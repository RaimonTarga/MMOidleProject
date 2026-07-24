export interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  atlasW: number;
  atlasH: number;
}

export interface IconAtlasRef {
  manifestUrl: string;
  imageUrl: string;
}

interface AtlasManifest {
  textures?: Array<{
    size: { w: number; h: number };
    frames: Array<{
      filename: string;
      frame: { x: number; y: number; w: number; h: number };
    }>;
  }>;
}

export const UI_ICON_ATLAS: IconAtlasRef = {
  manifestUrl: '/assets/UI_icons.json',
  imageUrl: '/assets/UI_icons.png',
};

export const ITEM_ICON_ATLAS: IconAtlasRef = {
  manifestUrl: '/assets/icons.json',
  imageUrl: '/assets/icons.png',
};

export const SPRITE_ATLAS: IconAtlasRef = {
  manifestUrl: '/assets/sprites.json',
  imageUrl: '/assets/sprites.png',
};

const manifestPromises = new Map<string, Promise<Map<string, AtlasFrame>>>();

/**
 * Load and cache a packed-atlas manifest. Failed or malformed manifests resolve
 * to an empty map so icon fallbacks remain visible instead of rejecting during
 * render. The image URL is part of the key because it belongs to the complete
 * asset reference, even though frame geometry comes from the JSON file.
 */
export function loadIconAtlas(atlas: IconAtlasRef): Promise<Map<string, AtlasFrame>> {
  const cacheKey = `${atlas.manifestUrl}\u0000${atlas.imageUrl}`;
  const cached = manifestPromises.get(cacheKey);
  if (cached) return cached;

  const request = fetch(atlas.manifestUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load icon atlas: ${atlas.manifestUrl}`);
      return response.json() as Promise<AtlasManifest>;
    })
    .then((manifest) => {
      const texture = manifest.textures?.[0];
      if (!texture) return new Map<string, AtlasFrame>();

      const frames = new Map<string, AtlasFrame>();
      for (const entry of texture.frames) {
        frames.set(entry.filename, {
          x: entry.frame.x,
          y: entry.frame.y,
          w: entry.frame.w,
          h: entry.frame.h,
          atlasW: texture.size.w,
          atlasH: texture.size.h,
        });
      }
      return frames;
    })
    .catch(() => new Map<string, AtlasFrame>());

  manifestPromises.set(cacheKey, request);
  return request;
}
