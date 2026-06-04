import { useEffect, useState } from 'react';
import './atlasSprite.css';

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

function loadItemsManifest(): Promise<Map<string, AtlasFrame>> {
  if (!manifestPromise) {
    manifestPromise = fetch('/assets/icons.json')
      .then(res => res.json() as Promise<SpritesManifest>)
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

function useItemFrame(frameName: string | null): AtlasFrame | null {
  const [frame, setFrame] = useState<AtlasFrame | null>(null);
  useEffect(() => {
    if (!frameName) { setFrame(null); return; }
    let cancelled = false;
    loadItemsManifest().then(map => {
      if (!cancelled) setFrame(map.get(frameName) ?? null);
    });
    return () => { cancelled = true; };
  }, [frameName]);
  return frame;
}

interface ItemIconProps {
  frameName: string | null;
  scale?: number;
  className?: string;
}

/** Renders a 32×32 item icon from /assets/items.png. Returns null when the
 *  frame name is absent or not found — parent's fallback (tier pip) shows through. */
export function ItemIcon({ frameName, scale = 1, className }: ItemIconProps) {
  const rect = useItemFrame(frameName);
  if (!rect) return null;
  return (
    <div
      className={`item-icon${className ? ` ${className}` : ''}`}
      style={{
        width: rect.w * scale,
        height: rect.h * scale,
        backgroundImage: 'url(/assets/icons.png)',
        backgroundSize: `${rect.atlasW * scale}px ${rect.atlasH * scale}px`,
        backgroundPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
