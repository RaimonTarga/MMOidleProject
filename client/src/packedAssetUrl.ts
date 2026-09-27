/**
 * Content-versioned URLs for the PACKED atlases (`art:pack` output).
 *
 * The server serves `/assets/*` with a one-hour freshness window, and the atlases
 * keep the same name across repacks — so a browser that loaded the game in the last
 * hour kept drawing the old atlas after a repack, and a frame added by the pack
 * (a new burrowed body, a new icon) was simply "missing". The build stamps each
 * packed file's content hash in as `?v=`, so a repack is a new URL and an unchanged
 * atlas keeps its cache.
 */
declare const __PACKED_ASSET_HASHES__: Record<string, string>;

export function packedAssetUrl(path: string): string {
  const hash = typeof __PACKED_ASSET_HASHES__ === 'undefined' ? undefined : __PACKED_ASSET_HASHES__[path];
  return hash ? `${path}?v=${hash}` : path;
}
