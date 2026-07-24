import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  loadIconAtlas,
  type AtlasFrame,
  type IconAtlasRef,
  UI_ICON_ATLAS,
} from './iconAtlas';
import './gameIcon.css';

export interface AtlasIconSource {
  kind: 'atlas';
  atlas: IconAtlasRef;
  frameName: string;
}

export interface AssetIconSource {
  kind: 'asset';
  src: string;
}

export interface NodeIconSource {
  kind: 'node';
  node: ReactNode;
}

/** Every icon consumer uses the same source contract, regardless of art origin. */
export type IconSource = AtlasIconSource | AssetIconSource | NodeIconSource;

export type IconAccessibility =
  | { decorative: true; label?: never }
  | { decorative?: false; label: string };

export type IconSize = number | { width: number; height: number };

interface GameIconCommonProps {
  source?: IconSource | null;
  size?: IconSize;
  fallback?: ReactNode;
  fit?: 'contain' | 'cover';
  pixelated?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  as?: 'div' | 'span';
}

export type GameIconProps = GameIconCommonProps & IconAccessibility;

export function atlasIcon(
  frameName: string,
  atlas: IconAtlasRef = UI_ICON_ATLAS,
): AtlasIconSource {
  return { kind: 'atlas', atlas, frameName };
}

export function assetIcon(src: string): AssetIconSource {
  return { kind: 'asset', src };
}

export function nodeIcon(node: ReactNode): NodeIconSource {
  return { kind: 'node', node };
}

function dimensions(size: IconSize): { width: number; height: number } {
  if (typeof size === 'number') {
    const value = Math.max(1, size);
    return { width: value, height: value };
  }
  return {
    width: Math.max(1, size.width),
    height: Math.max(1, size.height),
  };
}

function useAtlasFrame(source: AtlasIconSource | null): AtlasFrame | null {
  const key = source
    ? `${source.atlas.manifestUrl}\u0000${source.atlas.imageUrl}\u0000${source.frameName}`
    : '';
  const [resolved, setResolved] = useState<{
    key: string;
    frame: AtlasFrame | null;
  } | null>(null);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    loadIconAtlas(source.atlas).then((frames) => {
      if (!cancelled) {
        setResolved({ key, frame: frames.get(source.frameName) ?? null });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return resolved?.key === key ? resolved.frame : null;
}

function AtlasLayer({
  source,
  frame,
  width,
  height,
  fit,
}: {
  source: AtlasIconSource;
  frame: AtlasFrame;
  width: number;
  height: number;
  fit: 'contain' | 'cover';
}) {
  const scale = fit === 'cover'
    ? Math.max(width / frame.w, height / frame.h)
    : Math.min(width / frame.w, height / frame.h);

  return (
    <span
      className="game-icon__layer game-icon__atlas"
      aria-hidden="true"
      style={{
        width: frame.w * scale,
        height: frame.h * scale,
        backgroundImage: `url(${source.atlas.imageUrl})`,
        backgroundSize: `${frame.atlasW * scale}px ${frame.atlasH * scale}px`,
        backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
      }}
    />
  );
}

function AssetLayer({
  source,
  fit,
  loaded,
  onLoad,
  onError,
}: {
  source: AssetIconSource;
  fit: 'contain' | 'cover';
  loaded: boolean;
  onLoad: () => void;
  onError: () => void;
}) {
  return (
    <img
      className={`game-icon__layer game-icon__asset${loaded ? ' game-icon__asset--loaded' : ''}`}
      src={source.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ objectFit: fit }}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

/**
 * Layout-stable icon renderer. The outer footprint exists before art loads and
 * remains unchanged when a source is missing, replaced, or supplied as a node.
 * Callers must explicitly mark an icon decorative or provide its accessible
 * label; labeled controls should normally use decorative icons.
 */
export function GameIcon({
  source = null,
  size = 20,
  fallback = '?',
  fit = 'contain',
  pixelated,
  className,
  style,
  title,
  as: Tag = 'span',
  ...accessibility
}: GameIconProps) {
  const { width, height } = dimensions(size);
  const atlasSource = source?.kind === 'atlas' ? source : null;
  const frame = useAtlasFrame(atlasSource);
  const [assetState, setAssetState] = useState<{
    src: string;
    status: 'loading' | 'loaded' | 'failed';
  } | null>(null);
  const assetStatus = source?.kind === 'asset' && assetState?.src === source.src
    ? assetState.status
    : 'loading';
  const sourceReady = source?.kind === 'node'
    || (source?.kind === 'atlas' && !!frame)
    || (source?.kind === 'asset' && assetStatus === 'loaded');
  const usePixelated = pixelated ?? source?.kind === 'atlas';

  return (
    <Tag
      className={`game-icon${usePixelated ? ' game-icon--pixelated' : ''}${className ? ` ${className}` : ''}`}
      style={{ width, height, ...style }}
      title={title}
      data-icon-state={sourceReady ? 'ready' : 'fallback'}
      {...(accessibility.decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': accessibility.label })}
    >
      {!sourceReady && fallback !== null && (
        <span
          className="game-icon__fallback"
          aria-hidden="true"
          style={{ fontSize: Math.max(8, Math.round(Math.min(width, height) * 0.46)) }}
        >
          {fallback}
        </span>
      )}
      {atlasSource && frame && (
        <AtlasLayer
          source={atlasSource}
          frame={frame}
          width={width}
          height={height}
          fit={fit}
        />
      )}
      {source?.kind === 'asset' && assetStatus !== 'failed' && (
        <AssetLayer
          source={source}
          fit={fit}
          loaded={assetStatus === 'loaded'}
          onLoad={() => setAssetState({ src: source.src, status: 'loaded' })}
          onError={() => setAssetState({ src: source.src, status: 'failed' })}
        />
      )}
      {source?.kind === 'node' && (
        <span className="game-icon__layer game-icon__node" aria-hidden="true">
          {source.node}
        </span>
      )}
    </Tag>
  );
}
