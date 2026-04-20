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

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload() || {};
    const email = String(payload.email || '').trim().toLowerCase();
    const emailVerified = payload.email_verified === true;

    if (!emailVerified || !email.endsWith(ALLOWED_DOMAIN)) {
      return json(403, { ok: false, message: DENIED_MESSAGE });
    }

    return json(200, {
      ok: true,
      email,
      hostedDomain: payload.hd || null
    });
  } catch (error) {
    console.error('verify-google-auth error:', error);
    return json(403, { ok: false, message: DENIED_MESSAGE });
  }
};
