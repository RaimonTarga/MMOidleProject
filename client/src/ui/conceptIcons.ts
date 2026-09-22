import type { SkillNode } from '@mmo-idle/shared';
import { assetIcon, type AssetIconSource } from './iconSource';

const ROOT = '/assets/concept-icons';

const ABILITY_IDS = new Set([
  'binding-strike',
  'brace',
  'bramble-guard',
  'break-free',
  'charge',
  'charged-strike',
  'cleanse',
  'contagion',
  'detonate',
  'disengage',
  'endure',
  'expose-weakness',
  'frenzy',
  'hamstring',
  'imbue-lightning',
  'quick-strike',
  'recuperate',
  'second-wind',
  'slam',
  'snipe',
  'sweep',
  'stunning-strike',
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
  'in-combat',
  'when-idle',
  'hp-below-25',
  'hp-above-90',
  'target-hp-below-25',
  'has-debuff',
  'in-party',
  'inside-telegraph',
  'target-casting',
  'before-empowered',
  'target-elite',
  'target-max-stacks',
  'while-traveling',
  'stance-charged',
  'n-aggro-3',
]);

const ACTION_IDS = new Set([
  'chase-enemy',
  'flee',
  'orbit',
  'step-back',
  'follow-and-assist',
  'focus-closest',
  'focus-lowest-hp',
  'focus-highest-max-hp',
  'let-dots-finish',
  'spread-dots',
  'focus-elites',
  'tactical-reload',
  'wait-for-execution',
  'wait-for-regen',
  'wait-it-out',
  'auto-path-enemy',
  'avoid-hazards',
  'careful-pulling',
  'avoid-enemies',
  'fight-back',
  'lead-the-way',
  'taunt-current-target',
  'use-ability',
  'switch-stance',
]);

const STANCE_IDS = new Set([
  'defensive-stance',
  'offensive-stance',
  'tanking-stance',
  'enraged-stance',
  'perfection-stance',
  'fleeting-stance',
  'berserker-stance',
  'recuperating-stance',
  'predator-stance',
  'brawler-stance',
  'execute-stance',
  'time-to-strike-stance',
  'reaper-stance',
  'warding-stance',
  'powering-up-stance',
]);

const RITE_IDS = new Set([
  'lingering-battle',
  'swift-repose',
  'purification',
  'mechanic-renewal',
  'ability-reprieve',
  'blood-offering',
]);

const BUFF_IDS = new Set([
  'ability-bramble',
  'ability-control-resist',
  'ability-frenzy',
  'ability-guard',
  'ability-guard-2',
  'ability-imbue',
  'ability-second-wind',
  'ability-second-wind-2',
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
  'cooldown-patience',
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
  'defense-ward',
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
  'sunlight',
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
  'stance-charge',
  'stance-reaper',
  'stance-release',
]);

const DEBUFF_IDS = new Set([
  'debuff-antiheal',
  'debuff-dot',
  'debuff-poison',
  'debuff-frost-ramp',
  'debuff-frozen',
  'debuff-plating-shred',
  'debuff-root',
  'debuff-slow',
  'debuff-sun-mark',
  'debuff-swamp-rot',
  'debuff-stunned',
  'debuff-sundered',
  'debuff-tundra-chill',
  'debuff-volcanic-heat',
]);

// Monster-only target buffs are not PlayerBuff ids, so they stay out of the
// player registry above. They still use the same authored status-icon directory
// and need to resolve directly when the target frame receives their raw effect id.
const TARGET_BUFF_ICON_IDS = new Set([
  'monster-howl-haste',
  'monster-ape-chestbeat',
  'carrion-screech-haste',
  'thorn-spitter-barrage',
  'granite-barrier',
  'shelled',
  'abyssal-carapace',
  'molten-guard',
  'obsidian-shell',
  'necrotic-surge',
]);

// A target-only debuff whose raw server id is not part of the player's BuffId
// registry. Its icon is still authored in the normal status-debuff directory.
const TARGET_DEBUFF_ICON_IDS = new Set([
  'shatter-vulnerable',
]);

function source(directory: string, id: string, revision?: string): AssetIconSource {
  const cacheBuster = revision ? `?v=${revision}` : '';
  return assetIcon(`${ROOT}/${directory}/${id}.png${cacheBuster}`);
}

/** The authored class crest used by the passive tree's class-root nodes. */
export function classEmblemIconSource(archetype: string): AssetIconSource {
  return source('classes', archetype, 'class-crests-v2');
}

/** The authored crest for a class's light / balanced / heavy branch. */
export function classFrameEmblemIconSource(
  archetype: string,
  subVariant: 'light' | 'balanced' | 'heavy',
): AssetIconSource {
  return source('frames', `${archetype}-${subVariant}`, 'class-crests-v2');
}

/** The class-specific crest for a tier-3 range choice. */
export function classRangeEmblemIconSource(nodeId: string): AssetIconSource {
  return source('ranges/classes', nodeId, 'class-range-crests-v1');
}

/** The path crest for a tier-4 specialization choice. */
export function classPathEmblemIconSource(nodeId: string): AssetIconSource {
  return source('paths', nodeId, 'class-path-crests-v1');
}

export function conceptAbilityIconSource(id: string): AssetIconSource | null {
  const iconId = ABILITY_ICON_ALIASES[id] ?? id;
  return ABILITY_IDS.has(iconId) ? source('abilities', iconId) : null;
}

export function runeConditionIconSource(id: string): AssetIconSource | null {
  return CONDITION_IDS.has(id) ? source('runes/conditions', id, 'rune-set-v2') : null;
}

export function runeActionIconSource(id: string): AssetIconSource | null {
  return ACTION_IDS.has(id) ? source('runes/actions', id, 'rune-set-v2') : null;
}

export function runeFragmentConceptIconSource(id: string): AssetIconSource | null {
  return runeConditionIconSource(id) ?? runeActionIconSource(id);
}

export function stanceIconSource(id: string): AssetIconSource | null {
  return STANCE_IDS.has(id) ? source('stances', id, 'specific-v3') : null;
}

export function riteIconSource(id: string): AssetIconSource | null {
  return RITE_IDS.has(id) ? source('rites', id, 'rites-v2') : null;
}

/**
 * Buff ids whose artwork still lives under an older filename. The Recovery tile
 * was `defense-burst` before regen became one Recovery rate; the green-regen icon
 * is still exactly right for it, so the id moved and the art did not.
 */
const BUFF_ICON_ALIASES: Record<string, string> = {
  'defense-recovery': 'defense-burst',
};

const BUFF_ABILITY_ICON_ALIASES: Record<string, string> = {
  'ability-control-resist': 'break-free',
  'ability-frenzy': 'frenzy',
  'ability-imbue': 'imbue-lightning',
  'ability-second-wind': 'second-wind',
  'ability-second-wind-2': 'second-wind',
};

/**
 * Debuff ids whose authored art lives under `statuses/buffs`. Player-Frozen and the
 * DoT archetype's target-Frozen tile are one mechanic seen from opposite sides, so
 * they deliberately share the single authored icon rather than duplicating the PNG
 * into both directories and leaving two files to keep in step.
 */
const DEBUFF_BUFF_DIR_ICON_ALIASES: Record<string, string> = {
  'debuff-frozen': 'dot-frozen',
};

export function statusIconSource(id: string): AssetIconSource | null {
  if (BUFF_IDS.has(id)) {
    const abilityIconId = BUFF_ABILITY_ICON_ALIASES[id];
    if (abilityIconId) return conceptAbilityIconSource(abilityIconId);
    // The player-facing Recovery tile is its own art, not the boss `regen`
    // effect. Version its replaced art so a long-running client cannot retain
    // the old blue/gold shield from the browser image cache.
    const iconId = BUFF_ICON_ALIASES[id] ?? id;
    return source('statuses/buffs', iconId, iconId === 'defense-burst' ? 'green-regen-v2' : undefined);
  }
  if (DEBUFF_IDS.has(id)) {
    const buffDirIconId = DEBUFF_BUFF_DIR_ICON_ALIASES[id];
    if (buffDirIconId) return source('statuses/buffs', buffDirIconId);
    return source('statuses/debuffs', id, id === 'debuff-root' ? 'snare-root-v2' : undefined);
  }
  if (TARGET_BUFF_ICON_IDS.has(id)) {
    return source('statuses/buffs', id);
  }
  if (TARGET_DEBUFF_ICON_IDS.has(id)) {
    return source('statuses/debuffs', id);
  }
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
  'plating-shred': 'debuff-plating-shred',
  'reload-suppress-shred': 'debuff-plating-shred',
  'ability-slowed': 'hamstring',
  'ability-rooted': 'binding-strike',
  stunned: 'debuff-stunned',
  'stun-immune': 'break-free',
  'canopy-chameleon-barrage': 'thorn-spitter-barrage',
  'thornback-chameleon-barrage': 'thorn-spitter-barrage',
  'boss-roar-haste': 'monster-howl-haste',
  'monster-death-empower': 'necrotic-surge',
  'elder-carapace-renewal': 'abyssal-carapace',
  'magma-molten-guard': 'molten-guard',
  'magma-obsidian-shell': 'obsidian-shell',
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
  'enemy-barrier': 'defense-absorb',
};

const BOSS_EFFECT_ALIASES: Record<string, string> = {
  enrage: 'cadence-rampage',
  regen: 'boss-regen',
  shield: 'defense-absorb',
  summon: 'summoner-grand-ritual',
  'stat-buff': 'energy-overcharge',
  morph: 'summoner-volatile-brood',
  slam: 'cadence-aftershock',
  'bestial-frenzy': 'cadence-rampage',
  'stat-buff-attack': 'energy-overcharge',
  'stat-buff-speed': 'mob-haste',
  'stat-buff-attackSpeed': 'cadence-rampage',
  'stat-buff-plating': 'defense-hardening',
  'stat-buff-damageReduction': 'defense-sustained-dr',
  'stat-buff-evasion': 'mob-sprint',
  'relentless-pursuit': 'mob-haste',
  'crag-rush': 'mob-haste',
  'cinder-fury': 'cadence-rampage',
  'earthshaker-rush': 'mob-haste',
  sandsurge: 'mob-haste',
  'caldera-fury': 'cadence-rampage',
  'blood-in-the-water': 'mob-haste',
  'charge-instinct': 'mob-haste',
  'escape-instinct': 'mob-haste',
  'boss-stunned': 'debuff-stunned',
};

function aliasedStatusIconSource(alias: string | undefined): AssetIconSource | null {
  if (!alias) return null;
  return statusIconSource(alias) ?? conceptAbilityIconSource(alias);
}

export function targetStatusIconSource(id: string): AssetIconSource | null {
  // Boss patterns use source-owned ids (`barrier:<sourceId>`) so several
  // independent wards can coexist. They share one target-facing barrier icon.
  if (id.startsWith('barrier:')) return statusIconSource('granite-barrier');
  return statusIconSource(id) ?? aliasedStatusIconSource(TARGET_STATUS_ALIASES[id]);
}

export function bossEffectIconSource(id: string): AssetIconSource | null {
  return aliasedStatusIconSource(BOSS_EFFECT_ALIASES[id]);
}

/** Concept vocabulary exists for authored class-tree tiers through path choice. */
export function skillVocabularyIconSource(
  node: Pick<SkillNode, 'id' | 'tier' | 'classId' | 'subVariantId'>,
): AssetIconSource | null {
  if (node.tier === 0) {
    return classEmblemIconSource(node.id.replace(/-root$/, ''));
  }
  if (node.tier === 1 && node.subVariantId) {
    const classId = node.classId?.replace(/-root$/, '');
    if (classId) {
      return classFrameEmblemIconSource(classId, node.subVariantId);
    }
    return source('frames', node.subVariantId);
  }
  if (node.tier === 2) {
    if (node.id.endsWith('-range-close') || node.id.endsWith('-range-mid') || node.id.endsWith('-range-far')) {
      return classRangeEmblemIconSource(node.id);
    }
    return null;
  }
  if (node.tier === 3) return classPathEmblemIconSource(node.id);
  return null;
}
