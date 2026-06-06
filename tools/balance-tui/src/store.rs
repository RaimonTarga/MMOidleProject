use crate::model::{CLASS_ROOTS, JsonlMatch, Outcome, PartyMemberInfo};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, Default)]
pub struct FilterState {
    pub tiers: HashSet<u32>,
    pub biomes: HashSet<String>,
    pub class_roots: HashSet<String>,
    pub outcomes: HashSet<Outcome>,
    pub search: String,
}

impl FilterState {
    pub fn from_matches(matches: &[JsonlMatch]) -> Self {
        let mut tiers = HashSet::new();
        let mut biomes = HashSet::new();
        let mut class_roots = HashSet::new();
        let mut outcomes = HashSet::new();
        for m in matches {
            tiers.insert(m.content_tier);
            biomes.insert(m.biome_group.clone());
            class_roots.insert(m.class_root.clone());
            outcomes.insert(m.outcome);
        }
        Self {
            tiers,
            biomes,
            class_roots,
            outcomes,
            search: String::new(),
        }
    }

    pub fn matches_row(&self, m: &JsonlMatch) -> bool {
        if !self.tiers.is_empty() && !self.tiers.contains(&m.content_tier) {
            return false;
        }
        if !self.biomes.is_empty() && !self.biomes.contains(&m.biome_group) {
            return false;
        }
        if !self.class_roots.is_empty() && !self.class_roots.contains(&m.class_root) {
            return false;
        }
        if !self.outcomes.is_empty() && !self.outcomes.contains(&m.outcome) {
            return false;
        }
        if !self.search.is_empty() {
            let q = self.search.to_lowercase();
            if !m.build_id.to_lowercase().contains(&q)
                && !m.class_root.to_lowercase().contains(&q)
            {
                return false;
            }
        }
        true
    }
}

#[derive(Debug, Clone)]
pub struct BuildRollup {
    pub build_id: String,
    pub class_root: String,
    pub matches: u32,
    pub clears: u32,
    pub deaths: u32,
    pub timeouts: u32,
    pub avg_hp_fraction: f64,
    pub avg_clear_ms: Option<f64>,
}

pub fn rollup_flag(r: &BuildRollup) -> Option<&'static str> {
    if r.matches == 0 {
        return None;
    }
    let clear_rate = r.clears as f64 / r.matches as f64;
    let death_rate = r.deaths as f64 / r.matches as f64;
    let timeout_rate = r.timeouts as f64 / r.matches as f64;
    if clear_rate >= 0.9 && r.avg_hp_fraction >= 0.8 {
        Some("OVERTUNE")
    } else if death_rate >= 0.5 {
        Some("FRAGILE")
    } else if timeout_rate >= 0.5 {
        Some("UNDERTUNE")
    } else if clear_rate < 0.5 && r.deaths == 0 {
        Some("SOFT")
    } else {
        None
    }
}

pub fn match_row_flag(m: &JsonlMatch) -> Option<char> {
    match m.outcome {
        Outcome::Clear if m.hp_fraction >= 0.8 => Some('^'),
        Outcome::Timeout => Some('!'),
        Outcome::BotDied => Some('X'),
        _ => None,
    }
}

pub fn aggregate_by_build(rows: &[JsonlMatch]) -> Vec<BuildRollup> {
    let mut map: HashMap<String, BuildRollup> = HashMap::new();
    for m in rows {
        let e = map.entry(m.build_id.clone()).or_insert_with(|| BuildRollup {
            build_id: m.build_id.clone(),
            class_root: m.class_root.clone(),
            matches: 0,
            clears: 0,
            deaths: 0,
            timeouts: 0,
            avg_hp_fraction: 0.0,
            avg_clear_ms: None,
        });
        e.matches += 1;
        match m.outcome {
            Outcome::Clear => {
                e.clears += 1;
                let prev = e.avg_clear_ms.unwrap_or(0.0);
                e.avg_clear_ms = Some(
                    prev * (e.clears - 1) as f64 / e.clears as f64
                        + m.sim_duration_ms / e.clears as f64,
                );
            }
            Outcome::BotDied => e.deaths += 1,
            Outcome::Timeout => e.timeouts += 1,
        }
        e.avg_hp_fraction += m.hp_fraction;
    }
    let mut rollups: Vec<BuildRollup> = map.into_values().collect();
    for r in &mut rollups {
        if r.matches > 0 {
            r.avg_hp_fraction /= r.matches as f64;
        }
    }
    rollups
}

#[derive(Debug, Default)]
pub struct ResultStore {
    pub all: Vec<JsonlMatch>,
    pub filters: FilterState,
    pub parse_errors: u32,
}

impl ResultStore {
    pub fn insert_match(&mut self, m: JsonlMatch) {
        self.all.push(m);
        if self.filters.tiers.is_empty() && self.all.len() == 1 {
            self.filters = FilterState::from_matches(&self.all);
        }
    }

    pub fn tallies(&self) -> (u32, u32, u32) {
        let mut clears = 0u32;
        let mut deaths = 0u32;
        let mut timeouts = 0u32;
        for m in &self.all {
            match m.outcome {
                Outcome::Clear => clears += 1,
                Outcome::BotDied => deaths += 1,
                Outcome::Timeout => timeouts += 1,
            }
        }
        (clears, deaths, timeouts)
    }
}

// ── Relative class / party performance ────────────────────────────────────────
//
// The histogram view ranks how strong each class (or party composition) is
// *relative to the others in the same run*, so over/under-powered outliers pop
// out. Each match is reduced to a single `power` score in [0,1] (higher = the
// build cruised), groups are averaged, and the cross-group mean ± std-dev gives
// the outlier band.

/// Short class code (e.g. `cadence-root` → `cad`) used for compact labels.
pub fn class_code(class_root: &str) -> &str {
    match class_root.strip_suffix("-root").unwrap_or(class_root) {
        "cadence" => "cad",
        "cooldown" => "cdn",
        "reload" => "rel",
        "energy" => "nrg",
        "dot" => "dot",
        "summoner" => "sum",
        other => other,
    }
}

/// Compact class makeup for a party, e.g. `cad+cdn+dot+nrg`, sorted so the same
/// composition always produces the same key regardless of member order.
pub fn summarize_party(party: &[PartyMemberInfo]) -> String {
    let mut counts: Vec<(&str, u32)> = Vec::new();
    for m in party {
        let code = class_code(&m.class_root);
        if let Some(e) = counts.iter_mut().find(|(n, _)| *n == code) {
            e.1 += 1;
        } else {
            counts.push((code, 1));
        }
    }
    counts.sort_by(|a, b| a.0.cmp(b.0));
    counts
        .iter()
        .map(|(n, c)| if *c > 1 { format!("{c}×{n}") } else { (*n).to_string() })
        .collect::<Vec<_>>()
        .join("+")
}

/// Single "how strong was the player here" score in [0,1] (higher = stronger).
///
/// Outcome is the dominant gate — any clear beats any timeout beats any death —
/// and within a bucket the balance `difficulty` (or raw end-HP as a fallback)
/// breaks the tie so a healthy, fast clear scores near 1.0 (overpowered) while a
/// white-knuckle clear sits near 0.5.
pub fn match_power(m: &JsonlMatch) -> f64 {
    // `comfort` in [0,1]: 1 = trivial, 0 = brutal. difficulty already folds
    // survival/punish/attrition; fall back to raw end-HP when it is absent.
    let comfort = m
        .balance
        .as_ref()
        .map(|b| 1.0 - b.difficulty)
        .unwrap_or(m.hp_fraction)
        .clamp(0.0, 1.0);
    let p = match m.outcome {
        Outcome::Clear => 0.5 + 0.5 * comfort,
        Outcome::Timeout => 0.2 * comfort,
        Outcome::BotDied => 0.1 * m.hp_fraction.clamp(0.0, 1.0),
    };
    p.clamp(0.0, 1.0)
}

/// Aggregated performance for one group (a class, or a party composition).
#[derive(Debug, Clone)]
pub struct GroupPerf {
    pub label: String,
    pub n: u32,
    pub mean_power: f64,
    pub clear_rate: f64,
    pub avg_hp: f64,
}

#[derive(Default, Clone)]
struct PerfAcc {
    n: u32,
    power: f64,
    clears: u32,
    hp: f64,
}

impl PerfAcc {
    fn push(&mut self, m: &JsonlMatch) {
        self.n += 1;
        self.power += match_power(m);
        if m.outcome == Outcome::Clear {
            self.clears += 1;
        }
        self.hp += m.hp_fraction;
    }
    fn finish(self, label: String) -> GroupPerf {
        let n = self.n.max(1) as f64;
        GroupPerf {
            label,
            n: self.n,
            mean_power: self.power / n,
            clear_rate: self.clears as f64 / n,
            avg_hp: self.hp / n,
        }
    }
}

/// Sort strongest-first so OP outliers sit at the top, UP outliers at the bottom.
fn finish_sorted(map: HashMap<String, PerfAcc>) -> Vec<GroupPerf> {
    let mut out: Vec<GroupPerf> = map.into_iter().map(|(k, a)| a.finish(k)).collect();
    out.sort_by(|a, b| {
        b.mean_power
            .partial_cmp(&a.mean_power)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(a.label.cmp(&b.label))
    });
    out
}

/// Per-class performance (solo boss runs use the row's class; party runs fall
/// back to the row class too, but [`class_in_party_performance`] is preferred).
pub fn class_performance(rows: &[JsonlMatch]) -> Vec<GroupPerf> {
    let mut map: HashMap<String, PerfAcc> = HashMap::new();
    for m in rows {
        map.entry(class_code(&m.class_root).to_string())
            .or_default()
            .push(m);
    }
    finish_sorted(map)
}

/// Per-party-composition performance (overlord runs). Rows without a resolved
/// party are skipped. Surfaces "this 4-class comp tends to steamroll".
pub fn party_performance(rows: &[JsonlMatch]) -> Vec<GroupPerf> {
    let mut map: HashMap<String, PerfAcc> = HashMap::new();
    for m in rows {
        let Some(party) = &m.party else { continue };
        map.entry(summarize_party(party)).or_default().push(m);
    }
    finish_sorted(map)
}

/// Per-class performance *within parties*: each party's power is attributed to
/// every distinct class on its roster. Flags which class, by its presence,
/// correlates with the strongest party results.
pub fn class_in_party_performance(rows: &[JsonlMatch]) -> Vec<GroupPerf> {
    let mut map: HashMap<String, PerfAcc> = HashMap::new();
    // Overlord sampling is stratified across archetypes, so every class is
    // expected to appear. Seed all roots up front so a class with no sampled
    // party still shows as a "no data" row instead of silently dropping out.
    for root in CLASS_ROOTS {
        map.entry(class_code(root).to_string()).or_default();
    }
    for m in rows {
        let Some(party) = &m.party else { continue };
        let mut seen: HashSet<&str> = HashSet::new();
        for member in party {
            let code = class_code(&member.class_root);
            if seen.insert(code) {
                map.entry(code.to_string()).or_default().push(m);
            }
        }
    }
    finish_sorted(map)
}

/// Cross-group mean and population std-dev of `mean_power`, used to draw the
/// baseline axis and decide the outlier band.
pub fn perf_baseline(groups: &[GroupPerf]) -> (f64, f64) {
    // Groups with no samples (seeded placeholders) must not pull the baseline.
    let powers: Vec<f64> = groups
        .iter()
        .filter(|g| g.n > 0)
        .map(|g| g.mean_power)
        .collect();
    if powers.is_empty() {
        return (0.0, 0.0);
    }
    let n = powers.len() as f64;
    let mean = powers.iter().sum::<f64>() / n;
    let var = powers.iter().map(|p| (p - mean).powi(2)).sum::<f64>() / n;
    (mean, var.sqrt())
}

/// Outlier classification relative to the group baseline. `z` = standard scores
/// from the mean; anything beyond ±1σ (and a small absolute floor) is flagged.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PerfFlag {
    Overpowered,
    Underpowered,
    Fair,
}

pub fn perf_flag(power: f64, mean: f64, std: f64) -> PerfFlag {
    let dev = power - mean;
    // Need a meaningful spread before calling anything an outlier.
    if std < 0.02 || dev.abs() < 0.5 * std {
        return PerfFlag::Fair;
    }
    if dev >= std {
        PerfFlag::Overpowered
    } else if dev <= -std {
        PerfFlag::Underpowered
    } else {
        PerfFlag::Fair
    }
}
