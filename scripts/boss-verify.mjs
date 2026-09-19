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

/**
 * Declaration versus application, for ONE `ready.json`.
 *
 * Boss1's Sovereign block completed twelve clean fights and was then refused
 * certification on `applied stance != declared`: every receipt recorded
 * `declaredPackage.stance: null` against a correctly applied `offensive-stance`.
 * The bot was right and the packet was right; the receipt was serializing the
 * cell's RAW optional fields instead of the package preparation would resolve.
 * `resolveSurveyPackage` now supplies both sides' inputs, so this comparison is
 * between a declaration computed from the cell BEFORE the fight and the package
 * read back off the entity -- never the applied value compared with itself.
 *
 * It is deliberately stricter than the check it replaces, which compared only the
 * COUNT of rune rules. Ordering is load-bearing: movement-channel arbitration is
 * top-to-bottom, so a package whose Step Back has moved below its movement rule is
 * a different package at the same length.
 *
 * Returns a list of divergence strings; empty means the fight ran the package it
 * says it ran.
 */
export function verifyDeclaredApplied(ready) {
  const bad = [];
  const at = `${ready.cell}-s${ready.seed}`;
  const d = ready.declaredPackage, a = ready.appliedPackage;
  if (!d || !a) { bad.push(`${at}: receipt carries no declared/applied package pair`); return bad; }

  // A declaration that was never resolved is the Boss1 defect itself. An OMITTED
  // field is legitimate; a field left raw is not, so provenance must be present.
  if (!d.sources) bad.push(`${at}: declaration carries no field provenance — it was serialized raw, not resolved`);

  if (a.activeStance !== d.stance) {
    bad.push(`${at}: applied stance ${JSON.stringify(a.activeStance)} != declared ${JSON.stringify(d.stance)}`);
  }
  const attuned = a.attunedStances ?? [];
  const wantAttuned = d.stance ? [d.stance] : [];
  if (JSON.stringify(attuned) !== JSON.stringify(wantAttuned)) {
    bad.push(`${at}: attuned stances ${JSON.stringify(attuned)} != declared ${JSON.stringify(wantAttuned)}`);
  }

  // Ordered rule comparison. `[]` is a real declaration and is compared as one.
  const want = d.runeRules ?? [], got = a.runesEquipped ?? [];
  if (want.length !== got.length) {
    bad.push(`${at}: applied ${got.length} rune rules != declared ${want.length}`);
  } else {
    for (let i = 0; i < want.length; i++) {
      if (want[i].conditionId !== got[i].conditionId || want[i].actionId !== got[i].actionId) {
        bad.push(`${at}: rule ${i} is ${got[i].conditionId}:${got[i].actionId}, declared ${want[i].conditionId}:${want[i].actionId}`);
      }
    }
  }

  const norm = (x) => JSON.stringify({ techniques: [...(x?.techniques ?? [])].sort(), guards: [...(x?.guards ?? [])].sort() });
  if (d.abilities && norm(d.abilities) !== norm(a.attunedAbilities)) {
    bad.push(`${at}: applied abilities ${norm(a.attunedAbilities)} != declared ${norm(d.abilities)}`);
  }

  // Equipment is exact. Upgrades are checked on the four upgradable slots only --
  // a core and a relic legitimately sit at +0 while the kit sits at the declared level.
  for (const [slot, id] of Object.entries(d.gearItemIds ?? {})) {
    if (a.equipment?.[slot] !== id) bad.push(`${at}: ${slot} is ${a.equipment?.[slot]}, declared ${id}`);
    if (['weapon', 'armor', 'recovery', 'mobility'].includes(slot)) {
      const plus = a.itemUpgrades?.[id] ?? 0;
      if (plus !== d.upgradeLevel) bad.push(`${at}: ${slot} ${id} is +${plus}, declared +${d.upgradeLevel}`);
    }
  }

  if (ready.runicPoints && ready.runicPoints.cost > ready.runicPoints.budget) {
    bad.push(`${at}: package costs ${ready.runicPoints.cost} RP against a budget of ${ready.runicPoints.budget}`);
  }
  return bad;
}

/**
 * Throw unless every receipt ran the package it declared.
 *
 * Called at zero-fight QUALIFICATION as well as at formal verification, so a
 * discrepancy that is already visible in a READY receipt is caught before any
 * combat is spent rather than after eighteen fights have been run.
 */
export function assertDeclarationsApplied(readies) {
  const bad = readies.flatMap((r) => verifyDeclaredApplied(r));
  if (bad.length > 0) {
    throw new Error(`Declared package != applied package:\n  - ${bad.join('\n  - ')}`);
  }
}
