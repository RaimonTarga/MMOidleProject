/**
 * Cross-field verification for one boss fight record.
 *
 * The first boss runner produced a record that passed verification while
 * contradicting itself in four separate places at once:
 *
 *   outcome "boss-killed", bossHpFractionRemoved 1, crossedHalfAtMs null,
 *   minHpFraction 0, maxAddsAlive 12  -- on a boss that summons nothing.
 *
 * Every one of those is individually checkable, and together they are impossible.
 * Verification that accepted them was not verification. These rules exist so a
 * record cannot claim a victory it has no evidence for and still receive an
 * unqualified pass.
 *
 * Returns a list of contradiction strings. Empty means the record is internally
 * consistent -- which is NOT the same as the result being correct, only that it
 * does not disagree with itself.
 */
export function verifyBossRecord(r, opts = {}) {
  const { bossSummonsNothing = false, expectedBossMaxHp = null } = opts;
  const bad = [];
  const at = `${r.cell}-s${r.seed}`;

  // ── The victory claim and its evidence must agree.
  if (r.bossKilled !== (r.outcome === 'boss-killed')) {
    bad.push(`${at}: bossKilled ${r.bossKilled} disagrees with outcome "${r.outcome}"`);
  }
  if (r.bossKilled && !r.bossKillEvidence) {
    bad.push(`${at}: claims a victory with NO boss kill evidence`);
  }
  if (!r.bossKilled && r.bossKillEvidence && r.outcome !== 'simultaneous-terminal') {
    bad.push(`${at}: has boss kill evidence but outcome "${r.outcome}"`);
  }
  if (r.bossKilled && r.playerDeathEvidence) {
    bad.push(`${at}: claims a victory while also recording a player death`);
  }

  // ── Terminal HP must be supported, and may only be zero on a real kill.
  if (r.terminalBossHpSupported === false && r.bossHpRemaining !== null) {
    bad.push(`${at}: terminal boss HP is unsupported but reports ${r.bossHpRemaining}`);
  }
  if (r.bossKilled && r.bossHpRemaining !== 0) {
    bad.push(`${at}: a victory must leave the boss at 0 HP, got ${r.bossHpRemaining}`);
  }
  if (!r.bossKilled && r.bossHpRemaining === 0 && r.outcome !== 'simultaneous-terminal') {
    bad.push(`${at}: boss at 0 HP without a victory or ambiguity — a fabricated zero`);
  }
  if (r.bossHpRemaining !== null && expectedBossMaxHp !== null && r.bossMaxHp !== expectedBossMaxHp) {
    bad.push(`${at}: bossMaxHp ${r.bossMaxHp} != expected ${expectedBossMaxHp}`);
  }
  if (r.bossHpRemaining !== null && (r.bossHpRemaining < 0 || r.bossHpRemaining > r.bossMaxHp)) {
    bad.push(`${at}: boss HP ${r.bossHpRemaining} outside 0..${r.bossMaxHp}`);
  }

  // ── Removal fraction must follow from the HP figures, not float free of them.
  if (r.bossHpRemaining === null) {
    if (r.bossHpFractionRemoved !== null) {
      bad.push(`${at}: unsupported terminal HP but a removal fraction of ${r.bossHpFractionRemoved}`);
    }
  } else {
    const derived = 1 - r.bossHpRemaining / r.bossMaxHp;
    if (Math.abs(derived - r.bossHpFractionRemoved) > 1e-9) {
      bad.push(`${at}: removal fraction ${r.bossHpFractionRemoved} does not follow from ${r.bossHpRemaining}/${r.bossMaxHp}`);
    }
  }

  // ── A boss cannot go from full to dead without passing half way.
  if (r.bossHpFractionRemoved !== null && r.bossHpFractionRemoved >= 0.5 && r.crossedHalfAtMs === null) {
    bad.push(`${at}: removed ${(r.bossHpFractionRemoved * 100).toFixed(0)}% of the boss but never crossed 50%`);
  }

  // ── A player at zero HP did not win.
  if (r.minHpFraction === 0 && r.bossKilled) {
    bad.push(`${at}: claims a victory with the player at 0 HP`);
  }
  if (r.outcome === 'bot-died' && r.minHpFraction > 0) {
    bad.push(`${at}: recorded a death but never reached 0 HP (min ${r.minHpFraction})`);
  }

  // ── Adds. A boss that summons nothing cannot accumulate them; a non-zero count
  //    here is the guard that `resetDungeon` respawns leaking in as add pressure.
  if (bossSummonsNothing && r.maxAddsAlive > 0) {
    bad.push(`${at}: ${r.maxAddsAlive} adds on a boss that summons nothing — post-terminal bodies leaked in`);
  }
  if (bossSummonsNothing && Object.keys(r.damageFromAdds ?? {}).length > 0) {
    bad.push(`${at}: add damage attributed on a boss that summons nothing`);
  }

  // ── Timing sanity.
  if (r.killedAtMs !== null && r.killedAtMs > r.elapsedMs) {
    bad.push(`${at}: killedAtMs ${r.killedAtMs} after elapsed ${r.elapsedMs}`);
  }
  if (r.bossKillEvidence && r.killedAtMs === null) {
    bad.push(`${at}: kill evidence present but no killedAtMs`);
  }

  return bad;
}

/** Throw unless every record is internally consistent. No partial passes. */
export function assertBossRecordsConsistent(records, opts = {}) {
  const bad = records.flatMap((r) => verifyBossRecord(r, opts));
  if (bad.length > 0) {
    throw new Error(`Contradictory boss records:\n  - ${bad.join('\n  - ')}`);
  }
}
