import { biomeLevelCap } from '../../config/gameConfig';
import type { ClassArchetype } from '../../classKits/types';
import { RECIPE_DATABASE } from '../../data/recipes';
import type { Recipe } from '../../data/recipes/types';
import { CLASS_GEAR } from '../../data/classGear';
import { SKILL_TREE } from '../../data/skillTree';
import { classLineFor } from '../../systems/classGear';
import { CLEARING_NODE_ID } from '../../world/nodeBiomes';
import type { TutorialBeat, TutorialCondition, TutorialNodeRef, TutorialProgressRef, TutorialStep } from '../types';
import { TUTORIAL_GEAR_PLANS, type TutorialGearPlan } from './gearPlans';

/**
 * The guide's gear beats (OV2-GUIDE): a class's gear plan (`gearPlans.ts`) laid into its script.
 *
 * Each piece is one beat, one press of Next: farm its zone until the piece can be made, craft
 * it, wear it. The beats go where the zone opens the piece. A zone farm (a beat that farms a
 * zone to a level, e.g. the arrival beat up to the lesson level) that runs past a piece's level
 * is cut there: the farm beat keeps its line and now ends when the piece can be made, the piece's
 * beat follows, and the last piece cut out of that farm carries on to the level the farm used to
 * end at. A piece opened exactly at a farm's level follows that farm. So the lesson lines still
 * come up when their level lands, and every piece comes up as soon as it opens.
 *
 * Pieces from another zone (a detour) and pieces worn again come right after the zone's first
 * farm, before its boss.
 *
 * Every craft and equip carries an `unless`: the piece is moot once the player is past its
 * stretch (the next zone in the guide's order has been fought in, the zone's boss for that tier
 * is down, or the tier is two promotions on, one for Tier 1: three to five seals promote before a
 * tier's last bosses), or already wears a later piece of the plan for that slot. A hand-played
 * or older character is never sent back for gear it has outgrown.
 */

type Tier = 1 | 2 | 3 | 4;

interface Stretch {
  tier: number;
  zone: string;
}

interface Piece {
  id: string;
  recipe: Recipe;
  tier: number;
  /** The zone whose turn this piece is made in. */
  zone: string;
  /** `craft` in its own zone, `detour` from another zone, `again` already made earlier. */
  kind: 'craft' | 'detour' | 'again';
}

const stretchKey = (tier: number, zone: string) => `${tier}:${zone}`;

function gatesOf(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === 'allOf' || condition.type === 'anyOf') return condition.of.flatMap(gatesOf);
  if (condition.type === 'not') return [];
  return [condition];
}

/** The level a beat farms its zone to, when it is a farm of that zone at that tier. */
function farmGate(beat: TutorialBeat, tier: number, zone: string): number | null {
  const step = beat.steps[0];
  if (step?.type !== 'farm' || step.at.kind !== 'biome' || step.at.biomeGroup !== zone || step.at.tier !== tier) return null;
  const levels = gatesOf(step.until)
    .filter((gate): gate is Extract<TutorialCondition, { type: 'biomeLevelAtLeast' }> =>
      gate.type === 'biomeLevelAtLeast' && gate.biomeGroup === zone)
    .map((gate) => gate.level);
  return levels.length > 0 ? Math.max(...levels) : null;
}

/** The zone stretches of a class's beats, in the order the guide walks them. */
export function tutorialStretches(beats: readonly TutorialBeat[]): Stretch[] {
  const seen = new Set<string>();
  const order: Stretch[] = [];
  for (const beat of beats) {
    const step = beat.steps[0];
    if (step?.type !== 'farm' || step.at.kind !== 'biome' || step.at.tier === undefined) continue;
    const { tier, biomeGroup: zone } = step.at;
    if (farmGate(beat, tier, zone) === null || seen.has(stretchKey(tier, zone))) continue;
    seen.add(stretchKey(tier, zone));
    order.push({ tier, zone });
  }
  return order;
}

/** The plan's pieces in the guide's order (stretch by stretch, each zone's list in order). */
function planPieces(plan: TutorialGearPlan, stretches: readonly Stretch[]): Piece[] {
  const made = new Set<string>([plan.start]);
  const pieces: Piece[] = [];
  const known = new Set(stretches.map((s) => stretchKey(s.tier, s.zone)));
  for (const [tierKey, zones] of Object.entries(plan.tiers)) {
    for (const zone of Object.keys(zones)) {
      if (!known.has(stretchKey(Number(tierKey), zone))) {
        throw new Error(`tutorial gear: the guide never farms the tier-${tierKey} ${zone}`);
      }
    }
  }
  for (const { tier, zone } of stretches) {
    for (const id of plan.tiers[tier as Tier]?.[zone] ?? []) {
      const recipe = RECIPE_DATABASE.get(id);
      if (!recipe) throw new Error(`tutorial gear: unknown recipe ${id}`);
      const kind = made.has(id) ? 'again' : recipe.recipeGroup === zone ? 'craft' : 'detour';
      made.add(id);
      pieces.push({ id, recipe, tier, zone, kind });
    }
  }
  return pieces;
}

/** Words the class gear texts capitalize mid-sentence (Recovery, Bolt...): kept capitalized when a text is quoted after a colon. */
let termWords: Set<string> | null = null;
function terms(): Set<string> {
  if (termWords) return termWords;
  termWords = new Set<string>();
  const texts: string[] = [];
  for (const gear of Object.values(CLASS_GEAR)) {
    for (const weapon of gear.weapons) if (weapon.description) texts.push(weapon.description);
    for (const line of [...Object.values(gear.lines), ...Object.values(gear.movedLines ?? {})]) texts.push(line.text);
  }
  for (const text of texts) {
    for (const match of text.slice(1).matchAll(/[^.!?]\s([A-Z][A-Za-z'-]*)/g)) termWords.add(match[1]);
  }
  return termWords;
}

/** The panel's line limit (`tutorial.test.ts` holds every line to it). */
const LINE_LIMIT = 170;

/** A gear text's first sentence, quoted after the guide's words: lower-cased unless it opens on a term. */
function quoted(text: string): string {
  const sentence = text.split(/(?<=[.!?])\s+(?=[A-Z])/)[0];
  const first = /^[A-Za-z'-]+/.exec(sentence)?.[0] ?? '';
  const keep = (first.length > 1 && first === first.toUpperCase()) || terms().has(first);
  const body = keep ? sentence : `${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
  return /[.!?]$/.test(body) ? body : `${body}.`;
}

/** "Craft the X and wear it: what it does", shortened until it fits the panel. */
function craftLine(action: string, text: string | undefined): string {
  if (!text) return `${action}.`;
  const body = quoted(text);
  // A text with its own colon reads better after a dash.
  const joint = body.includes(':') ? ' - ' : ': ';
  for (const line of [`${action}${joint}${body}`, `${action.replace(/ and .*$/, '')}${joint}${body}`]) {
    if (line.length <= LINE_LIMIT) return line;
  }
  return `${action}.`;
}

/** The guide's line for a piece: one sentence, no numbers, what it does for this class. */
function gearLine(piece: Piece, plan: TutorialGearPlan, archetype: ClassArchetype): string {
  const { recipe } = piece;
  const name = recipe.name;
  const line = classLineFor(recipe, archetype)?.text;
  if (piece.kind === 'again') return craftLine(`Put the ${name} back on`, line);
  switch (recipe.slot) {
    case 'weapon': {
      if (piece.tier >= 2) {
        const pick = SKILL_TREE.get(plan.defaultPick)?.name ?? plan.defaultPick;
        return `Craft the ${name} and wield it: it suits ${pick}, the default ${plan.pickWord}, and the Make tab has weapons for the others.`;
      }
      return craftLine(`Craft the ${name} and wield it`, recipe.description);
    }
    case 'armor':
      return craftLine(`Craft the ${name} and wear it`, line);
    case 'recovery':
      return craftLine(`Craft the ${name} and carry it`, line);
    case 'mobility':
      return craftLine(`Craft the ${name} and lace them up`, line ?? 'A faster pair, so less walking and more fighting.');
    default:
      return craftLine(`Craft the ${name} and wear it`, line);
  }
}

function anyOf(of: TutorialCondition[]): TutorialCondition {
  return of.length === 1 ? of[0] : { type: 'anyOf', of };
}

interface Built {
  beats: TutorialBeat[];
  /** The Clearing start weapon's beat, for the opening. */
  start: TutorialBeat;
}

/**
 * The class's beats with its gear laid in, plus the start weapon's beat (which the caller puts
 * right after the class pick). Null when the class has no plan.
 */
export function buildGearBeats(classRoot: string, beats: readonly TutorialBeat[]): Built | null {
  const plan = TUTORIAL_GEAR_PLANS[classRoot];
  if (!plan) return null;
  const archetype = classRoot.replace(/-root$/, '') as ClassArchetype;
  const stretches = tutorialStretches(beats);
  const pieces = planPieces(plan, stretches);
  const startRecipe = RECIPE_DATABASE.get(plan.start);
  if (!startRecipe) throw new Error(`tutorial gear: unknown start weapon ${plan.start}`);
  const start: Piece = { id: plan.start, recipe: startRecipe, tier: 1, zone: 'clearing', kind: 'craft' };
  const ordered = [start, ...pieces];
  /** The stretches whose boss the guide fights: once it falls, that zone's pieces are moot. */
  const bosses = new Set(beats.flatMap((beat) => beat.steps)
    .flatMap((step) => (step.type === 'attemptBoss' ? [stretchKey(step.tier, step.biomeGroup)] : [])));

  /** When a piece no longer matters: past its stretch, its tier, or already outgrown. */
  const unlessFor = (piece: Piece, index: number): TutorialCondition => {
    const guards: TutorialCondition[] = [
      { type: 'playerTierAtLeast', tier: piece.tier === 1 ? 2 : piece.tier + 2 },
    ];
    const at = piece === start ? -1 : stretches.findIndex((s) => s.tier === piece.tier && s.zone === piece.zone);
    const next = stretches[at + 1];
    if (next) {
      guards.push({ type: 'biomeLevelAtLeast', biomeGroup: next.zone, level: biomeLevelCap(next.tier - 1, next.zone) + 1 });
    }
    if (bosses.has(stretchKey(piece.tier, piece.zone))) {
      guards.push({ type: 'bossCleared', biomeGroup: piece.zone, tier: piece.tier });
    }
    const madeSoFar = new Set(ordered.slice(0, index + 1).map((p) => p.id));
    for (const later of ordered.slice(index + 1)) {
      if (later.kind === 'again' || later.tier !== piece.tier || later.recipe.slot !== piece.recipe.slot) continue;
      if (madeSoFar.has(later.id)) continue;
      guards.push({ type: 'equipped', definitionId: later.id });
    }
    return anyOf(guards);
  };

  const madeWhere = (piece: Piece, farmAt: TutorialNodeRef): TutorialNodeRef =>
    piece.kind === 'detour' ? { kind: 'biome', biomeGroup: piece.recipe.recipeGroup, tier: piece.tier } : farmAt;

  const madeWhen = (piece: Piece, unless: TutorialCondition): TutorialCondition => ({
    type: 'anyOf',
    of: [
      { type: 'hasItem', definitionId: piece.id },
      { type: 'canCraft', recipeId: piece.id },
      ...(unless.type === 'anyOf' ? unless.of : [unless]),
    ],
  });

  const progressFor = (piece: Piece): TutorialProgressRef[] => [
    { type: 'biomeLevel', biomeGroup: piece.recipe.recipeGroup, level: piece.recipe.requiredBiomeLevel },
    { type: 'essenceFor', recipeId: piece.id },
  ];

  const gearBeat = (piece: Piece, chapter: string, farmAt: TutorialNodeRef, trailing: TutorialBeat | null = null): TutorialBeat => {
    const unless = unlessFor(piece, ordered.indexOf(piece));
    const name = piece.recipe.name;
    const equip: TutorialStep = { type: 'equip', definitionIds: [piece.id], unless };
    const steps: TutorialStep[] = piece.kind === 'again'
      ? [equip]
      : [
          { type: 'farm', at: madeWhere(piece, farmAt), until: madeWhen(piece, unless) },
          { type: 'craft', recipeIds: [piece.id], unless },
          equip,
        ];
    return {
      id: piece.kind === 'again' ? `gear:${piece.id}:again` : `gear:${piece.id}`,
      // No press of Next: the panel runs a gear beat as soon as it comes up.
      auto: true,
      chapter,
      say: gearLine(piece, plan, archetype),
      waiting: trailing ? (trailing.waiting ?? 'Fighting on.') : `Fighting on until the ${name} can be made.`,
      progress: piece.kind === 'again' ? undefined : [...progressFor(piece), ...(trailing?.progress ?? [])],
      steps: [...steps, ...(trailing ? trailing.steps : [])],
    };
  };

  // Where each piece goes: by stretch, then by the stretch's farm beats.
  const byStretch = new Map<string, Piece[]>();
  for (const piece of pieces) {
    const key = stretchKey(piece.tier, piece.zone);
    byStretch.set(key, [...(byStretch.get(key) ?? []), piece]);
  }
  const farmsOf = new Map<string, { index: number; gate: number }[]>();
  beats.forEach((beat, index) => {
    for (const { tier, zone } of stretches) {
      const gate = farmGate(beat, tier, zone);
      if (gate === null) continue;
      const key = stretchKey(tier, zone);
      farmsOf.set(key, [...(farmsOf.get(key) ?? []), { index, gate }]);
    }
  });

  /** For each farm beat index: the pieces cut out of it, the pieces after it. */
  const inside = new Map<number, Piece[]>();
  const after = new Map<number, Piece[]>();
  const push = (map: Map<number, Piece[]>, index: number, piece: Piece) => map.set(index, [...(map.get(index) ?? []), piece]);
  for (const [key, list] of byStretch) {
    const farms = farmsOf.get(key) ?? [];
    if (farms.length === 0) throw new Error(`tutorial gear: no farm beat for stretch ${key}`);
    const early: Piece[] = [];
    for (const piece of list) {
      if (piece.kind !== 'craft') {
        early.push(piece);
        continue;
      }
      const level = piece.recipe.requiredBiomeLevel;
      let placed = false;
      for (let k = 0; k < farms.length && !placed; k += 1) {
        const previous = k === 0 ? -Infinity : farms[k - 1].gate;
        if (level > previous && level < farms[k].gate) {
          push(inside, farms[k].index, piece);
          placed = true;
        } else if (level === farms[k].gate) {
          push(after, farms[k].index, piece);
          placed = true;
        }
      }
      if (!placed) push(after, farms[farms.length - 1].index, piece);
    }
    // Detours and pieces worn again: right after the zone's first farm (and what it opened).
    for (const piece of early) push(after, farms[0].index, piece);
  }

  const out: TutorialBeat[] = [];
  beats.forEach((beat, index) => {
    const step = beat.steps[0];
    const cut = inside.get(index) ?? [];
    const farmAt = step?.type === 'farm' ? step.at : null;
    if (cut.length > 0 && farmAt) {
      const first = cut[0];
      out.push({
        ...beat,
        waiting: `Fighting on until the ${first.recipe.name} can be made.`,
        progress: progressFor(first),
        steps: [{ type: 'farm', at: farmAt, until: madeWhen(first, unlessFor(first, ordered.indexOf(first))) }],
      });
      cut.forEach((piece, i) => out.push(gearBeat(piece, beat.chapter, farmAt, i === cut.length - 1 ? beat : null)));
    } else {
      out.push(beat);
    }
    for (const piece of after.get(index) ?? []) {
      if (!farmAt) throw new Error(`tutorial gear: ${beat.id} is not a farm`);
      out.push(gearBeat(piece, beat.chapter, farmAt));
    }
  });

  return { beats: out, start: gearBeat(start, 'The Clearing', { kind: 'node', nodeId: CLEARING_NODE_ID }) };
}
