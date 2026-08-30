> **ARCHIVED — complete 2026-08-11.** See `session-ui-sweep-handoff.md` below for what
> actually shipped from this unattended session brief.

# Overnight Session Brief — UI Sweep (W1 + W3)

**Agent:** Claude Opus 5. **Mode:** unattended, no back-and-forth.
**Branch:** cut from `feat/biome-ecology-pass2`.
**Runs concurrently with** `session-balance-instruments.md` (a different agent, a
different part of the tree). **Respect the file boundary in §1 — that is what keeps the
two sessions from colliding.**

Program context: `docs/polish-and-balance-roadmap.md` (this is W1 and W3 of Stage 1).
Repo conventions: `CLAUDE.md`. Read it before starting; it overrides anything here that
contradicts it.

---

## 1. File boundary — hard

**You may touch:**
- `client/**` (anything)
- `shared/src/data/mechanicLabels.ts` (new file, see T2)
- `shared/src/data/mechanicLabels.test.ts` (new file)
- `shared/src/items.ts` — **only** if T3 requires it

**You may NOT touch:** `server/**`, `tools/**`, `package.json`, `reports/**`,
`shared/` beyond the three files listed above. Another session owns those tonight.

If a task seems to require an out-of-bounds file, **stop that task, leave it undone, and
record it in the handoff** (§6). Do not reach across the boundary.

---

## 2. T1 — Stop words splitting mid-line

**Symptom:** text breaks mid-word across lines throughout the HUD.

**Cause:** 17 aggressive wrap rules across `client/src/**/*.css` — `overflow-wrap:
anywhere` (9 of them in `client/src/hud/hud.css` alone) and one `word-break: break-all`
at `hud.css:1572`.

`overflow-wrap: anywhere` and `word-break: break-all` both permit a break at *any*
character. `overflow-wrap: break-word` only breaks a word that cannot fit on a line by
itself — which is the behaviour wanted almost everywhere.

**Do:**
1. Find all 17 (`grep -rn "overflow-wrap: anywhere\|word-break: break-all" client/src --include=*.css`).
2. Default each to `overflow-wrap: break-word`.
3. **Keep `anywhere` only where the content is a long unbroken token** that would
   otherwise overflow its container — ids, hashes, URLs, generated keys. Judge per site
   by reading what renders there. Note each retained one and why, in a comment.
4. `client/src/hud/hud.css:147-149` already sets `overflow-wrap: break-word; hyphens:
   none;` — that pairing is the intended pattern. Match it.

`done when:` no `anywhere`/`break-all` remains except deliberately-commented cases, and
long panel labels wrap at word boundaries.

---

## 3. T2 — Item stats must never render a raw key

**Symptom (user-reported, Quake Hammer):** an item's effects display as
`cast speed pct` instead of a written stat name.

**Cause:** `MECHANIC_META` in `client/src/ui/crafting/itemDisplay.ts` labels **48**
keys. Recipes alone author **99** distinct `namespace.key` strings. The fallback at
`itemDisplay.ts:143` de-slugs whatever it does not know:

```ts
return MECHANIC_META[key] ?? {
  label: key.replace(/^[a-z]+\./, '').replace(/-/g, ' '),
  fmt: num,
};
```

So `technique.cast-speed-pct` renders as "cast speed pct". Filling the gap by hand fixes
today's sightings and regrows the moment anyone authors a new effect key.

**Do — the structural fix, not just the table:**

1. **Move the label vocabulary into `shared/`** as `shared/src/data/mechanicLabels.ts`.
   Reason: the invariant test must live where the test runner finds it, and per
   `CLAUDE.md` the runner discovers only `server/test/*.test.ts` and
   `shared/src/**/*.test.ts`. A client-only table cannot be guarded. This also matches
   the existing precedent — `ESSENCE_LABELS` already lives in `shared/src/items.ts`.
   - **Labels** (the human name for a key) move to shared.
   - **Formatters** (`pct`, `sec`, `mult`, `num` and the per-key `fmt`) stay in
     `client/src/ui/crafting/itemDisplay.ts`. They are presentation.
2. **Enumerate every authored key.** Sources: `shared/src/data/recipes/*.ts`,
   `shared/src/itemDatabase.ts`, stances, rites, cores, relics, charms — anything whose
   `mechanicEffects` reaches an item tooltip. Derive the list programmatically in the
   test rather than pasting a snapshot, so it stays true.
3. **Write a real label for every one.** Player-facing English, not a de-slug. If a key
   is a companion value (a duration or rate that belongs to another effect's sentence),
   mark it as such rather than inventing a standalone name — `itemDisplay.ts` already
   has this concept, see the comment above its companion-key list.
4. **Add `shared/src/data/mechanicLabels.test.ts`** asserting every authored
   `mechanicEffects` key has an explicit label. It must **fail** if a new unlabelled key
   is authored. Follow the existing test style: hand-rolled `assert`, trailing
   `console.log("mechanicLabels: ok")`.
5. **Keep the fallback**, but make it visibly wrong in development rather than
   plausibly right — the point is that a missing label is caught by the test, and if one
   ever slips through it should look like a bug, not like a stat.

`done when:` the new test passes, and deliberately removing one label makes it fail.

---

## 4. T3 — Combat log and stale copy

1. **Remove the number from the combat log.** User request; it is noise.
   (`client/src/hud/CombatLogPanel.tsx`, `DamageLogRow.tsx`, `LogHeadline.tsx`.)
2. **Cut the spam.** The log is dominated by buff/debuff/regen chatter, burying hits and
   kills. Add a category split so the important lines survive. Prefer a small set of
   categories with sensible defaults over a settings panel — this is a legibility fix,
   not a feature.
3. **Old essence names.** `ESSENCE_LABELS` / `essenceLabel()` in `shared/src/items.ts`
   are the single authority. Find display paths that bypass them and route them through.
   Grep user-facing strings for raw colour keys (`red`/`blue`/`green`/`yellow`/`purple`).
4. **Remove filler copy.** Named example: the party/solo explanation in the party panel.
   Sweep panel headers and blurbs for text that explains what the UI already shows.
   **Be conservative — delete only what is redundant, not what teaches a mechanic.**

---

## 5. T4 — Crafting panel (W3)

All four are in `client/src/ui/crafting/`.

1. **Sort highest tier first.** `makeEntries.ts:268` currently ends
   `... || a.tier - b.tier || a.name.localeCompare(b.name)`. Reverse the tier term.
   Keep `KIND_ORDER` as the primary key unless task 2 changes that.
2. **Slot/kind icons.** Stances, rites and runes read as hidden because entries group by
   `KIND_ORDER` and non-gear kinds sit below the gear block. Add a per-kind icon so each
   group is identifiable at a glance. Icon infrastructure exists — see
   `client/src/ui/systemIcons.ts`, `conceptIcons.ts`, `UIIcon.tsx`, and
   `ICON_SOURCE_CONTRACT.md`. **Use existing art; do not generate any.**
3. **Scroll containment.** Today the whole panel scrolls, so scrolling to an item further
   down pushes the craft controls off screen. Make the *item list* the scroll container
   and give the panel a fixed outer size, so the craft area stays visible.
4. **Tier-scaled craft animation.** Low-tier crafts are frequent and the full ceremony is
   tiresome; high-tier crafts are rare and should keep it. `tier` is already on the
   recipe, so this is a branch on existing data. **Make the fast path feel deliberate** —
   a short crisp confirmation beat, not the long animation with frames deleted. If the
   two paths cannot share a code path cleanly, prefer two explicit variants over one
   heavily-conditional component.

---

## 6. Acceptance

Everything below must hold before you finish:

- `pnpm typecheck` clean.
- `pnpm test` passes, including the new `mechanicLabels` test (was 71/71 before this
  session; expect 72/72).
- Removing one label from the registry makes the new test fail. **Verify this
  explicitly** — a test that cannot fail is not a test.
- No file outside §1's boundary is modified (`git status` to confirm).
- No art generated, no atlas repacked.

**Write a handoff at `docs/briefs/session-ui-sweep-handoff.md`** containing: what
landed, what you deliberately left (and why), every judgement call you made on the
`anywhere` retentions and the copy deletions, and anything a human should eyeball in a
running client. Screenshots are not expected.

**Do not commit** unless every acceptance item passes. If something is half-done, leave
it uncommitted and say so in the handoff — a clear "this is incomplete" is worth more
than a green-looking branch.

## 7. Judgement guidance

Three of these tasks are subjective (which `anywhere` to keep, which copy is filler,
what the fast craft path feels like). You will not be able to ask. When genuinely torn:

- **Prefer the smaller change.** This is a polish sweep, not a redesign.
- **Preserve anything that teaches a mechanic**, cut anything that narrates the UI.
- **Record the call in the handoff** rather than agonising — a listed decision is easy
  to reverse; a silent one is not.
