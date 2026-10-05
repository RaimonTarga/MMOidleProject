/**
 * The status registry has ZERO gaps (status registry audit, 2026-10-05; design
 * §26.2) — and stays that way.
 *
 * WHAT THIS PINS:
 *
 *   A. THE AUDIT. `server/scripts/statusAudit.ts` extracts every status id a
 *      writer can apply and checks it against the client registry: a player tile,
 *      a target label, help, badge colour and an icon. Zero open gaps; every
 *      accepted gap carries its reason and still matches a real gap; no new
 *      dynamic id expression is left unexplained. A new status id without its
 *      label, help, badge or icon fails here.
 *   B. THE SHARED CLASSIFICATION (Contract 3). `isAfflictionStatusId` is exactly
 *      what the server's DoT inventory owns and `isHoldStatusId` exactly what
 *      `monsterIsHeld` counts, so the HUD's "afflicted" and "held" can never
 *      disagree with the moments that fire on them. The ids it restates from the
 *      server are spelled the same.
 *   C. THE RETIRED IDS. `lineage.hemorrhage`, `lineage.lean-bleed`,
 *      `lineage.poison`, `root`, `vuln` and `void-corruption` have no copy left.
 *   D. THE STUN TILE. A stunned player shows the `debuff-stunned` tile, rooted
 *      for the own-player prediction; standing in lava shows its tile.
 *   E. THE TARGET FRAME. The three homes take exactly the afflictions and holds;
 *      a DoT reports what it still owes; bookkeeping never reaches the mirror.
 *
 * Run: node --conditions=development --import tsx test/statusRegistry.test.ts
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  ABILITY_SLOW_EFFECT_ID,
  BURN_FAMILY,
  CHILL_STATUS_ID,
  CLASS_DOT_STATUS_ID,
  CONFLAGRATION_STATUS_ID,
  FROZEN_STATUS_ID,
  GAME_CONFIG,
  LINEAGE_BLEED_STATUS_ID,
  LINEAGE_ROOT_STATUS_ID,
  LINEAGE_SLOW_STATUS_ID,
  STUN_STATUS_ID,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  holdKindOfStatusId,
  isAfflictionStatusId,
  isHoldStatusId,
  isTargetHiddenStatusId,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { mirrorTargetStatus } from '../src/systems/combat/targetStatus';
import { playerDotsOnMonster } from '../src/systems/combat/damage/dotInventory';
import { LINEAGE_BLEED_ID } from '../src/systems/combat/damage/bleedIds';
import { monsterIsHeld } from '../src/systems/combat/status/monsterControl';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import {
  CHILL_EFFECT, CONF_EFFECT_ID, DOT_EFFECT_ID, FROZEN_EFFECT,
} from '../src/systems/classes/archetypes/dot/t3/core/constants';
import { summonerFrameLinkEffectId } from '../src/systems/classes/archetypes/summoner/frameLoop';
import { auditStatusRegistry } from '../scripts/statusAudit';
import { statusMeta } from '../../client/src/hud/targetStatusMeta';
import { targetStatusHelp } from '../../client/src/hud/statusHelp';
import { targetStatusIconSource } from '../../client/src/ui/conceptIcons';
import { homeBadgeNumber, targetHomeOf } from '../../client/src/hud/targetHomes';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

// ══ A. THE AUDIT: zero gaps ══════════════════════════════════════════════════

{
  const audit = auditStatusRegistry();
  assert(audit.rows.length > 100, `the audit extracted the registry (${audit.rows.length} ids)`);
  assert(
    audit.gaps.length === 0,
    `every status id needs its tile/label/help/badge/icon — open gaps:\n${audit.gaps.map((g) => `  ${g.key}: ${g.issue}`).join('\n')}`,
  );
  assert(
    audit.staleAcceptances.length === 0,
    `accepted gaps that are no longer gaps (remove them from ACCEPTED_GAPS): ${audit.staleAcceptances.join(' / ')}`,
  );
  assert(audit.accepted.every((gap) => gap.reason.length > 20), 'every accepted gap says why');
  assert(
    audit.unexplained.length === 0,
    `new dynamic status ids the audit cannot resolve: ${audit.unexplained.map((d) => `${d.at} ${d.expression}`).join(', ')}`,
  );
  const ids = new Set(audit.rows.map((row) => row.id));
  for (const id of [LINEAGE_BLEED_STATUS_ID, LINEAGE_SLOW_STATUS_ID, LINEAGE_ROOT_STATUS_ID, 'stunned']) {
    assert(ids.has(id), `the audit sees the writer of ${id}`);
  }
  const stunned = audit.rows.find((row) => row.id === 'stunned');
  assert(stunned?.tiles.includes('debuff-stunned'), 'a stun on a player projects the debuff-stunned tile');
  console.log(`  audit: ${audit.rows.length} ids, 0 open gaps, ${audit.accepted.length} accepted`);
}

// ══ B. THE SHARED CLASSIFICATION ═════════════════════════════════════════════

{
  // The ids shared restates from the server, spelled the same.
  assert(CLASS_DOT_STATUS_ID === DOT_EFFECT_ID, 'the class DoT id');
  assert(CONFLAGRATION_STATUS_ID === CONF_EFFECT_ID, 'the Conflagration id');
  assert(CHILL_STATUS_ID === CHILL_EFFECT, 'the chill id');
  assert(FROZEN_STATUS_ID === FROZEN_EFFECT, 'the frozen id');
  assert(STUN_STATUS_ID === STUN_EFFECT, 'the stun id');
  assert(LINEAGE_BLEED_STATUS_ID === LINEAGE_BLEED_ID, 'the lineage bleed id');
  assert(isTargetHiddenStatusId(summonerFrameLinkEffectId('owner-1')), 'the Effigy link record is bookkeeping');
  assert(!isTargetHiddenStatusId('dot') && !isTargetHiddenStatusId('vulnerability'), 'and nothing else is');

  initCombatSystems();
  const world = new World();
  const slices = {
    isPlayer: { id: 'reg-owner', name: 'reg-owner' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  } as unknown as PersistedPlayerSlices;
  const player = world.attachPlayerEntity(slices, 'reg-owner');
  const ownerId = player.isPlayer.id;
  let x = 600;
  const body = (): MonsterEntity => {
    x += 300;
    const m = world.createMonster('node-5-5', 'plains-slime', { x, y: 400 })!;
    m.hasHealth.maxHp = 1_000_000;
    m.hasHealth.hp = 1_000_000;
    return m;
  };

  // Afflicted: one record of every family the DoT inventory owns.
  const afflicted = body();
  const put = (id: string, data: Record<string, number>, stacks = 1, remainingMs = 4_000) => {
    const effect = applyStatusEffect(afflicted.tracksCombat, {
      id, instanced: false, remainingMs, sourceId: ownerId, maxStacks: 10, data,
    });
    effect.stacks = stacks;
  };
  put(CLASS_DOT_STATUS_ID, { damagePerStack: 10, nextTickIn: 1_000, tickIntervalMs: 1_000 }, 3);
  put(CONFLAGRATION_STATUS_ID, { damagePerTick: 10, ticksLeft: 3 });
  put(LINEAGE_BLEED_STATUS_ID, { damagePerTick: 10, nextTickIn: 1_000, tickIntervalMs: 1_000, bleedMode: 0 }, 4, -1);
  for (const reservoir of BURN_FAMILY) put(reservoir.effectId, { pool: 100, nextTickIn: 1_000, tickIntervalMs: 1_000 });
  put('vulnerability', { damageMultiplier: 1.2, totalMs: 4_000 });
  put(ABILITY_SLOW_EFFECT_ID, { moveSlowPct: 0.2, totalMs: 4_000 });
  const owned = new Set(playerDotsOnMonster(world, player, afflicted).map((entry) => entry.effect.id));
  for (const effect of afflicted.tracksCombat.statusEffects) {
    assert(owned.has(effect.id) === isAfflictionStatusId(effect.id),
      `${effect.id}: the inventory ${owned.has(effect.id) ? 'owns' : 'does not own'} it, the shared classification must agree`);
  }

  // Held: every hold id, alone, holds; nothing else does.
  for (const id of [ABILITY_SLOW_EFFECT_ID, LINEAGE_SLOW_STATUS_ID, ABILITY_ROOT_EFFECT_ID, LINEAGE_ROOT_STATUS_ID,
    CHILL_STATUS_ID, FROZEN_STATUS_ID, STUN_STATUS_ID]) {
    const held = body();
    applyStatusEffect(held.tracksCombat, { id, remainingMs: 2_000, sourceId: ownerId, data: { totalMs: 2_000 } });
    assert(isHoldStatusId(id) && monsterIsHeld(held), `${id} holds its target, on both sides`);
  }
  for (const id of ['vulnerability', LINEAGE_BLEED_STATUS_ID, 'stun-immune', 'plating-shred']) {
    const free = body();
    applyStatusEffect(free.tracksCombat, { id, remainingMs: 2_000, sourceId: ownerId, data: { totalMs: 2_000 } });
    assert(!isHoldStatusId(id) && !monsterIsHeld(free), `${id} does not hold, on either side`);
  }
  assert(holdKindOfStatusId(LINEAGE_SLOW_STATUS_ID) === 'slowed' && holdKindOfStatusId(CHILL_STATUS_ID) === 'slowed',
    'a slow and a chill are slowed');
  assert(holdKindOfStatusId(LINEAGE_ROOT_STATUS_ID) === 'held' && holdKindOfStatusId(STUN_STATUS_ID) === 'held',
    'a root and a stun are held');

  // ══ D. THE STUN TILE (and the lava tile) ═══════════════════════════════════
  applyStatusEffect(player.tracksCombat, { id: STUN_STATUS_ID, remainingMs: 1_500, sourceId: 'boss', data: { totalMs: 1_500 } });
  applyStatusEffect(player.tracksCombat, {
    id: 'lava-burn', maxStacks: 4, remainingMs: 3_000, sourceId: 'node-feature:lava',
    data: { damagePerStack: 5, totalMs: 3_000 },
  });
  syncPlayerBuffs(world, Date.now());
  const stun = player.hasStatus.activeBuffs?.find((buff) => buff.id === 'debuff-stunned');
  assert(stun !== undefined, 'a stunned player shows the Stunned tile');
  assert(stun!.speedMult === 0, 'and publishes the zero speed multiplier the own-player prediction stops on');
  assert(stun!.durationPct > 0 && stun!.remainingMs === 1_500, 'with its clock');
  assert(player.hasStatus.activeBuffs?.some((buff) => buff.id === 'debuff-lava-burn'), 'standing in lava shows its tile');

  // ══ E. THE TARGET FRAME ═══════════════════════════════════════════════════
  const target = body();
  const bleed = applyStatusEffect(target.tracksCombat, {
    id: LINEAGE_BLEED_STATUS_ID, instanced: false, remainingMs: -1, sourceId: ownerId,
    data: { damagePerTick: 25, nextTickIn: 1_000, tickIntervalMs: 1_000, bleedMode: 0 },
  });
  bleed.stacks = 4;
  applyStatusEffect(target.tracksCombat, {
    id: summonerFrameLinkEffectId(ownerId), remainingMs: 2_000, sourceId: ownerId, data: { slotMask: 1, totalMs: 2_000 },
  });
  applyStatusEffect(target.tracksCombat, {
    id: LINEAGE_ROOT_STATUS_ID, remainingMs: 1_400, sourceId: ownerId, data: { totalMs: 2_000 },
  });
  player.hasAttackTarget = { targetId: target.isMonster.id } as typeof player.hasAttackTarget;
  mirrorTargetStatus(world);
  const mirrored = target.hasStatus.targetStatus ?? [];
  const mirroredBleed = mirrored.find((status) => status.id === LINEAGE_BLEED_STATUS_ID);
  assert(mirroredBleed?.owed === 100, `the bleed reports what it still owes (4 × 25), got ${mirroredBleed?.owed}`);
  assert(!mirrored.some((status) => status.id.startsWith('frame.summoner.link')), 'bookkeeping never reaches the frame');
  const pinned = mirrored.find((status) => status.id === LINEAGE_ROOT_STATUS_ID);
  assert(pinned !== undefined && pinned.owed === undefined, 'a hold owes nothing');

  assert(targetHomeOf(LINEAGE_BLEED_STATUS_ID) === 'owes' && targetHomeOf('poison-dagger-burn') === 'owes'
    && targetHomeOf('dot') === 'owes', 'every DoT lives in Owes');
  assert(targetHomeOf(LINEAGE_SLOW_STATUS_ID) === 'slowed' && targetHomeOf(ABILITY_SLOW_EFFECT_ID) === 'slowed'
    && targetHomeOf(CHILL_STATUS_ID) === 'slowed', 'every slow lives in Slowed');
  assert(targetHomeOf(LINEAGE_ROOT_STATUS_ID) === 'held' && targetHomeOf(STUN_STATUS_ID) === 'held'
    && targetHomeOf(FROZEN_STATUS_ID) === 'held', 'every root, stun and freeze lives in Held');
  assert(targetHomeOf('vulnerability') === undefined && targetHomeOf('stun-immune') === undefined,
    'anything else stays in the ordinary strip');
  assert(homeBadgeNumber('owes', mirroredBleed!) === '100', 'the Owes badge reads the damage owed');
  assert(homeBadgeNumber('owes', { id: 'x', stacks: 1, remainingMs: -1, owed: 1_234 }) === '1.2k', 'compactly');
  assert(homeBadgeNumber('held', pinned!) === '1.4s', 'the Held badge reads the seconds left');
  assert(homeBadgeNumber('owes', { id: 'poison-dagger-burn', stacks: 80, remainingMs: 4_000 }) === '80',
    'a reservoir with no owner to describe it falls back to its banked pool');
}

// ══ C. THE RETIRED IDS ═══════════════════════════════════════════════════════

{
  for (const id of ['lineage.hemorrhage', 'lineage.lean-bleed', 'lineage.poison', 'root', 'vuln', 'void-corruption']) {
    assert(targetStatusHelp(id) === undefined, `${id}: no help copy left`);
    assert(statusMeta(id).color === '#b0a8d0', `${id}: no badge left (it would render the fallback)`);
  }
  for (const [id, label] of [
    [LINEAGE_BLEED_STATUS_ID, 'Bleed'], [LINEAGE_SLOW_STATUS_ID, 'Hobbled'], [LINEAGE_ROOT_STATUS_ID, 'Pinned'],
  ] as const) {
    assert(statusMeta(id).label === label, `${id} reads "${label}"`);
    assert(targetStatusHelp(id)?.title === label, `${id} has its own help`);
    assert(targetStatusIconSource(id) !== null, `${id} has an icon`);
    assert(!/Hamstring|Binding Strike/.test(targetStatusHelp(id)?.help ?? ''), `${id}'s help names no ability`);
  }
}

console.log('statusRegistry: ok');
