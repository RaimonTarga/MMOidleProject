use crate::model::{
    FightLogLine, JsonlMatch, JsonlMeta, RunConfig, SCHEMA_VERSION, find_repo_root,
};
use anyhow::{Context, Result};
use std::path::Path;
use std::process::Stdio;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicI32, AtomicUsize, Ordering};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

#[derive(Debug)]
pub enum RunnerEvent {
    Meta(JsonlMeta),
    Match(JsonlMatch),
    StderrLine(String),
    Done(i32),
}

/// Effective number of parallel harness processes (matrix shards) for a run.
/// `--single` forces one shard; otherwise honor the configured concurrency.
fn effective_shards(config: &RunConfig) -> usize {
    if config.single {
        1
    } else {
        config.concurrency.max(1)
    }
}

/// Spawn the balance harness, sharding the matrix across `concurrency` child
/// processes and merging their streams into a single channel. Each shard emits
/// the same global `run_meta` (deduped to the first), its own slice of matches,
/// and a `Done`; the merged stream emits exactly one `Done` once every shard
/// has exited (with the worst non-zero exit code, if any).
pub async fn spawn_balance_run(config: RunConfig) -> Result<mpsc::Receiver<RunnerEvent>> {
    let repo = find_repo_root();
    let shards = effective_shards(&config);

    // Single shard: pass through directly (no shard flags, no merge overhead).
    if shards <= 1 {
        return spawn_with_args(&repo, build_matrix_args(&config, false, None)).await;
    }

    let (out_tx, out_rx) = mpsc::channel(512);
    let done = Arc::new(AtomicUsize::new(0));
    let worst_code = Arc::new(AtomicI32::new(0));
    let meta_sent = Arc::new(AtomicBool::new(false));

    for index in 0..shards {
        let args = build_matrix_args(&config, false, Some((index, shards)));
        let mut child_rx = spawn_with_args(&repo, args).await?;
        let out_tx = out_tx.clone();
        let done = done.clone();
        let worst_code = worst_code.clone();
        let meta_sent = meta_sent.clone();
        tokio::spawn(async move {
            while let Some(ev) = child_rx.recv().await {
                match ev {
                    // All shards report the same global count; forward once.
                    RunnerEvent::Meta(meta) => {
                        if !meta_sent.swap(true, Ordering::SeqCst) {
                            let _ = out_tx.send(RunnerEvent::Meta(meta)).await;
                        }
                    }
                    RunnerEvent::Done(code) => {
                        if code != 0 {
                            worst_code.store(code, Ordering::SeqCst);
                        }
                        let finished = done.fetch_add(1, Ordering::SeqCst) + 1;
                        if finished == shards {
                            let _ = out_tx
                                .send(RunnerEvent::Done(worst_code.load(Ordering::SeqCst)))
                                .await;
                        }
                    }
                    other => {
                        let _ = out_tx.send(other).await;
                    }
                }
            }
        });
    }

    Ok(out_rx)
}

/// Run the harness in `--dry-run` mode and return its `expectedMatches` count.
/// No matches are simulated; the child prints only the `run_meta` line.
pub async fn run_dry(config: RunConfig) -> Result<u32> {
    let repo = find_repo_root();
    let mut rx = spawn_with_args(&repo, build_matrix_args(&config, true, None)).await?;
    let mut expected: Option<u32> = None;
    let mut stderr_tail = Vec::new();

    while let Some(ev) = rx.recv().await {
        match ev {
            RunnerEvent::Meta(meta) => expected = Some(meta.expected_matches),
            RunnerEvent::StderrLine(line) => {
                stderr_tail.push(line);
                if stderr_tail.len() > 20 {
                    stderr_tail.remove(0);
                }
            }
            RunnerEvent::Done(code) if code != 0 => {
                anyhow::bail!("dry-run exited {code}: {}", stderr_tail.join("\n"));
            }
            RunnerEvent::Done(_) => break,
            _ => {}
        }
    }

    expected.context("dry-run produced no run_meta line")
}

/// Re-run a solo boss match with `--log` and return its fight log.
pub async fn spawn_single_match_log(m: &JsonlMatch) -> Result<Vec<FightLogLine>> {
    let repo = find_repo_root();
    let args = vec![
        "bench:balance".to_string(),
        "--".to_string(),
        "--format".to_string(),
        "jsonl".to_string(),
        "--log".to_string(),
        "--tier".to_string(),
        m.content_tier.to_string(),
        "--biome".to_string(),
        m.biome_group.clone(),
        "--class".to_string(),
        m.class_root.clone(),
        "--build".to_string(),
        m.build_id.clone(),
        "--time-scale".to_string(),
        m.time_scale.to_string(),
    ];
    collect_fight_log(&repo, args).await
}

/// Re-run an exact overlord party (by member build ids) with `--log` and return
/// its fight log. The matrix can't re-run a party via `--build/--class`, so this
/// uses the harness `--party` path.
pub async fn spawn_party_match_log(m: &JsonlMatch) -> Result<Vec<FightLogLine>> {
    let repo = find_repo_root();
    let Some(party) = m.party.as_ref() else {
        anyhow::bail!("match is not an overlord party run");
    };
    let ids = party
        .iter()
        .map(|p| p.build_id.clone())
        .collect::<Vec<_>>()
        .join(",");
    let args = vec![
        "bench:balance".to_string(),
        "--".to_string(),
        "--mode".to_string(),
        "overlord".to_string(),
        "--format".to_string(),
        "jsonl".to_string(),
        "--log".to_string(),
        "--tier".to_string(),
        m.content_tier.to_string(),
        "--biome".to_string(),
        m.biome_group.clone(),
        "--party".to_string(),
        ids,
        "--time-scale".to_string(),
        m.time_scale.to_string(),
    ];
    collect_fight_log(&repo, args).await
}

/// Spawn the harness with `pnpm_args`, consume its match line, and return the
/// captured fight log (shared by the solo and party re-run paths).
async fn collect_fight_log(repo: &Path, pnpm_args: Vec<String>) -> Result<Vec<FightLogLine>> {
    let mut rx = spawn_with_args(repo, pnpm_args).await?;
    let mut fight_log = None;
    let mut stderr_tail = Vec::new();

    while let Some(ev) = rx.recv().await {
        match ev {
            RunnerEvent::Match(mat) => {
                fight_log = mat.fight_log;
            }
            RunnerEvent::StderrLine(line) => {
                stderr_tail.push(line);
                if stderr_tail.len() > 20 {
                    stderr_tail.remove(0);
                }
            }
            RunnerEvent::Done(code) if code != 0 => {
                anyhow::bail!("bench exited {code}: {}", stderr_tail.join("\n"));
            }
            RunnerEvent::Done(_) => break,
            _ => {}
        }
    }

    fight_log.context("no match line with fight log in re-run output")
}

fn build_matrix_args(
    config: &RunConfig,
    dry_run: bool,
    shard: Option<(usize, usize)>,
) -> Vec<String> {
    let tiers = if config.tiers.is_empty() {
        "-1".to_string() // no valid tiers -> harness yields 0 matches
    } else {
        config
            .tiers
            .iter()
            .map(|t| t.to_string())
            .collect::<Vec<_>>()
            .join(",")
    };
    let mut args = vec![
        "bench:balance".to_string(),
        "--".to_string(),
        "--mode".to_string(),
        config.mode.cli().to_string(),
        "--format".to_string(),
        "jsonl".to_string(),
        "--tier".to_string(),
        tiers,
        "--time-scale".to_string(),
        config.time_scale.to_string(),
        "--max-seconds".to_string(),
        config.max_seconds.to_string(),
    ];
    if dry_run {
        args.push("--dry-run".to_string());
    }
    if let Some(ref b) = config.biome {
        args.push("--biome".to_string());
        args.push(b.clone());
    }
    if let Some(ref c) = config.class_root {
        args.push("--class".to_string());
        args.push(c.clone());
    }
    if config.single {
        args.push("--single".to_string());
    }
    if config.all_paths {
        args.push("--all-paths".to_string());
    }
    if config.sample_size > 0 {
        args.push("--sample".to_string());
        args.push(config.sample_size.to_string());
    }
    if let Some((index, count)) = shard {
        if count > 1 {
            args.push("--shard-index".to_string());
            args.push(index.to_string());
            args.push("--shard-count".to_string());
            args.push(count.to_string());
        }
    }
    args
}

async fn spawn_with_args(
    repo: &Path,
    pnpm_args: Vec<String>,
) -> Result<mpsc::Receiver<RunnerEvent>> {
    let mut cmd = Command::new("pnpm");
    cmd.current_dir(repo).args(&pnpm_args);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .with_context(|| format!("spawn pnpm in {}", repo.display()))?;

    let stdout = child
        .stdout
        .take()
        .context("stdout not piped")?;
    let stderr = child
        .stderr
        .take()
        .context("stderr not piped")?;

    let (tx, rx) = mpsc::channel(256);
    let tx_out = tx.clone();
    let tx_err = tx.clone();

    let stdout_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            let Ok(v) = serde_json::from_str::<serde_json::Value>(trimmed) else {
                continue;
            };
            let Some(kind) = v.get("kind").and_then(|k| k.as_str()) else {
                continue;
            };
            match kind {
                "run_meta" => {
                    if let Ok(meta) = serde_json::from_value::<JsonlMeta>(v) {
                        let _ = tx_out.send(RunnerEvent::Meta(meta)).await;
                    }
                }
                "match" => {
                    if let Ok(mat) = serde_json::from_value::<JsonlMatch>(v) {
                        if mat.schema_version != SCHEMA_VERSION {
                            continue;
                        }
                        let _ = tx_out.send(RunnerEvent::Match(mat)).await;
                    }
                }
                _ => {}
            }
        }
    });

    let stderr_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = tx_err.send(RunnerEvent::StderrLine(line)).await;
        }
    });

    tokio::spawn(async move {
        let status = child.wait().await;
        // Drain stdout/stderr fully before announcing Done: the consumer drops
        // the receiver on Done, so any match lines still buffered in the reader
        // after the process is reaped would otherwise be lost.
        let _ = stdout_task.await;
        let _ = stderr_task.await;
        let code = status.ok().and_then(|s| s.code()).unwrap_or(-1);
        let _ = tx.send(RunnerEvent::Done(code)).await;
    });

    Ok(rx)
}
