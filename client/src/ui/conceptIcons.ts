import type { SkillNode } from '@mmo-idle/shared';
import { assetIcon, type AssetIconSource } from './GameIcon';

const ROOT = '/assets/concept-icons';

const ABILITY_IDS = new Set([
  'brace',
  'bramble-guard',
  'charge',
  'charged-strike',
  'cleanse',
  'expose-weakness',
  'second-wind',
  'sweep',
]);

/**
 * Ability ids whose art lives under an older filename. Power Strike is the T1
 * Mountain re-home of Charged Strike — the same wind-up-and-deliver cast — so it
 * keeps the art rather than falling back to a placeholder while a redraw waits
 * in the manifest.
 */
const ABILITY_ICON_ALIASES: Record<string, string> = {
  'power-strike': 'charged-strike',
};

const CONDITION_IDS = new Set([
  'always',
  'before-empowered',
  'has-debuff',
  'hp-below-25',
  'in-combat',
  'in-party',
  'n-aggro-3',
  'target-casting',
  'target-elite',
  'when-idle',
]);

const ACTION_IDS = new Set([
  'auto-path-enemy',
  'avoid-hazards',
  'careful-pulling',
  'chase-enemy',
  'fire-guard',
  'fire-guard-2',
  'fire-technique',
  'fire-technique-2',
  'flee',
  'focus-closest',
  'focus-elites',
  'focus-highest-max-hp',
  'focus-lowest-hp',
  'follow-and-assist',
  'lead-the-way',
  'let-dots-finish',
  'orbit',
  'spread-dots',
  'step-back',
  'switch-stance',
  'tactical-reload',
  'taunt-current-target',
  'wait-for-execution',
  'wait-for-regen',
]);

const STANCE_IDS = new Set([
  'defensive-stance',
  'offensive-stance',
  'tanking-stance',
]);

const RITE_IDS = new Set([
  'cleansing-breath',
  'hunters-instinct',
  'lingering-momentum',
  'quickened-breath',
]);

const STANCE_ICON_ALIASES: Record<string, string> = {
  'enraged-stance': 'offensive-stance',
  'perfection-stance': 'offensive-stance',
  'berserker-stance': 'offensive-stance',
  'execute-stance': 'offensive-stance',
  'fleeting-stance': 'defensive-stance',
  'predator-stance': 'defensive-stance',
  'brawler-stance': 'tanking-stance',
  'recuperating-stance': 'tanking-stance',
};

const RITE_ICON_ALIASES: Record<string, string> = {
  'swift-repose': 'quickened-breath',
  purification: 'cleansing-breath',
  'lingering-battle': 'lingering-momentum',
  'blood-offering': 'hunters-instinct',
  'mechanic-renewal': 'lingering-momentum',
  'ability-reprieve': 'quickened-breath',
};

const BUFF_IDS = new Set([
  'ability-bramble',
  'ability-guard',
  'ability-guard-2',
  'boss-regen',
  'cadence-accelerando',
  'cadence-aftershock',
  'cadence-crescendo',
  'cadence-echo',
  'cadence-metronome',
  'cadence-rampage',
  'cadence-resonance',
  'cadence-verdict',
  'cooldown-alignment',
  'cooldown-battery',
  'cooldown-channel',
  'cooldown-eternal-charge',
  'cooldown-overdrive',
  'cooldown-reverb',
  'cooldown-rupture',
  'cooldown-temporal-ext',
  'cooldown-vengeance',
  'defense-absorb',
  'defense-recovery',
  'defense-debt',
  'defense-hardening',
  'defense-hardening-maxdr',
  'defense-reactive-plating',
  'defense-revive-heal',
  'defense-stationary-dr',
  'defense-sustained-dr',
  'dot-chill',
  'dot-conflag',
  'dot-frenzy',
  'dot-frostbite',
  'dot-frozen',
  'dot-vigor',
  'energy-ac-charge',
  'energy-ac-discharge',
  'energy-aether',
  'energy-binary-charge',
  'energy-binary-discharge',
  'energy-channel',
  'energy-critical-mass',
  'energy-equilibrium',
  'energy-overcharge',
  'energy-overdrive',
  'energy-reservoir',
  'energy-sm-pool',
  'energy-storm',
  'flurry',
  'mob-burst',
  'mob-grave',
  'mob-haste',
  'mob-kite',
  'mob-rush',
  'mob-sprint',
  'mob-suppress',
  'mob-volcanic',
  'reload-cannon',
  'reload-cover-fire',
  'reload-hair-trigger',
  'reload-momentum',
  'reload-snipe-ready',
  'summoner-battle-bond',
  'summoner-colossus',
  'summoner-coordinated-hunt',
  'summoner-endless-swarm',
  'summoner-grand-ritual',
  'summoner-harrier-brood',
  'summoner-howl-banner',
  'summoner-twin-covenant',
  'summoner-volatile-brood',
  'summoner-withering-chorus',
]);

const DEBUFF_IDS = new Set([
  'debuff-antiheal',
  'debuff-dot',
  'debuff-poison',
  'debuff-frost-ramp',
  'debuff-root',
  'debuff-slow',
  'debuff-sun-mark',
  'debuff-swamp-rot',
  'debuff-volcanic-heat',
]);

function source(directory: string, id: string, revision?: string): AssetIconSource {
  const cacheBuster = revision ? `?v=${revision}` : '';
  return assetIcon(`${ROOT}/${directory}/${id}.png${cacheBuster}`);
}

export function conceptAbilityIconSource(id: string): AssetIconSource | null {
  const iconId = ABILITY_ICON_ALIASES[id] ?? id;
  return ABILITY_IDS.has(iconId) ? source('abilities', iconId) : null;
}

export function runeConditionIconSource(id: string): AssetIconSource | null {
  if (id === 'hp-above-90' || id === 'target-hp-below-25') return source('runes/conditions', 'hp-below-25');
  if (id === 'inside-telegraph') return source('runes/conditions', 'target-casting');
  return CONDITION_IDS.has(id) ? source('runes/conditions', id) : null;
}

export function runeActionIconSource(id: string): AssetIconSource | null {
  return ACTION_IDS.has(id) ? source('runes/actions', id) : null;
}

export function runeFragmentConceptIconSource(id: string): AssetIconSource | null {
  return runeConditionIconSource(id) ?? runeActionIconSource(id);
}

export function stanceIconSource(id: string): AssetIconSource | null {
  const iconId = STANCE_ICON_ALIASES[id] ?? id;
  return STANCE_IDS.has(iconId) ? source('stances', iconId) : null;
}

export function riteIconSource(id: string): AssetIconSource | null {
  const iconId = RITE_ICON_ALIASES[id] ?? id;
  return RITE_IDS.has(iconId) ? source('rites', iconId) : null;
}

/**
 * Buff ids whose artwork still lives under an older filename. The Recovery tile
 * was `defense-burst` before regen became one Recovery rate; the green-regen icon
 * is still exactly right for it, so the id moved and the art did not.
 */
const BUFF_ICON_ALIASES: Record<string, string> = {
  'defense-recovery': 'defense-burst',
};

export function statusIconSource(id: string): AssetIconSource | null {
  if (BUFF_IDS.has(id)) {
    // The player-facing Recovery tile is its own art, not the boss `regen`
    // effect. Version its replaced art so a long-running client cannot retain
    // the old blue/gold shield from the browser image cache.
    const iconId = BUFF_ICON_ALIASES[id] ?? id;
    return source('statuses/buffs', iconId, iconId === 'defense-burst' ? 'green-regen-v2' : undefined);
  }
  if (DEBUFF_IDS.has(id)) return source('statuses/debuffs', id);
  if (id === 'second-wind') return source('abilities', id);
  return null;
}

const TARGET_STATUS_ALIASES: Record<string, string> = {
  dot: 'debuff-poison',
  'dot-chill': 'dot-chill',
  'dot-frozen': 'dot-frozen',
  'dot-smolder': 'dot-conflag',
  'dot-conf': 'dot-conflag',
  slow: 'debuff-slow',
  root: 'debuff-root',
  'plating-shred': 'expose-weakness',
  'cadence-hemorrhage': 'debuff-dot',
  'energy-storm': 'energy-storm',
  brittle: 'dot-frostbite',
  'poison-dagger-burn': 'debuff-poison',
  'swamp-mirebrand-burn': 'debuff-poison',
  'swamp-blightbrand-burn': 'debuff-poison',
  'cinderbrand-burn': 'dot-conflag',
  'tundra-rimebrand-burn': 'dot-chill',
  'rimebrand-burn': 'dot-chill',
  'void-corruption': 'debuff-swamp-rot',
  vuln: 'expose-weakness',
  vulnerability: 'expose-weakness',
  'expose-weakness': 'expose-weakness',
  'summoner-harried': 'summoner-harrier-brood',
  'summoner-withering-chorus': 'summoner-withering-chorus',
};

const BOSS_EFFECT_ALIASES: Record<string, string> = {
  enrage: 'cadence-rampage',
  regen: 'boss-regen',
  shield: 'defense-absorb',
  summon: 'summoner-grand-ritual',
  'stat-buff': 'energy-overcharge',
  morph: 'summoner-volatile-brood',
  slam: 'cadence-aftershock',
};

function aliasedStatusIconSource(alias: string | undefined): AssetIconSource | null {
  if (!alias) return null;
  return statusIconSource(alias) ?? conceptAbilityIconSource(alias);
}

export function targetStatusIconSource(id: string): AssetIconSource | null {
  return statusIconSource(id) ?? aliasedStatusIconSource(TARGET_STATUS_ALIASES[id]);
}

export function bossEffectIconSource(id: string): AssetIconSource | null {
  return aliasedStatusIconSource(BOSS_EFFECT_ALIASES[id]);
}

/** Concept vocabulary exists only for the first three tiers of the tree. */
export function skillVocabularyIconSource(
  node: Pick<SkillNode, 'id' | 'tier' | 'subVariantId'>,
): AssetIconSource | null {
  if (node.tier === 0) return source('classes', node.id.replace(/-root$/, ''));
  if (node.tier === 1 && node.subVariantId) return source('frames', node.subVariantId);
  if (node.tier !== 2) return null;
  if (node.id.endsWith('-range-close')) return source('ranges', 'close');
  if (node.id.endsWith('-range-mid')) return source('ranges', 'medium');
  if (node.id.endsWith('-range-far')) return source('ranges', 'far');
  return null;
}
