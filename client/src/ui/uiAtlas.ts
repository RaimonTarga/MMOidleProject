import { loadIconAtlas, UI_ICON_ATLAS, type AtlasFrame } from './iconAtlas';

export type { AtlasFrame } from './iconAtlas';

/** Compatibility export for map code that still reads UI-atlas geometry. */
export function loadUIAtlas(): Promise<Map<string, AtlasFrame>> {
  return loadIconAtlas(UI_ICON_ATLAS);
}
