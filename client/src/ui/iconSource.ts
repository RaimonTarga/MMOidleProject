import type { ReactNode } from "react";
import { UI_ICON_ATLAS, type IconAtlasRef } from "./iconAtlas";
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

