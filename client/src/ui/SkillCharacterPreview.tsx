import { useId } from 'react';
import { resolvePlayerFrame, resolvePlayerAccent, headAnchorFor, type SkillNode } from '@mmo-idle/shared';
import { skillPreviewInput } from './skillPreviewInput';
import { AtlasSprite } from './AtlasSprite';
import { SkillEmblem } from './SkillEmblem';

export function SkillCharacterPreview({ node, owned }: { node: SkillNode; owned: string[] }) {
  const input = skillPreviewInput(node, owned);
  const frame = resolvePlayerFrame(input);
  const accent = resolvePlayerAccent(input);
  const anchor = headAnchorFor(frame);
  const filterId = `crest-${useId().replace(/:/g, '')}`;
  const color = accent?.color ?? 0xffffff;
  const r = ((color >> 16) & 255) / 255;
  const g = ((color >> 8) & 255) / 255;
  const b = (color & 255) / 255;
  return (
    <span className="skill-choice-art" aria-hidden="true">
      <SkillEmblem node={node} />
      <span className="skill-character-preview">
      <span className="skill-character-preview__body"><AtlasSprite frameName={frame} /></span>
      {accent && <>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={`${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`} />
          </filter>
        </svg>
        <span className="skill-character-preview__accent" style={{ left: anchor.x - 16, top: anchor.y + 2, filter: `url(#${filterId})` }}>
          <AtlasSprite frameName={accent.frame} />
        </span>
      </>}
      </span>
    </span>
  );
}
