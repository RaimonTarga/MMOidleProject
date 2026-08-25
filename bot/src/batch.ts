import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildConfig, parseArgs, sanitizeCharacterName, type BotConfig } from "./config";
import { runBot, type RunOutcome } from "./botRun";
import { startDashboardOrWarn } from "./ui/server";

/**
 * Shared-world batch runner.
 *
 * Bots are NOT isolated: they connect to the same dev world at the same time,
 * so contention, shared targets and population pressure are part of the
 * measurement rather than noise removed from it.
 *
 *   pnpm --filter @mmo-idle/bot batch -- --routes=striker-t1 --policies=intended,rusher --count=2
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const routes = (args.routes ?? "striker-t1").split(",").filter(Boolean);
  const policies = (args.policies ?? "intended").split(",").filter(Boolean);
  const count = Number(args.count ?? "1");
  const outDir = args.out ?? "runs";
  const batchId = `batch-${new Date().toISOString().replace(/[:.]/g, "-")}`;

  const configs: BotConfig[] = [];
  for (const routeId of routes) {
    for (const policyId of policies) {
      for (let i = 1; i <= count; i++) {
        const index = String(i).padStart(2, "0");
        configs.push(
          buildConfig({
            ...args,
            route: routeId,
            policy: policyId,
            index,
            out: join(outDir, batchId),
            name: sanitizeCharacterName(`Bot ${routeId} ${policyId} ${index}`),
          }),
        );
      }
    }
  }

  // Every bot in a batch shares this process, so one dashboard shows the whole
  // cohort side by side.
  let dashboard: Awaited<ReturnType<typeof startDashboardOrWarn>> | null = null;
  if (configs[0]?.uiPort != null) {
    dashboard = await startDashboardOrWarn(configs[0].uiPort);
    if (dashboard) console.log(`[batch] dashboard: ${dashboard.url}`);
  }

  console.log(`[batch] ${batchId}: launching ${configs.length} bots into the shared world`);

  // Launched together on purpose — a staggered start would hide exactly the
  // population pressure this mode exists to observe.
  const settled = await Promise.allSettled(configs.map((config) => runBot(config)));

  const outcomes: Array<{ botId: string; ok: boolean; detail: unknown }> = settled.map(
    (result, i) => {
      const config = configs[i];
      const botId = `${config.routeId}-${config.policyId}-${config.devAccountId.slice(-2)}`;
      if (result.status === "rejected") {
        return { botId, ok: false, detail: String(result.reason) };
      }
      const { summary } = result.value as RunOutcome;
      return {
        botId,
        ok: summary.run.completion === "completed",
        detail: {
          completion: summary.run.completion,
          durationMs: summary.run.durationMs,
          canonical: summary.run.canonical,
          finalTier: summary.progression.finalPlayerTier,
          bossesCleared: summary.progression.bossesCleared,
          deaths: summary.deaths.total,
          stallReason: summary.run.stallReason,
          otherPlayersSeen: summary.world.otherPlayersSeen,
          contestedFraction: summary.world.contestedFraction,
        },
      };
    },
  );

  const batchDir = join(outDir, batchId);
  mkdirSync(batchDir, { recursive: true });
  writeFileSync(
    join(batchDir, "batch-summary.json"),
    `${JSON.stringify({ batchId, bots: outcomes }, null, 2)}\n`,
    "utf8",
  );

  await dashboard?.close();

  const completed = outcomes.filter((o) => o.ok).length;
  console.log(`[batch] ${completed}/${outcomes.length} completed · ${batchDir}`);
  process.exit(completed === outcomes.length ? 0 : 1);
}

main().catch((err) => {
  console.error("[batch] fatal:", err);
  process.exit(1);
});
