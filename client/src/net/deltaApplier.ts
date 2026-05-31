import type { DeltaSnapshot, MonsterView, NetworkedEntity, PlayerView } from "@mmo-idle/shared";
import {
  composeMinionView,
  composeMonsterView,
  composePlayerView,
  RECIPE_DATABASE,
} from "@mmo-idle/shared";
import { loadGameplaySettings } from '../settings/gameplaySettings';
import { sendSetAutocombatConfig, sendSetAutoTraverse } from './intents';
import { hudBus } from "../hudBus";
import { syncPlayerAtoms, nodeLoadingAtom, setZoneBoss, setZonePlayers, type ZonePlayer } from "../hud/atoms";
import { getDefaultStore } from "jotai";
import type { GameScene } from "../scenes/GameScene";
import type { RenderState } from "../render/state";
import { upsertPlayer } from "../render/players";
import { upsertMonster } from "../render/monsters";
import { upsertThoughtBubble } from "../render/thoughtBubbles";
import { upsertMinion } from "../render/minions";
import { destroyEntity } from "../render/destroy";
import { getOwnView } from "../render/state";
import { dispatchCombatEvent } from "../render/combatFx";
import { notifyDeltaAppliedDuringTabResync } from "../fx/guard";
import { refreshNodeDecorState } from "../scenes/game/overlays";
import { setVoidThroneHazardLifted } from "../scenes/game/voidThrone";
import { syncVoidOverlordRespawn } from "../render/voidOverlordTomb";

export function applyDelta(
  state: RenderState,
  snapshot: DeltaSnapshot,
  scene: GameScene,
): void {
  const liveIds = new Set<string>();
  const pendingRemoves: string[] = [];

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

  // Events fire before removes: sprites still exist so reward/hit FX can read positions
  for (const ev of snapshot.events) dispatchCombatEvent(state, ev, scene);

  for (const netId of pendingRemoves) {
    const entity = state.entity.get(netId);
    if (entity?.isMonster?.monsterTypeId === "void-overlord") {
      setVoidThroneHazardLifted(scene, true);
    }
    destroyEntity(state, netId, scene);
  }
  syncVoidOverlordRespawn(state, snapshot.voidOverlordRespawn, scene);
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
