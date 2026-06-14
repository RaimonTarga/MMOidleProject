export interface AtlasFrame {
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

export function loadUIAtlas(): Promise<Map<string, AtlasFrame>> {
  if (!manifestPromise) {
    manifestPromise = fetch('/assets/UI_icons.json')
      .then(res => (res.ok ? (res.json() as Promise<SpritesManifest>) : Promise.reject()))
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
