import type {
  AutocombatConfig,
  EquipmentSlot,
  EquippedAbilities,
  EquippedRule,
  EvolveMode,
  FastBossRetryResult,
  StanceSlot,
  TierEntryApplyResult,
  TierEntryProfile,
  T1EconomyArm,
  T1EconomyExperimentConfig,
  Vec2,
} from "@mmo-idle/shared";
import type { BotConnection } from "./connection";

export interface CraftOutcome {
  success: boolean;
  reason?: string;
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

  evolveItem(recipeId: string, mode: EvolveMode): Promise<CraftOutcome> {
    return this.conn.request<CraftOutcome>("crafting:result", () =>
      this.conn.raw.emit("crafting:evolveItem", { recipeId, mode }),
    );
  }

  upgradeItem(itemId: string): Promise<UpgradeOutcome> {
    return this.conn.request<UpgradeOutcome>("inventory:upgradeResult", () =>
      this.conn.raw.emit("inventory:upgradeItem", itemId),
    );
  }

  craftRuneRecipe(recipeId: string): Promise<{ recipeId: string; success: boolean; reason?: string }> {
    return this.conn.request("rune:craftResult", () =>
      this.conn.raw.emit("rune:craftRecipe", recipeId),
    );
  }

  craftAbilityRecipe(recipeId: string): Promise<{ recipeId: string; success: boolean; reason?: string }> {
    return this.conn.request("ability:craftResult", () =>
      this.conn.raw.emit("ability:craftRecipe", recipeId),
    );
  }

  craftStanceRecipe(recipeId: string): Promise<{ recipeId: string; success: boolean; reason?: string }> {
    return this.conn.request("stance:craftResult", () =>
      this.conn.raw.emit("stance:craftRecipe", recipeId),
    );
  }

  // ── Economy (fire-and-forget; confirmed by observing the next delta) ─────

  equipItem(definitionId: string): void {
    this.conn.raw.emit("inventory:equipItem", definitionId);
  }

  unequip(slot: EquipmentSlot): void {
    this.conn.raw.emit("inventory:unequip", slot);
  }

  setRuneLoadout(rules: EquippedRule[]): void {
    this.conn.raw.emit("rune:setLoadout", rules);
  }

  setDefaultStance(stanceId: string | null): Promise<{ system: "stances"; success: boolean; reason?: string }> {
    return this.conn.request("build:loadoutResult", () =>
      this.conn.raw.emit("stance:setLoadout", { slot: "default" as StanceSlot, stanceId }),
    );
  }

  /** Dev-only bootstrap; the server remains authoritative over the applied state. */
  applyTierEntryProfile(profile: TierEntryProfile): Promise<TierEntryApplyResult> {
    return this.conn.request<TierEntryApplyResult>("debug:tierEntryResult", () =>
      this.conn.raw.emit("debug:applyTierEntryProfile", profile),
    );
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

  setAbilityLoadout(equipped: EquippedAbilities): void {
    this.conn.raw.emit("ability:setLoadout", { equipped });
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
