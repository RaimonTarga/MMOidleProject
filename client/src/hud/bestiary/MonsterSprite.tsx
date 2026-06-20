import { useEffect, useState } from 'react';
import { resolveMonsterFrame } from '@mmo-idle/shared';

// Renders a single monster's atlas frame as a cropped DOM element, reusing the
// exact game texture atlas (/assets/sprites.png) the Phaser scene draws from.
// We parse the atlas JSON once and crop via background-position so no Phaser
// canvas is needed inside React.

const ATLAS_IMAGE_URL = '/assets/sprites.png';
const ATLAS_JSON_URL = '/assets/sprites.json';

interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Atlas {
  imageUrl: string;
  width: number;
  height: number;
  frames: Map<string, FrameRect>;
}

interface RawAtlas {
  textures?: Array<{
    size?: { w: number; h: number };
    frames?: Array<{ filename: string; frame: FrameRect }>;
  }>;
}

let atlasPromise: Promise<Atlas | null> | null = null;

function loadAtlas(): Promise<Atlas | null> {
  if (atlasPromise) return atlasPromise;
  atlasPromise = fetch(ATLAS_JSON_URL)
    .then((r) => (r.ok ? (r.json() as Promise<RawAtlas>) : null))
    .then((data) => {
      const tex = data?.textures?.[0];
      if (!tex?.frames || !tex.size) return null;
      const frames = new Map<string, FrameRect>();
      for (const f of tex.frames) frames.set(f.filename, f.frame);
      return {
        imageUrl: ATLAS_IMAGE_URL,
        width: tex.size.w,
        height: tex.size.h,
        frames,
      };
    })
    .catch(() => null);
  return atlasPromise;
}

function useAtlas(): Atlas | null {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  useEffect(() => {
    let alive = true;
    loadAtlas().then((a) => {
      if (alive) setAtlas(a);
    });
    return () => {
      alive = false;
    };
  }, []);
  return atlas;
}

export function MonsterSprite({
  monsterTypeId,
  size,
  fallbackColor,
  className,
}: {
  monsterTypeId: string;
  /** Display box size in px (square). */
  size: number;
  /** Hex color (0xRRGGBB) used as a fallback swatch while loading / if no frame. */
  fallbackColor: number;
  className?: string;
}) {
  const atlas = useAtlas();
  const frameName = resolveMonsterFrame(monsterTypeId);
  const rect = atlas && frameName ? atlas.frames.get(frameName) : undefined;

  const swatch = `#${fallbackColor.toString(16).padStart(6, '0')}`;

  if (!atlas || !rect) {
    // Loading, or no sprite authored — show the color swatch the game uses too.
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundColor: swatch,
          borderRadius: 4,
        }}
      />
    );
  }

  const scale = size / Math.max(rect.w, rect.h);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: rect.w * scale,
          height: rect.h * scale,
          backgroundImage: `url(${atlas.imageUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
          backgroundSize: `${atlas.width * scale}px ${atlas.height * scale}px`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
