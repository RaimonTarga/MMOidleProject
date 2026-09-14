/** Bounded in-memory diagnostics. Never a live save or economy continuation. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  tierEntryProfileFromT1Snapshot, emptyEquipment, emptyAttunedAbilities, composePlayerView,
  emptyEquippedStances, RESOLVED_NODE_FEATURES, GAME_CONFIG, hitboxGap,
  posHitboxFromEntity, ambientRampStatus, getFlag, type TierEntryProfile,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { applyTierEntryProfile } from '../src/admin/gameActions';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { validateProfile, validateSpawn } from '../../bot/src/tierEntry/validate';
import { getRuneDecisions, RUNE_KEEP_DISTANCE_FLAG } from '../src/systems/combat/ai/runeConfig';
import { bootSpeedMultiplier } from '../src/systems/world/mobility/mobilityBoots';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { playerCombatPhase } from '../src/systems/combat/ai/engagement';
import { bakeSpriteHitboxes } from '../src/hitbox/bake/index';
import { getAtlasPaths } from '../src/hitbox/paths';
import { hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { craftAbilityRecipe } from '../src/systems/player/economy/abilityCrafting';
import { upgradeItem } from '../src/systems/player/economy/itemUpgrade';
import { equipItem } from '../src/systems/player/economy/inventory';
import { validateBuild, buildRP } from '../../bot/src/loadout/loadout';
import { V1P_TUNDRA_BUILD } from '../../bot/src/routes/campaignT3V1p';
import { NIGHT2_TRAVEL_BUILD } from '../../bot/src/routes/campaignNight2Bridge';

const arms = [
  { id: 'volcano-control', armor: false, bramble: false, charm: false },
  { id: 'volcano-armor', armor: true, bramble: false, charm: false },
  { id: 'volcano-armor-bramble', armor: true, bramble: true, charm: false },
  { id: 'volcano-armor-bramble-charm', armor: true, bramble: true, charm: true },
];
const hash = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }

function blank(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id }, hasPosition: { current: { x: 300, y: 300 }, nodeId: 'node-t3-sanctuary', speed: 120 },
    hasHealth: { hp: 100, maxHp: 100, recovery: 10 },
    tracksProgression: { level: 0, skillPoints: 0, playerTier: 0, currentSkillTier: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {},
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, bossesCleared: [], clearedNodes: [],
      visitedNodes: [], runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: emptyAttunedAbilities(), knownStances: [], equippedStances: emptyEquippedStances(),
      activeStance: null, knownRites: [], equippedRites: [] },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
}

async function main() {
  const [mode, snapshotPath, outputArg] = process.argv.slice(2);
  assert(mode === '--preflight' || mode === '--execute', 'Expected --preflight or --execute, snapshot path, NEW output directory');
  assert(snapshotPath && outputArg, 'Missing input/output path');
  const output = resolve(outputArg);
  assert(!existsSync(output), 'Output already exists; never overwrite or resume');
  const input = readFileSync(snapshotPath);
  assert(hash(input) === 'c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144', 'Wrong V1m snapshot');
  const base = tierEntryProfileFromT1Snapshot(JSON.parse(input.toString()), 'node-t3-sanctuary', 3);
  assert(base.selectedRange === 'energy-range-far', 'Expected preserved Wisp');
  mkdirSync(output, { recursive: true });
  const atlas = getAtlasPaths();
  const baked = await bakeSpriteHitboxes(atlas.atlasPng, atlas.atlasJson);
  const hitboxes = join(output, 'hitboxes.json');
  writeFileSync(hitboxes, JSON.stringify({ rows: baked.rows }));
  assert(hydrateHitboxCacheFromArtifact(hitboxes) > 0, 'No baked hitboxes');
  const manifest = { mode, inputHash: hash(input), atlasPngHash: hash(readFileSync(atlas.atlasPng)),
    atlasJsonHash: hash(readFileSync(atlas.atlasJson)), hitboxHash: hash(readFileSync(hitboxes)),
    seed: 173, dtMs: 100, maxFightMs: 60_000, postClearMs: 30_000, antiKite: 'unchanged', heat: 'unchanged', rewardMultiplier: 1,
    canonical: false, kind: 'synthetic diagnostic fixture', arms };
  writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
  initCombatSystems();
  // Qualify the live route's purchases against the actual wallet without ticking combat.
  const prepWorld = new World();
  const prepPlayer = prepWorld.attachPlayerEntity(blank('v1p-preparation'), 'v1p-preparation');
  assert(applyTierEntryProfile(prepWorld, prepPlayer, structuredClone(base)).success, 'Tundra entry failed');
  assert(craftAbilityRecipe(prepWorld, prepPlayer, 'ability-recipe-hamstring').success, 'Cannot buy Hamstring');
  assert(craftRecipe(prepWorld, prepPlayer, 'desert-boots-t2').success, 'Cannot buy Desert Boots');
  for (let i = 0; i < 5; i++) assert(upgradeItem(prepWorld, prepPlayer, 'desert-boots-t2').success, `Cannot upgrade boots to ${i + 1}`);
  assert(equipItem(prepWorld, prepPlayer, 'desert-boots-t2'), 'Cannot equip Desert Boots');
  const prepView = composePlayerView(prepPlayer);
  assert(prepView, 'No prepared view');
  for (const build of [NIGHT2_TRAVEL_BUILD, V1P_TUNDRA_BUILD]) {
    const issues = validateBuild(build, prepView);
    assert(issues.length === 0, `Tundra build invalid: ${JSON.stringify(issues)}`);
  }
  writeFileSync(join(output, 'tundra-purchase-preflight.json'), JSON.stringify({
    mode: 'setup-only', ticks: 0, combatRP: buildRP(V1P_TUNDRA_BUILD),
    travelRP: buildRP(NIGHT2_TRAVEL_BUILD), view: prepView }, null, 2));
  const realNow = Date.now, realRandom = Math.random;
  try {
    for (const arm of arms) {
      let now = 1_800_000_000_000, seed = 173;
      Date.now = () => now;
      Math.random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
      const profile: TierEntryProfile = structuredClone(base);
      // Travel-only rules have no role in this fixed encounter; remove identically in every arm.
      profile.runesEquipped = profile.runesEquipped.filter(r => r.conditionId !== 'while-traveling');
      if (arm.bramble) {
        if (!profile.knownAbilities.includes('bramble-guard')) profile.knownAbilities.push('bramble-guard');
        profile.attunedAbilities.guards = ['second-wind', 'bramble-guard'];
      }
      for (const [slot, item] of [
        ...(arm.armor ? [['armor', 'plains-vest-t2'] as const] : []),
        ...(arm.charm ? [['recovery', 'plains-charm-t2'] as const] : []),
      ]) {
        const old = profile.equipment[slot];
        if (old && !profile.inventory.includes(old)) profile.inventory.push(old);
        profile.equipment[slot] = item;
        profile.itemUpgrades[item] = 5;
      }
      const legal = validateProfile(profile);
      assert(legal.pass, `${arm.id}: ${JSON.stringify(legal.findings)}`);
      const world = new World();
      world.suppressRepopulation = true;
      world.rewardMultiplier = 1;
      world.worldLogJournalMax = 100_000;
      const player = world.attachPlayerEntity(blank(`v1p-${arm.id}`), `v1p-${arm.id}`);
      const applied = applyTierEntryProfile(world, player, profile);
      assert(applied.success && applied.spawnView, applied.reason ?? 'Entry failed');
      assert(validateSpawn(profile, applied.spawnView).pass, 'Live spawn mismatch');
      const nodeId = 'node-t3-volcanic-01';
      // Use the real node terrain/modifier. No natural population, travel or additional pulls.
      const from = player.hasPosition.nodeId;
      player.hasPosition.nodeId = nodeId;
      world.movePlayerNode(from, nodeId, player.isPlayer.id);
      world.frozenNodes.delete(nodeId);
      for (const mob of [...world.monsterEntities]) world.removeMonsterEntity(mob.isMonster.id);
      const center = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
      player.hasPosition.current = { x: center.x - 220, y: center.y };
      player.usesAutocombat.auto = true;
      const specs = ['cinder-hound', 'ember-scuttler', 'ember-scuttler'];
      const mobs = specs.map((type, i) => {
        const mob = world.createMonster(nodeId, type, { x: center.x, y: center.y + i * 60 });
        assert(mob, `Cannot spawn ${type}`);
        // Fix engagement roster, not AI speed or attacks. All three begin targeting the player.
        setAggroTarget(world, mob, { id: player.isPlayer.id, kind: 'player' }, now);
        return mob;
      });
      const features = RESOLVED_NODE_FEATURES[nodeId];
      // Match V1o geometry: no lava; preserve Heat and Alacrity in every arm.
      RESOLVED_NODE_FEATURES[nodeId] = features.filter(f => !f.damage);
      const samples: unknown[] = [];
      let elapsed = 0;
      let firstClearMs: number | null = null;
      const start = structuredClone(applied.spawnView);
      const initialPlacement = structuredClone({ player: player.hasPosition,
        monsters: mobs.map(m => ({ id: m.isMonster.id, position: m.hasPosition })) });
      const wallStart = realNow();
      try {
        if (mode === '--execute') {
          while (firstClearMs === null ? elapsed < 60_000 : elapsed < firstClearMs + 30_000) {
            assert(realNow() - wallStart < 120_000, 'Case exceeded two-minute compute ceiling');
            now += 100; elapsed += 100;
            world.tick(100, now);
            samples.push({ elapsed, player: { combatPhase: playerCombatPhase(world, player, now), position: player.hasPosition, moving: player.isMoving,
              path: player.hasMovePath, target: player.hasAttackTarget, hp: player.hasHealth,
              barrier: player.hasBarrier, statuses: player.tracksCombat.statusEffects,
              cooldowns: player.tracksCombat.cooldowns, flags: player.tracksCombat.flags,
              orbit: getFlag(player.tracksCombat, RUNE_KEEP_DISTANCE_FLAG), rules: getRuneDecisions(player),
              bootMult: bootSpeedMultiplier(world, player, now), ambient: ambientRampStatus(player.tracksCombat),
              intent: player.hasAutoIntent, progression: { levels: player.tracksProgression.biomeLevel, xp: player.tracksProgression.biomeXP } },
              monsters: mobs.map(m => ({ id: m.isMonster.id, type: m.isMonster.monsterTypeId,
                alive: !!world.getMonsterEntity(m.isMonster.id), hp: m.hasHealth, position: m.hasPosition,
                moving: m.isMoving, ai: m.controlsMonster, slowMult: m.hasStatus.monsterMoveSpeedMult,
                statuses: m.tracksCombat.statusEffects, gap: hitboxGap(posHitboxFromEntity(player), posHitboxFromEntity(m)) })) });
            // Snapshot objects before the next authoritative mutation.
            samples[samples.length - 1] = structuredClone(samples[samples.length - 1]);
            if (player.hasHealth.hp <= 0 || world.pendingDeaths.length) break;
            if (firstClearMs === null && mobs.every(m => !world.getMonsterEntity(m.isMonster.id))) firstClearMs = elapsed;
            assert(player.hasPosition.nodeId === nodeId, 'Unexpected transition: stop diagnostic');
          }
        }
        writeFileSync(join(output, `${arm.id}.json`), JSON.stringify({ arm, start, initialPlacement,
          elapsed, firstClearMs, outcome: mode === '--preflight' ? 'setup-only' : player.hasHealth.hp <= 0 || world.pendingDeaths.length
            ? 'death' : mobs.every(m => !world.getMonsterEntity(m.isMonster.id)) ? 'clear' : 'timeout',
          profile, samples, events: world.worldLogJournal }, null, 2));
        console.log(`${arm.id}: ${mode === '--preflight' ? 'setup validated; no ticks' : `${elapsed}ms complete`}`);
      } catch (error) {
        writeFileSync(join(output, `${arm.id}.partial.json`), JSON.stringify({ arm, start,
          initialPlacement, elapsed, firstClearMs, profile, samples, events: world.worldLogJournal,
          error: String(error) }, null, 2));
        throw error;
      } finally { RESOLVED_NODE_FEATURES[nodeId] = features; }
    }
    assert(hash(readFileSync(snapshotPath)) === hash(input), 'Input changed');
    writeFileSync(join(output, 'complete.json'), JSON.stringify({ mode, cases: arms.length }));
  } finally { Date.now = realNow; Math.random = realRandom; }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
