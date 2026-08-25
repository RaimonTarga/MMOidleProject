import { buildConfig, parseArgs } from "./config";
import { runBot } from "./botRun";
import { startDashboardOrWarn } from "./ui/server";

/**
 * Single-bot entrypoint.
 *
 *   pnpm --filter @mmo-idle/bot run:bot -- --route=striker-t1 --policy=intended
 *
 * The dev server must be running with `AUTH_DEV_BYPASS=1`. Canonical runs leave
 * `DEBUG_REWARD_MULT` unset so the server stays at the shipped 1x economy.
 *
 * `--ui` opens a read-only local dashboard on :4500 showing this bot's
 * equipment, resources, mastery, build, route step and recent events.
 */
async function main(): Promise<void> {
  const config = buildConfig(parseArgs(process.argv.slice(2)));

  console.log(
    `[bot] ${config.routeId} / ${config.policyId} -> ${config.serverUrl} as ${config.devAccountId}`,
  );

  let dashboard: Awaited<ReturnType<typeof startDashboardOrWarn>> | null = null;
  if (config.uiPort !== null) {
    dashboard = await startDashboardOrWarn(config.uiPort);
    if (dashboard) console.log(`[bot] dashboard: ${dashboard.url}`);
  }

  const { summary, dir } = await runBot(config);

  console.log(`[bot] ${summary.run.completion} in ${formatMs(summary.run.durationMs)}`);
  if (summary.run.stallReason) console.log(`[bot] reason: ${summary.run.stallReason}`);
  console.log(
    `[bot] tier ${summary.progression.finalPlayerTier} · GM ${summary.progression.finalGlobalMastery} · ` +
      `bosses ${summary.progression.bossesCleared.length} · deaths ${summary.deaths.total}`,
  );
  console.log(`[bot] telemetry: ${dir}`);
  await dashboard?.close();

  if (!summary.run.canonical) {
    console.warn(`[bot] NON-CANONICAL run: ${summary.run.taints.join(", ")}`);
  }

  process.exit(summary.run.completion === "completed" ? 0 : 1);
}

function formatMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
}

main().catch((err) => {
  console.error("[bot] fatal:", err);
  process.exit(1);
});
