export function extractCsrf(html) {
  console.log('\n[CSRF] Extracting CSRF token...');
  const match = html.match(/CSRF_TOKEN\s*=\s*['"]([^'"]+)['"]/);

  if (!match) {
    console.log('[CSRF] ❌ Not found');
    return null;
  }

  console.log('[CSRF] ✅ Found:', match[1]);
  return match[1];
}

// WORD-boundary based quality regex (SOFT)
const QUALITY_REGEX = /\b(camrip|hdcam|cam|hdtc|tc|telesync|ts|scr|screener|dvdscr)\b/i;

// STRICT substrings (always exclude)
const STRICT_SUBSTRINGS = [
  'hqcam',
  'clean cam',
  'line audio',
  'xbet',
  '1xbet',
  'zip',
  'rar',
  'tar',
  '7z',
  'apk',
  'exe',
  'pdf'
];

export function isBannedTitle(title) {
  const lower = title.toLowerCase();

  // 1️⃣ STRICT substring filtering
  for (const word of STRICT_SUBSTRINGS) {
    if (lower.includes(word)) {
      console.log(`[FILTER] ❌ STRICT exclude "${title}" (matched: ${word})`);
      return true;
    }
  }

  // 2️⃣ SOFT quality filtering (word boundary)
  if (QUALITY_REGEX.test(lower)) {
    console.log(`[FILTER] ❌ SOFT exclude "${title}" (quality tag match)`);
    return true;
  }

  return false;
}
