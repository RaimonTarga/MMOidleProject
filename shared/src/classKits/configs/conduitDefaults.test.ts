/**
 * The Conduit's auto Formation per discipline (bible §7.13, OV2-CONDUIT): Swarm fills Command with
 * half-cost summons, tank first; Pack fields one of each type; Elite a tank and two damage elites.
 * Structure only (who opens the roster, caps, budgets, Legion's massing), never balance.
 */
import { biomeLevelCap } from '../../config/gameConfig';
import { listBiomeGroupsAtTier } from '../../systems/biomeProgress';
import { classConfigContextFromState, defaultClassConfig, validateClassConfig } from '../config';
import { CONDUIT_KIT } from '../conduit/kit';
import { CONDUIT_ROSTER_BODY_CAP, CONDUIT_SWARM_BODY_CAP, rosterBodyCap, rosterCommand } from './conduit';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const T1 = ['plains:1', 'mountain:1'];
const T2 = ['plains', 'forest', 'swamp', 'cave', 'mountain', 'jungle', 'desert'].map((b) => `${b}:2`);
const T3 = ['mountain', 'cave', 'swamp', 'jungle', 'desert', 'tundra', 'volcanic'].map((b) => `${b}:3`);

/** A Conduit as a route leaves it at a tier's bosses: every biome at the tier's cap, the earlier tiers cleared. */
function context(tier: number, disciplineId: string, specializationId: string | null, budgetBonus: number) {
  const biomeLevel: Record<string, number> = { clearing: biomeLevelCap(tier, 'clearing') };
  for (let t = 1; t <= tier; t++) for (const group of listBiomeGroupsAtTier(t)) biomeLevel[group] = biomeLevelCap(tier, group);
  const bossesCleared = tier === 2 ? T1 : tier === 3 ? [...T1, ...T2] : [...T1, ...T2, ...T3];
  const ctx = classConfigContextFromState({ combatArchetype: 'summoner', biomeLevel, bossesCleared, disciplineId, specializationId, budgetBonus });
  assert(ctx !== null, 'a Conduit context');
  return ctx!;
}

function rosterOf(tier: number, disciplineId: string, specializationId: string | null = null, budgetBonus = 0) {
  const ctx = context(tier, disciplineId, specializationId, budgetBonus);
  const config = defaultClassConfig(ctx);
  assert(config.system.kind === 'formation', 'a Formation');
  const roster = config.system.kind === 'formation' ? config.system.roster : [];
  const check = validateClassConfig(config, ctx);
  assert(check.ok, `${disciplineId} T${tier}: the default passes its own check (${check.ok ? '' : check.reasons.join('; ')})`);
  assert(rosterCommand(roster, disciplineId, specializationId) <= ctx.budget, `${disciplineId} T${tier}: within Command`);
  assert(roster.length <= rosterBodyCap(disciplineId), `${disciplineId} T${tier}: within the body cap`);
  return roster;
}

const pieceOf = (id: string) => CONDUIT_KIT.pieces.find((piece) => piece.id === id)!;

assert(rosterBodyCap('conduit-swarm') === CONDUIT_SWARM_BODY_CAP && CONDUIT_SWARM_BODY_CAP > CONDUIT_ROSTER_BODY_CAP, 'Swarm fields more bodies');
assert(rosterBodyCap('conduit-pack') === CONDUIT_ROSTER_BODY_CAP && rosterBodyCap(null) === CONDUIT_ROSTER_BODY_CAP, 'the others keep the shared cap');

for (const tier of [2, 3, 4]) {
  // Swarm: a tank first, then half-cost bodies; it fields more bodies than Pack does.
  const swarm = rosterOf(tier, 'conduit-swarm', tier >= 3 ? 'conduit-legion' : null);
  assert(pieceOf(swarm[0]!).family === 'tank' && pieceOf(swarm[0]!).command === 1, `Swarm T${tier} opens with a 1-cost tank`);
  const pack = rosterOf(tier, 'conduit-pack', tier >= 3 ? 'conduit-the-hunt' : null);
  assert(swarm.length > pack.length || swarm.length === CONDUIT_SWARM_BODY_CAP, `Swarm T${tier} fields more bodies than Pack`);
  // Pack: its tank, then its heavy, one of each.
  assert(pieceOf(pack[0]!).family === 'tank' && pieceOf(pack[1]!).command > 1, `Pack T${tier} opens with a tank and a heavy`);
  assert(new Set(pack).size === pack.length, `Pack T${tier}: one of each type`);
  // Elite: a tank and two damage elites.
  const elite = rosterOf(tier, 'conduit-elite', tier >= 3 ? 'conduit-ascendant' : null);
  assert(pieceOf(elite[0]!).family === 'tank', `Elite T${tier} opens with a tank`);
  assert(pieceOf(elite[1]!).family === 'damage' && pieceOf(elite[2]!).family === 'damage', `Elite T${tier}: then two damage elites`);
}

// Legion masses one damage summon to its top threshold.
const legion = rosterOf(3, 'conduit-swarm', 'conduit-legion');
const counts = new Map<string, number>();
for (const id of legion) counts.set(id, (counts.get(id) ?? 0) + 1);
const massed = [...counts].find(([id, n]) => n >= 8 && pieceOf(id).family === 'damage');
assert(massed !== undefined, 'Legion masses eight copies of a damage summon');

// Command the cap cannot spend on half-cost bodies buys heavies (the Swarm Staff's +2).
const rich = rosterOf(4, 'conduit-swarm', 'conduit-legion', 2);
assert(rich.length === CONDUIT_SWARM_BODY_CAP, 'a rich Swarm fills the cap');
assert(rich.some((id) => pieceOf(id).command > 1), 'and spends the leftover Command on heavies');
assert(pieceOf(rich[0]!).family === 'tank', 'never trading its tank away');

console.log('conduitDefaults.test.ts: ok');
