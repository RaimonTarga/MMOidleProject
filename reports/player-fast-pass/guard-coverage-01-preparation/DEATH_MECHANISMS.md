# Existing-evidence review; no new combat

The 32-cell Guard coverage brief governs, explicitly selected by the user over the conflicting 20-cell Recuperate brief. All controls will run fresh. This review uses the existing B raw histories and preserves their original source IDs. DEATH_REVIEW.json contains bounded terminal events, initial/terminal samples, and hashes of the files read.

| Package / seed | Recorded lethal hit | Preceding sequence and work |
|---|---|---|
| Berserker / 101009 | Dune Tyrant, 136 HP at 1548.4 s | Scarab 151 HP and Tyrant 136 HP in the final tick; Tyrant had dealt 300 at 1544.9 s. Owner 248.99 HP at 1548 s, target Tyrant still 1352 HP. |
| Berserker / 101021 | Sunshield Scarab (`sandspitter-cobra`), 151 HP at 213.8 s | Tyrant 300 at 210.2 s and 136 at 213.7 s; owner 216.75 HP at 213 s, target Tyrant 697 HP. |
| Juggernaut / 101009 | Sunshield Scarab, 151 HP at 425.9 s | Scarab 151 and Tyrant 300 at 422.1 s, Tyrant 136 at 425.6 s; target Tyrant 4334 HP at 425 s. |
| Juggernaut / 101021 | Sunshield Scarab, 151 HP at 478.1 s | Tyrant 300 at 474.2 s and 136 at 477.7 s; owner 150.49 HP at 478 s, target Tyrant 3985 HP. |
| Champion Inferno / 101021 | Sunshield Scarab, 71 HP at 42.9 s | A replacement paid 418 HP at 40.5 s, explicitly recorded in conduit-events. Owner 517.22 HP at 40 s, 78.43 at 41 s, 42.33 at 42 s; Tyrant still 3171 HP. Direct hits continued after payment (71, 67, 71). |
| Champion Mountain / 101021, historical control | Sunshield Scarab, 172 HP at 88 s | Initial 239 barrier was 82 at 1 s and zero by 3 s. Later barrier absorbed 172 at 80.4 s and 67 at 82.3 s. Scarab and Dune Basilisk direct hits then exhausted HP; 159.48 HP and Basilisk 1762 HP at 87 s. |

All four Striker terminal samples have zero barrier and zero incoming DoT, with no recorded static-damage contacts. Cleanse removed slow; it was not a poison cleanse. Their last Brace activations were 1539.6, 205.0, 416.9, and 468.9 seconds respectively; direct hits became larger after the short mitigation windows. Second Wind had fired, but the last sampled Recovery fraction was 0.46 for Inferno Strikers, with no kill window; this does not identify exact healing by source. The final attacks and existing recovery were insufficient before the unfinished Tyrant died.

Champion Inferno last cast Brace at 35.5 s and Second Wind at 35.4 s. Mountain last cast Brace at 79.1 s and Second Wind at 82.1 s; its 86/87 s samples show no active Recovery fraction. Original histories do not provide exact per-tick cooldown/status states, so no exact death cooldown is invented. The new recorder captures these states. The replacement payment is observed, not inferred from the HP endpoint. Barrier loss alone is not a demonstrated cause, and Endure does not mitigate reconstruction payment.

Endure remains a meaningful prescribed comparison because the lethal sources are direct attacks with earlier low-HP opportunities. It may reduce supported incoming attack damage while Recovery and work continue; no survival guarantee follows. Its usefulness against the payment plus attack sequence is precisely unresolved. No alternative Guard, numerical change, or reproduction run is substituted.

Counter policy: compare lifetime completedKills for lifetime work and endpoint work.kills for interval work. Preserve the historical 373-versus-375 discrepancy without correction or rerun. Post-death endpoints are null in the publication; an absent raw endpoint means unavailable, never zero.
