# Source provenance

Gameplay baseline: 5b81ddf5f5ed1099ea9e282ed4b9eb9946fc20eb, verified against remote develop during preparation. Executable successor: 056b5cd66c2f6aeccca840265a0cbce30a2a77f3.

Only server/src deltas from baseline are the inherited two-line fixedBiomeMasteryPlayers set and membership check in rewards.ts. They freeze the declared synthetic checkpoint; live worlds leave the set empty. No shared/src delta, no numerical gameplay edit.

Accepted follow-up bench support imported from 22a349bf: progressionSnapshot, progression/encounter catalogue dependencies, boss evidence helper and survey/readback support. Its gameplay modules were not restored except the bounded fixed-mastery support whose diff is preserved here. Existing t4SpecializationSpec supplies the old 54-ID catalogue; its Wasteland definitions are never selected by the new dispatcher.

Adopted Spirit four-field reduction, corrected Conduit engagement/casts/haste/Champion, empowered reservoirs, movement-only Hamstring, uncapped soft-scaled Heat and 2x OOC cooling remain byte-identical to baseline. Root reconstruction stays 3500 ms; framed R2 stays intact. The baseline Wasteland corpse-lifetime change remains in shared code, but this queue contains no Wasteland or Trench fixture.

Child boss runner differs from accepted follow-up only in its imported case catalogue. It keeps production tickDungeons initialization without an unmeasured World tick. Farm runner adds 20-minute endpoints and reuses read-only Desert/Guard recorders; no custom simulator, precharge or combat pilot.

Dispatcher is the accepted one-worker implementation adapted for 460 cases, current receipts, explicit null endpoints/interval rates, and an eight-hour soft scheduling guard checked between observations. No invented deadline flag. Control/candidate are inherited source-identity aliases to the same checkout; both primary and alternatives use that same gameplay source.

Publication is separate from execution. Byte-preserved CRLF source files require git -c core.whitespace=cr-at-eol diff --check; default whitespace checking reports carriage returns, not gameplay drift. No post-seal normalization.
