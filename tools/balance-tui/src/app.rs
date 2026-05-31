use crate::model::{
    BenchMode, BIOME_GROUPS, CLASS_ROOTS, FightLogLine, JsonlMatch, MAX_CONCURRENCY, Outcome,
    RunConfig, SAMPLE_PRESETS, SCHEMA_VERSION, default_concurrency,
};
use crate::runner::{
    RunnerEvent, run_dry, spawn_balance_run, spawn_party_match_log, spawn_single_match_log,
};
use crate::store::{
    FilterState, ResultStore, aggregate_by_build, class_performance, party_performance,
};
use ratatui::widgets::TableState;
use std::cmp::Ordering;
use std::time::{Duration, Instant};
use tokio::runtime::Runtime;
use tokio::sync::{mpsc, oneshot};

/// Debounce before kicking off a dry-run count after a config edit.
const DRY_RUN_DEBOUNCE: Duration = Duration::from_millis(200);

/// The "All" sentinel shown at the top of biome/class pickers (= no filter).
pub const ALL_SENTINEL: &str = "All";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RunPhase {
    Idle,
    Running,
    Done,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ViewMode {
    MatchTable,
    Rollup,
    Histogram,
    Detail,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SortMode {
    Dps,
    HpFraction,
    ClearRate,
    BuildId,
    Balance,
}

#[derive(Debug)]
pub enum DetailState {
    None,
    LoadingLog,
    Loaded(Vec<FightLogLine>),
    LogError(String),
}

/// Which sub-pane of the detail screen is showing. `Overview` (summary + balance)
/// is the default; `Build` shows the party/perks + gear; `Log` shows the fight log.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DetailPane {
    Overview,
    Build,
    Log,
}

/// Live expected-match count for the current setup config (from a `--dry-run`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExpectedPreview {
    Computing,
    Known(u32),
    Error,
}

/// Editable fields on the setup screen, in navigation order.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SetupField {
    Mode,
    Tiers,
    Biome,
    Class,
    TimeScale,
    MaxSeconds,
    Single,
    AllPaths,
    Sample,
    Threads,
    Run,
}

/// Default sim-time cap (seconds) for a mode. Overlords are ~20-min fights.
pub fn default_max_seconds(mode: BenchMode) -> u32 {
    match mode {
        BenchMode::Boss => 600,
        BenchMode::Overlord => 1500,
    }
}

/// Returned by `setup_activate` so the event loop knows when to launch a run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SetupAction {
    None,
    Run,
}

/// Full-list selector overlay for biome/class. Options[0] is the `All` sentinel.
#[derive(Debug, Clone)]
pub struct Picker {
    pub field: SetupField,
    pub options: Vec<String>,
    pub cursor: usize,
}

#[derive(Debug, Clone)]
pub struct SetupState {
    pub mode: BenchMode,
    pub field_idx: usize,
    pub tiers: [bool; 5],
    pub tier_cursor: usize,
    pub biome: Option<String>,
    pub class: Option<String>,
    pub time_scale: u32,
    pub max_seconds: u32,
    pub single: bool,
    pub all_paths: bool,
    pub concurrency: usize,
    /// Index into `SAMPLE_PRESETS` (overlord sample cap; `0` preset = full run).
    pub sample_idx: usize,
    pub picker: Option<Picker>,
}

impl Default for SetupState {
    fn default() -> Self {
        Self {
            mode: BenchMode::Boss,
            field_idx: 0,
            tiers: [false, true, false, false, false],
            tier_cursor: 1,
            biome: None,
            class: None,
            time_scale: 5,
            max_seconds: 600,
            single: false,
            all_paths: false,
            concurrency: default_concurrency(),
            sample_idx: 0,
            picker: None,
        }
    }
}

impl SetupState {
    /// Visible fields in navigation order. Overlord mode drops the tier picker
    /// (the target is the selected overlord, not a tier sweep).
    pub fn fields(&self) -> Vec<SetupField> {
        let mut fields = vec![SetupField::Mode];
        if self.mode == BenchMode::Boss {
            fields.push(SetupField::Tiers);
        }
        fields.extend([
            SetupField::Biome,
            SetupField::Class,
            SetupField::TimeScale,
            SetupField::MaxSeconds,
            SetupField::Single,
            SetupField::AllPaths,
        ]);
        // Random sampling is an overlord-only lever (the boss matrix is small).
        if self.mode == BenchMode::Overlord {
            fields.push(SetupField::Sample);
        }
        fields.extend([SetupField::Threads, SetupField::Run]);
        fields
    }

    pub fn focused(&self) -> SetupField {
        let fields = self.fields();
        fields[self.field_idx.min(fields.len() - 1)]
    }

    pub fn selected_tiers(&self) -> Vec<u32> {
        (0u32..5)
            .filter(|&t| self.tiers[t as usize])
            .collect()
    }

    /// Sample cap for the current preset (`0` = full run / no cap).
    pub fn sample_size(&self) -> u32 {
        SAMPLE_PRESETS[self.sample_idx.min(SAMPLE_PRESETS.len() - 1)]
    }
}

pub struct App {
    pub phase: RunPhase,
    pub view: ViewMode,
    pub store: ResultStore,
    pub expected: u32,
    pub collected: u32,
    pub setup: SetupState,
    pub expected_preview: ExpectedPreview,
    pub selected: usize,
    pub sort: SortMode,
    pub detail: DetailState,
    pub detail_pane: DetailPane,
    pub detail_match: Option<JsonlMatch>,
    pub log_scroll: usize,
    pub fail_message: Option<String>,
    pub started_at: Option<Instant>,
    pub finished_at: Option<Instant>,
    pub search_presets: Vec<String>,
    pub search_idx: usize,
    pub outcome_idx: usize,
    runner_rx: Option<mpsc::Receiver<RunnerEvent>>,
    expected_version: u64,
    expected_dirty: bool,
    expected_changed_at: Instant,
    dry_run_inflight: bool,
    dry_run_tx: mpsc::Sender<(u64, Option<u32>)>,
    dry_run_rx: mpsc::Receiver<(u64, Option<u32>)>,
    detail_rx: Option<oneshot::Receiver<Result<Vec<FightLogLine>, String>>>,
    pub match_table_state: TableState,
    pub rollup_table_state: TableState,
}

impl App {
    pub fn new() -> Self {
        let (dry_run_tx, dry_run_rx) = mpsc::channel(16);
        Self {
            phase: RunPhase::Idle,
            view: ViewMode::MatchTable,
            store: ResultStore::default(),
            expected: 0,
            collected: 0,
            setup: SetupState::default(),
            expected_preview: ExpectedPreview::Computing,
            selected: 0,
            sort: SortMode::Dps,
            detail: DetailState::None,
            detail_pane: DetailPane::Overview,
            detail_match: None,
            log_scroll: 0,
            fail_message: None,
            started_at: None,
            finished_at: None,
            search_presets: vec![
                String::new(),
                "cadence".into(),
                "dot".into(),
                "energy".into(),
                "summoner".into(),
            ],
            search_idx: 0,
            outcome_idx: 0,
            runner_rx: None,
            expected_version: 0,
            expected_dirty: true,
            expected_changed_at: Instant::now(),
            dry_run_inflight: false,
            dry_run_tx,
            dry_run_rx,
            detail_rx: None,
            match_table_state: TableState::default(),
            rollup_table_state: TableState::default(),
        }
    }

    pub fn build_run_config(&self) -> RunConfig {
        // Overlords ignore the tier sweep; the target is the overlord node itself.
        let tiers = if self.setup.mode == BenchMode::Overlord {
            vec![4]
        } else {
            self.setup.selected_tiers()
        };
        RunConfig {
            mode: self.setup.mode,
            tiers,
            biome: self.setup.biome.clone(),
            class_root: self.setup.class.clone(),
            time_scale: self.setup.time_scale,
            max_seconds: self.setup.max_seconds,
            single: self.setup.single,
            all_paths: self.setup.all_paths,
            concurrency: self.setup.concurrency,
            // Sampling only applies to overlord runs.
            sample_size: if self.setup.mode == BenchMode::Overlord {
                self.setup.sample_size()
            } else {
                0
            },
        }
    }

    pub fn can_run(&self) -> bool {
        let tiers_ok = self.setup.mode == BenchMode::Overlord
            || !self.setup.selected_tiers().is_empty();
        tiers_ok && self.expected_preview != ExpectedPreview::Known(0)
    }

    /// Switch boss/overlord mode, swapping the sim-cap default if it was untouched.
    fn cycle_mode(&mut self) {
        let prev = self.setup.mode;
        let next = prev.toggled();
        if self.setup.max_seconds == default_max_seconds(prev) {
            self.setup.max_seconds = default_max_seconds(next);
        }
        self.setup.mode = next;
        let len = self.setup.fields().len();
        if self.setup.field_idx >= len {
            self.setup.field_idx = len - 1;
        }
        self.mark_config_dirty();
    }

    pub async fn start_run(&mut self) -> anyhow::Result<()> {
        self.phase = RunPhase::Running;
        self.view = ViewMode::MatchTable;
        self.collected = 0;
        self.expected = 0;
        self.selected = 0;
        self.outcome_idx = 0;
        self.store = ResultStore::default();
        self.fail_message = None;
        self.started_at = Some(Instant::now());
        self.finished_at = None;

        let rx = spawn_balance_run(self.build_run_config()).await?;
        self.runner_rx = Some(rx);
        Ok(())
    }

    pub fn back_to_setup(&mut self) {
        self.phase = RunPhase::Idle;
        self.view = ViewMode::MatchTable;
        self.detail = DetailState::None;
        self.detail_match = None;
        self.fail_message = None;
        self.mark_config_dirty();
    }

    pub fn drain_runner(&mut self) {
        let events: Vec<RunnerEvent> = {
            let Some(rx) = &mut self.runner_rx else {
                return;
            };
            let mut batch = Vec::new();
            while let Ok(ev) = rx.try_recv() {
                batch.push(ev);
            }
            batch
        };

        let mut done = false;
        for ev in events {
            match ev {
                RunnerEvent::Meta(meta) => {
                    if meta.schema_version != SCHEMA_VERSION {
                        self.fail_message = Some(format!(
                            "schema version {} != expected {}",
                            meta.schema_version, SCHEMA_VERSION
                        ));
                        self.phase = RunPhase::Failed;
                        self.runner_rx = None;
                        return;
                    }
                    self.expected = meta.expected_matches;
                }
                RunnerEvent::Match(m) => {
                    if m.schema_version != SCHEMA_VERSION {
                        self.store.parse_errors += 1;
                        continue;
                    }
                    self.store.insert_match(m);
                    self.collected = self.store.all.len() as u32;
                }
                RunnerEvent::StderrLine(line) => {
                    self.fail_message = Some(line);
                }
                RunnerEvent::Done(code) => {
                    done = true;
                    self.finished_at = Some(Instant::now());
                    self.store.filters = FilterState::from_matches(&self.store.all);
                    self.outcome_idx = 0;
                    if code != 0 {
                        self.phase = RunPhase::Failed;
                    } else {
                        self.phase = RunPhase::Done;
                    }
                }
            }
        }
        if done {
            self.runner_rx = None;
        }
    }

    pub fn filtered_match_refs(&self) -> Vec<usize> {
        self.store
            .all
            .iter()
            .enumerate()
            .filter(|(_, m)| self.store.filters.matches_row(m))
            .map(|(i, _)| i)
            .collect()
    }

    pub fn clamp_selection(&mut self) {
        if self.phase == RunPhase::Idle {
            return;
        }
        let n = match self.view {
            ViewMode::Rollup => aggregate_by_build(
                &self
                    .filtered_match_refs()
                    .iter()
                    .map(|&i| self.store.all[i].clone())
                    .collect::<Vec<_>>(),
            )
            .len(),
            ViewMode::Histogram => {
                // Selection tracks the primary (top) section: party comps in
                // overlord runs, else per-class rows.
                let rows: Vec<_> = self
                    .filtered_match_refs()
                    .iter()
                    .map(|&i| self.store.all[i].clone())
                    .collect::<Vec<_>>();
                let is_party = rows.iter().any(|m| m.party.is_some());
                if is_party {
                    party_performance(&rows).len()
                } else {
                    class_performance(&rows).len()
                }
            }
            _ => self.filtered_match_refs().len(),
        };
        if n == 0 {
            self.selected = 0;
        } else if self.selected >= n {
            self.selected = n - 1;
        }
    }

    pub fn cycle_sort(&mut self) {
        self.sort = match self.sort {
            SortMode::Dps => SortMode::HpFraction,
            SortMode::HpFraction => SortMode::ClearRate,
            SortMode::ClearRate => SortMode::BuildId,
            SortMode::BuildId => SortMode::Balance,
            SortMode::Balance => SortMode::Dps,
        };
    }

    pub fn cycle_search(&mut self) {
        self.search_idx = (self.search_idx + 1) % self.search_presets.len();
        self.store.filters.search = self.search_presets[self.search_idx].clone();
    }

    /// Outcome filter presets, in cycle order. `None` = no filter (all outcomes).
    const OUTCOME_PRESETS: [Option<Outcome>; 4] = [
        None,
        Some(Outcome::Clear),
        Some(Outcome::BotDied),
        Some(Outcome::Timeout),
    ];

    /// Cycle the outcome filter: All → clear → died → timeout → All. Lets you
    /// narrow the table to e.g. only builds that cleared (or only those that died).
    pub fn cycle_outcome_filter(&mut self) {
        self.outcome_idx = (self.outcome_idx + 1) % Self::OUTCOME_PRESETS.len();
        let outcomes = &mut self.store.filters.outcomes;
        outcomes.clear();
        match Self::OUTCOME_PRESETS[self.outcome_idx] {
            // "All" = every outcome present in the data (matches_row whitelists,
            // so an empty set also means "all" — but we populate it so the panel
            // checkboxes read as all-on).
            None => {
                for m in &self.store.all {
                    outcomes.insert(m.outcome);
                }
            }
            Some(o) => {
                outcomes.insert(o);
            }
        }
        self.selected = 0;
        self.clamp_selection();
    }

    /// Human-readable label for the active outcome filter (for the footer/panel).
    pub fn outcome_filter_label(&self) -> &'static str {
        match Self::OUTCOME_PRESETS[self.outcome_idx] {
            None => "all",
            Some(Outcome::Clear) => "clear",
            Some(Outcome::BotDied) => "died",
            Some(Outcome::Timeout) => "timeout",
        }
    }

    /// Filtered matches in the same order the match table renders them, so a
    /// table selection index maps to the correct match.
    pub fn display_matches(&self) -> Vec<JsonlMatch> {
        let mut rows: Vec<JsonlMatch> = self
            .filtered_match_refs()
            .into_iter()
            .map(|i| self.store.all[i].clone())
            .collect();
        match self.sort {
            SortMode::Dps => {
                rows.sort_by(|a, b| b.dps.partial_cmp(&a.dps).unwrap_or(Ordering::Equal))
            }
            SortMode::HpFraction => rows.sort_by(|a, b| {
                b.hp_fraction
                    .partial_cmp(&a.hp_fraction)
                    .unwrap_or(Ordering::Equal)
            }),
            SortMode::Balance => rows.sort_by(|a, b| {
                let da = a.balance.as_ref().map(|x| x.difficulty).unwrap_or(-1.0);
                let db = b.balance.as_ref().map(|x| x.difficulty).unwrap_or(-1.0);
                db.partial_cmp(&da).unwrap_or(Ordering::Equal)
            }),
            SortMode::ClearRate | SortMode::BuildId => {
                rows.sort_by(|a, b| a.build_id.cmp(&b.build_id))
            }
        }
        rows
    }

    /// Open the detail screen for the selected match. Starts on the `Overview`
    /// pane (summary + balance). The fight log is lazy-loaded only when the
    /// `Log` pane is toggled on (see [`Self::toggle_log_pane`]).
    pub fn open_detail(&mut self) {
        if self.view != ViewMode::MatchTable {
            return;
        }
        let rows = self.display_matches();
        let Some(m) = rows.get(self.selected).cloned() else {
            return;
        };
        self.detail_match = Some(m);
        self.view = ViewMode::Detail;
        self.detail_pane = DetailPane::Overview;
        self.detail = DetailState::None;
        self.detail_rx = None;
        self.log_scroll = 0;
    }

    /// Toggle the build/party pane (party comp + builds + gear). Toggling it off
    /// returns to the overview.
    pub fn toggle_build_pane(&mut self) {
        if self.view != ViewMode::Detail {
            return;
        }
        self.detail_pane = if self.detail_pane == DetailPane::Build {
            DetailPane::Overview
        } else {
            DetailPane::Build
        };
    }

    /// Toggle the fight-log pane. The first time it is opened for a solo match we
    /// kick off a logged re-run (non-blocking). Solo boss runs re-run via
    /// `--build/--class`; overlord party runs re-run the exact roster via
    /// `--party`. Both stream the fight log in through [`Self::drain_detail`].
    pub fn toggle_log_pane(&mut self, rt: &Runtime) {
        if self.view != ViewMode::Detail {
            return;
        }
        if self.detail_pane == DetailPane::Log {
            self.detail_pane = DetailPane::Overview;
            return;
        }
        self.detail_pane = DetailPane::Log;

        // Already loading / loaded / errored — nothing more to do.
        if !matches!(self.detail, DetailState::None) {
            return;
        }
        let Some(m) = self.detail_match.clone() else {
            return;
        };
        let is_party = m.party.is_some();
        self.detail = DetailState::LoadingLog;
        self.log_scroll = 0;
        let (tx, rx) = oneshot::channel();
        self.detail_rx = Some(rx);
        rt.spawn(async move {
            let result = if is_party {
                spawn_party_match_log(&m).await
            } else {
                spawn_single_match_log(&m).await
            }
            .map_err(|e| e.to_string());
            let _ = tx.send(result);
        });
    }

    pub fn drain_detail(&mut self) {
        let Some(rx) = &mut self.detail_rx else {
            return;
        };
        match rx.try_recv() {
            Ok(Ok(lines)) => {
                self.detail = DetailState::Loaded(lines);
                self.detail_rx = None;
            }
            Ok(Err(e)) => {
                self.detail = DetailState::LogError(e);
                self.detail_rx = None;
            }
            Err(oneshot::error::TryRecvError::Empty) => {}
            Err(oneshot::error::TryRecvError::Closed) => {
                self.detail = DetailState::LogError("fight log re-run aborted".into());
                self.detail_rx = None;
            }
        }
    }

    pub fn close_detail(&mut self) {
        self.view = ViewMode::MatchTable;
        self.detail_pane = DetailPane::Overview;
        self.detail = DetailState::None;
        self.detail_match = None;
        self.detail_rx = None;
    }

    // ── Expected-match preview (async dry-run) ────────────────────────────────

    fn mark_config_dirty(&mut self) {
        self.expected_version += 1;
        self.expected_preview = ExpectedPreview::Computing;
        self.expected_dirty = true;
        self.expected_changed_at = Instant::now();
    }

    /// True when a debounced dry-run should be kicked off this frame.
    pub fn dry_run_due(&self) -> bool {
        self.phase == RunPhase::Idle
            && self.expected_dirty
            && !self.dry_run_inflight
            && self.expected_changed_at.elapsed() >= DRY_RUN_DEBOUNCE
    }

    /// Spawn a background dry-run for the current config (no-op if no tiers).
    pub fn begin_dry_run(&mut self, rt: &Runtime) {
        self.expected_dirty = false;
        if self.setup.selected_tiers().is_empty() {
            self.expected_preview = ExpectedPreview::Known(0);
            return;
        }
        self.dry_run_inflight = true;
        let version = self.expected_version;
        let config = self.build_run_config();
        let tx = self.dry_run_tx.clone();
        rt.spawn(async move {
            let res = run_dry(config).await.ok();
            let _ = tx.send((version, res)).await;
        });
    }

    pub fn drain_dry_run(&mut self) {
        while let Ok((version, res)) = self.dry_run_rx.try_recv() {
            self.dry_run_inflight = false;
            if version == self.expected_version {
                self.expected_preview = match res {
                    Some(n) => ExpectedPreview::Known(n),
                    None => ExpectedPreview::Error,
                };
            }
        }
    }

    // ── Setup screen interaction ──────────────────────────────────────────────

    pub fn setup_move_field(&mut self, delta: i32) {
        let n = self.setup.fields().len() as i32;
        let next = (self.setup.field_idx as i32 + delta).rem_euclid(n);
        self.setup.field_idx = next as usize;
    }

    /// Left/right adjustment for the focused field. `dir` is -1 or +1.
    pub fn setup_adjust(&mut self, dir: i32) {
        match self.setup.focused() {
            SetupField::Mode => self.cycle_mode(),
            SetupField::Tiers => {
                let next = (self.setup.tier_cursor as i32 + dir).rem_euclid(5);
                self.setup.tier_cursor = next as usize;
            }
            SetupField::TimeScale => {
                let v = self.setup.time_scale as i32 + dir;
                self.setup.time_scale = v.clamp(1, 10) as u32;
            }
            SetupField::MaxSeconds => {
                let v = self.setup.max_seconds as i32 + dir * 30;
                self.setup.max_seconds = v.clamp(30, 3600) as u32;
            }
            SetupField::Threads => {
                let v = self.setup.concurrency as i32 + dir;
                self.setup.concurrency = v.clamp(1, MAX_CONCURRENCY as i32) as usize;
            }
            SetupField::Sample => {
                let n = SAMPLE_PRESETS.len() as i32;
                self.setup.sample_idx =
                    (self.setup.sample_idx as i32 + dir).rem_euclid(n) as usize;
                self.mark_config_dirty();
            }
            SetupField::Single | SetupField::AllPaths => self.setup_toggle(),
            _ => {}
        }
    }

    pub fn setup_toggle(&mut self) {
        match self.setup.focused() {
            SetupField::Mode => self.cycle_mode(),
            SetupField::Tiers => {
                let i = self.setup.tier_cursor;
                self.setup.tiers[i] = !self.setup.tiers[i];
                self.mark_config_dirty();
            }
            SetupField::Single => {
                self.setup.single = !self.setup.single;
                self.mark_config_dirty();
            }
            SetupField::AllPaths => {
                self.setup.all_paths = !self.setup.all_paths;
                self.mark_config_dirty();
            }
            _ => {}
        }
    }

    pub fn setup_activate(&mut self) -> SetupAction {
        match self.setup.focused() {
            SetupField::Mode
            | SetupField::Tiers
            | SetupField::Single
            | SetupField::AllPaths => {
                self.setup_toggle();
                SetupAction::None
            }
            SetupField::Biome => {
                self.open_picker(SetupField::Biome);
                SetupAction::None
            }
            SetupField::Class => {
                self.open_picker(SetupField::Class);
                SetupAction::None
            }
            SetupField::Run => SetupAction::Run,
            _ => SetupAction::None,
        }
    }

    fn open_picker(&mut self, field: SetupField) {
        let (options, current) = match field {
            SetupField::Biome => {
                let mut opts = vec![ALL_SENTINEL.to_string()];
                opts.extend(BIOME_GROUPS.iter().map(|s| s.to_string()));
                (opts, self.setup.biome.clone())
            }
            SetupField::Class => {
                let mut opts = vec![ALL_SENTINEL.to_string()];
                opts.extend(CLASS_ROOTS.iter().map(|s| s.to_string()));
                (opts, self.setup.class.clone())
            }
            _ => return,
        };
        let cursor = match current {
            Some(ref v) => options.iter().position(|o| o == v).unwrap_or(0),
            None => 0,
        };
        self.setup.picker = Some(Picker {
            field,
            options,
            cursor,
        });
    }

    pub fn picker_move(&mut self, delta: i32) {
        if let Some(p) = &mut self.setup.picker {
            let n = p.options.len() as i32;
            if n == 0 {
                return;
            }
            p.cursor = (p.cursor as i32 + delta).rem_euclid(n) as usize;
        }
    }

    pub fn picker_confirm(&mut self) {
        let Some(p) = self.setup.picker.take() else {
            return;
        };
        let chosen = p.options.get(p.cursor).cloned();
        let value = match chosen {
            Some(ref s) if s == ALL_SENTINEL => None,
            other => other,
        };
        match p.field {
            SetupField::Biome => self.setup.biome = value,
            SetupField::Class => self.setup.class = value,
            _ => {}
        }
        self.mark_config_dirty();
    }

    pub fn picker_cancel(&mut self) {
        self.setup.picker = None;
    }
}
