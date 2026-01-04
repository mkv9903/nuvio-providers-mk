const QUALITY_PATTERNS = [
  { label: '2160p', regex: /\b2160p\b/i },
  { label: '1080p', regex: /\b1080p\b/i },
  { label: '720p',  regex: /\b720p\b/i },
  { label: '480p',  regex: /\b480p\b/i }
];

export function extractQuality(title) {
  for (const q of QUALITY_PATTERNS) {
    if (q.regex.test(title)) {
      console.log(`[QUALITY] ${q.label} ← "${title}"`);
      return q.label;
    }
  }

  console.log(`[QUALITY] unknown ← "${title}"`);
  return 'unknown';
}
