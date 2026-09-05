import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildRunPlan,
  copySnapshotInput,
  defaultExperimentRoot,
  docker,
  dockerObjectExists,
  ensureInfrastructure,
  experimentDir,
  git,
  hashTree,
  isTerminal,
  loadExperiment,
  makeExperimentId,
  normalizeCreateOptions,
  parseArgs,
  randomSecret,
  readJson,
  removeBuildDirectory,
  resolveExperimentId,
  run,
  sha256Buffer,
  sha256File,
  sleep,
  stateCounts,
  walkFiles,
  writeJsonAtomic,
} from "./lib.mjs";

const command = process.argv[2];
const args = parseArgs(process.argv.slice(3));
const root = resolve(args.root ?? defaultExperimentRoot());
const scriptDirectory = dirname(fileURLToPath(import.meta.url));

function usage() {
  console.log(`Frozen bot experiment runner

Commands:
  pnpm experiment:create --revision=HEAD --routes=striker-t1,squire-t1 [--workers=2]
  pnpm experiment:launch --id=<id>
  pnpm experiment:status --id=<id|latest>
  pnpm experiment:stop --id=<id>
  pnpm experiment:report --id=<id>
  pnpm experiment:clean --id=<id>

Create options:
  --mode=canonical-isolated|smoke-isolated
  --workers=1..4             defaults to 2
  --count=N                  replicas per route/policy
  --policies=intended
  --maxRunMs=N
  --rewardMultiplier=N       canonical mode requires 1
  --completion=full-gauntlet|next-tier
  --tierEntrySnapshot=<file> or --tierEntrySnapshotDir=<dir>
  --root=<artifact-root>     defaults outside the Git checkout
`);
}

function requireExperiment() {
  const id = resolveExperimentId(root, args.id);
  return { id, ...loadExperiment(root, id) };
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function toolingFiles() {
  return ["lib.mjs", "supervisor.mjs", "worker.mjs", "Dockerfile"]
    .map((name) => join(scriptDirectory, name));
}

async function createExperiment() {
  const config = normalizeCreateOptions(args);
  const repoRoot = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
  const gitRevision = git(repoRoot, ["rev-parse", `${config.requestedRevision}^{commit}`]);
  const sourceTree = git(repoRoot, ["rev-parse", `${gitRevision}^{tree}`]);
  const invocationBranch = git(repoRoot, ["branch", "--show-current"]);
  const invocationStatus = git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]);
  const experimentId = makeExperimentId(config.name);
  const dir = experimentDir(root, experimentId);
  if (existsSync(dir)) throw new Error(`experiment already exists: ${dir}`);
  mkdirSync(dir, { recursive: true });

  const input = copySnapshotInput(config, dir);
  const buildDirectory = join(dir, ".build");
  const archivePath = join(dir, ".source.tar");
  mkdirSync(buildDirectory, { recursive: true });
  try {
    console.log(`[experiment] exporting committed revision ${gitRevision}`);
    git(repoRoot, ["archive", "--format=tar", `--output=${archivePath}`, gitRevision]);
    run("tar", ["-xf", archivePath, "-C", buildDirectory]);
    const runtimeBuildDirectory = join(buildDirectory, "experiment-runtime");
    mkdirSync(runtimeBuildDirectory, { recursive: true });
    cpSync(join(scriptDirectory, "worker.mjs"), join(runtimeBuildDirectory, "worker.mjs"));
    cpSync(join(scriptDirectory, "Dockerfile"), join(runtimeBuildDirectory, "Dockerfile"));
    const toolingHash = hashTree(runtimeBuildDirectory);
    const buildId = sha256Buffer(`${gitRevision}:${sourceTree}:${toolingHash}`).slice(0, 24);
    writeFileSync(join(runtimeBuildDirectory, "build-metadata.json"), `${JSON.stringify({
      schemaVersion: 1,
      gitRevision,
      sourceTree,
      buildId,
      toolingHash,
    }, null, 2)}\n`, "utf8");

    const imageTag = `mmo-idle-experiment:${gitRevision.slice(0, 12)}-${toolingHash.slice(0, 8)}`;
    const existingImage = docker([
      "image", "inspect", "--format", "{{json .Config.Labels}}", imageTag,
    ], { allowFailure: true });
    let reuseImage = false;
    if (existingImage.status === 0) {
      try {
        const labels = JSON.parse(existingImage.stdout);
        reuseImage = labels?.["org.opencontainers.image.revision"] === gitRevision &&
          labels?.["mmo.experiment.build-id"] === buildId;
      } catch {
        reuseImage = false;
      }
    }
    if (reuseImage) {
      console.log(`[experiment] reusing verified immutable image ${imageTag}`);
    } else {
      console.log(`[experiment] building immutable image ${imageTag}`);
      docker([
        "build",
        "--label", `org.opencontainers.image.revision=${gitRevision}`,
        "--label", `mmo.experiment.build-id=${buildId}`,
        "--file", join(runtimeBuildDirectory, "Dockerfile"),
        "--tag", imageTag,
        buildDirectory,
      ], { inherit: true });
    }
    const imageId = docker(["image", "inspect", "--format", "{{.Id}}", imageTag]).stdout;

    const runtimeDirectory = join(dir, "runtime");
    mkdirSync(runtimeDirectory, { recursive: true });
    for (const source of toolingFiles().filter((file) => !file.endsWith("worker.mjs") && !file.endsWith("Dockerfile"))) {
      cpSync(source, join(runtimeDirectory, source.split(/[\\/]/).at(-1)));
    }
    const runtimeHash = hashTree(runtimeDirectory);
    const prefix = `mmoexp-${sha256Buffer(experimentId).slice(0, 12)}`;
    const manifest = {
      schemaVersion: 1,
      experimentId,
      createdAt: new Date().toISOString(),
      artifactRoot: dir,
      source: {
        requestedRevision: config.requestedRevision,
        gitRevision,
        sourceTree,
        repoRoot,
        invocationBranch,
        invocationDirty: invocationStatus.length > 0,
        invocationStatus: invocationStatus ? invocationStatus.split(/\r?\n/) : [],
        dirtyWorkingTreeIncluded: false,
      },
      build: { imageTag, imageId, buildId, toolingHash, runtimeHash },
      config: {
        mode: config.mode,
        workerConcurrency: config.workerConcurrency,
        workerMemoryLimit: args.workerMemory ?? "768m",
        maxRunMs: config.maxRunMs,
        rewardMultiplier: config.rewardMultiplier,
        completionMode: config.completionMode,
        fastBossRetry: config.fastBossRetry,
        routes: config.routes,
        policies: config.policies,
        count: config.count,
        automaticRetries: 0,
      },
      inputs: { tierEntrySnapshot: input },
      infrastructure: {
        prefix,
        network: `${prefix}-network`,
        postgresContainer: `${prefix}-postgres`,
        postgresVolume: `${prefix}-postgres-data`,
        redisContainer: `${prefix}-redis`,
        postgresImage: "postgres:16-alpine",
        redisImage: "redis:7-alpine",
        hostPortsPublished: false,
      },
    };
    const state = {
      schemaVersion: 1,
      experimentId,
      createdAt: manifest.createdAt,
      updatedAt: manifest.createdAt,
      supervisor: { status: "not-started", pid: null },
      runs: buildRunPlan(config, experimentId),
    };
    writeJsonAtomic(join(dir, "runtime-secrets.json"), { postgresPassword: randomSecret() });
    const manifestPath = join(dir, "experiment.json");
    writeJsonAtomic(manifestPath, manifest);
    writeFileSync(join(dir, "experiment.sha256"), `${sha256File(manifestPath)}\n`, "utf8");
    writeJsonAtomic(join(dir, "state.json"), state);
    console.log(`[experiment] created ${experimentId}`);
    console.log(`[experiment] revision ${gitRevision}`);
    console.log(`[experiment] image ${imageId}`);
    console.log(`[experiment] artifacts ${dir}`);
    if (manifest.source.invocationDirty) {
      console.log(`[experiment] note: the invoking checkout was dirty; its uncommitted changes were excluded`);
    }
  } finally {
    removeBuildDirectory(buildDirectory);
    if (existsSync(archivePath)) rmSync(archivePath, { force: true });
  }
}

async function launchExperiment() {
  const experiment = requireExperiment();
  const state = readJson(join(experiment.dir, "state.json"));
  if (state.runs.every((runState) => isTerminal(runState.status))) {
    throw new Error("experiment is already terminal; retries require a new experiment/attempt");
  }
  const pidPath = join(experiment.dir, "supervisor.pid");
  if (existsSync(pidPath) && processAlive(Number(readFileSync(pidPath, "utf8").trim()))) {
    throw new Error(`experiment supervisor is already running for ${experiment.id}`);
  }
  const stopPath = join(experiment.dir, "stop.request");
  if (existsSync(stopPath)) rmSync(stopPath, { force: true });
  await ensureInfrastructure(experiment.manifest, experiment.secrets);

  const logFd = openSync(join(experiment.dir, "supervisor.log"), "a");
  const supervisorPath = join(experiment.dir, "runtime", "supervisor.mjs");
  const child = spawn(process.execPath, [supervisorPath, `--experimentDir=${experiment.dir}`], {
    cwd: experiment.dir,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", logFd, logFd],
  });
  child.unref();
  closeSync(logFd);
  writeFileSync(pidPath, `${child.pid}\n`, "utf8");
  console.log(`[experiment] launched ${experiment.id} with ${experiment.manifest.config.workerConcurrency} worker(s)`);
  console.log(`[experiment] supervisor pid ${child.pid}`);
  console.log(`[experiment] status: pnpm experiment:status --id=${experiment.id}`);
}

function statusExperiment() {
  const experiment = requireExperiment();
  const state = readJson(join(experiment.dir, "state.json"));
  console.log(`${experiment.id} / ${experiment.manifest.source.gitRevision}`);
  console.log(`mode=${experiment.manifest.config.mode} workers=${experiment.manifest.config.workerConcurrency} image=${experiment.manifest.build.imageId}`);
  console.log(`supervisor=${state.supervisor?.status ?? "unknown"} counts=${JSON.stringify(stateCounts(state))}`);
  console.table(state.runs.map((runState) => ({
    order: runState.order,
    route: runState.routeId,
    replica: runState.replica,
    status: runState.status,
    worker: runState.workerSlot ?? "-",
    reason: runState.terminalReason ?? "",
  })));
  console.log(`artifacts=${experiment.dir}`);
}

async function stopExperiment() {
  const experiment = requireExperiment();
  const state = readJson(join(experiment.dir, "state.json"));
  if (state.runs.every((runState) => isTerminal(runState.status))) {
    console.log(`[experiment] ${experiment.id} is already terminal`);
    return;
  }
  writeFileSync(join(experiment.dir, "stop.request"), `${new Date().toISOString()}\n`, "utf8");
  console.log(`[experiment] stop requested for ${experiment.id}`);
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    await sleep(1_000);
    const latest = readJson(join(experiment.dir, "state.json"));
    if (latest.runs.every((runState) => isTerminal(runState.status))) {
      console.log("[experiment] all runs are terminal; artifacts were preserved");
      return;
    }
  }
  console.log("[experiment] stop remains in progress; inspect with experiment:status");
}

function parseJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

function reportExperiment() {
  const experiment = requireExperiment();
  const state = readJson(join(experiment.dir, "state.json"));
  const runs = state.runs.map((runState) => {
    const runDirectory = join(experiment.dir, "runs", runState.runKey);
    const samples = parseJsonl(join(runDirectory, "resource-samples.jsonl"));
    let maxMemoryBytes = 0;
    let maxEventLoopP99Ms = 0;
    let maxCpuPct = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];
      maxMemoryBytes = Math.max(maxMemoryBytes, Number(sample.memoryBytes ?? 0));
      maxEventLoopP99Ms = Math.max(maxEventLoopP99Ms, Number(sample.server?.eventLoopP99Ms ?? 0));
      if (index > 0 && sample.cpuUsageUsec != null && samples[index - 1].cpuUsageUsec != null) {
        const elapsedUs = (Date.parse(sample.at) - Date.parse(samples[index - 1].at)) * 1_000;
        if (elapsedUs > 0) maxCpuPct = Math.max(maxCpuPct, (sample.cpuUsageUsec - samples[index - 1].cpuUsageUsec) / elapsedUs * 100);
      }
    }
    return {
      runKey: runState.runKey,
      routeId: runState.routeId,
      status: runState.status,
      reason: runState.terminalReason,
      startedAt: runState.startedAt,
      endedAt: runState.endedAt,
      summaryPath: runState.summaryPath ?? null,
      maxMemoryMiB: Math.round(maxMemoryBytes / 1024 / 1024 * 10) / 10,
      maxContainerCpuPct: Math.round(maxCpuPct * 10) / 10,
      maxEventLoopP99Ms: Math.round(maxEventLoopP99Ms * 10) / 10,
      resourceSamples: samples.length,
    };
  });
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    experimentId: experiment.id,
    gitRevision: experiment.manifest.source.gitRevision,
    imageId: experiment.manifest.build.imageId,
    config: experiment.manifest.config,
    counts: stateCounts(state),
    runs,
  };
  const reportPath = join(experiment.dir, "cohort-summary.json");
  writeJsonAtomic(reportPath, report);
  console.table(runs.map((item) => ({
    route: item.routeId,
    status: item.status,
    memoryMiB: item.maxMemoryMiB,
    cpuPct: item.maxContainerCpuPct,
    eventLoopP99Ms: item.maxEventLoopP99Ms,
  })));
  console.log(`[experiment] report ${reportPath}`);
  console.log(`[experiment] existing bot reports can read recursively under ${join(experiment.dir, "runs")}`);
}

function cleanExperiment() {
  const experiment = requireExperiment();
  const state = readJson(join(experiment.dir, "state.json"));
  if (state.runs.some((runState) => runState.status === "starting" || runState.status === "running")) {
    throw new Error("refusing to clean an active experiment; run experiment:stop first");
  }
  const prefix = experiment.manifest.infrastructure.prefix;
  if (!prefix.startsWith("mmoexp-") || prefix.length < 16) throw new Error(`unsafe infrastructure prefix: ${prefix}`);
  const listed = docker([
    "ps", "-aq", "--filter", `label=mmo.experiment.id=${experiment.id}`,
  ], { allowFailure: true }).stdout.split(/\r?\n/).filter(Boolean);
  for (const containerId of listed) docker(["rm", "-f", containerId], { allowFailure: true });
  for (const name of [experiment.manifest.infrastructure.postgresContainer, experiment.manifest.infrastructure.redisContainer]) {
    if (dockerObjectExists("container", name)) docker(["rm", "-f", name], { allowFailure: true });
  }
  if (dockerObjectExists("network", experiment.manifest.infrastructure.network)) {
    docker(["network", "rm", experiment.manifest.infrastructure.network], { allowFailure: true });
  }
  if (dockerObjectExists("volume", experiment.manifest.infrastructure.postgresVolume)) {
    docker(["volume", "rm", experiment.manifest.infrastructure.postgresVolume]);
  }
  console.log(`[experiment] removed runtime containers, network, and database volume for ${experiment.id}`);
  console.log(`[experiment] artifacts and frozen image remain recoverable at ${experiment.dir}`);
}

try {
  mkdirSync(root, { recursive: true });
  if (command === "create") await createExperiment();
  else if (command === "launch") await launchExperiment();
  else if (command === "status") statusExperiment();
  else if (command === "stop") await stopExperiment();
  else if (command === "report") reportExperiment();
  else if (command === "clean") cleanExperiment();
  else usage();
} catch (error) {
  console.error(`[experiment] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
