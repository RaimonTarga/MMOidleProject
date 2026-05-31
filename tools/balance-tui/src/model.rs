use serde::Deserialize;
use std::collections::HashMap;
use std::path::PathBuf;

pub const SCHEMA_VERSION: u32 = 1;

/// Class roots, mirroring `CLASS_ROOTS` in `server/bench/balance/progression.ts`.
pub const CLASS_ROOTS: &[&str] = &[
    "cadence-root",
    "cooldown-root",
    "reload-root",
    "energy-root",
    "dot-root",
    "summoner-root",
];

/// Biome groups, mirroring `NODE_BIOMES` in `shared/src/world/nodeBiomes.ts`.
/// The harness skips biome/tier pairs without a dungeon, so an over-broad list is safe.
pub const BIOME_GROUPS: &[&str] = &[
    "clearing",
    "forest",
    "mountain",
    "plains",
    "swamp",
    "cave",
    "jungle",
    "desert",
    "tundra",
    "volcanic",
    "necropolis",
    "abyss",
];

/// Which kind of content to bench: solo dungeon bosses, or 4-bot overlord parties.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BenchMode {
    Boss,
    Overlord,
}

impl BenchMode {
    pub fn label(self) -> &'static str {
        match self {
            BenchMode::Boss => "Boss",
            BenchMode::Overlord => "Overlord (4-party)",
        }
    }

    /// CLI value passed to the harness `--mode` flag.
    pub fn cli(self) -> &'static str {
        match self {
            BenchMode::Boss => "boss",
            BenchMode::Overlord => "overlord",
        }
    }

    pub fn toggled(self) -> Self {
        match self {
            BenchMode::Boss => BenchMode::Overlord,
            BenchMode::Overlord => BenchMode::Boss,
        }
    }
}

/// Party size used for overlord runs (mirrors `OVERLORD_PARTY_SIZE`).
pub const OVERLORD_PARTY_SIZE: usize = 4;

/// Upper bound on parallel harness processes; each Node process is memory-heavy,
/// so we cap regardless of how many cores the machine reports.
pub const MAX_CONCURRENCY: usize = 32;

/// Default worker count: one harness process per logical core, capped.
pub fn default_concurrency() -> usize {
    std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
        .clamp(1, MAX_CONCURRENCY)
}

#[derive(Debug, Clone)]
pub struct RunConfig {
    pub mode: BenchMode,
    pub tiers: Vec<u32>,
    pub biome: Option<String>,
    pub class_root: Option<String>,
    pub time_scale: u32,
    pub max_seconds: u32,
    pub single: bool,
    /// Enumerate every perk combination (full T3 depth) rather than the realistic
    /// per-tier skill-depth cap.
    pub all_paths: bool,
    /// Number of parallel harness processes (matrix shards) to spawn. `1` = serial.
    pub concurrency: usize,
    /// Overlord-only: cap to this many randomly-sampled party scenarios. `0` = full.
    pub sample_size: u32,
}

impl Default for RunConfig {
    fn default() -> Self {
        Self {
            mode: BenchMode::Boss,
            tiers: vec![1, 2, 3, 4],
            biome: None,
            class_root: None,
            time_scale: 5,
            max_seconds: 600,
            single: false,
            all_paths: false,
            concurrency: default_concurrency(),
            sample_size: 0,
        }
    }
}

/// Sample-cap presets cycled in the setup screen (overlord mode). `0` = full run.
pub const SAMPLE_PRESETS: [u32; 8] = [0, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000];

// Fields mirror the JSONL wire contract; not all are consumed by the UI yet.
#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonlMeta {
    pub schema_version: u32,
    pub kind: String,
    #[serde(default)]
    pub mode: Option<String>,
    pub expected_matches: u32,
    pub tiers: Vec<u32>,
    pub biome: Option<String>,
    pub class_root: Option<String>,
    pub time_scale: u32,
    pub max_sim_seconds: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Deserialize)]
pub enum Outcome {
    #[serde(rename = "clear")]
    Clear,
    #[serde(rename = "bot_died")]
    BotDied,
    #[serde(rename = "timeout")]
    Timeout,
}

impl Outcome {
    pub fn label(self) -> &'static str {
        match self {
            Outcome::Clear => "CLEAR",
            Outcome::BotDied => "DIED",
            Outcome::Timeout => "TIMEOUT",
        }
    }

    /// Worst-first ordering (higher = worse). Retained for outcome ranking.
    #[allow(dead_code)]
    pub fn severity(self) -> u8 {
        match self {
            Outcome::Clear => 0,
            Outcome::Timeout => 1,
            Outcome::BotDied => 2,
        }
    }
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FightLogLine {
    pub tick: u32,
    pub time_ms: f64,
    pub kind: String,
    pub headline: String,
    pub detail: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PerkInfo {
    #[allow(dead_code)]
    pub id: String,
    pub name: String,
    pub tier: u32,
    pub description: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpgradeStepInfo {
    pub level: u32,
    #[serde(default)]
    pub stats: HashMap<String, f64>,
    #[serde(default)]
    pub mechanic_effects: HashMap<String, f64>,
    #[serde(default)]
    pub cost: HashMap<String, f64>,
    pub required_biome_level: u32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GearInfo {
    pub slot: String,
    #[allow(dead_code)]
    pub item_id: String,
    pub name: String,
    pub tier: u32,
    #[serde(default)]
    pub upgrade_level: u32,
    #[serde(default)]
    pub stats: HashMap<String, f64>,
    #[serde(default)]
    pub mechanic_effects: HashMap<String, f64>,
    #[serde(default)]
    pub upgrades: Vec<UpgradeStepInfo>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
pub enum BalanceRating {
    #[serde(rename = "too_easy")]
    TooEasy,
    #[serde(rename = "easy")]
    Easy,
    #[serde(rename = "balanced")]
    Balanced,
    #[serde(rename = "hard")]
    Hard,
    #[serde(rename = "too_hard")]
    TooHard,
}

impl BalanceRating {
    pub fn label(self) -> &'static str {
        match self {
            BalanceRating::TooEasy => "Too Easy",
            BalanceRating::Easy => "Easy",
            BalanceRating::Balanced => "Balanced",
            BalanceRating::Hard => "Struggled",
            BalanceRating::TooHard => "Can't Do",
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceWeights {
    pub survival: f64,
    pub punish: f64,
    pub attrition: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceScore {
    pub rating: BalanceRating,
    pub difficulty: f64,
    pub survival_danger: f64,
    pub punish_danger: f64,
    pub attrition_danger: f64,
    pub hp_fraction: f64,
    pub dmg_ratio: f64,
    pub seconds: f64,
    pub target_min_secs: f64,
    pub target_max_secs: f64,
    pub is_overlord: bool,
    pub outcome_gated: bool,
    pub weights: BalanceWeights,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartyMemberInfo {
    #[allow(dead_code)]
    pub build_id: String,
    pub class_root: String,
    #[allow(dead_code)]
    pub skill_path: Vec<String>,
    #[serde(default)]
    pub perks: Vec<PerkInfo>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonlMatch {
    pub schema_version: u32,
    pub kind: String,
    pub build_id: String,
    pub class_root: String,
    pub skill_path: Vec<String>,
    pub gear_item_ids: HashMap<String, String>,
    pub biome_group: String,
    pub content_tier: u32,
    pub node_id: String,
    pub is_dungeon: bool,
    pub outcome: Outcome,
    pub sim_duration_ms: f64,
    pub ticks: u32,
    pub time_scale: u32,
    pub initial_mob_count: u32,
    pub damage_dealt: f64,
    pub damage_taken: f64,
    pub bot_hp_end: f64,
    pub max_hp: f64,
    pub dps: f64,
    pub incoming_dps: f64,
    pub hp_fraction: f64,
    pub fight_log: Option<Vec<FightLogLine>>,
    #[serde(default)]
    pub perks: Vec<PerkInfo>,
    #[serde(default)]
    pub gear: Vec<GearInfo>,
    #[serde(default)]
    pub balance: Option<BalanceScore>,
    /// Overlord runs only: resolved 4-member roster.
    #[serde(default)]
    pub party: Option<Vec<PartyMemberInfo>>,
    #[serde(default)]
    pub party_deaths: Option<u32>,
}

pub fn find_repo_root() -> PathBuf {
    let mut dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    loop {
        if dir.join("package.json").exists() && dir.join("pnpm-workspace.yaml").exists() {
            return dir;
        }
        if !dir.pop() {
            break;
        }
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

