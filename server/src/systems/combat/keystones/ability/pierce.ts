/**
 * SNIPE — **Pierce**. "The shot passes through its target and hits everything in
 * line behind it." (design §22.4; delivery: the delivering body)
 *
 * THE SEAM. Snipe's own resolution, and `applyPlayerAoe`'s resolution half
 * (`applyPlayerAoeTo`) on the bodies the line crosses: when the shot resolves,
 * the line runs from the delivery body — the owner, or on a Conduit the physical
 * summon that cast it — THROUGH the target and on behind it, and every body whose
 * hitbox it crosses beyond the target, inside Snipe's own reach of that body,
 * takes the keystone's share of the shot (off the magnitude table at
 * `ROW_SCALAR.keystone`). Plating, DR, the reservoir feed, kills, rewards and the
 * world log are the area seam's, untouched.
 *
 * "TO THE ABILITY'S REACH" is Snipe's reach from the delivery body (`reach.ts`,
 * edge to edge like every reach): the shot carries as far as it could have been
 * aimed, and no further.
 *
 * THE NUMBER. The share of Snipe's own payload — the player's Attack times the
 * rank's `damageMult`, after Technique Power, exactly what `resolveCastPayload`
 * dealt the target. A cast carries no empowered multiplier, so one multiplier per
 * hit holds by construction.
 *
 * THE RULES IT KEEPS.
 *  - Behind only: the line starts at the target, so a body between the shooter
 *    and the target is not hit (the shot already passed it).
 *  - Each body once, by construction: one list, resolved once.
 *  - The shot passes through whether or not it killed the target.
 *  - Not an attack: an area payload, so no attack-equivalent and no weapon-verb
 *    hit counter.
 *  - One `card-fx` per shot that pierced something, drawn from the delivery body
 *    to the farthest body it reached; none when nothing stood behind.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  posHitboxFromEntity,
  resolveAbilityEffect,
  type Vec2,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../../ecs/entity';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { techniquePowerPctFor } from '../../../player/abilities/abilityKata';
import { applyPlayerAoeTo } from '../../damage/aoeDamage';
import {
  abilityKeystoneShareOf, defineAbilityKeystone, deliveringBody, pushAbilityKeystoneFx,
} from './registry';
import { bodiesInAbilityReach } from './reach';

const ID = 'pierce';

/** Liang–Barsky: does the segment `a`→`b` touch the axis-aligned box? */
function segmentTouchesBox(a: Vec2, b: Vec2, minX: number, minY: number, maxX: number, maxY: number): boolean {
  let enter = 0;
  let leave = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const edges: Array<[number, number]> = [
    [-dx, a.x - minX], [dx, maxX - a.x], [-dy, a.y - minY], [dy, maxY - a.y],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false; // parallel to this slab and outside it
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > leave) return false;
      if (t > enter) enter = t;
    } else {
      if (t < enter) return false;
      if (t < leave) leave = t;
    }
  }
  return enter <= leave;
}

/**
 * Whether the line from `from` through `through`, continued past it, crosses
 * `body` BEHIND `through`: the segment from `through` to a point beyond the far
 * side of the body touches one of its hitbox rects.
 */
function inLineBehind(from: Vec2, through: Vec2, body: MonsterEntity): boolean {
  const dx = through.x - from.x;
  const dy = through.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return false;
  const { pos, rects } = posHitboxFromEntity(body);
  // Far enough along the ray to clear the body's whole box, wherever it stands.
  let extent = 0;
  for (const rect of rects) {
    extent = Math.max(extent, Math.hypot(Math.abs(rect.offsetX) + rect.halfW, Math.abs(rect.offsetY) + rect.halfH));
  }
  const reachAlong = Math.max(length, Math.hypot(pos.x - from.x, pos.y - from.y)) + extent;
  const end = { x: from.x + (dx / length) * reachAlong, y: from.y + (dy / length) * reachAlong };
  return rects.some((rect) => {
    const cx = pos.x + rect.offsetX;
    const cy = pos.y + rect.offsetY;
    return segmentTouchesBox(through, end, cx - rect.halfW, cy - rect.halfH, cx + rect.halfW, cy + rect.halfH);
  });
}

export const PIERCE_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Snipe\'s resolution runs applyPlayerAoeTo on every body the line from the delivering body through the target crosses behind it, inside Snipe\'s reach, each once',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    // A cast has no exchange to dodge; should Snipe ever ride one, a dodged shot
    // passes through nothing.
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const target = site.target ?? (site.ctx?.defenderType === 'monster' ? site.ctx.defender : undefined);
    if (!target) return;
    const share = abilityKeystoneShareOf(player, ID);
    if (share <= 0) return;
    const effect = resolveAbilityEffect(ability, {
      playerTier: player.tracksProgression.playerTier,
      techniquePowerPct: techniquePowerPctFor(player),
    });
    if (effect.kind !== 'cast-strike') return;

    const body = deliveringBody(world, player, definition.delivery, site);
    const from = { ...body.hasPosition.current };
    const through = { ...target.hasPosition.current };
    const line = bodiesInAbilityReach(world, player, body, ability, new Set([target.isMonster.id]))
      .filter((monster) => inLineBehind(from, through, monster));
    if (line.length === 0) return; // nothing behind: nothing to draw

    // Ordered along the shot, so the drawn line ends at the last body it reached.
    const along = (monster: MonsterEntity): number =>
      (monster.hasPosition.current.x - from.x) * (through.x - from.x)
      + (monster.hasPosition.current.y - from.y) * (through.y - from.y);
    line.sort((a, b) => along(a) - along(b));
    const farthest = { ...line[line.length - 1]!.hasPosition.current };

    const payload = Math.max(1, Math.round(player.dealsDamage.attack * effect.damageMult));
    pushAbilityKeystoneFx(world, player, definition, { pos: from, at: farthest });
    applyPlayerAoeTo(
      world, player, line, Math.max(1, Math.round(payload * share)), 'player', {},
      // The shot's own damage, so it converts like the payload it extends.
      { feedsWeaponReservoir: true },
    );
  },
});
