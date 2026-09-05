import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export const EXPERIMENT_SCHEMA_VERSION = 1;
export const TERMINAL_STATES = new Set([
  "completed",
  "failed",
  "timed_out",
  "cancelled",
]);

export function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    out[arg.slice(2, eq === -1 ? undefined : eq)] = eq === -1 ? "true" : arg.slice(eq + 1);
  }
  return out;
}

export function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

export function defaultExperimentRoot() {
  const local = process.env.LOCALAPPDATA;
  return local
    ? join(local, "mmo-idle", "experiments")
    : join(homedir(), ".local", "share", "mmo-idle", "experiments");
}

export function sanitizeId(raw) {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function makeExperimentId(name, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "z").toLowerCase();
  const label = sanitizeId(name || "experiment") || "experiment";
  return `${stamp}-${label}`;
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temp, path);
}

export function appendJsonl(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value)}\n`, { encoding: "utf8", flag: "a" });
}

export function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256File(path) {
  return sha256Buffer(readFileSync(path));
}

export function walkFiles(root, out = []) {
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root).sort()) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

export function hashTree(root) {
  const hash = createHash("sha256");
  for (const file of walkFiles(root)) {
    hash.update(file.slice(root.length).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    const detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}): ${detail}`);
  }
  return {
    status: result.status ?? 1,
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim(),
  };
}

export function git(repoRoot, args, options = {}) {
  return run("git", ["-C", repoRoot, ...args], options).stdout;
}

export function docker(args, options = {}) {
  return run("docker", args, options);
}

export function dockerObjectExists(kind, name) {
  return docker([kind, "inspect", name], { allowFailure: true }).status === 0;
}

export function experimentDir(root, id) {
  return resolve(root, id);
}

export function loadExperiment(root, id) {
  const dir = experimentDir(root, id);
  return {
    dir,
    manifest: readJson(join(dir, "experiment.json")),
    state: readJson(join(dir, "state.json")),
    secrets: readJson(join(dir, "runtime-secrets.json")),
  };
}

export function resolveExperimentId(root, requested) {
  if (requested && requested !== "latest") return requested;
  if (!existsSync(root)) throw new Error(`no experiments exist under ${root}`);
  const candidates = readdirSync(root)
    .filter((entry) => existsSync(join(root, entry, "experiment.json")))
    .sort();
  const latest = candidates.at(-1);
  if (!latest) throw new Error(`no experiments exist under ${root}`);
  return latest;
}

export function normalizeCreateOptions(args) {
  if (!args.revision) throw new Error("--revision=<commit-or-HEAD> is required");
  const routes = String(args.routes ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (routes.length === 0) throw new Error("--routes=<route-a,route-b> is required");
  const policies = String(args.policies ?? "intended").split(",").map((value) => value.trim()).filter(Boolean);
  const count = Number(args.count ?? "1");
  const workerConcurrency = Number(args.workers ?? "2");
  const maxRunMs = Number(args.maxRunMs ?? String(6 * 60 * 60 * 1000));
  const rewardMultiplier = Number(args.rewardMultiplier ?? "1");
  const mode = args.mode ?? "canonical-isolated";
  const completionMode = args.completion ?? "full-gauntlet";

  if (!Number.isInteger(count) || count < 1) throw new Error("--count must be a positive integer");
  if (!Number.isInteger(workerConcurrency) || workerConcurrency < 1 || workerConcurrency > 4) {
    throw new Error("--workers must be an integer from 1 to 4; 6/8-worker scaling is deferred");
  }
  if (!Number.isFinite(maxRunMs) || maxRunMs < 10_000) throw new Error("--maxRunMs must be at least 10000");
  if (!Number.isFinite(rewardMultiplier) || rewardMultiplier < 1 || rewardMultiplier > 1000) {
    throw new Error("--rewardMultiplier must be from 1 to 1000");
  }
  if (mode !== "canonical-isolated" && mode !== "smoke-isolated") {
    throw new Error("--mode must be canonical-isolated or smoke-isolated");
  }
  if (completionMode !== "full-gauntlet" && completionMode !== "next-tier") {
    throw new Error("--completion must be full-gauntlet or next-tier");
  }
  if (mode === "canonical-isolated") {
    if (rewardMultiplier !== 1) throw new Error("canonical-isolated requires --rewardMultiplier=1");
    if (completionMode !== "full-gauntlet") throw new Error("canonical-isolated requires full-gauntlet completion");
    if (args.fastBossRetry === "true") throw new Error("canonical-isolated forbids fast boss retry");
    if (args.tierEntry) throw new Error("canonical-isolated forbids synthetic --tierEntry profiles");
    if (routes.some((route) => route.includes("-t2")) && !args.tierEntrySnapshot && !args.tierEntrySnapshotDir) {
      throw new Error("canonical Tier-2 routes require a real --tierEntrySnapshot or --tierEntrySnapshotDir");
    }
  }

  return {
    requestedRevision: args.revision,
    name: args.name ?? routes.join("-").slice(0, 30),
    routes,
    policies,
    count,
    workerConcurrency,
    maxRunMs,
    rewardMultiplier,
    mode,
    completionMode,
    fastBossRetry: args.fastBossRetry === "true",
    tierEntrySnapshot: args.tierEntrySnapshot,
    tierEntrySnapshotDir: args.tierEntrySnapshotDir,
  };
}

export function buildRunPlan(config, experimentId) {
  const runs = [];
  let order = 0;
  for (let replica = 1; replica <= config.count; replica += 1) {
    for (const routeId of config.routes) {
      for (const policyId of config.policies) {
        order += 1;
        const runKey = `${String(order).padStart(3, "0")}-${sanitizeId(routeId)}-${sanitizeId(policyId)}-r${String(replica).padStart(2, "0")}`;
        runs.push({
          runKey,
          order,
          routeId,
          policyId,
          replica,
          attempt: 1,
          status: "queued",
          workerSlot: null,
          containerName: null,
          containerId: null,
          gameDatabase: null,
          logDatabase: null,
          queuedAt: new Date().toISOString(),
          startedAt: null,
          endedAt: null,
          terminalReason: null,
          artifactDirectory: null,
          experimentId,
        });
      }
    }
  }
  return runs;
}

export function isTerminal(status) {
  return TERMINAL_STATES.has(status);
}

export function randomSecret() {
  return randomBytes(24).toString("hex");
}

export function copySnapshotInput(config, destinationRoot) {
  const source = config.tierEntrySnapshotDir ?? config.tierEntrySnapshot;
  if (!source) return null;
  const absolute = resolve(source);
  if (!existsSync(absolute)) throw new Error(`tier-entry snapshot input does not exist: ${absolute}`);
  const destination = join(destinationRoot, "inputs", "tier-entry");
  mkdirSync(dirname(destination), { recursive: true });
  if (config.tierEntrySnapshotDir) {
    cpSync(absolute, destination, { recursive: true, errorOnExist: true });
    return { kind: "directory", hostPath: destination, containerPath: "/inputs/tier-entry", sha256: hashTree(destination) };
  }
  mkdirSync(destination, { recursive: true });
  const target = join(destination, basename(absolute));
  cpSync(absolute, target, { errorOnExist: true });
  return { kind: "file", hostPath: target, containerPath: `/inputs/tier-entry/${basename(absolute)}`, sha256: sha256File(target) };
}

export function removeBuildDirectory(path) {
  if (!existsSync(path)) return;
  rmSync(path, { recursive: true, force: true });
}

export async function waitForContainerHealth(name, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = docker(["inspect", "--format", "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", name], { allowFailure: true });
    if (result.status === 0 && (result.stdout === "healthy" || result.stdout === "running")) return;
    await sleep(1_000);
  }
  throw new Error(`container ${name} did not become healthy within ${timeoutMs}ms`);
}

export async function ensureInfrastructure(manifest, secrets) {
  const { network, postgresContainer, postgresVolume, redisContainer } = manifest.infrastructure;
  if (!dockerObjectExists("network", network)) docker(["network", "create", network]);
  if (!dockerObjectExists("volume", postgresVolume)) docker(["volume", "create", postgresVolume]);

  if (!dockerObjectExists("container", postgresContainer)) {
    docker([
      "run", "-d", "--name", postgresContainer,
      "--label", `mmo.experiment.id=${manifest.experimentId}`,
      "--network", network, "--network-alias", "postgres",
      "--mount", `type=volume,source=${postgresVolume},target=/var/lib/postgresql/data`,
      "-e", `POSTGRES_PASSWORD=${secrets.postgresPassword}`,
      "-e", "POSTGRES_DB=postgres",
      "--health-cmd", "pg_isready -U postgres -d postgres",
      "--health-interval", "2s", "--health-timeout", "3s", "--health-retries", "30",
      manifest.infrastructure.postgresImage,
    ]);
  } else {
    docker(["start", postgresContainer], { allowFailure: true });
  }
  await waitForContainerHealth(postgresContainer);

  if (!dockerObjectExists("container", redisContainer)) {
    docker([
      "run", "-d", "--name", redisContainer,
      "--label", `mmo.experiment.id=${manifest.experimentId}`,
      "--network", network, "--network-alias", "redis",
      "--health-cmd", "redis-cli ping",
      "--health-interval", "2s", "--health-timeout", "3s", "--health-retries", "30",
      manifest.infrastructure.redisImage,
    ]);
  } else {
    docker(["start", redisContainer], { allowFailure: true });
  }
  await waitForContainerHealth(redisContainer);
}

export function stateCounts(state) {
  return state.runs.reduce((counts, runState) => {
    counts[runState.status] = (counts[runState.status] ?? 0) + 1;
    return counts;
  }, {});
}
