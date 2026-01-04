import { search } from './search.js';
import { resolveHubCloud } from './hubcloud.js';
import { fetchJson } from './http.js';

const TMDB_API_KEY = '47b0f8e9-a3ff-4975-8697-d8901250265b'
const TMDB_BASE = 'https://api.themoviedb.org/3';

/* -----------------------------
 * Helpers
 * ----------------------------- */

function pad2(num) {
  return String(num).padStart(2, '0');
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

    const url = `${TMDB_BASE}${endpoint}`;

    const options = {
      method: 'GET',
      headers: {}
    };

    if (isV4Key(TMDB_API_KEY)) {
      options.headers.Authorization = `Bearer ${TMDB_API_KEY}`;
    } else {
      // v3 key
      endpoint += `?api_key=${TMDB_API_KEY}`;
    }

    const data = await fetchJson(url, options);

    if (mediaType === 'movie') return data?.title || null;
    if (mediaType === 'tv') return data?.name || null;

    return null;
  } catch {
    return null;
  }
}

/* -----------------------------
 * DOCUMENTATION-REQUIRED API
 * ----------------------------- */

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    /* -------------------------
     * 1. Resolve TMDB title
     * ------------------------- */
    const baseTitle = await getTmdbTitle(tmdbId, mediaType);
    if (!baseTitle) return [];

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
              name: `flixindia-${stream.source}`,
              title: stream.title,
              url: stream.url,
              quality: stream.quality || 'unknown',
              headers: {}
            });
          }
        }
      } catch {
        // Skip failing result, continue
      }
    }

    return streams;
  } catch {
    return [];
  }
}

/* -----------------------------
 * REQUIRED EXPORT
 * ----------------------------- */

module.exports = { getStreams };
