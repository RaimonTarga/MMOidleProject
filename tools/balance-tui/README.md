# Balance Bench TUI

Terminal UI for the in-process balance bench harness. Spawns `pnpm bench:balance -- --format jsonl`, streams match results, and aggregates them for interpretation.

## Prerequisites

- [Rust](https://rustup.rs/) toolchain (`cargo`)
- [pnpm](https://pnpm.io/) on `PATH`
- Run from **repo root** (or any subdirectory — the binary walks up to find `pnpm-workspace.yaml`)

## Usage

```bash
# From repo root — launches into the setup screen
pnpm bench:tui
```

The run is configured **entirely inside the TUI** — there are no launch flags to
remember. On the **Configure run** screen, pick your **mode**, tiers, biome, class,
time scale, max seconds, single-match toggle, and **all-paths** toggle, watch the
live **expected matches** count update, then activate **Run ▶**.

**Mode (Boss vs Overlord):** the top field toggles between two benches:

- **Boss** — the solo dungeon-boss matrix (one bot per build × content tier).
- **Overlord (4-party)** — runs a **4-bot party** against an overlord (an
  objective `ultimateEncounter` boss, currently the void-overlord at `node-10-0`).
  It enumerates every party of **4 distinct classes** — one build drawn from each
  of 4 different classes, across every build variation. **No class is ever
  repeated** in a party (a real group rarely runs 4 of the same type), which keeps
  the space tractable. The tier sweep is dropped (the target is the overlord
  itself). The **class** filter does *not* narrow the pool to one class — instead
  it **locks one slot** to that class (every party is guaranteed to include it,
  the other 3 slots are distinct other classes). Switching to this mode bumps the
  default sim cap to 1500 s (overlords target ~20 min). Party member 0 leads; the
  rest follow/assist via the normal auto-combat AI. Metrics are party totals, and
  HP% is the party average; `deaths N/4` shows in the detail pane. The space is
  still large (≈ 1.9M parties unfiltered at T4, ≈ 1.6M with a class lock), so use
  the **Sample** lever (and threads) and watch the **expected matches** count.

**Sample (overlord only):** rather than running the full party space, cap the run
to N **randomly-sampled** scenarios (presets: 1k / 5k / 10k / 25k / 50k / 100k /
250k, or **full**). Sampling is built for *archetype coverage with build
spot-checks*: it (1) spreads evenly across class archetypes by round-robin over
the distinct-class strata, (2) samples build variants rather than exhausting them,
and (3) **prioritizes "optimized" builds** — those whose range node fits the
archetype (melee → close, ranged → far/mid, DoT → mid) — over mismatched ones, so
the budget is spent on sensible builds first. The sample is deterministic (fixed
seed) so it reproduces across runs and across parallel shards. If N exceeds the
full space it degrades to a full (optimized-first) enumeration. CLI:
`--sample 10000`.

> **Caveat — overlord gear:** the abyss biome has no craftable gear recipes, so
> party bots currently fight the overlord with **no equipment** (skills only). This
> makes most comps read `Can't Do`. Until the overlord gear loadout is decided
> (e.g. best-available T4 gear from another biome), treat overlord results as
> relative skill-comp comparisons rather than absolute clear-rates.

**Gear:** every simulated bot runs **fully upgraded gear (+max)** for its tier's
biome loadout. Upgrade bonuses are applied during stat recalc, and the applied
`+N` is shown per item in the detail pane.

**All paths:** by default the matrix caps skill depth at the realistic
`contentTier − 1` (e.g. a T1 run is root-only). Enable **All paths** to enumerate
*every* perk combination at full T3 depth (every variant × range × T3 choice)
regardless of tier. Reload T3 and Cooldown-heavy T3 are excluded (no server logic
yet). Expect a large match count — e.g. a single-tier run jumps from 30 to 630.

**Threads (parallelism):** the bench is CPU-bound and embarrassingly parallel —
each match is independent and deterministic. The **Threads** field sets how many
harness processes the TUI spawns; it defaults to one per logical core (capped at
32). Each worker simulates a deterministic `1/N` slice of the matrix
(`globalIndex % N == shardIndex`, via `--shard-index`/`--shard-count`), and the
TUI merges their JSONL streams into one result set — so wall-time scales roughly
linearly with thread count. Because Node is single-threaded per process, this
multi-process sharding is the only way to use more than one core. Use it for the
large overlord runs; e.g. ~11M parties is still days even at full parallelism, so
combine threads with class/build filters to keep a run tractable. (Single-match
mode forces one worker.)

Raw JSONL without the TUI (for scripts/CI):

```bash
pnpm bench:balance -- --format jsonl --tier 1 --single
pnpm bench:balance -- --format jsonl --all-paths --tier 1     # full perk space
pnpm bench:balance -- --format jsonl --dry-run --tier 1,2   # just the expected-match count
pnpm bench:balance -- --mode overlord --class cadence-root --dry-run   # overlord party count
pnpm bench:balance -- --mode overlord --single                        # one overlord party fight
pnpm bench:balance -- --tier 2 --shard-index 0 --shard-count 8         # shard 0 of 8 (parallel slice)
```

Each shard prints the same global `expectedMatches` in its `run_meta` and only
simulates its slice; running shards `0..N-1` and concatenating their match lines
reproduces the full matrix exactly (no overlaps, no gaps).

## Keybindings

### Setup screen

| Key | Action |
|-----|--------|
| `↑` / `↓` (or `j`/`k`) | Move between fields |
| `←` / `→` (or `h`/`l`) | Adjust focused field (mode, tier cursor, time scale, max seconds, threads) |
| `Space` | Toggle (mode, selected tier, single-match, all-paths) |
| `Enter` | Activate field — opens biome/class picker, toggles, or launches **Run ▶** |
| `q` / `Esc` | Quit |

### Biome / class picker (overlay)

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move through the full option list |
| `Enter` | Select |
| `Esc` | Cancel |

### Results screen

| Key | Action |
|-----|--------|
| `q` | Quit |
| `c` / `Esc` | Back to setup (reconfigure & re-run) |
| `m` | Toggle match table / build rollup |
| `h` | Toggle relative-power histogram (class / party balance outliers) |
| `/` | Cycle build search substring |
| `s` | Cycle sort column |
| `Enter` | Open detail pane (Overview) |
| `p` | Detail: toggle party/build + gear pane |
| `c` | Detail: toggle fight-log pane (loads on demand) |
| `↑` / `↓` | Move selection |
| `j` / `k` | Scroll fight log in detail |

## Detail panes

Press `Enter` on a match to open the detail pane, which starts on **Overview** (summary + balance score). From there:

- `p` — **party/build + gear**: the full party roster (each member's class + build path) and the shared gear loadout, each given the full screen so nothing is truncated. For solo boss runs it shows the class path + gear.
- `c` — **fight log**: a **representative re-run** (not a deterministic replay), captured on demand. Solo runs re-run via `--log --build …`; overlord party runs re-run the exact roster via `--log --party id,id,id,id`.

### Gear selection

`resolveGearLoadout` equips each bot with the **best non-ultimate gear for its content tier**, fully upgraded (+max). It prefers the native biome's own gear (so solo runs wear what a player farming that biome would craft) and falls back to the strongest tier-appropriate item from any biome when the native biome has none.

This matters for overlords: the abyss biome's only T4 gear is **ultimate / boss-gated** (`requiredBossClear: ultimate:void-overlord`) — you can't have it *before* beating the overlord. So overlord parties fall back to the best craftable T4 gear (volcanic/tundra), which is the strongest loadout a player could realistically bring into the fight. Gear is biome+tier based (not class based), so it is genuinely shared across all four party members.

## Balance score

Each match gets a computed difficulty rating — **Too Easy · Easy · Balanced · Struggled · Can't Do** — shown as a color-coded column (blue → cyan → green → yellow → red) and broken down in the detail pane. For overlords (party fights), `Struggled` and `Can't Do` are expected, acceptable outcomes — overlords are meant to be hard, and some party compositions simply can't clear them.

It is a weighted composite of three normalized "danger" axes (each `0` = trivial, `1` = brutal):

| Axis | Weight | Measures |
|------|--------|----------|
| survival | 0.50 | `1 − endHP%` — how close to death at the end |
| punish | 0.35 | `(damageTaken / maxHP) / 1.75` — incoming pressure |
| attrition | 0.15 | `(seconds − targetMax) / targetMax` — overlong grind |

`difficulty = 0.50·survival + 0.35·punish + 0.15·attrition`, bucketed at `<.15 / <.35 / <.60 / <.85 / ≥.85`. A **death or timeout always forces `Can't Do`** regardless of the composite.

Ideal fight-duration windows drive the attrition axis:

- Regular dungeon boss: **1–3 min** (60–180 s)
- Overlord (objective/`ultimateEncounter` boss, e.g. void-overlord): **~18–20 min** (1080–1200 s)

> Overlords only read accurately when `max-seconds` ≥ their target (~1200 s); a shorter sim cap will time them out and report `too hard`.
