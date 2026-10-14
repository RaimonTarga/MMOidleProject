import type {
  AutocombatConfig,
  EquipmentSlot,
  EquippedRule,
  FastBossRetryResult,
  ProgressionCheckpointResult,
  ProgressionCheckpointRestore,
  RowKind,
  T1EconomyArm,
  T1EconomyExperimentConfig,
  Vec2,
} from "@mmo-idle/shared";
import type { BotConnection } from "./connection";

export interface CraftOutcome {
  success: boolean;
  reason?: string;
}

/** The server's answer event for the row-activation intent (`setActive`). */
export interface LineageResult {
  success: boolean;
  reason?: string;
  lineageId: string;
  action: "unlockCard" | "setActive" | "unlockForm" | "wearForm";
}

export interface UpgradeOutcome {
  success: boolean;
  reason?: string;
  itemId: string;
  newLevel: number;
}

/**
 * The bot's entire write surface. Every method here is a plain
 * `ClientToServerEvents` emit — the same intent the browser client sends. There
 * is deliberately no privileged shortcut: no `winDungeon`, no direct state
 * mutation, no server-internal call.
 */
export class Intents {
  constructor(private readonly conn: BotConnection) {}

  // ── Movement & travel ────────────────────────────────────────────────────

  moveTo(pos: Vec2): void {
    this.conn.raw.emit("player:move", pos, { mode: "path" });
  }

  navigateTo(nodeId: string): void {
    this.conn.raw.emit("player:navigateTo", nodeId);
  }

  requestSync(): void {
    this.conn.raw.emit("player:requestSync");
  }

  // ── Combat control ───────────────────────────────────────────────────────

  setAuto(enabled: boolean): void {
    this.conn.raw.emit("player:setAuto", enabled);
  }

  setAutoTraverse(enabled: boolean): void {
    this.conn.raw.emit("player:setAutoTraverse", enabled);
  }

  setAutocombatConfig(config: AutocombatConfig): void {
    this.conn.raw.emit("player:setAutocombatConfig", config);
  }

  ackDeath(): void {
    this.conn.raw.emit("player:ackDeath");
  }

  activateDungeonAltar(): void {
    this.conn.raw.emit("player:activateDungeonAltar");
  }

  /** Dev-only and always tainted; acknowledged by the authoritative server reset. */
  prepareFastBossRetry(nodeId: string, includeGuardians: boolean): Promise<FastBossRetryResult> {
    return this.conn.request("debug:fastBossRetryResult", () =>
      this.conn.raw.emit("debug:prepareFastBossRetry", { nodeId, includeGuardians }),
    );
  }

  // ── Social ────────────────────────────────────────────────────────────────

  partyJoin(targetPlayerId: string): void {
    this.conn.raw.emit("party:join", targetPlayerId);
  }

  partyLeave(): void {
    this.conn.raw.emit("party:leave");
  }

  // ── Progression ──────────────────────────────────────────────────────────

  unlockSkill(skillId: string): void {
    this.conn.raw.emit("player:unlockSkill", skillId);
  }

  // ── Economy (acknowledged) ───────────────────────────────────────────────

  craftRecipe(recipeId: string): Promise<CraftOutcome> {
    return this.conn.request<CraftOutcome>("crafting:result", () =>
      this.conn.raw.emit("crafting:craftRecipe", recipeId),
    );
  }

  upgradeItem(itemId: string): Promise<UpgradeOutcome> {
    return this.conn.request<UpgradeOutcome>("inventory:upgradeResult", () =>
      this.conn.raw.emit("inventory:upgradeItem", itemId),
    );
  }

  // ── Economy (fire-and-forget; confirmed by observing the next delta) ─────

  equipItem(definitionId: string): void {
    this.conn.raw.emit("inventory:equipItem", definitionId);
  }

  unequip(slot: EquipmentSlot): void {
    this.conn.raw.emit("inventory:unequip", slot);
  }

  setRuneLoadout(rules: EquippedRule[]): Promise<CraftOutcome> {
    return this.conn.request("build:loadoutResult", () => this.conn.raw.emit("rune:setLoadout", rules), 15_000, p => p.system === "runes");
  }

  /** Dev-only bootstrap; the server remains authoritative over the applied state. */
  captureCheckpoint(boundaryId: string): Promise<ProgressionCheckpointResult> {
    return this.conn.request('debug:checkpointResult', () => this.conn.raw.emit('debug:captureCheckpoint', boundaryId));
  }
  restoreCheckpoint(request: ProgressionCheckpointRestore): Promise<ProgressionCheckpointResult> {
    return this.conn.request('debug:checkpointResult', () => this.conn.raw.emit('debug:restoreCheckpoint', request));
  }

  /** Dev-only bootstrap; the server remains authoritative over the selected arm. */
  applyEconomyExperiment(arm: T1EconomyArm): Promise<{
    success: boolean;
    arm?: T1EconomyArm;
    config?: T1EconomyExperimentConfig;
    reason?: string;
  }> {
    return this.conn.request("debug:economyExperimentResult", () =>
      this.conn.raw.emit("debug:applyEconomyExperiment", arm),
    );
  }

  /**
   * The `setActive` step's intent. Its answer event is shared with other
   * intents, so the request filter matches on the ACTION as well as the id.
   */
  setLineageActive(lineageId: string, row: RowKind, cardId: string | null): Promise<LineageResult> {
    return this.conn.request<LineageResult>("lineage:result",
      () => this.conn.raw.emit("lineage:setActive", { lineageId, row, cardId }),
      15_000, p => p.lineageId === lineageId && p.action === "setActive");
  }

  /**
   * Dev-only, and SERVER-GLOBAL: this changes the kill-reward rate for every
   * client connected to the dev world, not just this bot. Ignored entirely in
   * production. Any run that uses it is tagged NON_CANONICAL_REWARD_MULTIPLIER.
   */
  setRewardMultiplier(multiplier: number): void {
    this.conn.raw.emit("debug:setRewardMultiplier", multiplier);
  }
}
