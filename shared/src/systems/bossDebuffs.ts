/**
 * BOSS MECHANIC DEBUFFS — one generic channel for the named debuffs the
 * boss-lineage redesign hangs on players (Cave Eroded, Tundra Frostbite and
 * Brittle, Trench Crushing Pressure and Rend).
 *
 * A status carrying `data.isBossDebuff = 1` is harmful, shows on the buff bar as a
 * `debuff-boss` tile labelled from this registry, and does whatever its data says
 * through the shared readers (`damageTakenPct` per stack -> incoming damage, and so
 * on). Adding one is a registry row, not a new buff descriptor and client map.
 *
 * `data.uncleansable = 1` makes one immune to Cleanse (Frostbite): the redesign
 * moved some pressure off Cleanse on purpose.
 */

export interface BossDebuffDef {
  label: string;
  color: string;
  /** One-line player-facing explanation, shown in the tile's help. */
  help: string;
}

export const BOSS_DEBUFF_KEY = 'isBossDebuff';
export const UNCLEANSABLE_KEY = 'uncleansable';

/** Cave T2+: sinkholes; +damage taken per stack, decays. */
export const ERODED_EFFECT_ID = 'eroded';

export const BOSS_DEBUFFS: Record<string, BossDebuffDef> = {
  [ERODED_EFFECT_ID]: {
    label: 'Eroded',
    color: '#b08a5a',
    help: 'Standing in collapsed ground wears you down: each stack raises the damage you take. It fades once you step out.',
  },
};

export function bossDebuffDef(id: string): BossDebuffDef | undefined {
  return BOSS_DEBUFFS[id];
}
