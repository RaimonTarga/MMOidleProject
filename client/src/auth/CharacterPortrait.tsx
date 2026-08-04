import { useEffect, useRef, useState } from 'react';
import { resolvePlayerFrame, type CharacterSummary } from '@mmo-idle/shared';

interface AtlasFrame {
  filename: string;
  frame: { x: number; y: number; w: number; h: number };
}

interface AtlasJson {
  textures: Array<{ frames: AtlasFrame[] }>;
}

let atlasFramesPromise: Promise<Map<string, AtlasFrame>> | null = null;
let atlasImagePromise: Promise<HTMLImageElement> | null = null;

function loadAtlasFrames(): Promise<Map<string, AtlasFrame>> {
  atlasFramesPromise ??= fetch('/assets/sprites.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load character atlas (${response.status})`);
      return response.json() as Promise<AtlasJson>;
    })
    .then((atlas) => new Map(
      (atlas.textures[0]?.frames ?? []).map((frame) => [frame.filename, frame]),
    ));
  return atlasFramesPromise;
}

function loadAtlasImage(): Promise<HTMLImageElement> {
  atlasImagePromise ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load character sprite atlas'));
    image.src = '/assets/sprites.png';
  });
  return atlasImagePromise;
}

export function CharacterPortrait({ character }: { character: CharacterSummary }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const frameName = resolvePlayerFrame({
    combatArchetype: character.combatArchetype,
    unlockedSkills: character.unlockedSkills,
  });

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void Promise.all([loadAtlasFrames(), loadAtlasImage()])
      .then(([frames, image]) => {
        if (cancelled || !frameName) return;
        const frame = frames.get(frameName);
        const canvas = canvasRef.current;
        if (!frame || !canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;
        context.fillStyle = 'rgba(0, 0, 0, 0.32)';
        context.beginPath();
        context.ellipse(60, 128, 34, 10, 0, 0, Math.PI * 2);
        context.fill();
        context.drawImage(
          image,
          frame.frame.x,
          frame.frame.y,
          frame.frame.w,
          frame.frame.h,
          16,
          40,
          88,
          88,
        );
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => { cancelled = true; };
  }, [frameName]);

  return (
    <div className="auth-character-card__portrait" aria-hidden="true">
      <canvas ref={canvasRef} width={120} height={154} />
      {!ready && <span>{character.selectedClass?.slice(0, 1).toUpperCase() ?? '◇'}</span>}
    </div>
  );
}
