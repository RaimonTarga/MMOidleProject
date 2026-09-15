/**
 * Desert Falchion — alpha WINDOW (2026-09-15).
 *
 * The lineage traded a pure alpha STRIKE (2.0x/2.5x/3.0x on the literal first hit)
 * for a modest opener plus `Sunlight`, a short final damage-dealt window. This
 * covers the mechanic's invariants, not its balance numbers:
 *
 *   - the opener still fires exactly once per fresh monster entity;
 *   - the opener opens Sunlight, which never stacks, refreshes or extends;
 *   - Sunlight reaches every player-owned channel that routes through
 *     `outgoingFinalDamage` (basic hit, on-hit, AoE, procs, Techniques, DoT ticks,
 *     owned summons) and stops reaching them the instant it expires;
 *   - death / node teardown / unequipping do not leave a window behind;
 *   - each authored tier gets exactly its own values, and evolution never leaves
 *     two tiers' mechanic effects live at once.
 */
import {
  GAME_CONFIG,
  RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  FINAL_DAMAGE_DEALT_PCT_KEY,
  SUNLIGHT_EFFECT_ID,
  applyStatusEffect,
  emptyEquipment,
  getStatusEffect,
  resolveFinalDamageMultipliers,
  tickStatusEffectDurations,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updateWeaponEffects } from '../src/systems/combat/damage/weaponEffects';
import { killPlayer } from '../src/systems/world/playerIncapacitation';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const T2 = 'desert-sunsteel-cross';
const T3 = 'desert-solar-cross';
const T4 = 'desert-zenith-cross';

/** Authored prototype values, asserted against the recipes below. */
const AUTHORED = {
  [T2]: { mult: 1.4, pct: 0.15, ms: 4000 },
  [T3]: { mult: 1.5, pct: 0.20, ms: 5000 },
  [T4]: { mult: 1.6, pct: 0.25, ms: 6000 },
} as const;

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

/** Arm a player with one tier's authored Falchion mechanic, without crafting it. */
function armFalchion(player: PlayerEntity, recipeId: keyof typeof AUTHORED): void {
  const p = player.usesSkills.passives;
  const a = AUTHORED[recipeId];
  p['weapon.first-strike-mult'] = a.mult;
  p['weapon.first-strike-buff-damage-pct'] = a.pct;
  p['weapon.first-strike-buff-duration-ms'] = a.ms;
}

function hit(world: World, player: PlayerEntity, monster: MonsterEntity, now: number): number {
  const before = monster.hasHealth.hp;
  runPlayerAttack(world, player, monster, now, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  return before - monster.hasHealth.hp;
}

/** A plating/DR/evasion-free dummy, so a damage delta can only be the mechanic. */
function spawnDummy(world: World, x: number): MonsterEntity {
  const monster = world.createMonster(NODE, 'stone-basilisk', { x, y: 400 });
  assert(!!monster, 'test needs a monster dummy');
  monster!.mitigatesDamage.plating = 0;
  monster!.mitigatesDamage.damageReduction = 0;
  // `evadesHits` is component-gated — absent on most monsters, which is already
  // "never dodges". Zero it only when the dummy actually has it.
  if (monster!.evadesHits) monster!.evadesHits.dodgeRate = 0;
  monster!.hasHealth.maxHp = 10_000_000;
  monster!.hasHealth.hp = 10_000_000;
  return monster!;
}

function makeArmedWorld(id: string, tier: keyof typeof AUTHORED = T2) {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices(id), id);
  player.dealsDamage.attack = 1_000;
  armFalchion(player, tier);
  return { world, player };
}

initCombatSystems();

// ── Authoring: each tier carries exactly its own alpha-window values ──────────
{
  for (const [id, expected] of Object.entries(AUTHORED)) {
    const recipe = RECIPE_DATABASE.get(id);
    assert(!!recipe, `${id} should exist`);
    const fx = recipe!.mechanicEffects ?? {};
    assert(
      fx['weapon.first-strike-mult'] === expected.mult,
      `${id} opener should be ${expected.mult}, got ${fx['weapon.first-strike-mult']}`,
    );
    assert(
      fx['weapon.first-strike-buff-damage-pct'] === expected.pct,
      `${id} Sunlight damage should be ${expected.pct}, got ${fx['weapon.first-strike-buff-damage-pct']}`,
    );
    assert(
      fx['weapon.first-strike-buff-duration-ms'] === expected.ms,
      `${id} Sunlight duration should be ${expected.ms}, got ${fx['weapon.first-strike-buff-duration-ms']}`,
    );
    // The rework's whole point: the tier deepening is the WINDOW, not the opener.
    assert(
      (fx['weapon.first-strike-mult'] ?? 0) <= 1.6,
      `${id} must not regress to a 2x+ pure alpha strike`,
    );
    // Technique Power was removed from the whole lineage by the same pass: it only
    // ever existed on T2 and vanished on evolution, and Sunlight already scales
    // Technique payloads as a final layer. One offensive rider, all three tiers.
    assert(
      fx['technique.power-pct'] === undefined,
      `${id} should carry no Technique Power (removed 2026-09-15)`,
    );
  }

  // Evolution replaces the item wholesale (ITEM_DATABASE is built per recipe), so
  // an evolved Falchion can never hold two tiers' values at once. Assert the chain.
  assert(RECIPE_DATABASE.get(T3)?.evolvesFrom === T2, 'Solar should evolve from Sunsteel');
  assert(RECIPE_DATABASE.get(T4)?.evolvesFrom === T3, 'Zenith should evolve from Solar');
  const tiers = [T2, T3, T4] as const;
  for (const id of tiers) {
    const fx = RECIPE_DATABASE.get(id)!.mechanicEffects ?? {};
    for (const other of tiers.filter((t) => t !== id)) {
      assert(
        fx['weapon.first-strike-mult'] !== AUTHORED[other].mult,
        `${id} must not also carry ${other}'s opener multiplier`,
      );
    }
  }
}

// ── First strike: once per fresh target, and only on a fresh target ───────────
{
  const { world, player } = makeArmedWorld('fs-basic');
  const a = spawnDummy(world, 420);
  const b = spawnDummy(world, 440);

  const opener = hit(world, player, a, 1_000);
  // Deliberately measured against a hit taken AFTER the window has lapsed: the
  // opener must pay exactly its authored multiplier, not the multiplier times its
  // own window (the reason the grant is registered on afterHit, not onHit).
  tickStatusEffectDurations(player.tracksCombat, AUTHORED[T2].ms);
  const followUp = hit(world, player, a, 6_000);
  assert(
    Math.abs(opener / followUp - AUTHORED[T2].mult) < 0.01,
    `the opener should be exactly ~${AUTHORED[T2].mult}x a plain hit, got ${(opener / followUp).toFixed(3)}`,
  );
  const third = hit(world, player, a, 7_000);
  assert(third === followUp, 'the same target must not pay the opener twice');

  // A different fresh target gets its own opener even though Sunlight is running.
  const bOpener = hit(world, player, b, 7_500);
  assert(bOpener > followUp, `a second fresh target should get its own opener (${bOpener} <= ${followUp})`);
}

// ── The opener opens Sunlight ────────────────────────────────────────────────
{
  const { world, player } = makeArmedWorld('sun-open');
  assert(!getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID), 'no window before the first hit');

  const a = spawnDummy(world, 420);
  hit(world, player, a, 1_000);
  const effect = getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID);
  assert(!!effect, 'the opener should grant Sunlight');
  assert(effect!.remainingMs === AUTHORED[T2].ms, `Sunlight should last ${AUTHORED[T2].ms}ms`);
  assert(effect!.data[FINAL_DAMAGE_DEALT_PCT_KEY] === AUTHORED[T2].pct, 'Sunlight should carry its authored fraction');
  assert(effect!.stacks === 1, 'Sunlight starts at one stack');

  // It is a FINAL damage-dealt layer — that is what makes it reach every channel.
  const mults = resolveFinalDamageMultipliers(player.usesSkills.passives, null, 1, player.tracksCombat);
  assert(
    Math.abs(mults.dealt - (1 + AUTHORED[T2].pct)) < 1e-9,
    `Sunlight should multiply final damage dealt by ${1 + AUTHORED[T2].pct}, got ${mults.dealt}`,
  );
  assert(mults.taken === 1, 'Sunlight must not touch the damage the player takes');
}

// ── Damage during the window, and not after it ───────────────────────────────
{
  const { world, player } = makeArmedWorld('sun-damage');
  const opener = spawnDummy(world, 420);
  const during = spawnDummy(world, 440);
  const after = spawnDummy(world, 460);

  // Pay the openers on `during`/`after` FIRST, so the measured hits below are plain
  // follow-ups and the only difference between them is Sunlight.
  hit(world, player, during, 500);
  hit(world, player, after, 500);
  // Those openers each started a window; burn it off before the real measurement.
  tickStatusEffectDurations(player.tracksCombat, AUTHORED[T2].ms);
  assert(!getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID), 'setup window should be gone');
  const baseline = hit(world, player, during, 900);

  hit(world, player, opener, 1_000); // opens a fresh window
  const buffed = hit(world, player, during, 1_100);
  assert(
    Math.abs(buffed / baseline - (1 + AUTHORED[T2].pct)) < 0.02,
    `a hit inside Sunlight should be ~+${AUTHORED[T2].pct * 100}%, got ${((buffed / baseline - 1) * 100).toFixed(1)}%`,
  );

  // Expire exactly on time: one tick short is still buffed, the tick that lands on
  // the duration is not.
  tickStatusEffectDurations(player.tracksCombat, AUTHORED[T2].ms - 100);
  assert(!!getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID), 'Sunlight should survive to its last 100ms');
  const nearExpiry = hit(world, player, during, 4_900);
  assert(nearExpiry === buffed, 'the window applies in full until it expires');

  tickStatusEffectDurations(player.tracksCombat, 100);
  assert(!getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID), 'Sunlight should expire on its authored duration');
  const expired = hit(world, player, after, 5_100);
  assert(expired === baseline, `damage after expiry should be baseline (${expired} vs ${baseline})`);
}

// ── No refresh, no extend, no stack ──────────────────────────────────────────
{
  const { world, player } = makeArmedWorld('sun-no-refresh');
  const a = spawnDummy(world, 420);
  const b = spawnDummy(world, 440);
  const c = spawnDummy(world, 460);

  hit(world, player, a, 1_000);
  tickStatusEffectDurations(player.tracksCombat, 2_000);
  const midway = getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID)!;
  assert(midway.remainingMs === AUTHORED[T2].ms - 2_000, 'the window should be two seconds down');

  // B is fresh: it gets its own opener, but the running window keeps its expiry.
  const bOpener = hit(world, player, b, 3_000);
  const plain = hit(world, player, b, 3_100);
  assert(bOpener > plain, 'the second fresh target still gets its opener');
  const afterB = getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID)!;
  assert(
    afterB.remainingMs === AUTHORED[T2].ms - 2_000,
    `opening on a fresh target must not extend the window (${afterB.remainingMs})`,
  );
  assert(afterB.stacks === 1, 'Sunlight must never stack');
  assert(
    player.tracksCombat.statusEffects.filter((e) => e.id === SUNLIGHT_EFFECT_ID).length === 1,
    'Sunlight must never run as parallel instances',
  );

  // Hitting the ORIGINAL target again does nothing to the window either.
  hit(world, player, a, 3_200);
  assert(
    getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID)!.remainingMs === AUTHORED[T2].ms - 2_000,
    'an ordinary follow-up must not touch the window',
  );

  // ── A new window after expiry ──────────────────────────────────────────────
  tickStatusEffectDurations(player.tracksCombat, AUTHORED[T2].ms);
  assert(!getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID), 'the window should have lapsed');
  hit(world, player, c, 9_000);
  const reopened = getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID);
  assert(!!reopened, 'a later fresh-target opener should start a NEW window');
  assert(reopened!.remainingMs === AUTHORED[T2].ms, 'the new window starts at full duration');
}

// ── Damage channels: Sunlight is a final layer, so every owned channel scales ──
{
  const { world, player } = makeArmedWorld('sun-channels');
  const a = spawnDummy(world, 420);
  hit(world, player, a, 1_000);

  // `outgoingFinalDamage` is the single funnel for basic hits, on-hit, AoE/cleave,
  // procs, Technique payloads, DoT ticks and owned-summon damage. Asserting the
  // multiplier at the funnel is what says "all of them", rather than re-testing
  // each caller: they all read the same `dealt`.
  const dealt = resolveFinalDamageMultipliers(
    player.usesSkills.passives, null, 1, player.tracksCombat,
  ).dealt;
  assert(Math.abs(dealt - 1.15) < 1e-9, `every channel should read +15%, got ${dealt}`);

  // It must compose with (not replace) the other final layers.
  player.usesSkills.passives['core.damage-dealt-pct'] = 0.10;
  const composed = resolveFinalDamageMultipliers(
    player.usesSkills.passives, null, 1, player.tracksCombat,
  ).dealt;
  assert(Math.abs(composed - 1.10 * 1.15) < 1e-9, `Sunlight should compose with core damage dealt, got ${composed}`);
  delete player.usesSkills.passives['core.damage-dealt-pct'];

  // And it must not be double-counted by the OTHER outgoing seam: `damageDealtPct`
  // (playerAmplifiers) is summed separately in the direct-attack path, so Sunlight
  // deliberately does NOT use that key.
  assert(
    getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID)!.data['damageDealtPct'] === undefined,
    'Sunlight must not also carry the playerAmplifiers key (that would double-apply)',
  );
}

// ── Presentation: the window is visible in the buff UI with a clock ──────────
{
  const { world, player } = makeArmedWorld('sun-buffbar');
  const a = spawnDummy(world, 420);
  hit(world, player, a, 1_000);
  tickStatusEffectDurations(player.tracksCombat, 1_000);
  syncPlayerBuffs(world, 2_000);
  const buff = (player.hasStatus.activeBuffs ?? []).find((b) => b.id === 'sunlight');
  assert(!!buff, 'Sunlight should project onto the player buff bar');
  assert(buff!.label === 'Sunlight', 'the buff is named Sunlight');
  assert(
    buff!.durationPct > 0 && buff!.durationPct < 100,
    `the tile should show a partial clock, got ${buff!.durationPct}`,
  );
  assert((buff!.values ?? []).some((v) => v.value === '+15%'), 'the tooltip should show the authored magnitude');

  tickStatusEffectDurations(player.tracksCombat, AUTHORED[T2].ms);
  syncPlayerBuffs(world, 9_000);
  assert(
    !(player.hasStatus.activeBuffs ?? []).some((b) => b.id === 'sunlight'),
    'the tile should clear when the window lapses',
  );
}

// ── Lifecycle: death clears it; a rebuilt player never inherits it ────────────
{
  const { world, player } = makeArmedWorld('sun-death');
  const a = spawnDummy(world, 420);
  hit(world, player, a, 1_000);
  assert(!!getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID), 'window is up before death');

  killPlayer(world, player.isPlayer.id, {
    kind: 'melee',
    killer: { monsterTypeId: 'stone-basilisk', monsterName: 'Stone Basilisk', isBoss: false, nodeId: NODE },
    damage: 1,
  });
  assert(
    !getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID),
    'death must clear the window (resetTracksCombat)',
  );

  // Reconnect/rebuild: the window is server-only scratch state and is never
  // persisted, so re-attaching a character comes back clean.
  const rebuilt = world.attachPlayerEntity(makePlayerSlices('sun-death-2'), 'sun-death-2');
  assert(
    !getStatusEffect(rebuilt.tracksCombat, SUNLIGHT_EFFECT_ID),
    'a rebuilt player must not inherit a window',
  );
}

// ── Lifecycle: unequipping the Falchion drops the window it granted ──────────
{
  const { world, player } = makeArmedWorld('sun-unequip');
  const a = spawnDummy(world, 420);
  hit(world, player, a, 1_000);
  assert(!!getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID), 'window is up while armed');

  // Same convention as Flurry, the file's other weapon-granted player buff: a
  // recalc that drops the passive drops the buff on the next tick.
  delete player.usesSkills.passives['weapon.first-strike-buff-damage-pct'];
  delete player.usesSkills.passives['weapon.first-strike-buff-duration-ms'];
  delete player.usesSkills.passives['weapon.first-strike-mult'];
  updateWeaponEffects(world, 100);
  assert(
    !getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID),
    'unequipping the Falchion must not leave a stale window',
  );

  // The cleanup must not touch an unrelated effect on a player who never had one.
  const other = world.attachPlayerEntity(makePlayerSlices('sun-bystander'), 'sun-bystander');
  applyStatusEffect(other.tracksCombat, {
    id: 'test-unrelated', maxStacks: 1, remainingMs: 5_000,
    refreshable: false, sourceId: 'test', data: { totalMs: 5_000 },
  });
  updateWeaponEffects(world, 100);
  assert(!!getStatusEffect(other.tracksCombat, 'test-unrelated'), 'cleanup must be scoped to Sunlight');
}

// ── A weapon with no window authored still gets a plain opener ───────────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('sun-opener-only'), 'sun-opener-only');
  player.dealsDamage.attack = 1_000;
  player.usesSkills.passives['weapon.first-strike-mult'] = 1.4;
  const a = spawnDummy(world, 420);
  const opener = hit(world, player, a, 1_000);
  const plain = hit(world, player, a, 2_000);
  assert(opener > plain, 'the opener still pays without a window authored');
  assert(
    !getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID),
    'no window without weapon.first-strike-buff-* on the item',
  );
}

// ── Each tier drives its own window ──────────────────────────────────────────
{
  for (const tier of [T3, T4] as const) {
    const { world, player } = makeArmedWorld(`sun-${tier}`, tier);
    const a = spawnDummy(world, 420);
    hit(world, player, a, 1_000);
    const effect = getStatusEffect(player.tracksCombat, SUNLIGHT_EFFECT_ID)!;
    assert(effect.remainingMs === AUTHORED[tier].ms, `${tier} window should be ${AUTHORED[tier].ms}ms`);
    assert(
      Math.abs(
        resolveFinalDamageMultipliers(player.usesSkills.passives, null, 1, player.tracksCombat).dealt -
          (1 + AUTHORED[tier].pct),
      ) < 1e-9,
      `${tier} should deal +${AUTHORED[tier].pct * 100}%`,
    );
  }
}

console.log('alphaWindow: ok');
