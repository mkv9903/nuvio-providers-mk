import { search } from './search.js';
import { resolveHubCloud } from './hubcloud.js';
import { fetchJson } from './http.js';

// --- CONFIGURATION ---
// REPLACE THIS with your actual TMDB v3 API Key
const TMDB_API_KEY = '919605fd567bbffcf76492a03eb4d527'; 
const TMDB_BASE = 'https://api.themoviedb.org/3';

/* -----------------------------
 * Helpers
 * ----------------------------- */

function pad2(num) {
  return String(num).padStart(2, '0');
}

// Helper to check if key is V4 (JWT)
function isV4Key(key) {
  return key && key.length > 40;
}

async function getTmdbTitle(tmdbId, mediaType) {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
        console.error('[FlixIndia] ❌ Missing TMDB API Key');
        return null;
    }

    let endpoint;
    if (mediaType === 'movie') endpoint = `/movie/${tmdbId}`;
    else if (mediaType === 'tv') endpoint = `/tv/${tmdbId}`;
    else return null;

    let url = `${TMDB_BASE}${endpoint}`;
    const options = { method: 'GET', headers: {} };

    // Correctly handle V3 vs V4 keys
    if (isV4Key(TMDB_API_KEY)) {
      options.headers.Authorization = `Bearer ${TMDB_API_KEY}`;
    } else {
      url += `?api_key=${TMDB_API_KEY}`;
    }

    const data = await fetchJson(url, options);

    if (mediaType === 'movie') return data?.title || null;
    if (mediaType === 'tv') return data?.name || null;

    return null;
  } catch (error) {
    console.error(`[TMDB] Error: ${error.message}`);
    return null;
  }
}

/* -----------------------------
 * Main Entry
 * ----------------------------- */

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    // 1. Resolve TMDB title
    const baseTitle = await getTmdbTitle(tmdbId, mediaType);
    if (!baseTitle) {
      console.log('[FlixIndia] TMDB title not found');
      return [];
    }

    // 2. Build search query
    let query;
    if (mediaType === 'movie') {
      query = baseTitle;
    } else if (mediaType === 'tv') {
      if (season == null || episode == null) return [];
      query = `${baseTitle} S${pad2(season)}E${pad2(episode)}`;
    } else {
      return [];
    }

    // 3. FlixIndia search
    const results = await search(query);
    if (!Array.isArray(results)) return [];

    /* -------------------------
     * 4. Resolve hosts (PARALLEL)
     * ------------------------- */
    
    // Limit to first 5 results for speed/safety
    const limitedResults = results.slice(0, 5);

    const promises = limitedResults.map(async (item) => {
      try {
        if (item.host === 'hubcloud') {
          const resolved = await resolveHubCloud(item.url, {
            title: item.title,
            quality: item.quality
          });

          // Map the results, INCLUDING the new size field
          return resolved.map(stream => ({
            name: 'FlixIndia',
            title: stream.title,
            url: stream.url,
            quality: stream.quality || 'unknown',
            size: stream.size || null,   // <--- New Field
            headers: {}
          }));
        }
      } catch (err) {
        console.log(`[FlixIndia] Error resolving ${item.url}: ${err.message}`);
      }
      return [];
    });

    // Wait for all resolutions to finish
    const resultsArrays = await Promise.all(promises);

    // Flatten and return
    return resultsArrays.flat();

  } catch (err) {
    console.error(`[FlixIndia] Critical Error: ${err.message}`);
    return [];
  }
}

module.exports = { getStreams };