import type { DeltaSnapshot, NetworkedEntity, PlayerView } from "@mmo-idle/shared";
import {
  composeMonsterView,
  composePlayerView,
  RECIPE_DATABASE,
} from "@mmo-idle/shared";
import { loadGameplaySettings } from '../settings/gameplaySettings';
import { sendSetAutoTraverse } from './intents';
import { hudBus } from "../hudBus";
import { syncPlayerAtoms, nodeLoadingAtom, setZonePlayers, type ZonePlayer } from "../hud/atoms";
import { getDefaultStore } from "jotai";
import type { GameScene } from "../scenes/GameScene";
import type { RenderState } from "../render/state";
import { upsertPlayer } from "../render/players";
import { upsertMonster } from "../render/monsters";
import { destroyEntity } from "../render/destroy";
import { getOwnView } from "../render/state";
import { dispatchCombatEvent } from "../render/combatFx";
import { notifyDeltaAppliedDuringTabResync } from "../fx/guard";

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

    let entity = state.entity.get(delta.netId);
    if (!entity) {
      entity = {};
      state.entity.set(delta.netId, entity);
    }

    if (delta.kind === "add") {
      state.ids.add(delta.netId);
      state.kind.set(delta.netId, delta.entityKind);
      liveIds.add(delta.netId);
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

  for (const netId of pendingRemoves) destroyEntity(state, netId, scene);

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

    if (!state.gameplaySettingsSynced) {
      sendSetAutoTraverse(scene.socket, loadGameplaySettings().autoTraverseEnabled);
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
    return;
  }
  if (kind === "monster") {
    const monster = composeMonsterView(entity);
    if (!monster) return;
    upsertMonster(state, monster, scene);
  }
}
