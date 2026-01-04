import cheerio from 'cheerio-without-node-native';
import { fetchText } from './http.js';

/**
 * Resolve HubCloud entry URL into final streamable links
 * Covers:
 * - Entry page
 * - Generate link
 * - Redirect chain
 * - FSL extraction
 * - PixelDrain extraction + final API URL
 * - Exclusion of non-streamable links
 */
export async function resolveHubCloud(entryUrl, meta) {
  console.log('\n[HUBCLOUD] ▶ Resolving:', entryUrl);

  const streams = [];

  /* ----------------------------------
   * STEP 1: Fetch HubCloud entry page
   * ---------------------------------- */
  const entryHtml = await fetchText(entryUrl);
  console.log('[HUBCLOUD] Entry HTML length:', entryHtml.length);

  const $entry = cheerio.load(entryHtml);

  /* ----------------------------------
   * STEP 1.5: Extract File Size (NEW)
   * ---------------------------------- */
  let fileSize = null;
  try {
    // Looks for <i id="size">11.12 GB</i>
    const sizeText = $entry('i#size').text().trim();
    if (sizeText) {
      fileSize = sizeText;
      console.log(`[HUBCLOUD] 📦 File Size: ${fileSize}`);
    }
  } catch (err) {
    console.log('[HUBCLOUD] ⚠️ Could not extract size:', err.message);
  }

  const generatorUrl = $entry('a#download').attr('href');

  if (!generatorUrl) {
    console.log('[HUBCLOUD] ❌ Generate link not found');
    return streams;
  }

  console.log('[HUBCLOUD] Generate link found:', generatorUrl);

  /* ----------------------------------
   * STEP 2: Follow generator redirects
   * ---------------------------------- */
  const finalHtml = await fetchText(generatorUrl);
  console.log('[HUBCLOUD] Final page HTML length:', finalHtml.length);

  const $final = cheerio.load(finalHtml);

  /* ----------------------------------
   * STEP 3: Extract FSL Server link
   * ---------------------------------- */
  const fslUrl = $final('a#fsl').attr('href');
  if (fslUrl) {
    console.log('[HUBCLOUD] ✅ FSL link found:', fslUrl);

    streams.push({
      name: 'Flixindia - hubcloud - FSL',
      title: meta.title,
      url: fslUrl,
      quality: meta.quality,
      size: fileSize, // <--- Added Size
      source: 'hubcloud-fsl'
    });
  } else {
    console.log('[HUBCLOUD] ⚠️ No FSL link found');
  }

  /* ----------------------------------
   * STEP 4: Scan ALL links for PixelDrain
   * ---------------------------------- */
  $final('a[href]').each((_, el) => {
    const href = $final(el).attr('href');
    if (!href) return;

    let url;
    try {
      url = new URL(href);
    } catch {
      return;
    }

    // Always log discovered links (debug visibility)
    console.log('[HUBCLOUD] Link found:', url.href);

    /* -------------------------------
     * PixelDrain (TLD-agnostic)
     * ------------------------------- */
    if (url.hostname.includes('pixeldrain')) {
      console.log('[HUBCLOUD] 🟣 PixelDrain candidate:', url.href);

      const resolved = resolvePixelDrain(url);
      if (resolved) {
        streams.push({
          name: 'Flixindia - hubcloud - PixelDrain',
          title: meta.title,
          url: resolved,
          quality: meta.quality,
          size: fileSize, // <--- Added Size
          source: 'hubcloud-pixeldrain'
        });
      }
    }
  });

  /* ----------------------------------
   * STEP 5: Filter non-streamable links
   * ---------------------------------- */
  const filtered = streams.filter(s => {
    if (
      s.url.includes('gpdl') ||
      s.url.includes('hubcdn')
    ) {
      console.log('[HUBCLOUD] ❌ Excluding direct / non-streamable:', s.url);
      return false;
    }
    return true;
  });

  console.log('[HUBCLOUD] ▶ Final streams:', filtered.length);
  return filtered;
}

/**
 * PixelDrain resolver (TLD-agnostic)
 * Converts:
 * /u/<id>
 * /file/<id>
 * /api/file/<id>
 * → /api/file/<id>
 */
function resolvePixelDrain(url) {
  try {
    const parts = url.pathname.split('/').filter(Boolean);
    let fileId = null;

    if (parts[0] === 'u' && parts[1]) {
      fileId = parts[1];
    } else if (parts[0] === 'file' && parts[1]) {
      fileId = parts[1];
    } else if (parts[0] === 'api' && parts[1] === 'file' && parts[2]) {
      fileId = parts[2];
    }

    if (!fileId) {
      console.log('[PIXELDRAIN] ❌ Unsupported format:', url.href);
      return null;
    }

    const finalUrl = `https://${url.hostname}/api/file/${fileId}`;
    console.log('[PIXELDRAIN] ✅ Final stream URL:', finalUrl);

    return finalUrl;
  } catch (err) {
    console.log('[PIXELDRAIN] ❌ Error:', err.message);
    return null;
  }
}