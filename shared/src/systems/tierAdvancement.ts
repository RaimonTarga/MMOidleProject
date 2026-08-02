import { BIOME_DATABASE } from '../biomeDatabase';
import { bossClearKey } from './biomeProgress';

/**
 * Tier advancement by SEALS.
 *
 * A "seal" is not a stored object — it IS a boss first-clear. `bossesCleared`
 * already persists one `biomeGroup:tier` key per boss the player has felled for
 * the first time (see {@link bossClearKey}), so the seals a player holds at tier
 * T are exactly the distinct entries in that list whose tier part is T.
 *
 * That means this whole system adds **no new state, no migration, and no second
 * source of truth** — it is a read over data the game has always recorded.
 *
 * Advancement rule (locked 2026-08-02):
 *  - Seals only. No mastery or level gate alongside them.
 *  - Sources are any DISTINCT biome boss AT the player's current tier — the
 *    player picks which biomes; lower-tier clears do not count.
 *  - The requirement scales with tier.
 *
 * Tier 0 → 1 is deliberately NOT seal-gated: there are no bosses at tier 0. The
 * tutorial kill-quest still owns that step.
 */

/**
 * Seals needed to advance FROM this tier to the next.
 *
 * ⚠️ PLACEHOLDER NUMBERS — this table is the balance pass's to own, and it is
 * meant to be edited directly. The only hard rule is that a tier's requirement
 * can never exceed the number of bosses that actually exist at that tier;
 * {@link validateTierAdvancement} enforces it at boot.
 */
export const SEALS_REQUIRED_BY_TIER: Record<number, number> = {
  1: 2, // of 5 bosses available
  2: 3, // of 7
  3: 4, // of 7
  4: 5, // of 7 — the intended plateau; see SEAL_REQUIREMENT_CAP
  // Tier 5+ is intentionally ABSENT until T5/T6 content is authored. A tier with
  // no entry requires 0 seals, which `canAdvance` reads as "not gated" — so the
  // highest authored tier is the ceiling, rather than an impossible gate. Add the
  // row in the same commit that adds the tier's bosses.
};

/**
 * The requirement plateaus here: the ramp runs 2 → 3 → 4 → 5 across T1–T4 and
 * then stops climbing, so T5+ should ask for 5 seals rather than continuing to
 * grow. Rationale: past this point the gate is meant to stay a broad-engagement
 * check, not an ever-tightening completion tax — and with 7 sources per tier, 5
 * already means clearing most of a region while still leaving a route choice.
 *
 * Enforced as a boot-time report, not a hard failure — raise the cap here if the
 * balance pass decides otherwise.
 */
export const SEAL_REQUIREMENT_CAP = 5;

/** The lowest tier whose advancement is seal-gated. Below this, quests apply. */
export const FIRST_SEAL_GATED_TIER = 1;

/** Seals required to leave `playerTier`. `0` = not seal-gated (tier 0, or unmapped). */
export function sealsRequiredForTier(playerTier: number): number {
  if (playerTier < FIRST_SEAL_GATED_TIER) return 0;
  return SEALS_REQUIRED_BY_TIER[playerTier] ?? 0;
}

/**
 * Biome groups that have a boss at `tier` — i.e. every biome that can mint a
 * seal there. Derived from `bossPoolByTier`, which is the authority the world
 * actually spawns from (the quest database's monster lists are NOT — they are
 * hand-maintained and can drift).
 */
export function bossSealSourcesAtTier(tier: number): string[] {
  const groups: string[] = [];
  for (const [id, biome] of BIOME_DATABASE) {
    if ((biome.bossPoolByTier?.[tier]?.length ?? 0) > 0) groups.push(id);
  }
  return groups.sort();
}

/** How many distinct seals the player holds at `tier`. */
export function sealsHeldAtTier(bossesCleared: readonly string[], tier: number): number {
  const suffix = `:${tier}`;
  const seen = new Set<string>();
  for (const key of bossesCleared) {
    // Non-biome tokens also live in bossesCleared (e.g. `ultimate:void-overlord`);
    // they carry no numeric tier and must never count toward advancement.
    if (!key.endsWith(suffix)) continue;
    const group = key.slice(0, -suffix.length);
    if (group && BIOME_DATABASE.has(group)) seen.add(group);
  }
  return seen.size;
}

export interface TierAdvancementProgress {
  /** Distinct seals held at the player's current tier. */
  held: number;
  /** Seals needed to advance. `0` when this tier is not seal-gated. */
  required: number;
  /** True when the player has met the requirement. */
  canAdvance: boolean;
  /** Biome groups at this tier that would still mint a new seal. */
  remainingSources: string[];
}

/**
 * The full advancement picture for a player. `remainingSources` is what the UI
 * needs to answer "where do I get the next one" — the question the current
 * progression panel cannot answer.
 */
export function tierAdvancementProgress(
  bossesCleared: readonly string[],
  playerTier: number,
): TierAdvancementProgress {
  const required = sealsRequiredForTier(playerTier);
  const held = sealsHeldAtTier(bossesCleared, playerTier);
  const remainingSources = bossSealSourcesAtTier(playerTier).filter(
    (group) => !bossesCleared.includes(bossClearKey(group, playerTier)),
  );
  return {
    held,
    required,
    canAdvance: required > 0 && held >= required,
    remainingSources,
  };
}

/**
 * Boot invariant: no tier may demand more seals than it has bosses to mint them.
 * Returns human-readable problems; empty means healthy.
 */
export function validateTierAdvancement(): string[] {
  const errors: string[] = [];
  for (const [tierKey, required] of Object.entries(SEALS_REQUIRED_BY_TIER)) {
    const tier = Number(tierKey);
    const available = bossSealSourcesAtTier(tier).length;
    if (required > available) {
      errors.push(
        `Tier ${tier} requires ${required} seals but only ${available} biome ` +
          `boss(es) exist at that tier — advancement would be impossible.`,
      );
    }
    if (required <= 0) {
      errors.push(`Tier ${tier} has a non-positive seal requirement (${required}).`);
    }
    if (required > SEAL_REQUIREMENT_CAP) {
      errors.push(
        `Tier ${tier} requires ${required} seals, above the intended plateau of ` +
          `${SEAL_REQUIREMENT_CAP}. Raise SEAL_REQUIREMENT_CAP if that is deliberate.`,
      );
    }
  }
  return errors;
}
