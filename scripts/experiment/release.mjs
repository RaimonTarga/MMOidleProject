import { join } from "node:path";
import { docker, isTerminal, writeJsonAtomic } from "./lib.mjs";

/** Release scarce subnet/runtime capacity without deleting evidence or volumes. */
export function releaseInfrastructure(manifest, state, directory, invoke = docker, save = writeJsonAtomic) {
  if (state.supervisor?.status !== "completed" || !state.runs.every(r => isTerminal(r.status))) {
    throw new Error("release requires a completed supervisor and all terminal runs");
  }
  const infra = manifest.infrastructure;
  if (!/^mmoexp-[a-f0-9]{12}$/.test(infra.prefix) || infra.network !== `${infra.prefix}-network`) {
    throw new Error("unsafe experiment infrastructure identity");
  }
  const networks = invoke(["network", "ls", "--format", "{{json .}}"] ).stdout.split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const found = networks.find(n => n.Name === infra.network);
  const network = found ? JSON.parse(invoke(["network", "inspect", found.ID]).stdout)[0] : null;
  const ids = invoke(["ps", "-aq", "--filter", `label=mmo.experiment.id=${manifest.experimentId}`]).stdout.split(/\r?\n/).filter(Boolean);
  const containers = ids.length ? JSON.parse(invoke(["inspect", ...ids]).stdout) : [];
  const services = [infra.postgresContainer, infra.redisContainer];
  for (const c of containers) {
    if (c.Config.Labels?.["mmo.experiment.id"] !== manifest.experimentId || !c.Name.startsWith(`/${infra.prefix}-`)) throw new Error("foreign container");
    if ((c.State.Running || c.State.Paused || c.State.Restarting) && !services.includes(c.Name.slice(1))) throw new Error("live worker prevents release");
  }
  for (const id of Object.keys(network?.Containers ?? {})) {
    if (!containers.some(c => c.Id === id)) throw new Error("foreign network endpoint prevents release");
  }
  if (!network && !containers.some(c => c.State.Running)) return { status: "already-released" };
  const receipt = { experimentId: manifest.experimentId, at: new Date().toISOString(), status: "releasing",
    network, containers: containers.map(c => ({ id: c.Id, name: c.Name, mounts: c.Mounts, networks: c.NetworkSettings.Networks })) };
  const path = join(directory, "network-release.json");
  save(path, receipt); // Preserve IDs, volume bindings and aliases before mutation.
  for (const c of containers) {
    if (c.State.Running) invoke(["stop", "--time", "15", c.Id]);
    if (network && c.NetworkSettings.Networks[infra.network]) invoke(["network", "disconnect", network.Id, c.Id]);
  }
  if (network) {
    const fresh = JSON.parse(invoke(["network", "inspect", network.Id]).stdout)[0];
    if (Object.keys(fresh.Containers ?? {}).length) throw new Error("network still has endpoints; retained");
    invoke(["network", "rm", network.Id]);
  }
  receipt.status = "released";
  save(path, receipt);
  return { status: "released", network: infra.network, containersRetained: containers.length };
}
