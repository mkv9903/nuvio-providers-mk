export const BASE_URL = 'https://m.flixindia.xyz/';

export const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  Referer: BASE_URL,
  Origin: BASE_URL,
  'X-Requested-With': 'XMLHttpRequest'
};

// Simple in-memory cookie jar
let COOKIE_JAR = '';

function storeCookies(res) {
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    COOKIE_JAR = setCookie.split(';')[0];
    console.log('[HTTP][COOKIE] Stored:', COOKIE_JAR);
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Core retry wrapper for ALL HTTP calls
 */
async function requestWithRetry(fetchFn, label, retries = 3) {
  let attempt = 0;
  let delay = 500;

  while (attempt < retries) {
    try {
      console.log(`[HTTP][RETRY] ${label} attempt ${attempt + 1}/${retries}`);
      return await fetchFn();
    } catch (err) {
      attempt++;
      console.log(`[HTTP][RETRY] ❌ ${label} failed:`, err.message);

      if (attempt >= retries) {
        console.log(`[HTTP][RETRY] ❌ ${label} giving up`);
        throw err;
      }

      await sleep(delay);
      delay *= 2;
    }
  }
}

/**
 * GET text with retry + cookies
 */
export async function fetchText(url, options = {}) {
  return requestWithRetry(async () => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...BASE_HEADERS,
        ...(COOKIE_JAR ? { Cookie: COOKIE_JAR } : {}),
        ...(options.headers || {})
      }
    });

    storeCookies(res);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  }, `GET ${url}`);
}

/**
 * POST JSON with retry + cookies
 */
export async function fetchJson(url, options = {}) {
  return requestWithRetry(async () => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...BASE_HEADERS,
        ...(COOKIE_JAR ? { Cookie: COOKIE_JAR } : {}),
        ...(options.headers || {})
      }
    });

    storeCookies(res);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  }, `POST ${url}`);
}
