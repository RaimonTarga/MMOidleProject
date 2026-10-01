/**
 * T3 class path -> packet tags (progression rework run 3, W1-B).
 *
 * Design §4: "The T3 class paths are tagged with a packet so the item
 * keystone and the class path name the same lane." This is a PROVISIONAL,
 * best-effort tag chosen from each path's own description — the paths
 * themselves are reviewed (and this tag re-cut) after the class rework,
 * which is explicitly out of this task's scope.
 *
 * What this file checks:
 *   1. Every tier-3 node in the skill tree carries a `packet` tag, and it is
 *      a known `PacketId` — the brief's "tag every T3 class path" is a
 *      completeness requirement on the NODES, enforced with `assert`.
 *   2. Node count sanity: 54 tier-3 paths (6 class roots x 3 sub-variants x 3
 *      options), matching the brief's "54 nodes incl. Conduit".
 *   3. Lane coverage is REPORTED, not enforced: for every packet a WEAPON can
 *      carry (design §3 — the six offensive packets; the keystone handoff
 *      this tag exists for is always with a WEAPON's lane), is there at
 *      least one tagged T3 path? Per the brief — "list the misses in the
 *      report rather than forcing tags" — a lane with zero tagged paths is
 *      logged, not thrown: forcing an unnatural tag onto a path just to fill
 *      a lane would be worse data than an honest gap. `bulwark` and
 *      `barrier-tempo` are weapon-ineligible (no weapon keystone ever names
 *      them), so class attack paths are not expected to carry them; they are
 *      reported as the SAME kind of miss here, deliberately, rather than
 *      special-cased, so the report is the one place that distinction has to
 *      be made by a reader, not silently assumed by the test.
 */
import { SKILL_TREE } from './index';
import { PACKET_IDS, WEAPON_PACKET_IDS } from '../lineages/types';
import type { PacketId } from '../lineages/types';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const t3Nodes = [...SKILL_TREE.values()].filter((n) => n.tier === 3);

assert(t3Nodes.length === 54, `expected 54 tier-3 class paths (6 roots x 3 sub-variants x 3 options incl. Conduit), found ${t3Nodes.length}`);

const byPacket = new Map<PacketId, string[]>();
for (const packet of PACKET_IDS) byPacket.set(packet, []);

for (const node of t3Nodes) {
  assert(!!node.packet, `${node.id} ('${node.name}'): tier-3 path has no 'packet' tag (design §4, run 3 W1-B)`);
  assert(
    PACKET_IDS.includes(node.packet as PacketId),
    `${node.id}: packet '${node.packet}' is not a known PacketId`,
  );
  byPacket.get(node.packet as PacketId)!.push(node.id);
}

// Reported, not enforced (see header): a lane with no tagged path is a real
// gap worth knowing about, not a bug to force-fix with an unnatural tag.
const misses = WEAPON_PACKET_IDS.filter((packet) => (byPacket.get(packet)?.length ?? 0) === 0);

console.log('t3PacketTags: per-packet T3 path counts —',
  Object.fromEntries(PACKET_IDS.map((p) => [p, byPacket.get(p)?.length ?? 0])));
if (misses.length > 0) {
  console.log(`t3PacketTags: weapon-eligible lanes with NO tagged T3 path (reported, not forced): ${misses.join(', ')}`);
} else {
  console.log('t3PacketTags: every weapon-eligible lane has at least one tagged T3 path');
}

console.log('t3PacketTags.test.ts: ok');
