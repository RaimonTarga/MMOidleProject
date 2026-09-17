/** Opt-in benchmark diagnostics. Never changes navigation decisions. */
export interface PathDiagnostics {
  now: () => number;
  paths: number;
  nullPaths: number;
  pathMs: number;
  expandedCells: number;
  paddedChecks: number;
  overlapQueries: number;
  segmentSamples: number;
  droppedKeys: number;
  requests: Map<string, {calls:number; nulls:number; ms:number; maxMs:number}>;
}
export let pathDiagnostics: PathDiagnostics | undefined;
export function setPathDiagnostics(value?: PathDiagnostics): void { pathDiagnostics=value; }
export function createPathDiagnostics(now:()=>number): PathDiagnostics {
  return {now,paths:0,nullPaths:0,pathMs:0,expandedCells:0,paddedChecks:0,
    overlapQueries:0,segmentSamples:0,droppedKeys:0,requests:new Map()};
}
