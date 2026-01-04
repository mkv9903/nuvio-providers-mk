import { BASE_URL, fetchText, fetchJson } from './http.js';
import { extractCsrf, isBannedTitle } from './utils.js';
import { classifyHost } from './hosts.js';
import { extractQuality } from './quality.js';

export async function search(query) {
  console.log('\n[SEARCH] ▶ Starting search:', query);

  try {
    // Step 1: Homepage (CSRF)
    const homeHtml = await fetchText(BASE_URL);
    const csrf = extractCsrf(homeHtml);

    if (!csrf) {
      console.log('[SEARCH] ❌ CSRF not found');
      return [];
    }

    // Step 2: POST search
    const body = new URLSearchParams({
      action: 'search',
      csrf_token: csrf,
      q: query
    }).toString();

    const json = await fetchJson(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!Array.isArray(json.results)) {
      console.log('[SEARCH] ⚠️ No results array');
      return [];
    }

    // Step 3: Process results safely
    const results = [];

    for (const item of json.results) {
      try {
        if (!item?.title || !item?.url) continue;
        if (isBannedTitle(item.title)) continue;

        results.push({
          title: item.title,
          url: item.url,
          quality: extractQuality(item.title),
          ...classifyHost(item.url)
        });
      } catch (err) {
        console.log('[SEARCH] ⚠️ Skipping bad item:', err.message);
      }
    }

    console.log('[SEARCH] ▶ Final results:', results.length);
    return results;

  } catch (err) {
    console.log('[SEARCH] ❌ Search failed completely:', err.message);
    return [];
  }
}
