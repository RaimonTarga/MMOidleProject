/**
 * Terminal classification for a boss fight, as a pure function.
 *
 * This exists because the first version of the boss runner got it wrong in a way
 * that produced a confident false victory. It treated the boss's ABSENCE from the
 * node as proof of a kill, forced terminal boss HP to zero, and tested that before
 * it tested player death:
 *
 *     else if (bossSeen) { bossHp = 0; killedAtMs = elapsed; outcome = 'boss-killed'; }
 *     ...
 *     if (outcome === 'boss-killed') break;
 *     if (bot.hasHealth.hp <= 0) { outcome = 'bot-died'; break; }
 *
 * But `resetDungeon(..., reason: "node_wipe")` runs on a player wipe and does two
 * things in the same tick: it removes the boss entity, and it respawns the guard.
 * So a death read back as a 100%-HP-removed victory, accompanied by twelve
 * "adds" on a boss that summons nothing. Both fingerprints appeared together in
 * `bossref-timberclaw-b-legacy`.
 *
 * The rules here are therefore explicit rather than inferred:
 *
 * - A victory requires BOSS-SPECIFIC AUTHORITATIVE evidence -- a kill event naming
 *   the boss as victim. Absence is never evidence of a kill.
 * - Player death is checked alongside, not after.
 * - Simultaneous terminal events get their own outcome instead of silently
 *   resolving to whichever branch happened to be written first.
 * - A boss that disappears without a kill is its own outcome, and terminal HP is
 *   the last SUPPORTED reading rather than a fabricated zero.
 */

/** Terminal outcomes. `null` means the fight is still running. */
export type BossTerminal =
  | 'boss-killed'
  | 'bot-died'
  | 'encounter-reset'
  | 'boss-vanished-no-kill'
  | 'simultaneous-terminal'
  | null;

export interface BossTickInput {
  /** Was a kill event naming the boss as victim observed in this tick? */
  bossKillEvent: boolean;
  /** Did the player die in this tick? */
  playerDead: boolean;
  /** Is the boss entity present in the node after this tick? */
  bossPresent: boolean;
  /** Was a dungeon reset/guard-reform message observed in this tick? */
  dungeonReset: boolean;
  /** Has the boss ever been present? Absence before the first sighting is a wake-up, not a terminal. */
  bossSeen: boolean;
}

/**
 * Classify one tick.
 *
 * Order is meaningful and is the fix:
 *
 * 1. Both terminal signals in one tick is AMBIGUOUS and is reported as such. It is
 *    not resolved in either direction, because on a wipe the reset that removes the
 *    boss lands in the very same tick as the death.
 * 2. An authoritative boss kill is the ONLY route to a victory.
 * 3. Player death outranks anything inferred from the boss going missing -- the
 *    wipe reset is a CONSEQUENCE of the death, so reading it as a clear inverts
 *    cause and effect.
 * 4. A reset without a death and without a kill is an encounter reset.
 * 5. A boss that is simply gone, with no kill evidence, is exactly that. Never a win.
 */
export function classifyBossTick(input: BossTickInput): BossTerminal {
  const { bossKillEvent, playerDead, bossPresent, dungeonReset, bossSeen } = input;
  if (bossKillEvent && playerDead) return 'simultaneous-terminal';
  if (bossKillEvent) return 'boss-killed';
  if (playerDead) return 'bot-died';
  if (bossSeen && !bossPresent) return dungeonReset ? 'encounter-reset' : 'boss-vanished-no-kill';
  return null;
}

/** A terminal outcome counts as a victory only with authoritative kill evidence. */
export function isVictory(terminal: BossTerminal): boolean {
  return terminal === 'boss-killed';
}

/**
 * Resolve the terminal boss HP that the record may actually claim.
 *
 * Zero is only ever asserted when a kill event supports it. Otherwise the last
 * reading taken while the boss was genuinely present is carried, and `supported`
 * says whether any reading was ever taken at all. A consumer that needs a number
 * must check `supported` first rather than treating `null` as zero.
 */
export function resolveTerminalBossHp(
  terminal: BossTerminal,
  lastSupportedBossHp: number | null,
): { hp: number | null; supported: boolean } {
  if (terminal === 'boss-killed') return { hp: 0, supported: true };
  return { hp: lastSupportedBossHp, supported: lastSupportedBossHp !== null };
}

/**
 * Should this tick's bodies count toward add statistics?
 *
 * No, once the fight has terminated. The guard that `resetDungeon` respawns
 * arrives in the same tick as the wipe, so counting it produced the phantom
 * twelve adds on a boss with no `spawn-adds` at all. Replacement bodies are
 * encounter teardown, not add pressure.
 */
export function countsTowardAdds(terminal: BossTerminal): boolean {
  return terminal === null;
}
