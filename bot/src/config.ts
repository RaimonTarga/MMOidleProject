/**
 * Run configuration for one headless bot. Everything here is either a CLI flag
 * or an environment variable — nothing is read from the server.
 */

/** Prefix that marks an account as bot-owned. `cleanup.ts` deletes on this. */
export const BOT_ACCOUNT_PREFIX = "bot-";

export interface BotConfig {
  /** Server origin, e.g. `http://localhost:4000`. */
  serverUrl: string;
  /**
   * Dev-only account identity. Always `bot-<class>-<policy>-<nn>`; the server
   * provisions the account on first connect via `findOrCreateDevAccount`, which
   * is reachable only when `NODE_ENV !== production` and `AUTH_DEV_BYPASS=1`.
   */
  devAccountId: string;
  /** In-world character name. Server-validated: letters/digits/space/'/- , 2..24. */
  characterName: string;
  /** Route id, resolved against the route registry. */
  routeId: string;
  /** Policy profile id. */
  policyId: string;
  /** Directory that receives `runs/<runId>/`. */
  outDir: string;
  /** Hard stop for a whole run. */
  maxRunMs: number;
  /**
   * Delete any existing characters on this account before starting, so a
   * canonical run always begins from a genuinely fresh character.
   */
  freshCharacter: boolean;
  /**
   * Dev-only kill-reward multiplier to request on connect (1-1000). Leave
   * undefined for a canonical run. Anything above 1 makes the run a PIPELINE
   * TEST, not an evaluation: the output is tagged NON_CANONICAL_REWARD_MULTIPLIER
   * and must never be mixed into balance or economy conclusions.
   *
   * It is server-GLOBAL, so it changes rewards for every client on the dev world.
   */
  rewardMultiplier?: number;
  /**
   * Port for the read-only local dashboard, or null to run headless. The runner
   * serves the bots' OWN state — no game-server, protocol or admin change, and
   * the audited anonymous-spectator projection is untouched.
   */
  uiPort: number | null;
  /**
   * Origin of the dev game client, used to build "watch this bot" links from
   * the dashboard into the live spectator viewport.
   */
  clientUrl: string;
}

function envOr(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

export function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    if (eq === -1) out[arg.slice(2)] = "true";
    else out[arg.slice(2, eq)] = arg.slice(eq + 1);
  }
  return out;
}

/** Server-safe character name: strip anything the name validator rejects. */
export function sanitizeCharacterName(raw: string): string {
  const cleaned = raw
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} '-]/gu, "-")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(cleaned).slice(0, 24).join("");
}

export function buildConfig(args: Record<string, string>): BotConfig {
  const routeId = args.route ?? "striker-t1";
  const policyId = args.policy ?? "intended";
  const index = args.index ?? "01";
  const botId = `${routeId}-${policyId}-${index}`;

  return {
    serverUrl: args.server ?? envOr("BOT_SERVER_URL", "http://localhost:4000"),
    devAccountId: args.account ?? `${BOT_ACCOUNT_PREFIX}${botId}`,
    characterName: sanitizeCharacterName(args.name ?? `Bot ${routeId} ${index}`),
    routeId,
    policyId,
    outDir: args.out ?? envOr("BOT_OUT_DIR", "runs"),
    maxRunMs: Number(args.maxRunMs ?? envOr("BOT_MAX_RUN_MS", String(24 * 60 * 60 * 1000))),
    freshCharacter: args.fresh !== "false",
    clientUrl: args.clientUrl ?? envOr("BOT_CLIENT_URL", "http://localhost:3000"),
    uiPort:
      args.ui === undefined || args.ui === "false"
        ? null
        : Number(args.ui === "true" ? envOr("BOT_UI_PORT", "4500") : args.ui),
    rewardMultiplier: args.rewardMultiplier
      ? Number(args.rewardMultiplier)
      : envOr("BOT_REWARD_MULT", "")
        ? Number(envOr("BOT_REWARD_MULT", "1"))
        : undefined,
  };
}
