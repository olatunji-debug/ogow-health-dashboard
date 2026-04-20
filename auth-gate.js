const OGOW_AUTH_ERROR = 'Access denied, User not permitted to view dashboard. Please sign in with your OGOW Health Google account.';

let ogowAuthStartPromise = null;
let ogowLastClientId = '';

function injectInternalTagline() {
  if (document.querySelector('.internal-tagline, .ogow-internal-tagline')) return;

  const tagline = document.createElement('div');
  tagline.className = 'ogow-internal-tagline';
  tagline.textContent = 'INTERNAL';
  tagline.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'padding:5px 11px',
    'border-radius:999px',
    'font-size:11px',
    'font-weight:900',
    'letter-spacing:.14em',
    'text-transform:uppercase',
    'background:rgba(46,196,182,.16)',
    'color:#6ee8db',
    'border:1px solid rgba(110,232,219,.34)',
    'box-shadow:0 6px 18px rgba(46,196,182,.10)',
    'margin-bottom:6px'
  ].join(';');

  const target = document.querySelector('.header-text, .hero, header, .dashboard-header') || document.body.firstElementChild || document.body;
  target.prepend(tagline);
}

function ensureAuthOverlayStructure(overlay) {
  if (!overlay.querySelector('#googleSignInButton')) {
    const buttonHost = document.createElement('div');
    buttonHost.id = 'googleSignInButton';
    buttonHost.style.display = 'flex';
    buttonHost.style.justifyContent = 'center';
    overlay.querySelector('.ogow-auth-card, div')?.appendChild(buttonHost);
  }

  if (!overlay.querySelector('#ogow-auth-message')) {
    const message = document.createElement('div');
    message.id = 'ogow-auth-message';
    message.className = 'ogow-auth-message';
    overlay.querySelector('.ogow-auth-card, div')?.appendChild(message);
  }

  if (!overlay.querySelector('#retryGoogleSignIn')) {
    const retry = document.createElement('button');
    retry.id = 'retryGoogleSignIn';
    retry.type = 'button';
    retry.className = 'ogow-auth-retry';
    retry.textContent = 'Retry sign-in';
    overlay.querySelector('.ogow-auth-card, div')?.appendChild(retry);
  }
}

function mountAuthOverlay() {
  let overlay = document.getElementById('ogow-auth-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ogow-auth-overlay';
    overlay.innerHTML = `
      <div class="ogow-auth-card">
        <div class="ogow-auth-badge">INTERNAL</div>
        <h2>OGOW Health Staff Sign-In Required</h2>
        <p>Please sign in with your <strong>@ogowhealth.com</strong> Google account to access this dashboard.</p>
        <div id="googleSignInButton"></div>
        <div id="ogow-auth-message" class="ogow-auth-message"></div>
        <button id="retryGoogleSignIn" type="button" class="ogow-auth-retry">Retry sign-in</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  ensureAuthOverlayStructure(overlay);

  if (!document.getElementById('ogow-auth-style')) {
    const style = document.createElement('style');
    style.id = 'ogow-auth-style';
    style.textContent = `
      #ogow-auth-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(6, 21, 16, 0.82);
        backdrop-filter: blur(10px);
        padding: 24px;
      }
      .ogow-auth-card {
        width: min(92vw, 460px);
        background: #ffffff;
        border: 1px solid #d7e7e1;
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 22px 70px rgba(0,0,0,.18);
        text-align: center;
        font-family: Inter, Segoe UI, Arial, sans-serif;
        color: #22322f;
      }
      .ogow-auth-badge {
        display: inline-flex;
        padding: 6px 12px;
        border-radius: 999px;
        background: #0e6d62;
        color: #fff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .12em;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .ogow-auth-card h2 {
        margin: 0 0 10px 0;
        color: #0a3a35;
        font-size: 22px;
      }
      .ogow-auth-card p {
        margin: 0 0 18px 0;
        color: #47625b;
        line-height: 1.6;
        font-size: 14px;
      }
      .ogow-auth-message {
        min-height: 20px;
        margin-top: 14px;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.5;
      }
      .ogow-auth-retry {
        margin-top: 10px;
        padding: 10px 14px;
        border: none;
        border-radius: 10px;
        background: #0e6d62;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      .ogow-auth-retry[disabled] {
        opacity: 0.7;
        cursor: wait;
      }
    `;
    document.head.appendChild(style);
  }

  bindRetryButton();
  return overlay;
}

function setAuthMessage(message, tone = 'error') {
  const el = document.getElementById('ogow-auth-message');
  if (!el) return;
  el.textContent = message || '';
  el.style.color = tone === 'info' ? '#315952' : '#c24e45';
}

function setRetryState(isBusy) {
  const button = document.getElementById('retryGoogleSignIn');
  if (!button) return;
  button.disabled = Boolean(isBusy);
  button.textContent = isBusy ? 'Loading...' : 'Retry sign-in';
}

function showAuthOverlay() {
  const overlay = mountAuthOverlay();
  overlay.style.display = 'flex';
  const app = document.getElementById('app');
  if (app) app.style.display = 'none';
}

function hideAuthOverlay() {
  const overlay = document.getElementById('ogow-auth-overlay');
  if (overlay) overlay.style.display = 'none';
  const app = document.getElementById('app');
  if (app) app.style.display = '';
}

function resetGoogleButton() {
  const buttonHost = document.getElementById('googleSignInButton');
  if (buttonHost) buttonHost.innerHTML = '';
}

async function verifyOgowGoogleAccess(credential) {
  const response = await fetch('/.netlify/functions/verify-google-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.message || OGOW_AUTH_ERROR);
  }
  return data;
}

async function loadProtectedDashboardData(credential) {
  const response = await fetch('/.netlify/functions/dashboard-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.message || OGOW_AUTH_ERROR);
  }
  return Array.isArray(data.rows) ? data.rows : [];
}

async function handleGoogleLogin(response) {
  if (!response || !response.credential) {
    showAuthOverlay();
    setAuthMessage(OGOW_AUTH_ERROR);
    return;
  }

  try {
    setRetryState(true);
    setAuthMessage('Verifying staff access...', 'info');
    await verifyOgowGoogleAccess(response.credential);

    setAuthMessage('Loading protected dashboard data...', 'info');
    const rows = await loadProtectedDashboardData(response.credential);

    window.ogowCredential = response.credential;
    window.ogowAuthorizedRows = rows;

    hideAuthOverlay();
    injectInternalTagline();

    if (typeof window.initializeDashboardWithRows === 'function') {
      window.initializeDashboardWithRows(rows);
    }
    if (typeof window.updateTimestamp === 'function') {
      window.updateTimestamp();
    }
  } catch (error) {
    window.ogowCredential = null;
    window.ogowAuthorizedRows = [];
    showAuthOverlay();
    setAuthMessage(error.message || OGOW_AUTH_ERROR);
  } finally {
    setRetryState(false);
  }
}

function waitForGoogleIdentity(timeoutMs = 15000, intervalMs = 250) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (window.google && google.accounts && google.accounts.id) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        reject(new Error('Google sign-in script did not finish loading.'));
      }
    }, intervalMs);
  });
}

async function startOgowAuth(clientId) {
  const resolvedClientId = String(clientId || ogowLastClientId || '').trim();
  ogowLastClientId = resolvedClientId;

  const app = document.getElementById('app');
  if (app) app.style.display = 'none';

  injectInternalTagline();
  showAuthOverlay();
  setRetryState(true);
  setAuthMessage('Loading Google sign-in...', 'info');

  if (!resolvedClientId || resolvedClientId.includes('REPLACE_WITH')) {
    setRetryState(false);
    setAuthMessage('Google Sign-In client ID is not configured yet.');
    return;
  }

  try {
    await waitForGoogleIdentity();
    const buttonHost = document.getElementById('googleSignInButton');
    if (!buttonHost) throw new Error('Google sign-in container is missing.');

    resetGoogleButton();
    google.accounts.id.initialize({
      client_id: resolvedClientId,
      callback: handleGoogleLogin,
      auto_select: false,
      cancel_on_tap_outside: false
    });

    google.accounts.id.renderButton(buttonHost, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: 'signin_with'
    });

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        setAuthMessage('Use the Google sign-in button below to continue.', 'info');
      }
    });

    setAuthMessage('Use your @ogowhealth.com Google account to continue.', 'info');
  } catch (error) {
    console.error(error);
    setAuthMessage('Google sign-in failed to load. Please retry or refresh the page.');
  } finally {
    setRetryState(false);
  }
}

function restartOgowAuth() {
  if (ogowAuthStartPromise) return ogowAuthStartPromise;
  ogowAuthStartPromise = startOgowAuth(ogowLastClientId).finally(() => {
    ogowAuthStartPromise = null;
  });
  return ogowAuthStartPromise;
}

function bindRetryButton() {
  const retryButton = document.getElementById('retryGoogleSignIn');
  if (retryButton && !retryButton.dataset.bound) {
    retryButton.dataset.bound = 'true';
    retryButton.addEventListener('click', () => {
      setAuthMessage('Reloading Google sign-in...', 'info');
      restartOgowAuth();
    });
  }
}

function initializeOgowAuth(clientId) {
  const launch = () => {
    ogowLastClientId = String(clientId || '').trim();
    restartOgowAuth();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launch, { once: true });
  } else {
    launch();
  }
}

window.initializeOgowAuth = initializeOgowAuth;
window.verifyOgowGoogleAccess = verifyOgowGoogleAccess;
window.loadProtectedDashboardData = loadProtectedDashboardData;
window.showOgowAuthOverlay = showAuthOverlay;
window.hideOgowAuthOverlay = hideAuthOverlay;
window.OGOW_AUTH_ERROR = OGOW_AUTH_ERROR;
