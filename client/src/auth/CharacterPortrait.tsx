import { useEffect, useRef, useState } from 'react';
import {
  headAnchorFor,
  resolvePlayerAccent,
  resolvePlayerFrame,
  SKILL_TREE,
  type CharacterSummary,
} from '@mmo-idle/shared';
import { GameIcon } from '../ui/GameIcon';
import {
  classEmblemIconSource,
  skillVocabularyIconSource,
} from '../ui/conceptIcons';

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

/**
 * Follow the highest authored emblem in the character's class path. The
 * passive-tree resolver owns the product-tier mapping: root, frame, class
 * range, and path emblems all come from the same canonical node identity.
 */
function classEmblemFor(character: CharacterSummary) {
  const archetype = character.combatArchetype;
  if (!archetype) return null;

  const rootId = character.selectedClass ?? `${archetype}-root`;
  let latestNode = SKILL_TREE.get(rootId) ?? null;

  for (const skillId of character.unlockedSkills) {
    const node = SKILL_TREE.get(skillId);
    if (!node || node.tier > 3) continue;
    const belongsToClass = node.tier === 0
      ? node.id === rootId
      : node.classId === rootId;
    if (!belongsToClass) continue;
    if (!latestNode || node.tier >= latestNode.tier) latestNode = node;
  }

  const source = latestNode
    ? skillVocabularyIconSource(latestNode)
    : classEmblemIconSource(archetype);

  return source ? { source } : null;
}

export function CharacterPortrait({ character }: { character: CharacterSummary }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const frameName = resolvePlayerFrame({
    combatArchetype: character.combatArchetype,
    unlockedSkills: character.unlockedSkills,
  });
  const accent = resolvePlayerAccent({
    combatArchetype: character.combatArchetype,
    unlockedSkills: character.unlockedSkills,
  });
  const accentFrameName = accent?.frame ?? null;
  const accentColor = accent?.color;
  const classEmblem = classEmblemFor(character);

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
        const bodyX = 16;
        const bodyY = 40;
        const bodyWidth = 88;
        const bodyHeight = 88;
        const bodyScaleX = bodyWidth / frame.frame.w;
        const bodyScaleY = bodyHeight / frame.frame.h;
        context.drawImage(
          image,
          frame.frame.x,
          frame.frame.y,
          frame.frame.w,
          frame.frame.h,
          bodyX,
          bodyY,
          bodyWidth,
          bodyHeight,
        );

        const accentFrame = accentFrameName ? frames.get(accentFrameName) : undefined;
        if (accentFrame) {
          const anchor = headAnchorFor(frameName);
          const accentWidth = accentFrame.frame.w * bodyScaleX;
          const accentHeight = accentFrame.frame.h * bodyScaleY;
          const accentCenterX = bodyX + bodyWidth / 2
            + (anchor.x - frame.frame.w / 2) * bodyScaleX;
          const accentCenterY = bodyY + bodyHeight / 2
            + (anchor.y - frame.frame.h / 2) * bodyScaleY
            - accentHeight / 2
            + 2 * bodyScaleY;
          const accentCanvas = document.createElement('canvas');
          accentCanvas.width = Math.max(1, Math.round(accentWidth));
          accentCanvas.height = Math.max(1, Math.round(accentHeight));
          const accentContext = accentCanvas.getContext('2d');
          if (accentContext) {
            accentContext.imageSmoothingEnabled = false;
            accentContext.drawImage(
              image,
              accentFrame.frame.x,
              accentFrame.frame.y,
              accentFrame.frame.w,
              accentFrame.frame.h,
              0,
              0,
              accentCanvas.width,
              accentCanvas.height,
            );
            if (accentColor !== undefined) {
              const pixels = accentContext.getImageData(
                0,
                0,
                accentCanvas.width,
                accentCanvas.height,
              );
              const tintR = (accentColor >> 16) & 0xff;
              const tintG = (accentColor >> 8) & 0xff;
              const tintB = accentColor & 0xff;
              for (let i = 0; i < pixels.data.length; i += 4) {
                pixels.data[i] = Math.round(pixels.data[i]! * tintR / 255);
                pixels.data[i + 1] = Math.round(pixels.data[i + 1]! * tintG / 255);
                pixels.data[i + 2] = Math.round(pixels.data[i + 2]! * tintB / 255);
              }
              accentContext.putImageData(pixels, 0, 0);
            }
            context.drawImage(
              accentCanvas,
              accentCenterX - accentCanvas.width / 2,
              accentCenterY - accentCanvas.height / 2,
            );
          }
        }
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => { cancelled = true; };
  }, [accentColor, accentFrameName, frameName]);

  return (
    <div className="auth-character-card__portrait" aria-hidden="true">
      {classEmblem && (
        <GameIcon
          source={classEmblem.source}
          size={112}
          fit="contain"
          fallback={null}
          className="auth-character-card__emblem"
          decorative
        />
      )}
      <canvas ref={canvasRef} width={120} height={154} />
      {!ready && (
        <span className="auth-character-card__portrait-fallback">
          {character.selectedClass?.slice(0, 1).toUpperCase() ?? '◇'}
        </span>
      )}
    </div>
  );
}
