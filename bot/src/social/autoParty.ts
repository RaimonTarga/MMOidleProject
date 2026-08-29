import type { Intents } from "../net/intents";
import type { Observation } from "../state/observation";

/**
 * Every bot character is named this way (`config.ts` / `batch.ts`), so it is
 * the cheapest way to tell "another bot sharing my node" from a stray human
 * player who happens to wander through the same dev world. Heuristic, not a
 * protocol guarantee -- fine for a dev harness on a solo dev server.
 */
const BOT_NAME_PREFIX = "Bot ";

/**
 * Auto-party for shared-world batches: bots that land on the same node group
 * up, and un-group the moment none of their party is around anymore.
 *
 * This exists because `pnpm bot:batch` runs multiple bots in the same live
 * world, and same-node monsters are a shared, exhaustible resource -- two
 * bots farming the same node compete for kills. Grouping turns that
 * competition into `grantMonsterRewards`' existing same-node party-sharing
 * (server/src/systems/player/progression/rewards.ts), so a kill by one party
 * member benefits everyone else standing in that node too.
 *
 * The rule is stateless and self-healing by design -- call it every tick, no
 * memory required: every bot that can see the same roster of same-node bots
 * computes the SAME target (the lexicographically smallest connection id
 * among itself and its co-located bots) and either does nothing (it IS that
 * anchor -- others come to it) or joins that anchor's party. A late arrival,
 * a leader that leaves, or a smaller id showing up all resolve themselves on
 * the very next tick without any bot needing to know the others' intentions.
 *
 * Leaving is just as simple: once no other bot is visible in the current
 * node (i.e. this bot moved on, or the others did), it leaves whatever party
 * it was in. There is no explicit "done farming" signal to wire up -- the
 * node-scoped visibility IS the signal.
 */
export function runAutoParty(obs: Observation, intents: Intents): void {
  const self = obs.self;
  if (!self) return;

  const otherBotsHere = obs.otherPlayers().filter((p) => p.name.startsWith(BOT_NAME_PREFIX));

  if (otherBotsHere.length === 0) {
    if (self.partyLeaderId) intents.partyLeave();
    return;
  }

  const anchorId = [self.id, ...otherBotsHere.map((p) => p.id)].sort()[0];
  if (anchorId === self.id) return; // We are the anchor; the others join us.
  if (self.partyLeaderId === anchorId) return; // Already grouped correctly.

  // `party:join` resolves to the target's own leader server-side, and quietly
  // re-syncs us out of any previous party first -- no explicit leave needed
  // when the correct anchor changes underneath us.
  intents.partyJoin(anchorId);
}
