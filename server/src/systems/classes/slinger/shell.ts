/**
 * Siege's shell (bible §10.5): every round banks into a siege gun on the Slinger's back, and the
 * reload fires it where the target stood, an area blast made of what was fired (a Venom clip is a
 * gas shell, Scatter a cluster shell, Breaching a bunker-buster). The bank lives on the Slinger,
 * never on the target (stack-then-detonate is the Apprentice's, §3). Server-only scratch in
 * `TracksCombat`; nothing here is networked or persisted.
 */
import { applyStatusEffect, getResource, getStatusEffect, SLINGER_KIT, setResource } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { SLINGER_VENOM_ID } from '../../combat/damage/bleedIds';
import { applyPlayerAoeTo, playerAoeTargets } from '../../combat/damage/aoeDamage';
import { applyKnockback } from '../../combat/damage/knockback';
import { applyMonsterSlow } from '../../combat/status/monsterControl';
import { applyFramePlatingShred } from '../shared/frameLoop';
import { applyTickDot } from '../shared/tickDot';
import { slingerTally } from './telemetry';
import { entrenchFraction } from './t3';
import {
  DEATHMARK,
  DEATHMARK_MS,
  DEATHMARK_SHELL_SHARE,
  ENTRENCHED,
  ENTRENCH_MAX_SHELL,
  SHELL_BUSTER_FRACTION,
  SHELL_BUSTER_MS,
  SHELL_CLUSTER_MULT,
  SHELL_GAS_TICKS,
  SHELL_RADIUS,
  SHELL_SHOVE_PX,
  SHELL_SNARE_MS,
  SHELL_SNARE_SLOW,
} from './tuning';

const BANK = 'slinger.shell.bank';
const BANK_X = 'slinger.shell.x';
const BANK_Y = 'slinger.shell.y';
const PENDING = 'slinger.shell.pending';
const clipKey = (clipId: string) => `slinger.shell.clip.${clipId}`;
const CLIP_IDS = SLINGER_KIT.pieces.map((piece) => piece.id);

export const DEATHMARK_EFFECT_ID = 'slinger-deathmark';

/** Deathmark: a round marks the enemy it hit. One mark each; a second round only renews it. */
export function markDeathmark(player: PlayerEntity, target: MonsterEntity): void {
  applyStatusEffect(target.tracksCombat, {
    id: DEATHMARK_EFFECT_ID, maxStacks: 1, remainingMs: DEATHMARK_MS, refreshable: true, sourceId: player.isPlayer.id,
    data: { totalMs: DEATHMARK_MS },
  });
}

/** The live enemies this Slinger has marked. */
function markedBy(world: World, player: PlayerEntity): MonsterEntity[] {
  return [...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter((monster) => {
    const mark = getStatusEffect(monster.tracksCombat, DEATHMARK_EFFECT_ID);
    return !!mark && mark.sourceId === player.isPlayer.id && monster.hasHealth.hp > 0;
  });
}

/** What the shell holds now (damage), for the HUD's charge glow and for tests. */
export function shellBank(player: PlayerEntity): number {
  return getResource(player.tracksCombat, BANK);
}

/** Every round banks the damage it dealt, tagged by the clip that fired it, and remembers where the target stood. */
export function bankShell(player: PlayerEntity, target: MonsterEntity, clipId: string, amount: number): void {
  const cs = player.tracksCombat;
  setResource(cs, BANK, getResource(cs, BANK) + amount);
  setResource(cs, clipKey(clipId), getResource(cs, clipKey(clipId)) + amount);
  setResource(cs, BANK_X, target.hasPosition.current.x);
  setResource(cs, BANK_Y, target.hasPosition.current.y);
}

/** A reload started: the shell fires once the round that started it has banked. */
export function markShellPending(player: PlayerEntity): void {
  setResource(player.tracksCombat, PENDING, 1);
}

export function shellPending(player: PlayerEntity): boolean {
  return getResource(player.tracksCombat, PENDING) > 0;
}

/**
 * Fire the shell at the banked position. Returns the victims struck (empty when nothing was banked).
 * `asClip`: Fresh Powder makes the shell take that clip's property instead of the clip that fed it most.
 */
export function fireShell(world: World, player: PlayerEntity, asClip?: string): MonsterEntity[] {
  const cs = player.tracksCombat;
  setResource(cs, PENDING, 0);
  const spec = player.usesSkills.specializationId;
  // Entrenched: the longer you stood your ground, the bigger the shell.
  const bank = getResource(cs, BANK) * (spec === ENTRENCHED ? 1 + entrenchFraction(player) * ENTRENCH_MAX_SHELL : 1);
  if (bank < 1) return [];

  // The shell is made of the clip that fed it most.
  let dominant = '';
  let most = 0;
  for (const id of CLIP_IDS) {
    const banked = getResource(cs, clipKey(id));
    if (banked > most) { most = banked; dominant = id; }
    if (banked !== 0) setResource(cs, clipKey(id), 0);
  }
  const center = { x: getResource(cs, BANK_X), y: getResource(cs, BANK_Y) };
  setResource(cs, BANK, 0);

  if (asClip) dominant = asClip;
  const cluster = dominant === 'slinger-scatter' || dominant === 'slinger-buckshot';
  // Deathmark: the shell bursts on every marked enemy at once (the marks say where it lands); no marks left, it falls where the last round did.
  const marked = spec === DEATHMARK ? markedBy(world, player) : [];
  const victims = marked.length > 0 ? marked : playerAoeTargets(world, player, center, SHELL_RADIUS * (cluster ? SHELL_CLUSTER_MULT : 1));
  if (spec === DEATHMARK) for (const monster of marked) monster.tracksCombat.statusEffects = monster.tracksCombat.statusEffects.filter((effect) => effect.id !== DEATHMARK_EFFECT_ID);
  if (victims.length === 0) return [];
  const tally = slingerTally(player);
  if (tally) tally.shells += 1;
  if (dominant === 'slinger-breaching') {
    for (const victim of victims) applyFramePlatingShred(player, victim, SHELL_BUSTER_FRACTION, SHELL_BUSTER_MS);
  }
  applyPlayerAoeTo(world, player, victims, marked.length > 0 ? bank * DEATHMARK_SHELL_SHARE : bank, 'player', {}, {});
  for (const victim of victims) {
    if (victim.hasHealth.hp <= 0) continue;
    if (dominant === 'slinger-venom') applyTickDot(world, player, victim, SLINGER_VENOM_ID, Math.max(1, bank * 0.05), SHELL_GAS_TICKS, SHELL_GAS_TICKS * 2, 1000);
    else if (dominant === 'slinger-snare') applyMonsterSlow(world, victim, SHELL_SNARE_SLOW, SHELL_SNARE_MS, player.isPlayer.id);
    else if (dominant === 'slinger-stopping') applyKnockback(world, victim.isMonster.id, center, SHELL_SHOVE_PX);
  }
  return victims;
}
