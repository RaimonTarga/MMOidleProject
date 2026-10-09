/**
 * The composed ability icon's ART (design §22.7) — the pure half. Shared's
 * `abilityIconLayers` says WHAT each layer means (a lane, an axis, a verb); this
 * says which EXISTING art and which colour draws it, so the component only
 * places them. No Phaser, no DOM: `server/test/abilityIconArt.test.ts` checks
 * every glyph named here exists on disk and every layer resolves.
 *
 * NO NEW ART. Every glyph is an existing concept icon (status tiles, stance and
 * stat icons, the payload glyphs), never a packed atlas frame edited by hand and
 * never a PixelLab generation. Nothing here is the Ornate skin (design §26.4): a
 * frame is a lane's colour, a border a verb's, and there are no gems or light.
 */
import {
  packetDefinition,
  type AbilityIconLayer,
  type AmplifiedAxis,
  type PacketId,
} from "@mmo-idle/shared";

const ART = "/assets/concept-icons";

/** The public path of one concept icon (`<dir>/<name>`, no extension). */
export function conceptArtPath(path: string): string {
  return `${ART}/${path}.png`;
}

/**
 * Base glyphs for the abilities that have no art of their own: §22.8's two
 * additions borrow the tile that already says what they are — Sidestep its own
 * window's tile (the lineage evasion window, which its buff already wears), Cull
 * the Execute stance (a strike that wants the target low).
 */
export const BORROWED_BASE_GLYPHS: Readonly<Record<string, string>> = {
  sidestep: "statuses/buffs/lineage-evasion",
  cull: "stances/execute-stance",
};

/**
 * The amplifier's overlay glyph, per axis — the "of X" of the name, drawn:
 * of Many (four bodies), of the Lingering (the hourglass), of Weight (the weight),
 * of Haste (the speed arrow). `trigger` is a lineage card's axis, never an
 * ability's (`nodePayoffAxes` offers it nowhere), so it has none.
 */
export const AXIS_GLYPHS: Readonly<Partial<Record<AmplifiedAxis, string>>> = {
  targets: "statuses/buffs/summoner-endless-swarm",
  duration: "statuses/buffs/cooldown-patience",
  magnitude: "statuses/debuffs/debuff-slow",
  cast: "stats/speed",
};

/**
 * The keystone's second glyph, per verb: the existing icon that draws its
 * silhouette (shared `ABILITY_KEYSTONE_SILHOUETTES`). One per keystone — §22.7's
 * "only the keystone's second glyph and its animation are authored".
 */
export const KEYSTONE_GLYPHS: Readonly<Record<string, string>> = {
  // Techniques
  whirlwind: "statuses/buffs/flurry", // spin: the turning blades
  aftershock: "statuses/buffs/cadence-aftershock", // quake: the ring that goes off again
  breakthrough: "statuses/debuffs/debuff-stunned", // stagger: the dazed halo
  outbreak: "statuses/debuffs/dot-rot-spores", // spread: the spore cloud
  dragnet: "payloads/root", // net: the Control lane's own shackle glyph
  "chain-reaction": "statuses/buffs/energy-critical-mass", // burst: the core going off
  vanish: "statuses/buffs/cadence-echo", // fade: the waning moon
  pierce: "stats/range", // line: the shot's straight path
  relay: "statuses/buffs/summoner-coordinated-hunt", // jump: body to body
  fork: "statuses/buffs/energy-storm", // fork: the split bolt
  harvest: "stances/reaper-stance", // scythe
  // Guards
  "shared-breath": "statuses/buffs/summoner-howl-banner", // formation: the banner the line follows
  immunity: "statuses/buffs/summoner-debuff-immune", // shell: the struck-through shield
  riposte: "statuses/debuffs/debuff-stunned", // stagger
  entangle: "statuses/debuffs/debuff-root", // snare: the held foot
  unyielding: "statuses/buffs/defense-hardening", // shell: the plate
  backlash: "statuses/buffs/stance-release", // burst: the release
  overflow: "statuses/buffs/defense-absorb", // shell: the ward
  flow: "stances/fleeting-stance", // flow: the streaming wing, a blur that carries on
  afterimage: "payloads/lands-twice", // fade: the doubled crescent, a second self
};

/** A lane's colour, from its one owner (design §18.2). */
export function laneCss(lane: PacketId): string {
  return packetDefinition(lane)?.color ?? "#ffffff";
}

/** What the component draws, resolved from the layer list. */
export interface ComposedIconArt {
  /** Packet row: the frame's colour. */
  frame?: string;
  /** Cross row: the edge's colour. */
  edge?: string;
  /** Keystone row: the border's colour. */
  border?: string;
  /** Keystone row: the second glyph's path, where the verb has a silhouette. */
  keystoneGlyph?: string;
  /** Amplifier row: the overlay glyph's path. */
  axisGlyph?: string;
}

/** Resolve a layer list to art. A layer with no art (an unmapped verb) draws nothing. */
export function composedIconArt(layers: readonly AbilityIconLayer[]): ComposedIconArt {
  const art: ComposedIconArt = {};
  for (const layer of layers) {
    switch (layer.kind) {
      case "lane-frame":
        art.frame = laneCss(layer.lane);
        break;
      case "cross-edge":
        art.edge = laneCss(layer.lane);
        break;
      case "keystone-border":
        art.border = laneCss(layer.lane);
        break;
      case "keystone-glyph": {
        const path = KEYSTONE_GLYPHS[layer.keystone];
        if (path) art.keystoneGlyph = conceptArtPath(path);
        break;
      }
      case "axis-glyph": {
        const path = AXIS_GLYPHS[layer.axis];
        if (path) art.axisGlyph = conceptArtPath(path);
        break;
      }
      default:
        break;
    }
  }
  return art;
}
