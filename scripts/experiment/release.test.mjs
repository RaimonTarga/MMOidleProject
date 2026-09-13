import assert from "node:assert/strict";
import { releaseInfrastructure } from "./release.mjs";
const prefix = "mmoexp-0123456789ab";
const manifest = { experimentId: "test", infrastructure: { prefix, network: `${prefix}-network`, postgresContainer: `${prefix}-postgres`, redisContainer: `${prefix}-redis` } };
const terminal = { supervisor: { status: "completed" }, runs: [{ status: "completed" }, { status: "failed" }] };
function fixture({ foreign = false, worker = false, empty = false } = {}) {
  const calls = [], receipts = [];
  const c = { Id: "container-id", Name: `/${prefix}-${worker ? "w01" : "postgres"}`, State: { Running: true }, Config: { Labels: { "mmo.experiment.id": "test" } }, Mounts: [{ Name: "retained-db" }], NetworkSettings: { Networks: { [manifest.infrastructure.network]: { Aliases: ["postgres"] } } } };
  let detached = false;
  const invoke = args => {
    calls.push(args);
    let result = "";
    if (args[0] === "network" && args[1] === "ls") result = empty ? "" : JSON.stringify({ Name: manifest.infrastructure.network, ID: "network-id" });
    else if (args[0] === "ps") result = empty ? "" : c.Id;
    else if (args[0] === "inspect") result = JSON.stringify([c]);
    else if (args[0] === "network" && args[1] === "inspect") result = JSON.stringify([{ Id: "network-id", Containers: detached ? {} : { [foreign ? "foreign" : c.Id]: {} } }]);
    else if (args[1] === "disconnect") detached = true;
    return { stdout: result };
  };
  return { calls, receipts, invoke, save: (_path, receipt) => receipts.push(structuredClone(receipt)) };
}
for (const options of [{ foreign: true }, { worker: true }]) {
  const f = fixture(options);
  assert.throws(() => releaseInfrastructure(manifest, terminal, ".", f.invoke, f.save));
  assert.equal(f.receipts.length, 0);
  assert(!f.calls.some(c => ["stop", "rm"].includes(c[0]) || ["disconnect", "rm"].includes(c[1])));
}
assert.throws(() => releaseInfrastructure(manifest, { ...terminal, runs: [{ status: "running" }] }, ".", () => { throw new Error("must not call Docker"); }), /terminal/);
const good = fixture();
assert.equal(releaseInfrastructure(manifest, terminal, ".", good.invoke, good.save).status, "released");
assert.equal(good.receipts[0].status, "releasing");
assert.equal(good.receipts[1].status, "released");
assert(good.calls.some(c => c[0] === "network" && c[1] === "rm" && c[2] === "network-id"));
assert(!good.calls.some(c => c[0] === "rm" || c[0] === "volume"));
const empty = fixture({ empty: true });
assert.equal(releaseInfrastructure(manifest, terminal, ".", empty.invoke, empty.save).status, "already-released");
console.log("release: ok (terminal gating, ownership, live worker refusal, retained volumes, idempotence)");
