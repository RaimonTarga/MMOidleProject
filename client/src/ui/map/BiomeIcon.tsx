import { useEffect, useState } from 'react';
import { loadUIAtlas, type AtlasFrame } from '../uiAtlas';
import { BIOME_ICONS } from './constants';

function useBiomeFrame(frameName: string | null): AtlasFrame | null {
  const [frame, setFrame] = useState<AtlasFrame | null>(null);
  useEffect(() => {
    if (!frameName) { setFrame(null); return; }
    let cancelled = false;
    loadUIAtlas().then(map => {
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
        backgroundImage: 'url(/assets/UI_icons.png)',
        backgroundSize: `${rect.atlasW * scale}px ${rect.atlasH * scale}px`,
        backgroundPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
