import { NODE_BIOMES } from '@mmo-idle/shared';
import { MAX_VIEW_C, MAX_VIEW_R } from './constants';

// Parse "node-{r}-{c}" → [r, c] or null
export function parseNodeId(id: string): [number, number] | null {
  const p = id.split('-');
  if (p.length !== 3) return null;
  const r = parseInt(p[1], 10);
  const c = parseInt(p[2], 10);
  return isNaN(r) || isNaN(c) ? null : [r, c];
}

// Clamp viewport so player node is visible
export function clampView(r: number, c: number): [number, number] {
  return [
    Math.max(0, Math.min(MAX_VIEW_R, r)),
    Math.max(0, Math.min(MAX_VIEW_C, c)),
  ];
}

// ── BFS shortest path ─────────────────────────────────────────────────────────
// Returns the full path [from, ...intermediates, to], or null if unreachable.
export function bfsPath(from: string, to: string): string[] | null {
  if (from === to) return [from];
  const parent = new Map<string, string>([[from, '']]);
  const queue: string[] = [from];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const rc = parseNodeId(cur);
    if (!rc) continue;
    const [r, c] = rc;
    for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]] as [number,number][]) {
      if (nr < 0 || nr > 10 || nc < 0 || nc > 10) continue;
      const nid = `node-${nr}-${nc}`;
      if (parent.has(nid) || !NODE_BIOMES[nid]) continue;
      parent.set(nid, cur);
      if (nid === to) {
        const path: string[] = [];
        let n: string = to;
        while (n !== '') { path.unshift(n); n = parent.get(n)!; }
        return path;
      }
      queue.push(nid);
    }
  }
  return null;
}
