import { useEffect, useState } from 'react';
import { loadUIAtlas, type AtlasFrame } from './uiAtlas';

function useUIFrame(frameName: string): AtlasFrame | null {
  const [frame, setFrame] = useState<AtlasFrame | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadUIAtlas().then(map => {
      if (!cancelled) setFrame(map.get(frameName) ?? null);
    });
    return () => { cancelled = true; };
  }, [frameName]);
  return frame;
}

interface UIIconProps {
  frameName: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function UIIcon({ frameName, size = 20, className, style }: UIIconProps) {
  const rect = useUIFrame(frameName);
  if (!rect) return null;
  const scale = size / rect.h;
  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: rect.w * scale,
        height: rect.h * scale,
        backgroundImage: 'url(/assets/UI_icons.png)',
        backgroundSize: `${rect.atlasW * scale}px ${rect.atlasH * scale}px`,
        backgroundPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    />
  );
}
