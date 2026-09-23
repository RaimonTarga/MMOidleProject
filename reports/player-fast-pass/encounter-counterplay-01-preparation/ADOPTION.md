# Spirit adoption

The attached designer brief approves the isolated Spirit adjustment. It was cherry-picked onto the intended `develop` branch as **d073dc19c4f9df9c90b4661899d2454972b2c5b3**, from verified commit `e47c48f9e29afcaaf4d49cec79d53a468c85fc41`. The exact patch is `SPIRIT.patch`: energy-light attackPct 0.07 -> 0.02 and attackSpeedPct 0.12 -> 0.04; energy-balanced attackPct 0.08 -> 0.03 and attackSpeedPct 0.06 -> 0.00. These additive frame contributions inherit into selected later specializations.

Integration succeeded without conflicts; `git push origin develop` succeeded. Unrelated dirty Heat, Hamstring, UI, test and report files were left untouched. The combined candidate and Conduit-only commit were not merged or cherry-picked. This is adoption, not deployment.

Checks: isolated source diff; full workspace and bench typecheck; shared package build; zero-tick production composition across T1-T4 Spirit and all existing Conduit profile readbacks. Root/T1 and Heavy Spirit readbacks match the previous control exactly, and every Conduit profile matches the previous control exactly. Light/Balanced expose the approved fields. No general test suite or 56-fight replay was run. All 24 encounter packages additionally qualified and replayed their applied receipts exactly with zero World ticks.

No root, Heavy, movement, HP, plating, energy or discharge parameter was adjusted. Root Conduit retains normal 3,500 ms reconstruction with authored modifiers/floors; framed R2, session correction and native owner targeting are preserved. The experiment source adds the previously used bench-only fixed-mastery opt-in to World/rewards; it is empty for live worlds and is not part of the Spirit integration on develop.
