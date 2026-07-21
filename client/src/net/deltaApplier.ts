import type { DeltaSnapshot, MinionView, MonsterView, NetworkedEntity, PlayerView } from "@mmo-idle/shared";
import {
  composeMinionView,
  composeMonsterView,
  composePlayerView,
  RECIPE_DATABASE,
} from "@mmo-idle/shared";
import { loadGameplaySettings } from '../settings/gameplaySettings';
import { sendSetAutocombatConfig, sendSetAutoTraverse } from './intents';
import { hudBus } from "../hudBus";
import { notifyTargetDotTick, syncPlayerAtoms, nodeLoadingAtom, setDungeonGauntlet, setSummonHealth, setTargetFrame, setZoneBoss, setZonePlayers, type SummonHealthView, type TargetFrameData, type ZonePlayer } from "../hud/atoms";
import { getDefaultStore } from "jotai";
import type { GameScene } from "../scenes/GameScene";
import type { RenderState, DamageNumberHint } from "../render/state";
import { upsertPlayer } from "../render/players";
import { refreshMonsterTints, upsertMonster } from "../render/monsters";
import { upsertThoughtBubble } from "../render/thoughtBubbles";
import { upsertMinion } from "../render/minions";
import { destroyEntity } from "../render/destroy";
import { getOwnView } from "../render/state";
import { dispatchCombatEvent } from "../render/combatFx";
import { fxBossDeath, fxMobDeath } from "../fx/monsterDeath";
import { playSfx } from "../audio/audioEngine";
import { notePlayerStatusCues } from "../audio/statusCues";
import { notifyDeltaAppliedDuringTabResync, shouldRunClientFx } from "../fx/guard";
import { refreshNodeDecorState } from "../scenes/game/overlays";
import { setVoidThroneHazardLifted } from "../scenes/game/voidThrone";
import { syncVoidOverlordRespawn } from "../render/voidOverlordTomb";
import { syncDungeonHazards } from "../render/dungeonHazards";

// Last frame's resolved target — lets us detect when a target dies (its id
// vanishes from view) so the target frame can drain HP to 0 before fading.
let lastTargetRef: { id: string; data: TargetFrameData } | null = null;

function ensureDamageHint(state: RenderState, id: string): DamageNumberHint {
  let hint = state.damageStyleHints.get(id);
  if (!hint) {
    hint = { hasDirectHit: false, empowered: false, execution: false };
    state.damageStyleHints.set(id, hint);
  }
  return hint;
}

export function applyDelta(
  state: RenderState,
  snapshot: DeltaSnapshot,
  scene: GameScene,
): void {
  const liveIds = new Set<string>();
  const pendingRemoves: string[] = [];
  state.dungeonGuardianIds = guardianIdsFromGauntlet(snapshot);

  // Derive per-monster damage-number style hints from this snapshot's events
  // before the delta loop spawns HP-delta numbers (which run before events fire).
  state.damageStyleHints.clear();
  for (const ev of snapshot.events) {
    if (ev.kind === "player-hit") {
      const hint = ensureDamageHint(state, ev.targetId);
      hint.hasDirectHit = true;
      if (ev.empowered) hint.empowered = true;
      if (ev.execution) hint.execution = true;
      if (ev.shieldAbsorbed)
        hint.shieldAbsorbed = (hint.shieldAbsorbed ?? 0) + ev.shieldAbsorbed;
      if (ev.evadedPartial) hint.evadedPartial = true;
      if (ev.capped) hint.capped = true;
    } else if (ev.kind === "monster-hit") {
      const hint = ensureDamageHint(state, ev.targetId);
      hint.hasDirectHit = true;
      if (ev.empowered) hint.empowered = true;
      if (ev.execution) hint.execution = true;
      if (ev.shieldAbsorbed)
        hint.shieldAbsorbed = (hint.shieldAbsorbed ?? 0) + ev.shieldAbsorbed;
      if (ev.evadedPartial) hint.evadedPartial = true;
      if (ev.capped) hint.capped = true;
    } else if (ev.kind === "dot-tick") {
      ensureDamageHint(state, ev.targetId).dotElement = ev.element;
    }
  }

  for (const delta of snapshot.deltas) {
    if (delta.kind === "remove") {
      // Defer removes until after events so FX can read sprite positions
      pendingRemoves.push(delta.netId);
      continue;
    }

    // An `add` delta carries the entity's full component set, so start from a
    // fresh object. Reusing the stale one would leak slices the server has
    // since detached (e.g. `isDead` after respawn) because Object.assign only
    // overwrites present keys — it never removes absent ones.
    let entity: NetworkedEntity;
    if (delta.kind === "add") {
      entity = {};
      state.entity.set(delta.netId, entity);
      state.ids.add(delta.netId);
      state.kind.set(delta.netId, delta.entityKind);
      liveIds.add(delta.netId);
      if (
        delta.entityKind === "monster" &&
        delta.components?.isMonster?.monsterTypeId === "void-overlord"
      ) {
        setVoidThroneHazardLifted(scene, false);
      }
    } else {
      entity = state.entity.get(delta.netId) ?? {};
      state.entity.set(delta.netId, entity);
    }

    if (delta.components) {
      Object.assign(entity, delta.components);
    }
    if (delta.kind === "patch") {
      for (const key of delta.removed ?? []) {
        delete (entity as Record<string, unknown>)[key];
      }
    }

    upsertEntityView(state, delta.netId, entity, scene);
  }

  // Events fire before removes: sprites still exist so reward/hit FX can read positions.
  // Only the local player's confirmed primary DoT tick drives their mechanic HUD.
  const ownBeforeRemoves = getOwnView(state);
  for (const ev of snapshot.events) {
    if (
      ev.kind === "dot-tick" &&
      ev.sourceType === "class" &&
      ev.sourceId === state.ownId &&
      ev.targetId === ownBeforeRemoves?.attackTargetId
    ) {
      notifyTargetDotTick();
    }
    dispatchCombatEvent(state, ev, scene);
  }

  for (const netId of pendingRemoves) {
    const entity = state.entity.get(netId);
    if (entity?.isMonster?.monsterTypeId === "void-overlord") {
      setVoidThroneHazardLifted(scene, true);
    }
    // A monster leaving the live node via a patch delta means it died (node
    // changes come through the full-sync path below, not here). Play the retro
    // bar-fade dissolve off its still-present sprite before it is destroyed —
    // the full boss version (with sting) for bosses, a lighter one for mobs.
    if (entity?.isMonster && shouldRunClientFx()) {
      const sprite = state.sprite.get(netId);
      if (sprite) {
        if (entity.isMonster.isBoss) {
          fxBossDeath(scene, sprite);
          playSfx("boss-death");
        } else {
          fxMobDeath(scene, sprite);
        }
      }
    }
    destroyEntity(state, netId, scene);
  }
  syncVoidOverlordRespawn(state, snapshot.voidOverlordRespawn, scene);
  setDungeonGauntlet(snapshot.dungeonGauntlet ?? null);
  syncDungeonHazards(scene, snapshot.dungeonGauntlet);
  refreshMonsterTints(state);
  if (snapshot.voidOverlordRespawn) {
    setVoidThroneHazardLifted(scene, true);
  }

  if (snapshot.full) {
    for (const id of [...state.ids]) {
      if (!liveIds.has(id)) destroyEntity(state, id, scene);
    }
    getDefaultStore().set(nodeLoadingAtom, { active: false, nodeId: null });
  }

  const own = getOwnView(state);
  if (own) {
    if (!state.knownUnlockedRecipesInitialized) {
      state.knownUnlockedRecipes = new Set(own.unlockedRecipes);
      state.knownUnlockedRecipesInitialized = true;
    } else {
      for (const recipeId of own.unlockedRecipes) {
        if (state.knownUnlockedRecipes.has(recipeId)) continue;
        state.knownUnlockedRecipes.add(recipeId);
        const recipe = RECIPE_DATABASE.get(recipeId);
        hudBus.notifyRecipeUnlock(
          recipe?.name ?? recipeId,
          recipe?.recipeGroup ?? "unknown",
        );
      }
    }
    syncPlayerAtoms(own);
    notePlayerStatusCues(own);

    const summonHealth: SummonHealthView[] = [];
    for (const id of state.ids) {
      if (state.kind.get(id) !== "minion") continue;
      const minion = state.view.get(id) as MinionView | undefined;
      if (!minion || minion.ownerPlayerId !== own.id || minion.nodeId !== own.nodeId) continue;
      summonHealth.push({ slot: minion.slot, hp: minion.hp, maxHp: minion.maxHp });
    }
    summonHealth.sort((a, b) => a.slot - b.slot);
    setSummonHealth(summonHealth);

    const zonePlayers: ZonePlayer[] = [];
    for (const id of state.ids) {
      if (state.kind.get(id) !== "player") continue;
      const v = state.view.get(id) as PlayerView | undefined;
      if (!v || v.nodeId !== own.nodeId) continue;
      zonePlayers.push({
        id: v.id,
        name: v.name,
        partyLeaderId: v.partyLeaderId,
        hp: v.hp,
        maxHp: v.maxHp,
      });
    }
    zonePlayers.sort((a, b) => a.name.localeCompare(b.name));
    setZonePlayers(zonePlayers);

    let zoneBoss = null;
    for (const id of state.ids) {
      if (state.kind.get(id) !== "monster") continue;
      const m = state.view.get(id) as MonsterView | undefined;
      if (!m || m.nodeId !== own.nodeId || !m.ultimateStatus) continue;
      zoneBoss = {
        id: m.id,
        name: m.name,
        hp: m.hp,
        maxHp: m.maxHp,
        status: m.ultimateStatus,
      };
      break;
    }
    setZoneBoss(zoneBoss);

    // Resolve the local player's current attack target → top-center target frame.
    const targetId = own.attackTargetId;
    const tm = targetId && state.kind.get(targetId) === "monster"
      ? (state.view.get(targetId) as MonsterView | undefined)
      : undefined;
    if (tm && tm.nodeId === own.nodeId) {
      const data: TargetFrameData = {
        id: tm.id,
        name: tm.name,
        hp: tm.hp,
        maxHp: tm.maxHp,
        attack: tm.attack,
        plating: tm.plating,
        damageReduction: tm.damageReduction,
        isBoss: tm.isBoss,
        statuses: tm.targetStatus ?? [],
        bossEffects: tm.bossEffects ?? [],
      };
      setTargetFrame(data);
      lastTargetRef = { id: tm.id, data };
    } else if (lastTargetRef && !state.view.has(lastTargetRef.id)) {
      // The target vanished from view (it died) — emit one final frame at 0 HP so
      // the bar animates down to empty, then clear so the linger fade takes over.
      setTargetFrame({ ...lastTargetRef.data, hp: 0, statuses: [], bossEffects: [] });
      lastTargetRef = null;
    } else {
      setTargetFrame(null);
      lastTargetRef = null;
    }

    refreshNodeDecorState(scene);

    if (!state.gameplaySettingsSynced) {
      const gameplaySettings = loadGameplaySettings();
      sendSetAutoTraverse(scene.socket, gameplaySettings.autoTraverseEnabled);
      sendSetAutocombatConfig(scene.socket, gameplaySettings.autocombat);
      state.gameplaySettingsSynced = true;
    }
  }

  notifyDeltaAppliedDuringTabResync();
}

function guardianIdsFromGauntlet(snapshot: DeltaSnapshot): Set<string> {
  const gauntlet = snapshot.dungeonGauntlet;
  const ids = new Set<string>();
  if (!gauntlet) return ids;
  for (const id of gauntlet.guardianMonsterIds) ids.add(id);
  if (gauntlet.status === "active" && gauntlet.phaseIndex === 0) {
    for (const id of gauntlet.activeMonsterIds) ids.add(id);
  }
  return ids;
}

function upsertEntityView(
  state: RenderState,
  id: string,
  entity: NetworkedEntity,
  scene: GameScene,
): void {
  const kind = state.kind.get(id);
  if (kind === "player") {
    const player = composePlayerView(entity);
    if (!player) return;
    upsertPlayer(state, player, scene);
    upsertThoughtBubble(state, player, scene);
    return;
  }
  if (kind === "monster") {
    const monster = composeMonsterView(entity);
    if (!monster) return;
    upsertMonster(state, monster, scene);
    return;
  }
  if (kind === "minion") {
    const minion = composeMinionView(entity);
    if (!minion) return;
    upsertMinion(state, minion, scene);
  }
}
