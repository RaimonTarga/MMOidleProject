import { useEffect, useState } from 'react';
import './atlasSprite.css';

interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  atlasW: number;
  atlasH: number;
}

interface SpritesManifest {
  textures: Array<{
    size: { w: number; h: number };
    frames: Array<{
      filename: string;
      frame: { x: number; y: number; w: number; h: number };
    }>;
  }>;
}

let manifestPromise: Promise<Map<string, AtlasFrame>> | null = null;

function loadAtlasManifest(): Promise<Map<string, AtlasFrame>> {
  if (!manifestPromise) {
    manifestPromise = fetch('/assets/sprites.json')
      .then((res) => res.json() as Promise<SpritesManifest>)
      .then((data) => {
        const texture = data.textures[0];
        const map = new Map<string, AtlasFrame>();
        for (const entry of texture.frames) {
          map.set(entry.filename, {
            x: entry.frame.x,
            y: entry.frame.y,
            w: entry.frame.w,
            h: entry.frame.h,
            atlasW: texture.size.w,
            atlasH: texture.size.h,
          });
        }
        return map;
      });
  }
  return manifestPromise;
}

function useAtlasFrame(frameName: string | null): AtlasFrame | null {
  const [frame, setFrame] = useState<AtlasFrame | null>(null);

  useEffect(() => {
    if (!frameName) {
      setFrame(null);
      return;
    }
    let cancelled = false;
    loadAtlasManifest().then((map) => {
      if (!cancelled) setFrame(map.get(frameName) ?? null);
    });
    return () => { cancelled = true; };
  }, [frameName]);

  return frame;
}

export interface AtlasSpriteProps {
  frameName: string | null;
  scale?: number;
  className?: string;
  fallbackInitial?: string;
}

export function AtlasSprite({
  frameName,
  scale = 1,
  className,
  fallbackInitial = '?',
}: AtlasSpriteProps) {
  const rect = useAtlasFrame(frameName);

  if (!frameName || !rect) {
    return (
      <div className={`atlas-sprite atlas-sprite--missing ${className ?? ''}`}>
        {fallbackInitial.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`atlas-sprite ${className ?? ''}`}
      style={{
        width: rect.w * scale,
        height: rect.h * scale,
        backgroundImage: 'url(/assets/sprites.png)',
        backgroundSize: `${rect.atlasW * scale}px ${rect.atlasH * scale}px`,
        backgroundPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
      }}
    />
  );
}
