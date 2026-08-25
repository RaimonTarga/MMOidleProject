import { BOT_ACCOUNT_PREFIX, buildConfig, parseArgs } from "./config";
import { BotConnection } from "./net/connection";

/**
 * Reset bot characters between runs.
 *
 * Deliberately done through the ordinary lobby protocol rather than direct SQL:
 * it needs no database credentials, respects the same soft-delete the real
 * client uses, and keeps this package free of any server import.
 *
 * Bot ACCOUNTS are intentionally left in place. They are deterministic
 * (`bot-<route>-<policy>-<nn>`), so the next run reuses the same row instead of
 * accumulating orphans — and the `bot-` prefix makes them trivially greppable if
 * the dev database ever does need a manual sweep.
 *
 *   pnpm --filter @mmo-idle/bot cleanup -- --routes=striker-t1 --policies=intended --count=3
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const routes = (args.routes ?? "striker-t1").split(",").filter(Boolean);
  const policies = (args.policies ?? "intended,rusher,generic").split(",").filter(Boolean);
  const count = Number(args.count ?? "1");

  const accountIds: string[] = args.accounts
    ? args.accounts.split(",").filter(Boolean)
    : routes.flatMap((route) =>
        policies.flatMap((policy) =>
          Array.from(
            { length: count },
            (_, i) =>
              buildConfig({ ...args, route, policy, index: String(i + 1).padStart(2, "0") })
                .devAccountId,
          ),
        ),
      );

  const serverUrl = buildConfig(args).serverUrl;
  let deleted = 0;

  for (const accountId of accountIds) {
    if (!accountId.startsWith(BOT_ACCOUNT_PREFIX)) {
      console.warn(`[cleanup] refusing non-bot account "${accountId}"`);
      continue;
    }

    const conn = new BotConnection(serverUrl, accountId);
    try {
      await conn.connect({
        onDelta: () => undefined,
        onWorldEvents: () => undefined,
        onDied: () => undefined,
        onAscended: () => undefined,
        onKicked: () => undefined,
        onRewardMultiplier: () => undefined,
      });
      const roster = await conn.awaitCharacters();
      for (const character of roster.characters) {
        await conn.deleteCharacter(character.id);
        deleted += 1;
        console.log(`[cleanup] ${accountId}: deleted ${character.name}`);
      }
      if (roster.characters.length === 0) console.log(`[cleanup] ${accountId}: nothing to delete`);
    } catch (err) {
      console.warn(`[cleanup] ${accountId}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      conn.disconnect();
    }
  }

  console.log(`[cleanup] removed ${deleted} character(s)`);
}

main().catch((err) => {
  console.error("[cleanup] fatal:", err);
  process.exit(1);
});
