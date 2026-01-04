import { search } from './search.js';
import { resolveHubCloud } from './hubcloud.js';
import { fetchJson } from './http.js';

const TMDB_API_KEY = '919605fd567bbffcf76492a03eb4d527';
const TMDB_BASE = 'https://api.themoviedb.org/3';

/* -----------------------------
 * Helpers
 * ----------------------------- */

function pad2(num) {
  return String(num).padStart(2, '0');
}

// Check if key is a long V4 Bearer token (JWT) or a short V3 key
function isV4Key(key) {
  return key && key.length > 40;
}

async function getTmdbTitle(tmdbId, mediaType) {
  try {
    if (!TMDB_API_KEY) return null;

    let endpoint;
    if (mediaType === 'movie') {
      endpoint = `/movie/${tmdbId}`;
    } else if (mediaType === 'tv') {
      endpoint = `/tv/${tmdbId}`;
    } else {
      return null;
    }

    // Initialize URL with base
    let url = `${TMDB_BASE}${endpoint}`;

    const options = {
      method: 'GET',
      headers: {}
    };

    if (isV4Key(TMDB_API_KEY)) {
      options.headers.Authorization = `Bearer ${TMDB_API_KEY}`;
    } else {
      // v3 key: Append to the URL correctly
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
    /* -------------------------
     * 1. Resolve TMDB title
     * ------------------------- */
    const baseTitle = await getTmdbTitle(tmdbId, mediaType);
    if (!baseTitle) {
      console.log('[FlixIndia] TMDB title not found');
      return [];
    }

    /* -------------------------
     * 2. Build search query
     * ------------------------- */
    let query;

    if (mediaType === 'movie') {
      query = baseTitle;
    } else if (mediaType === 'tv') {
      if (season == null || episode == null) return [];
      query = `${baseTitle} S${pad2(season)}E${pad2(episode)}`;
    } else {
      return [];
    }

    /* -------------------------
     * 3. FlixIndia search
     * ------------------------- */
    const results = await search(query);
    if (!Array.isArray(results)) return [];

    const streams = [];

    /* -------------------------
     * 4. Resolve hosts
     * ------------------------- */
    for (const item of results) {
      try {
        if (item.host === 'hubcloud') {
          const resolved = await resolveHubCloud(item.url, {
            title: item.title,
            quality: item.quality
          });

          for (const stream of resolved) {
            streams.push({
              name: `FlixIndia`, // Consistent naming
              title: stream.title,
              url: stream.url,
              quality: stream.quality || 'unknown',
              headers: {}
            });
          }
        }
      } catch (err) {
        console.log(`[FlixIndia] Error resolving ${item.url}: ${err.message}`);
      }
    }

    return streams;
  } catch (err) {
    console.error(`[FlixIndia] Critical Error: ${err.message}`);
    return [];
  }
}

module.exports = { getStreams };