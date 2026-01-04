function getHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getPath(url) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

export function classifyHost(url) {
  const hostname = getHostname(url);
  const path = getPath(url);

  // --- HUBCLOUD ---
  if (hostname.includes('hubcloud')) {
    let kind = 'unknown';

    if (path.startsWith('/drive')) kind = 'drive';
    else if (path.startsWith('/video')) kind = 'video';

    console.log('[HOST] hubcloud →', kind, url);
    return { host: 'hubcloud', kind };
  }

  // --- GDFLIX / GDLINK ---
  if (hostname.includes('gdflix') || hostname.includes('gdlink')) {
    let kind = 'unknown';

    if (path.startsWith('/file')) kind = 'file';
    else if (path.startsWith('/pack')) kind = 'pack';

    console.log('[HOST] gdflix →', kind, url);
    return { host: 'gdflix', kind };
  }

  // --- VCLOUD ---
  if (hostname.includes('vcloud')) {
    console.log('[HOST] vcloud → unknown', url);
    return { host: 'vcloud', kind: 'unknown' };
  }

  // --- UNKNOWN ---
  console.log('[HOST] unknown →', url);
  return { host: 'unknown', kind: 'unknown' };
}
