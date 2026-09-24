# Item and ability outlier pass 01 — patch dispositions

This file records at most the three selective proposals assigned to the packet. It is a review receipt, not an adoption or merge instruction. No proposal is recommended for automatic production change from this run.

## D — Desert kiting curve

- Current → candidate: Desert T2/T3/T4 `kite-speed-pct` `.20/.30/.40 -> .20/.25/.30`.
- Consumer: `desert.recipes.ts`, `mobility.kite-speed-pct`, consumed by `mobilityBoots.ts::bootSpeedMultiplier`.
- Applied source: immutable source commit `0d392fdddaec7ed31876699589f291c8c840a5e5`; candidate child-local overlay `D` is recorded in `applied-receipt.json`.
- Evidence: Ritualist matched exactly at both seeds (44/44 and 40/40 kills; identical HP damage). Ranger/Duelist candidate work was +2 and +4 kills at 600 seconds, but HP damage moved +2,878 then −7,551 and sampled slow/motion exposure was not identical.
- Counterexample: the exact Ritualist null effect and the second Ranger damage regression prevent a universal speed conclusion.
- Adoption risk: this is a passive multiplier consumed across Desert mobility items; a global curve change can alter movement/tempo tradeoffs outside the tested T4 fixtures. T3 numerical policy extrapolation remains unmeasured.
- Disposition: HOLD. Retain as a bounded candidate for a separately assigned confirmation if needed; do not merge or deploy.

## S — Swamp slow-resistance curve

- Current → candidate: T1 unchanged; T2 `.45 -> .40` with upgrade deltas `.03/.03/.02/.03/.02 -> .02` each; T3 `.62 -> .50` with deltas unchanged. At +5 the declared T1/T2/T3 values are `.40/.50/.60`.
- Consumer: `swamp.recipes.ts`, `mobility.slow-resistance`, consumed by `slowResistedMult`.
- Applied source: immutable source commit `0d392fdddaec7ed31876699589f291c8c840a5`; candidate child-local overlay `S` is recorded in `applied-receipt.json`.
- Evidence: T2 was +1/0 kills at 600 seconds across the two seeds. T3 was +10/−2 kills, with HP damage −858/−337 and mixed minimum-HP/active-fraction movement. T3 also showed sampled `Careful Footing` for 26/31 and 34/36 seconds.
- Counterexample: the opposing T3 seed and unchanged T2 seed mean the candidate does not establish a general resistance benefit. Roots remain distinct from soft slow resistance.
- Adoption risk: lower resistance may impair escape in slow-heavy fights; passive ratios do not translate directly to kills per minute, and the sampled exposure is only one-second resolution.
- Disposition: HOLD. No blanket resistance patch is justified.

## A — Arcanist Technique power

- Current → candidate: Technique power `.20 -> .30`; cooldown reduction `.20` unchanged.
- Consumer: `mountain.recipes.ts::core-arcanist`, `resolveAbilityEffect`, and `modifiedAbilityCooldownMs`.
- Applied source: immutable source commit `0d392fdddaec7ed31876699589f291c8c840a5`; candidate child-local overlay `A` is recorded in `applied-receipt.json`.
- Evidence: candidate player-source AOE HP damage exceeded current in all four rows: Reverb 53,968/50,639 versus 47,617/47,982; Idolwright 88,220/89,784 versus 80,558/85,963. Completed work was mixed: Reverb +5/−4 kills and Idolwright −1/+2.
- Counterexample: the Reverb seed 101033 regression and the lack of exclusive Technique attribution make A a delivered-effect signal, not a whole-build DPS proof. Tempered is a whole-core comparator and is not interchangeable with a pure Technique control.
- Adoption risk: this consumer affects eligible Technique payload across Arcanist packages; target loss, interrupts, competing casts, summon availability, and rounding remain material. A cast/activation total is not itself useful damage proof.
- Disposition: HOLD. Preserve the candidate evidence for command-center review; do not merge or deploy.

Blood Offering, extra boots normalization, inverse Accelerant, a new T4 item, ability-number changes, and Heat changes are not new proposals in this packet.
