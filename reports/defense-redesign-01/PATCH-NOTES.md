# Defense redesign — experimental patch notes

Status: implemented and experimentally evaluated in `codex/defense-redesign-01`. Not merged or deployed. Recommend the Force/Scout/Sniper subset for adoption review; HOLD the complete redesign for further tuning. See REPORT.md for the measured results and ARMOR-INVENTORY.md for all 30 armor definitions at +0 and +5.

## Cores

- Force: removes the 12% maximum-health penalty; damage bonus reduced from 22% to 18%.
- Scout: removes the 20% maximum-health penalty; damage bonus reduced from 24% to 12%. Movement speed and mobility cooldown benefits remain.
- Sniper: removes the 30% maximum-health and 25% plating penalties; damage bonus reduced from 40% to 25%.
- Bruiser and Duelist retain their melee health bonuses and existing offensive packages. Melee durability is intentional compensation for exposure.
- Juggernaut: prototype reduces overlapping defenses to 20% health, 10% plating and 10% less damage taken; existing attack and movement costs remain. Subject to the bunker comparisons.

## Armor

- Plating becomes a specialist defense concentrated in Plains and its Volcano evolution, with small amounts on Mountain/Tundra. Other armor families invest in their own defenses.
- Forest gains evade strength; Jungle develops that strength from T2 instead of waiting until T4.
- Cave/Trench retain dependable general damage reduction.
- Mountain retains health and stronger timed Guards; soft-cap and automatic barrier-refill riders are removed. Stormwall gains its own small barrier.
- Desert replaces cheat death and periodic cleanse with six seconds of opening protection, starting on the first outgoing or incoming attack. Selecting a target during approach does not spend it. New targets do not refresh it; six quiet seconds rearm it. Base protection is 30%/35%/40% at T2/T3/T4, with one percentage point per upgrade.
- Tundra builds protection over three seconds in active combat. Movement rapidly sheds it; standing out of combat does not charge it.
- Volcano hardens under incoming pressure. Heavy gross impacts crack half of earned hardening even when a shield absorbs the hit. The extra maximum-hardening DR rider is removed.
- Swamp/Graveyard emphasize ailment resistance and damage debt; Grave Ward trades some ailment protection for stronger debt conversion instead of automatic forgiveness.
- Armor health receives a larger T3/T4 foundation to compensate for lost generic plating: approximately 150/288 base HP before family modifiers, versus 30/55 at T1/T2; five upgrades add roughly half the base value. See the inventory for exact rounding and variants. Crafting prices, ownership, recipe IDs and evolution routes remain unchanged.

## Classes and combat

- Squire root: plating multiplier 30% → 10%, DR 4% → 28%; retains 30% health and existing Recovery. Striker root: health 18% → 25%, plating multiplier 15% → 5%, DR 2% → 18%. Both close-range nodes add 4 percentage points to their class DR group and retain their health advantages. These are experimental budgets, not a production balance recommendation.
- Striker's soft cap is replaced with health and general DR. Apprentice replaces its 8% plating multiplier with 8% DR, and debt conversion rises from 10% to 15%. Slinger retains innate evade frequency; innate evade strength falls from 20% to 10% as armor gains that axis. Spirit and Conduit roots retain their existing defensive packages.
- Defensive and Tanking Stances retain their damage reduction and offensive costs, without additional plating multipliers.
- Charged attacks subtract plating once from the completed hit.
- Class and item DR compose multiplicatively. Active Guards protect shields and damage later deferred into debt.
- Conduit redirects after shields but before the owner's debt and recuperation calculation.
- General DR applies fully to monster DoTs. Secondary splash and environmental damage respect absorb pools.
- Debt pays through four upcoming one-second installments with fractional amounts preserved and resistance fixed when queued. Tiny remaining debts are not forgiven.

## Validation boundaries

Final main comparison: baseline 81 deaths / 2,518 kills; core-only 81 / 2,547; full candidate composite 97 / 2,219, each across 218 capped cases. The full composite reuses 176 unchanged revision-3 cases and replaces 42 Desert/Volcano cases with their final retest. The initial full prototype had 137 deaths, so iteration recovered substantial performance but did not close the gap.

Boss follow-ups with explicit Heat management: Squire wins at +3; Squire and Striker win at +5, each on both seeds. Other tested classes do not clear. A +5 Spirit still receives a 446-damage Final Eruption against 430 maximum HP after its barrier has been spent; this redesign does not establish universal one-shot safety.

The matrix uses synthetic, mastery-qualified loadouts at declared upgrade levels, real server Worlds and native Rune/ability execution. It does not demonstrate acquisition pacing, production telemetry, or the exact reported player death.

The initial `baseline-02`, `core-01`, and `full-01` runs in the candidate worktree used mismatched clock origins and are excluded from balance conclusions. The transform failure and preflight-only `baseline-01` are retained. Clock-corrected `baseline-03` and `full-02` initially label some zero-HP dungeon outcomes `boss_missing`; their canonical summary classifies every zero-HP result as a death. `core-02` and later runners prioritize death directly.
