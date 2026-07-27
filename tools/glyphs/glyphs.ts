// Hand-authored UI glyphs (Wave 3 §15 / V0b).
//
// These are source, not output. Each glyph is a pixel map in the sampled family
// palette; `pnpm art:glyphs` renders them into art/src/UI_icons/** and
// `pnpm art:pack --atlas=UI_icons` ships them.
//
// Why authored rather than generated: at icon size the whole glyph is a few
// hundred meaningful pixels, and every diffusion tool generates larger and
// downscales, which is precisely where the meaning is lost. The 2026-07-26
// PixelLab batch (22 entries, 66 candidates, $0.47) came back legible at 64px
// and mush at 18px — the same failure that retired the 16px modifier badges.
//
// Grid size is the shipped size; nothing is ever resampled. Stat and action
// glyphs are 16x16 because the HUD draws them at 16px. Class root sigils are
// 32x32 because the passive tree renders them on 88px nodes, where 16 would be
// starved — a three-part cycle or a figure with three skulls needs the room.
//
// Editing: change a character, re-run `pnpm art:glyphs`, look at the contact
// sheet. Iteration is free and instant, which is the whole point.

import { DEFAULT_GRID, GRID_SIZES, type GridSize } from './palette';

export interface Glyph {
  /** Atlas frame path, relative to art/src. */
  out: string;
  /** Square pixel map; its length is the grid size and the shipped size. */
  rows: string[];
}

export const GLYPHS: Record<string, Glyph> = {

  // ── Stat glyphs (16x16) ────────────────────────────────────────────────────
  // GlyphTile figures, the V3 crown, V4 mastery summaries, and — per §15 — the
  // standard V6 tree nodes, which reuse these on class-toned orbs.

  'stat-attack': {
    // A sword: long blade, full crossguard, grip and pommel.
    out: 'UI_icons/stats/attack.png',
    rows: [
      '................',
      '............K...',
      '...........KLK..',
      '..........KLCCK.',
      '.........KLLLLK.',
      '........KLLLLK..',
      '....K..KLLLLK...',
      '...KBKKLLLLK....',
      '..KBBBLLLLK.....',
      '..KBBBBLLK......',
      '...KBBBBK.......',
      '...KbBBBBK......',
      '..KbbbBBBBK.....',
      '.KBbbbKBBK......',
      'KBBBbK.KK.......',
      '.KBKK...........',
    ],
  },

  'stat-dps': {
    // A dagger held point-down — damage delivered, not damage held.
    out: 'UI_icons/stats/dps.png',
    rows: [
      '............KK..',
      '........KK.KbBK.',
      '.......KBBKbBBBK',
      '......KBBBbbbBK.',
      '.......KBBBbbK..',
      '........KBBBBK..',
      '.......KLLBBBBK.',
      '......KLLLLBBK..',
      '.....KLLLLKKK...',
      '....KLLLLK......',
      '...KLLLLK.......',
      '...KCLLK........',
      '...KCLK.........',
      '....KK..........',
      '................',
      '................',
    ],
  },

  'stat-plating': {
    // One riveted armour plate with a lit rivet.
    out: 'UI_icons/stats/plating.png',
    rows: [
      '................',
      '................',
      '....KKKKKKKK....',
      '..KKLLLLLLLLKK..',
      '..KLLDDDDDDLLK..',
      '..KLDDDDDDDDLK..',
      '..KLDCDDDDBDLK..',
      '..KLDDDDDDDDLK..',
      '..KLDDDDDDDDLK..',
      '..KLDBDDDDBDLK..',
      '..KLDDDDDDDDLK..',
      '..KKLDDDDDDLKK..',
      '...KKLLLLLLKK...',
      '.....KKKKKK.....',
      '................',
      '................',
    ],
  },

  'stat-reduction': {
    // A shield with a bronze cross and a lit heart.
    out: 'UI_icons/stats/reduction.png',
    rows: [
      '................',
      '................',
      '..KKKKKKKKKKKK..',
      '..KDDDDBBDDDDK..',
      '..KDDDDBBDDDDK..',
      '..KBBBBBBBBBBK..',
      '..KDDDDBBDDDDK..',
      '..KDDDDCCDDDDK..',
      '...KDDDBBDDDK...',
      '...KDDDBBDDDK...',
      '....KDDBBDDK....',
      '.....KDBBDK.....',
      '......KBBK......',
      '.......KK.......',
      '................',
      '................',
    ],
  },

  'stat-range': {
    // A crosshair: ring, four ticks, lit centre.
    out: 'UI_icons/stats/range.png',
    rows: [
      '................',
      '.......BB.......',
      '.......BB.......',
      '.....KKKKKK.....',
      '....KB....BK....',
      '...KB......BK...',
      '..KB........BK..',
      'BB.B...CC...B.BB',
      'BB.B...CC...B.BB',
      '..KB........BK..',
      '...KB......BK...',
      '....KB....BK....',
      '.....KKKKKK.....',
      '.......BB.......',
      '.......BB.......',
      '................',
    ],
  },

  'stat-speed': {
    // A boot with a lit stripe.
    out: 'UI_icons/stats/speed.png',
    rows: [
      '................',
      '................',
      '.....KKKK.......',
      '....KBBBBK......',
      '....KBBBBK......',
      '....KBCCBK......',
      '....KBBBBK......',
      '....KBBBBK......',
      '....KBBBBKKK....',
      '....KBBBBBBBK...',
      '....KBBBBBBBBK..',
      '...KKBBBBBBBBK..',
      '...KDDDDDDDDDK..',
      '...KKKKKKKKKKK..',
      '................',
      '................',
    ],
  },

  'stat-regen': {
    // A medical cross with a lit core.
    out: 'UI_icons/stats/regen.png',
    rows: [
      '................',
      '................',
      '................',
      '.....KKKKKK.....',
      '.....KBBBBK.....',
      '.....KBBBBK.....',
      '..KKKKBBBBKKKK..',
      '..KBBBBCCBBBBK..',
      '..KBBBBCCBBBBK..',
      '..KKKKBBBBKKKK..',
      '.....KBBBBK.....',
      '.....KBBBBK.....',
      '.....KKKKKK.....',
      '................',
      '................',
      '................',
    ],
  },

  'stat-evasion': {
    // A figure leaning clear of an incoming strike.
    out: 'UI_icons/stats/evasion.png',
    rows: [
      '................',
      '...........CC...',
      '..........BCCB..',
      '.........BBCCBB.',
      '...........BB...',
      '...........BB...',
      '..KDK......BB...',
      '.KDCDK.....BB...',
      '..KDK.....BB....',
      '..........BB....',
      '.........BB.....',
      '........BB......',
      '.......BB.......',
      '......BB........',
      '................',
      '................',
    ],
  },

  'stat-empowered': {
    // A double chevron rising — the arrow symbol, not a projectile.
    out: 'UI_icons/stats/empowered.png',
    rows: [
      '................',
      '.......KK.......',
      '......KCCK......',
      '.....KCCCCK.....',
      '....KCC..CCK....',
      '...KCC....CCK...',
      '..KCK......KCK..',
      '..KK........KK..',
      '.......KK.......',
      '......KBBK......',
      '.....KBBBBK.....',
      '....KBB..BBK....',
      '...KBB....BBK...',
      '..KBK......KBK..',
      '..KK........KK..',
      '................',
    ],
  },

  'stat-shield': {
    // A bubble ward, lit above and deeper below.
    out: 'UI_icons/stats/shield.png',
    rows: [
      '................',
      '......CCCC......',
      '....CC....CC....',
      '...C........C...',
      '..C..CC......C..',
      '..C..C.......C..',
      '.C............C.',
      '.C............C.',
      '.c............c.',
      '.c............c.',
      '..c..........c..',
      '..c..........c..',
      '...c........c...',
      '....cc....cc....',
      '......cccc......',
      '................',
    ],
  },


  // ── Action glyphs (16x16) ──────────────────────────────────────────────────
  // The §15 de-texting replacements. An ActionChip shows one of these instead
  // of a text button; the label still reaches the tooltip and accessible name.

  'action-locate': {
    // A compass: bronze case, lit north needle.
    out: 'UI_icons/actions/locate.png',
    rows: [
      '.......CC.......',
      '......BBBB......',
      '....BB....BB....',
      '...B........B...',
      '..B....C.....B..',
      '..B....CC....B..',
      '.B.....CC.....B.',
      '.B.....CC.....B.',
      '.B.....DD.....B.',
      '.B.....DD.....B.',
      '..B....DD....B..',
      '..B....D.....B..',
      '...B........B...',
      '....BB....BB....',
      '......BBBB......',
      '................',
    ],
  },

  'action-inspect': {
    // Bronze lens ring with a glint; no eye, to stay clear of the rune sigil.
    out: 'UI_icons/actions/inspect.png',
    rows: [
      '................',
      '....KKKKKK......',
      '...KBBBBBBK.....',
      '..KBBKKKKBBK....',
      '..KBK.CC.KBK....',
      '..KBK....KBK....',
      '..KBK....KBK....',
      '..KBBKKKKBBK....',
      '...KBBBBBBK.....',
      '....KKKKKKbK....',
      '..........KBBK..',
      '...........KBBK.',
      '............KBK.',
      '............KKK.',
      '................',
      '................',
    ],
  },

  'action-equip': {
    // Into the socket, lit at the point of entry.
    out: 'UI_icons/actions/equip.png',
    rows: [
      '................',
      '.......KK.......',
      '.......BB.......',
      '.......BB.......',
      '....K..BB..K....',
      '....KB.BB.BK....',
      '.....KBCCBK.....',
      '......KCCK......',
      '.......KK.......',
      '................',
      '..KKK......KKK..',
      '..KDK......KDK..',
      '..KDKKKKKKKKDK..',
      '..KDDDDDDDDDDK..',
      '..KKKKKKKKKKKK..',
      '................',
    ],
  },

  'action-unequip': {
    // Out of the socket; the mirror of equip.
    out: 'UI_icons/actions/unequip.png',
    rows: [
      '................',
      '.......KK.......',
      '......KCCK......',
      '.....KBCCBK.....',
      '....KB.BB.BK....',
      '....K..BB..K....',
      '.......BB.......',
      '.......BB.......',
      '.......KK.......',
      '................',
      '..KKK......KKK..',
      '..KDK......KDK..',
      '..KDKKKKKKKKDK..',
      '..KDDDDDDDDDDK..',
      '..KKKKKKKKKKKK..',
      '................',
    ],
  },

  'action-reorder': {
    // Two real arrows: raise (lit) and lower.
    out: 'UI_icons/actions/reorder.png',
    rows: [
      '................',
      '................',
      '....C...........',
      '...BCB....LL....',
      '..BBCBB...LL....',
      '.BBBCBBB..LL....',
      '...BBB....LL....',
      '...BBB....LL....',
      '...BBB....LL....',
      '...BBB....LL....',
      '...BBB..LLLLLL..',
      '...BBB...LLLL...',
      '...BBB....LL....',
      '...BBB.....L....',
      '................',
      '................',
    ],
  },

  'action-confirm': {
    // Bronze check rising to a lit tip.
    out: 'UI_icons/actions/confirm.png',
    rows: [
      '................',
      '................',
      '.............KK.',
      '............KCK.',
      '...........KCK..',
      '..........KBK...',
      '.K.......KBK....',
      '.KK.....KBK.....',
      '..KB...KBK......',
      '...KB.KBK.......',
      '....KBBK........',
      '.....KK.........',
      '................',
      '................',
      '................',
      '................',
    ],
  },


  // ── Class root sigils (32x32) ──────────────────────────────────────────────
  // For the V6 passive-tree spine, drawn on 88px nodes. Deliberately not
  // class-coloured: §14.6 puts the class tone on the orb behind the node, and
  // Phase 10C locked navigation art as a transparent symbol layer.

  'class-cadence': {
    // Two crossed swords.
    out: 'UI_icons/classes/cadence.png',
    rows: [
      '................................',
      '............KKKKKKKKK...........',
      '..........KKBBBBBBBBBKK.........',
      '........KKBBBBBBBBBBBBBKK.......',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '......KBBBbbbbKKKKKbbbbBBBK.....',
      '.....KBBBbbKKK.....KKKbbBBBK....',
      '....KBBBbbLK..........KbbBBBK...',
      '...KBBBbLCLLK........KLCbbBBBK..',
      '...KBBbbKLLLLK......KLLLLbbBBK..',
      '..KBBbbK.KLLLK.....KLLLLKKbbBBK.',
      '..KBBbK..KLLLLK...KLLLLK..KbBBK.',
      '.KBBBbK...KLLLLK.KLLLLK...KbBBBK',
      '.KBBbbK....KLLLLKLLLLK....KbbBBK',
      '.KBBbK.....KBLLLLLBBLK.....KbBBK',
      '.KBBbK.....KBBLLLBBBBK.....KbBBK',
      '.KBBbK.....KBBBLBBbBK......KbBBK',
      '.KBBbK......KKbBbbbK.......KbBBK',
      '.KBBbK......KbBBbbbbK......KbBBK',
      '.KBBbbK....KbBBBBbbbbK....KbbBBK',
      '.KBBBbK...KbbbBBKBbbbbK...KbBBBK',
      '..KBBbK..KbbbbKK.KKbbbbK..KbBBK.',
      '..KBBbbK.KBbbbK....KbbBbKKbbBBK.',
      '...KBBbbKBBBbK......KBBBKbbBBK..',
      '...KBBBbbKBbK........KBKbbBBBK..',
      '....KBBBbbKK..........KbbBBBK...',
      '.....KBBBbbKKK.....KKKbbBBBK....',
      '......KBBBbbbbKKKKKbbbbBBBK.....',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '........KKBBBBBBBBBBBBBKK.......',
      '..........KKBBBBBBBBBKK.........',
      '............KKKKKKKKK...........',
    ],
  },

  'class-cooldown': {
    // A war hammer with a lit striking face.
    out: 'UI_icons/classes/cooldown.png',
    rows: [
      '....................K...........',
      '............KKKKKKKKBKK.........',
      '..........KKBBBBBBBBBBBK........',
      '........KKBBBBBBBBDBBBBBK.......',
      '.......KBBBBBbbbbDDDBBBBBK......',
      '......KBBBbbbbKKBDDDDDBCCBKK....',
      '.....KBBBbbKKK.KBBBDDDCCCCCBK...',
      '....KBBBbbK...KBBBBBDDCCCCCBBK..',
      '...KBBBbbK...KDDBBBBBDDCCCCBBBK.',
      '...KBBbbK...KDDDDDBBBBDDCCDBBBBK',
      '..KBBbbK.....KDDDDDBBBBBDDDDBBK.',
      '..KBBbK.......KDDDDDBBBBBDDDDBK.',
      '.KBBBbK........KDDDDDBBBBBDDBBBK',
      '.KBBbbK........KbbDDDDDBBBBbbBBK',
      '.KBBbK........KbbbbDDDDDBBKKbBBK',
      '.KBBbK.......KbbbbbKDDDDDK.KbBBK',
      '.KBBbK......KbbbbbK.KDDDDK.KbBBK',
      '.KBBbK......KbbbbbK..KKDK..KbBBK',
      '.KBBbK.....KbbbbbK.....K...KbBBK',
      '.KBBbbK...KBbbbbK.........KbbBBK',
      '.KBBBbK..KBBBBbK..........KbBBBK',
      '..KBBbK.KBBBBBBK..........KbBBK.',
      '..KBBbbKBBBBBBBK.........KbbBBK.',
      '...KBBbbBBBBBBK.........KbbBBK..',
      '...KBBBbbBBBBK.........KbbBBBK..',
      '....KBBbbbBBK.........KbbBBBK...',
      '.....KBBbbbKKK.....KKKbbBBBK....',
      '......KBBbbbbbKKKKKbbbbBBBK.....',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '........KKBBBBBBBBBBBBBKK.......',
      '..........KKBBBBBBBBBKK.........',
      '............KKKKKKKKK...........',
    ],
  },

  'class-dot': {
    // A cycle in three parts: poison, flame, frost — told apart by shape, not colour.
    out: 'UI_icons/classes/dot.png',
    rows: [
      '................................',
      '............KKKKKKKKK...........',
      '..........KKBBBBBBBBBKK.........',
      '........KKBBBBBBBBBBBBBKK.......',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '......KBBBbbbbKKKKKbbbbBBBK.....',
      '.....KBBBbbKKK.....KKKbbBBBK....',
      '....KBBBbbK...........KbbBBBK...',
      '...KBBBbbK.............KbbBBBK..',
      '...KBBbbK.......K.......KbbBBK..',
      '..KBBbbK.......KBK.......KbbBBK.',
      '..KBBbK........KBK........KbBBK.',
      '.KBBBbK.......KBBBK.......KbBBBK',
      '.KBBbbK......KKBBBKK......KbbBBK',
      '.KBBbK......KBBBBBBBK......KbBBK',
      '.KBBbK.....KBBBBDBBBBK.....KbBBK',
      '.KBBbK....KBBBDDDDDBBBK....KbBBK',
      '.KBBbK....KBBDDDDDDDBBK....KbBBK',
      '.KBBbK....KBBDCDDDDDBBK....KbBBK',
      '.KBBbbK..KBBDDDDDDDDDBBK..KbbBBK',
      '.KBBBbK...KBBDDDDDCDBBK...KbBBBK',
      '..KBBbK...KBBDDDDDDDBBK...KbBBK.',
      '..KBBbbK..KBBBDCDDDBBBK..KbbBBK.',
      '...KBBbbK..KBBBBDBBBBK..KbbBBK..',
      '...KBBBbbK..KBBBBBBBK..KbbBBBK..',
      '....KBBBbbK..KKKBKKK..KbbBBBK...',
      '.....KBBBbbKKK..K..KKKbbBBBK....',
      '......KBBBbbbbKKKKKbbbbBBBK.....',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '........KKBBBBBBBBBBBBBKK.......',
      '..........KKBBBBBBBBBKK.........',
      '............KKKKKKKKK...........',
    ],
  },

  'class-reload': {
    // A hexagonal cylinder; five chambers spent, the top one loaded.
    out: 'UI_icons/classes/reload.png',
    rows: [
      '................................',
      '............KKKKKKKKK...........',
      '..........KKBBBBBBBBBKK.........',
      '........KKBBBBBBBBBBBBBKK.......',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '......KBBBbbbbKBBBKbbbbBBBK.....',
      '.....KBBBbbKKBBBBBBBKKbbBBBK....',
      '....KBBBbbKKBBBBBBBBBKKbbBBBK...',
      '...KBBBbbKBBBBBBCBBBBBBKbbBBBK..',
      '...KBBbbBBBBBBKCCCKBBBBBBbbBBK..',
      '..KBBbbBBBBBKKCCCCCKKBBBBBbbBBK.',
      '..KBBbBBBBDK..KCCCK..KDBBBBbBBK.',
      '.KBBBbBBBDDDK..KCK..KDDDBBBbBBBK',
      '.KBBbbBBDDDDDK..K..KDDDDDBBbbBBK',
      '.KBBbKBBBDDDK...K...KDDDBBBKbBBK',
      '.KBBbKBBBKDK...KbK...KDKBBBKbBBK',
      '.KBBbKBBBKK...KbbbK...KKBBBKbBBK',
      '.KBBbKBBBKDK...KbK...KDKBBBKbBBK',
      '.KBBbKBBBDDDK...K...KDDDBBBKbBBK',
      '.KBBbbBBDDDDDK.....KDDDDDBBbbBBK',
      '.KBBBbBBBDDDK...K...KDDDBBBbBBBK',
      '..KBBbBBBBDK...KDK...KDBBBBbBBK.',
      '..KBBbbBBBBBKKKDDDKKKBBBBBbbBBK.',
      '...KBBbbBBBBBBDDDDDBBBBBBbbBBK..',
      '...KBBBbbKBBBBBDDDBBBBBKbbBBBK..',
      '....KBBBbbKKBBBBDBBBBKKbbBBBK...',
      '.....KBBBbbKKBBBBBBBKKbbBBBK....',
      '......KBBBbbbbKBBBKbbbbBBBK.....',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '........KKBBBBBBBBBBBBBKK.......',
      '..........KKBBBBBBBBBKK.........',
      '............KKKKKKKKK...........',
    ],
  },

  'class-energy': {
    // A lugged focus ring with the channel running clean through it.
    out: 'UI_icons/classes/energy.png',
    rows: [
      '...............KK...............',
      '..............KCCK..............',
      '..............KCCK..............',
      '.............KKCCBKK............',
      '..........KKKBBCCBBBKKK.........',
      '.........KBBBBBCCBBBBBBK........',
      '........KBBBBBKCCKKBBBBBK.......',
      '.......KBBBKKKKCCKKKKKBBBK......',
      '......KBBBKKKbbCCbbbKKKBBBK.....',
      '.....KBBBbKbbbKCCKKbbbKbBBBK....',
      '....KBBBKKbbKKKCCK.KKbbKKBBBK...',
      '....KBBKKbbK..KCCK...KbbKKBBK...',
      '....KBBKKbK...KCCK....KbKKBBK...',
      '...KBBBKbbK...KCCK....KbbKBBBK..',
      '...KBBKKbK...KCCCCK....KbKKBBK..',
      '..KBBBKKbK...KCCCCK....KbKKBBBK.',
      '.KBBBBBKbK...KCCCCK....KbKBBBBBK',
      '..KBBBKKbK...KCCCCK....KbKKBBBK.',
      '...KBBKKbK...KCCCCK....KbKKBBK..',
      '...KBBBKbbK...KCCK....KbbKBBBK..',
      '....KBBKKbK...KCCK....KbKKBBK...',
      '....KBBKKbbK..KCCK...KbbKKBBK...',
      '....KBBBKKbbKKKCCK.KKbbKKBBBK...',
      '.....KBBBbKbbbKCCKKbbbKbBBBK....',
      '......KBBBKKKbbCCbbbKKKBBBK.....',
      '.......KBBBKKKKCCKKKKKBBBK......',
      '........KBBBBBKCCKKBBBBBK.......',
      '.........KBBBBBCCBBBBBBK........',
      '..........KKKBBCCBBBKKK.........',
      '.............KKCCBKK............',
      '..............KCCK..............',
      '...............KK...............',
    ],
  },

  'class-summoner': {
    // A caller with arms raised, and three skulls answering.
    out: 'UI_icons/classes/summoner.png',
    rows: [
      '................................',
      '............KKKKKKKKK...........',
      '..........KKBBBBBBBBBKK.........',
      '........KKBBBBBBBBBBBBBKK.......',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '......KBBBbbbbKKKKKbbbbBBBK.....',
      '.....KBBBbbKKKKKKKKKKKbbBBBK....',
      '....KBBBbbKKLLLLLLLLLKKbbBBBK...',
      '...KBBBbbK.KLLLLLLLLLK.KbbBBBK..',
      '...KBBbbK..KLLLLLLLLLK..KbbBBK..',
      '..KBBbbK...KLCCCLCCCLK...KbbBBK.',
      '..KBBbK....KLCCCLCCCLK....KbBBK.',
      '.KBBBbK....KLCCCLCCCLK....KbBBBK',
      '.KBBbbK....KLLLLLLLLLK....KbbBBK',
      '.KBBbK.....KLLLLLLLLLK.....KbBBK',
      '.KBBbK......KLLLKLLLK......KbBBK',
      '.KBBbKKKKKKK.KKK.KKK.KKKKKKKbBBK',
      '.KBBbLLLLLLLK.......KLLLLLLLbBBK',
      '.KBBbLLLLLLLK.......KLLLLLLLbBBK',
      '.KBBbLCCLCCLK.......KLCCLCCLbBBK',
      '.KBBBLCCLCCLK.......KLCCLCCLBBBK',
      '..KBBLCCLCCLK...K...KLCCLCCLBBK.',
      '..KBBLLLLLLLK..KbK..KLLLLLLLBBK.',
      '...KBBLLKLLK..KbbbK..KLLKLLBBK..',
      '...KBBBbbKK..KbbbbbK..KKbbBBBK..',
      '....KBBBbbK...KbbbK...KbbBBBK...',
      '.....KBBBbbKKKbbbbbKKKbbBBBK....',
      '......KBBBbbbbbbbbbbbbbBBBK.....',
      '.......KBBBBBbbbbbbbBBBBBK......',
      '........KKBBBBbbbbbBBBBKK.......',
      '..........KKBBBBBBBBBKK.........',
      '............KKKKKKKKK...........',
    ],
  },
};

/** The authored grid for a glyph is simply how tall its map is. */
export function gridSizeOf(glyph: Glyph): GridSize {
  const size = glyph.rows.length;
  return (GRID_SIZES as readonly number[]).includes(size)
    ? (size as GridSize)
    : DEFAULT_GRID;
}

/** Fails loudly on a ragged map — a miscounted row silently shifts a glyph. */
export function validateGlyphs(): void {
  const problems: string[] = [];
  for (const [id, glyph] of Object.entries(GLYPHS)) {
    const size = glyph.rows.length;
    if (!(GRID_SIZES as readonly number[]).includes(size)) {
      problems.push(`${id}: ${size} rows; expected one of ${GRID_SIZES.join('/')}`);
      continue;
    }
    glyph.rows.forEach((row, y) => {
      if (row.length !== size) {
        problems.push(`${id}: row ${y} is ${row.length} wide, expected ${size}`);
      }
    });
  }
  if (problems.length) {
    throw new Error(`Invalid glyph maps:\n  - ${problems.join('\n  - ')}`);
  }
}
