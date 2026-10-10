import type { CSSProperties } from "react";
import type { AbilityIconLayer } from "@mmo-idle/shared";
import { GameIcon, type IconSource } from "./GameIcon";
import { composedIconArt } from "./abilityIconModel";
import "./composedAbilityIcon.css";

/**
 * An ability's icon as its rows have made it (design §22.7): the one hand-made
 * base glyph, the packet's lane as a frame, the cross's borrowed lane on the bottom
 * edge, the keystone as a border with its second glyph in the lower-left corner,
 * and the amplifier's axis as a small overlay in the lower-right. Placed here,
 * meant in shared (`abilityIconLayers`), drawn from existing art
 * (`abilityIconModel.ts`). The top corners stay clear: the hotbar puts its key
 * hint top-right and the slot badge top-left.
 */
export function ComposedAbilityIcon({
  base,
  layers,
}: {
  base: IconSource;
  layers: readonly AbilityIconLayer[];
}) {
  const art = composedIconArt(layers);
  const style = {
    ...(art.frame ? { "--ability-frame": art.frame } : {}),
    ...(art.edge ? { "--ability-edge": art.edge } : {}),
    ...(art.border ? { "--ability-border": art.border } : {}),
  } as CSSProperties;
  return (
    <span
      className={`composed-ability-icon${art.border ? " composed-ability-icon--keystone" : ""}`}
      style={style}
      aria-hidden="true"
    >
      <span className="composed-ability-icon__base">
        {base.kind === "asset"
          ? <img src={base.src} alt="" draggable={false} />
          : <GameIcon source={base} size={40} fit="cover" decorative />}
      </span>
      {art.frame && <span className="composed-ability-icon__frame" />}
      {art.edge && <span className="composed-ability-icon__edge" />}
      {art.border && <span className="composed-ability-icon__border" />}
      {art.keystoneGlyph && (
        <span className="composed-ability-icon__glyph composed-ability-icon__glyph--keystone">
          <img src={art.keystoneGlyph} alt="" draggable={false} />
        </span>
      )}
      {art.axisGlyph && (
        <span className="composed-ability-icon__glyph composed-ability-icon__glyph--axis">
          <img src={art.axisGlyph} alt="" draggable={false} />
        </span>
      )}
    </span>
  );
}
