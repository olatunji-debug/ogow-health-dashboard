const fs = require('fs/promises');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

const DENIED_MESSAGE = 'Access denied, User not permitted to view dashboard. Please sign in with your OGOW Health Google account.';
const ALLOWED_DOMAIN = '@ogowhealth.com';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(payload)
  };
}

async function verifyCredential(credential) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload() || {};
  const email = String(payload.email || '').trim().toLowerCase();
  const emailVerified = payload.email_verified === true;

  if (!emailVerified || !email.endsWith(ALLOWED_DOMAIN)) {
    throw new Error(DENIED_MESSAGE);
  }

  return { email };
}

async function readFromGitHubApi() {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const dataPath = process.env.GITHUB_DATA_PATH || 'data/epi_dashboard_data.json';

  if (!repo || !token) return null;

  const url = `https://api.github.com/repos/${repo}/contents/${dataPath}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ogow-dashboard-netlify-function'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !payload.content) {
    throw new Error('GitHub API response did not include file content.');
  }

  const decoded = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return JSON.parse(decoded);
}

async function readFromDataUrl() {
  const dataUrl = process.env.GITHUB_DATA_URL || process.env.DATA_URL;
  if (!dataUrl) return null;

  const response = await fetch(dataUrl, {
    headers: { 'User-Agent': 'ogow-dashboard-netlify-function' }
  });

  if (!response.ok) {
    throw new Error(`Remote data request failed with status ${response.status}`);
  }

  return response.json();
}

async function readBundledFallback() {
  const localPath = path.resolve(__dirname, '../../data/epi_dashboard_data.json');
  try {
    const raw = await fs.readFile(localPath, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  return [];
}

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Method not allowed.' });
  }

  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return json(500, { ok: false, message: 'GOOGLE_CLIENT_ID is not configured.' });
    }

    const body = JSON.parse(event.body || '{}');
    const credential = body.credential;
    if (!credential) {
      return json(403, { ok: false, message: DENIED_MESSAGE });
    }

    await verifyCredential(credential);

    let payload = await readFromDataUrl();
    if (!payload) payload = await readFromGitHubApi();
    if (!payload) payload = await readBundledFallback();

    if (!payload) {
      return json(500, { ok: false, message: 'Protected dashboard data source is not configured.' });
    }

    const rows = normalizeRows(payload);
    return json(200, { ok: true, rows });
  } catch (error) {
    if (error.message === DENIED_MESSAGE) {
      return json(403, { ok: false, message: DENIED_MESSAGE });
    }
    console.error('dashboard-data error:', error);
    return json(500, { ok: false, message: 'Unable to load protected dashboard data.' });
  }
};
