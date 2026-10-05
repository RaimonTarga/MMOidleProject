# Documentation fold report — 2026-10-05

Task 4 of [the Sol mechanical brief](sol-mechanical-tasks-2026-10-05.md).
Branch: `docs/fold-2026-10-05`, based on develop `20b34088`.
Checkout: `C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w1c`.

The tutorial fold is complete. Progression amendments 11–13 are moved verbatim to the
end of §18. **Items 9–10 remain above the title:** their text is not contained in
§18.9/§18.10, so the conditional deletion is not authorized. The instruction to remove
the entire pre-title block is therefore only partially fulfilled. No candidate plan
from item 3 qualifies for a lossless archival under both conditions in the brief.

## What moved

| Item | Result | Commit |
|---|---|---|
| Tutorial | `docs/guided-tutorial-plan.md` → `docs/archive/guided-tutorial-plan.md`, with the requested archive/successor header | `ec3673a3` |
| Tutorial current state | New `docs/guided-tutorial-current-state.md`: description, source owners, director, scripts, weapon-page lessons, first-hour checklist, validation procedure, all validation records, findings and open questions | `ec3673a3` |
| Progression decisions | Original items 11–13 → §18.11–§18.13 in `design_docs/progression-rework-design.md`; numbering continues the existing ten decisions, wording unchanged | `e1fa1bd1` |
| Index and scoreboard | Tutorial indexed as current state and its plan as history; tutorial shipped row added to `docs/system-rework-status.md`; progression design indexed | Same commits as the corresponding items |

The archived tutorial body matches its original exactly after LF normalization; only
the archive header was added. The entire `## Validation record` section matches the
original exactly after LF normalization, including the older 25x, canonical 1x,
course-correction and verbs-that-fire evidence and their limits. This task ran no new
playtest or tutorial sweep.

Current tutorial prose was checked against `shared/src/tutorial/types.ts`,
`conditions.ts`, `scripts/plans.ts`, `scripts/farewell.ts`, `tutorial.test.ts`,
`client/src/tutorial/director.ts`, `TutorialPanel.tsx`, and
`client/src/hud/MenuButtons.tsx`. Retired upgrade steps/conditions and the stale phase
list were removed from the live description. The implemented ready/action feedback
replaces the old chime question. Earlier boss-wall findings stay labeled as history;
the real-client farewell pass and cross-device opt-in question remain open.

## What was left flat

| File | Own status line | Decision and reason |
|---|---|---|
| `docs/map-variety-plan.md` | `DIRECTION LOCKED and implemented for the authored T1–T4 world (audited 2026-09-27)` | Retained. The file explicitly calls itself the living map design authority and retains region-layout/mask rules (§3, §4, §5 and §7). `variants-current-state.md` records families/blends; `map-crafting-panels-current-state.md` records map presentation. Neither is a complete paired current-state successor for those region rules. Its old modifier current-state page is already archived. Moving this file without a new fold would remove that living design authority. |
| `docs/terrain-variance-plan.md` | `IN PROGRESS (2026-08-14)` | Retained. Its own status does not say the plan is implemented/shipped; no complete paired terrain-current-state page exists. |
| `docs/ui-redesign-plan.md` | `approved for incremental implementation; not a broad rewrite` | Retained. Implemented phases in its review log do not make its own plan status shipped; no complete paired UI-current-state page exists. |
| `docs/boss-encounter-redesign-implementation-plan-2026-09-04.md` | `IN PROGRESS (2026-09-04). Phases 0-7 are SHIPPED; Phase 8 (cleanup and tuning handoff) remains.` | Retained. `boss-encounter-rework-current-state.md` exists, but the plan explicitly remains open for Phase 8. Archiving partial delivery would violate the own-status condition. |

No item-3 filename changed, so no candidate links required rewriting. Their index
entries now explain the retention/status. References were inventoried with:

```powershell
rg -n 'map-variety-plan\.md|terrain-variance-plan\.md|ui-redesign-plan\.md|boss-encounter-redesign-implementation-plan-2026-09-04\.md' docs design_docs CLAUDE.md
```

Historical packets retain their original tutorial path mentions; live tutorial
navigation in the index points to the current-state page and archive. Source-code
comments still mention the old tutorial path; editing code is outside this docs-only
scope.

## The conditional duplicate proof

Source for the original wording: `ec3673a3:design_docs/progression-rework-design.md`.
The two bodies were compared against the corresponding §18 entries, first verbatim
and then with the numbered prefix removed and whitespace collapsed. Both containment
checks are false. The same four quotes are preserved in commit `e1fa1bd1`.

The original item 9 requires the favoured lane to rank first and the punished lane to
rank last. §18.9 instead asks whether the favoured lane out-uplifts the punished lane.
Those statements cannot be substituted by a mechanical text fold.

Pre-title item 9:

```text
9. ~~**Bench criterion, replacing §9's bands (from the 2026-10-01 day-run bench).**~~
   **SUPERSEDED by §24.1 (2026-10-03): viability floor, no lane below 0.9× its tier's
   median.** (The ±3 pp lane budget below is retired; the ordinal encounter check lives on
   as §18.9's second paragraph. Kept as history.) "±10% of the
   median" shrinks as lanes weaken (+3.9% to +4.7% at a +4.3% median) and "favoured lane
   wins by ~30%" was never met. New reading: **lane budget** = every packet's mean uplift
   over its lane-less control lies within **±3 percentage points** of the median uplift at
   T1 (the band is authored per tier in the magnitude table, next to TIER_SCALAR).
   **Encounter check** = on a family's own node the favoured lane ranks **first** of the
   lanes measured there and the punished lane ranks **last**; the margin is reported, not
   required. A family whose favoured lane is *negative* on its own node (Cave Deep −17.6%,
   Plains Herd −7.5% on 2026-10-01) is a **monster-shape** finding for the Phase 4 monster
   pass, never a reason to tune that lane's cards per node.
```

§18.9:

```text
9. **The bench criterion is ±3 PERCENTAGE POINTS, and the encounter check is ordinal.**
   **First paragraph SUPERSEDED by §24.1 (2026-10-03): viability floor, no lane below
   0.9× its tier's median.** The ±3 pp band is retired (kept below as history); the
   ordinal encounter check in the second paragraph stands.

   Replaces §9's "±10% of the tier median", which was unreadable twice over: it is a
   proportion OF a number that is itself small, so the band narrows as lanes weaken
   (at a +4.3% median it reads +3.9% to +4.7%, tighter than the measurement noise),
   and no lane could ever sit inside it by construction. The band is now the median
   uplift ±3pp, absolute.

   The encounter check drops "~30%" for a ranking: **does the favoured lane out-uplift
   the punished lane on that family's own node, and by what margin?** The margin is
   reported, never thresholded. A family whose favoured lane ranks BELOW its punished
   lane is a monster-shape finding for Phase 4 (§18.7 — `drops` stays the definition of
   "favours", so the mobs are what must move), not a magnitude to tune.
```

Pre-title item 10:

```text
10. **Frames column.** The bench needs three reference profiles per root (one per frame,
   18 rows) to show Light / Balanced / Heavy uplift. Approved as its own follow-up task;
   it roughly triples the run.
```

§18.10:

```text
10. **The frames column is its own task.** Light / Balanced / Heavy uplift per root is
    not a column the lane matrix can grow: `LINEAGE_LANE_REFERENCES` does not vary frame,
    so it needs three new reference profiles per root (18 rows in
    `bot/src/tierEntry/profiles.ts`) and roughly triples a 35-minute run. Deliberately
    deferred out of the 2026-10-01 day run rather than approximated.
```

Items 11–13 were removed as one exact string and inserted before §18's closing
separator. Removing that inserted string from the result reproduced the remainder of
the original file exactly. The pre-title 9–10 prefix is unchanged. No designer wording
was edited, deleted or reinterpreted.

## Validation and limits

- Initial `Get-Location`, `git status --short`, `git branch --show-current`: assigned
  checkout, clean, on `feat/vf-data`; then created the requested branch from develop.
- Read full `CLAUDE.md` and the full brief. The brief was absent on the initial worker
  branch, so it was first read from the supplied main-checkout path; it is present after
  branching from develop. No file in another checkout was changed.
- `pnpm typecheck` passed three times: before the tutorial commit, the progression
  commit, and the final report/index commit. This includes workspace, bench and test
  TypeScript compilation, with no runtime tests required for this docs task.
- Exact archived-body, validation-section and designer-move comparisons passed.
- All 144 relative Markdown links checked across the index, scoreboard, tutorial pages
  and this report resolve; every created/edited file uses LF without CR.
- `git diff --check` and staged `git diff --cached --check` passed before commits.
- Only `docs/**` and `design_docs/**` changed. No install, push, merge or process stop.
- **UI limitation:** this worker could verify the working directory through commands
  but could not inspect a Codex window title bar; title-bar verification is unclaimed.

The remaining designer action is to decide what to do with the nonidentical pre-title
9–10 text. This worker leaves it intact and reports the incomplete layout cleanup.
