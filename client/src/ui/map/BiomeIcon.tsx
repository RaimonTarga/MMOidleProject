import { useEffect, useState } from 'react';
import { BIOME_ICONS } from './constants';

// Loads frames from a dedicated biome atlas (/assets/biomes.png + biomes.json),
// mirroring ItemIcon's loader. The atlas is optional: until the art ships the
// manifest fetch 404s, the loader resolves to an empty map, and <BiomeIcon>
// returns null so callers fall back to their existing colored-tile rendering.

interface AtlasFrame {
  x: number; y: number; w: number; h: number;
  atlasW: number; atlasH: number;
}

interface SpritesManifest {
  textures: Array<{
    size: { w: number; h: number };
    frames: Array<{ filename: string; frame: { x: number; y: number; w: number; h: number } }>;
  }>;
}

let manifestPromise: Promise<Map<string, AtlasFrame>> | null = null;

function loadBiomeManifest(): Promise<Map<string, AtlasFrame>> {
  if (!manifestPromise) {
    manifestPromise = fetch('/assets/biomes.json')
      .then(res => (res.ok ? (res.json() as Promise<SpritesManifest>) : Promise.reject()))
      .then(data => {
        const texture = data.textures[0];
        const map = new Map<string, AtlasFrame>();
        for (const entry of texture.frames) {
          map.set(entry.filename, {
            x: entry.frame.x, y: entry.frame.y,
            w: entry.frame.w, h: entry.frame.h,
            atlasW: texture.size.w, atlasH: texture.size.h,
          });
        }
        return map;
      })
      .catch(() => new Map<string, AtlasFrame>());
  }
  return manifestPromise;
}

function useBiomeFrame(frameName: string | null): AtlasFrame | null {
  const [frame, setFrame] = useState<AtlasFrame | null>(null);
  useEffect(() => {
    if (!frameName) { setFrame(null); return; }
    let cancelled = false;
    loadBiomeManifest().then(map => {
      if (!cancelled) setFrame(map.get(frameName) ?? null);
    });
    return () => { cancelled = true; };
  }, [frameName]);
  return frame;
}

interface BiomeIconProps {
  biomeGroup: string;
  size?: number;
  className?: string;
}

/**
 * Renders a biome's icon from the biome atlas, scaled to `size` px. Returns null
 * when no frame is mapped/loaded — the parent's fallback (colored tile + name)
 * shows through, so the layout is ready before the art exists.
 */
export function BiomeIcon({ biomeGroup, size = 32, className }: BiomeIconProps) {
  const frameName = BIOME_ICONS[biomeGroup] ?? null;
  const rect = useBiomeFrame(frameName);
  if (!rect) return null;
  const scale = size / rect.w;
  return (
    <div
      className={`biome-icon${className ? ` ${className}` : ''}`}
      style={{
        width: rect.w * scale,
        height: rect.h * scale,
        backgroundImage: 'url(/assets/biomes.png)',
        backgroundSize: `${rect.atlasW * scale}px ${rect.atlasH * scale}px`,
        backgroundPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
