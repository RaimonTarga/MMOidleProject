import type { ShadowDef, ShadowDefsFile } from '@mmo-idle/shared';

let cache: Map<string, ShadowDef> = new Map();

function isShadowDef(value: unknown): value is ShadowDef {
  if (typeof value !== 'object' || value === null) return false;
  const maybe = value as Partial<ShadowDef>;
  return (
    typeof maybe.sourceW === 'number' &&
    typeof maybe.sourceH === 'number' &&
    typeof maybe.footY === 'number' &&
    typeof maybe.halfWAtFoot === 'number'
  );
}

function isShadowDefsFile(value: unknown): value is ShadowDefsFile {
  if (typeof value !== 'object' || value === null) return false;
  const maybe = value as Partial<ShadowDefsFile>;
  return (
    typeof maybe.atlasHash === 'string' &&
    typeof maybe.frames === 'object' &&
    maybe.frames !== null
  );
}

export function setShadowDefs(file: unknown): void {
  const next = new Map<string, ShadowDef>();
  if (!isShadowDefsFile(file)) {
    cache = next;
    return;
  }

  for (const [frameName, def] of Object.entries(file.frames)) {
    if (isShadowDef(def)) next.set(frameName, def);
  }
  cache = next;
}

export function getShadowDef(frame: string | null): ShadowDef | undefined {
  if (!frame) return undefined;
  return cache.get(frame);
}
