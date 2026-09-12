# V1c assessment — repair post-death travel recovery

2026-09-12. Astra review of [V1c](bot-balance-v1c-report.md).

The manifest hash matches the report; durable supervisor events record the same
arrival failure and normal finalization. V1c reached GM30 and Axe +5, but failed
at 22m45s on the 10-minute Plains supplier arrival wait, before the 30-minute
overall ceiling. The remaining target pieces stayed +4; no final readiness gate
or boss encounter was reached. Two deaths occurred overall, one in this final
travel segment. The report's closing reference to one transit death applies only
to that segment, not the whole run.

Raw events place the second death in Forest 04 at 825,515 ms and the return to
Clearing at 828,465 ms. Clearing samples initially show zero attackers and full
HP, then one attacker by 881,482 ms, before the 60-second navigation fallback
could fire. The final sample at 1,363,565 ms still shows Clearing, one attacker
and full HP. There was no Plains Alacrity supplier arrival. This is travel
recovery evidence, not an Alacrity acquisition rate or boss balance result.

## Source diagnosis and repair

`ensureAt` consumed an incremented death counter even when the observed player
was still dead. Consequently, the live respawn no longer triggered the intended
navigation reissue. Independently, its suppressed/foreign-combat branch reset
the progress timer every poll with an attacker, preventing the navigation
fallback indefinitely. The raw sequence is consistent with these two defects;
the event stream does not record every outbound navigation intent.

Commit `028e8933118364e6b5e7129e57acb4c4fb7cd23d` keeps a death pending until a
live observation can receive navigation, and lets suppressed/foreign transit
reach the existing node-progress/retry check despite attackers. It does not
enable combat, change server travel, add tactical decisions or enlarge timeouts.
Regression checks exercise the actual executor polling for corpse, live respawn,
repeated polls, attackers and foreign-node isolation.

## Next decision

[V1d](bot-balance-v1d-operator-packet.md) is one fresh preparation-only validation
on the repaired executor, with the same route, kit, 25x rewards and 30-minute cap.
This is an explicitly reviewed repair run; preserve V1c separately. A naturally
occurring death can qualify runtime recovery; if none occurs, report that
boundary untested rather than deliberately killing the bot or claiming proof.
If preparation succeeds, Astra will next qualify a separate encounter entry.
Snapshot A remains incomplete and is not a boss-ready export.

We remain at first-path preparation qualification after six-profile local behavior
readiness. No campaign boss evidence or gameplay tuning recommendation exists yet.

## Validation and infrastructure

`pnpm bot:preflight` passed on exact revision `028e8933` in the clean detached
validation checkout. This includes bot/server typechecks, the new executor
recovery regressions, route/build checks and experiment tooling tests. Full
repository tests were not run; preflight is not runtime balance evidence.

Astra verified V1c's terminal state and Docker ownership, then stopped and
disconnected only its PostgreSQL/Redis services and removed their empty network.
The containers, volumes and artifacts remain preserved. A temporary network
create/remove verified capacity for V1d. The receipt is
`v1d-network-preparation.json` under V1c's experiment directory. Future restoration
requires a new isolated network and the original `postgres`/`redis` aliases.
No V1d experiment was created or launched by Astra.
