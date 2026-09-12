import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildRunPlan, normalizeCreateOptions, parseArgs, experimentDir, defaultExperimentRoot, resolveExperimentId, sha256File } from "./lib.mjs";
import { calibrate, compareStudy, readEvents, readJson, loadRunTimeline } from "./experience.mjs";

const command = process.argv[2], args = parseArgs(process.argv.slice(3));
const required = key => { if (!args[key]) throw new Error(`--${key} is required`); return args[key]; };
let result;
if (command === "plan") {
  required("study");
  const config = normalizeCreateOptions(args);
  result = { schemaVersion: 1, dryRun: true, config, runs: buildRunPlan(config, "preview"),
    note: "No image, snapshot or source has been validated or frozen. Create a committed-revision experiment to seal these inputs." };
} else if (command === "timeline") {
  result = loadRunTimeline(resolve(required("summary")));
} else if (command === "compare") {
  const root = resolve(args.root ?? defaultExperimentRoot());
  const dir = experimentDir(root, resolveExperimentId(root, required("id")));
  const experiment = { dir, manifest: readJson(join(dir, "experiment.json")), state: readJson(join(dir, "state.json")) };
  if (readFileSync(join(experiment.dir, "experiment.sha256"), "utf8").trim() !== sha256File(join(experiment.dir, "experiment.json"))) throw new Error("experiment manifest checksum mismatch");
  result = compareStudy(experiment.manifest, experiment.state, r => r.summaryPath ? readJson(r.summaryPath) : null);
} else if (command === "calibrate") {
  result = calibrate(readEvents(resolve(required("bot"))), readEvents(resolve(required("human"))), readJson(resolve(required("window"))));
} else throw new Error("use plan, timeline, compare or calibrate; see docs/bot-experience-command-center.md");

const json = JSON.stringify(result, null, 2) + "\n";
if (args.out) {
  const path = resolve(args.out);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json);
  console.log(path);
} else process.stdout.write(json);
