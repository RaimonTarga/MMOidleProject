/**
 * BARRIER TEMPO — **Unbroken**. "Barrier recharge is not interrupted by hits
 * while HP is above 50%." (design §4)
 *
 * THE SEAM. `stampBarrierDamage`, the one function both damage paths call to
 * restart the recharge delay — the direct-hit listener in `barrier.ts` and the
 * DoT tick in `dotPrototype`. Refusing the stamp there covers both, which is the
 * whole reason that function exists as a single entry point: the comment on it
 * warns that missing either call site would let a burning player recharge through
 * the burn, and the same reasoning says a rule about that stamp belongs in it
 * rather than in two listeners that would drift apart.
 *
 * WHAT IS NOT CHANGED. The barrier still ABSORBS the hit, and still empties and
 * raises its break riders when it runs out. Unbroken touches only the delay — the
 * pool refills while the player is being hit instead of only between packs, which
 * is exactly the barrier-tempo lane's fantasy, and it is why the rule is worth a
 * keystone rather than a percentage.
 *
 * THE HALF-HEALTH CLAUSE is the bound, and it is the interesting half: below it
 * the rule switches off, so the card is strongest while the player is winning and
 * does nothing in the fight they are losing. `unbrokenHpFraction` is authored, so
 * where "above half" sits is the designer's.
 *
 * No `card-fx`. The recharge is continuous and so is the refusal; an effect per
 * refused stamp would fire on every hit and every DoT tick, which is precisely
 * the per-tick drawing design §8 forbids. What the player sees is the barrier bar
 * climbing while they are being hit, which is the clearest tell this rule could
 * have.
 */
import { lineageUnit, type PacketId } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { defineKeystone, keystoneActive } from './registry';

const LANE: PacketId = 'barrier-tempo';

export const UNBROKEN_KEYSTONE = defineKeystone({
  id: 'unbroken',
  lane: LANE,
  seam: 'a refusal inside stampBarrierDamage, the single entry point both damage paths call',
  // No listener: the rule changes what an existing call does, not when it happens.
});

/**
 * True when a hit must NOT restart this player's barrier recharge delay.
 *
 * Asked by `stampBarrierDamage`. The health test uses the pool as it stands after
 * the hit has been applied where the caller runs after mitigation, and before it
 * where the caller runs first; either reading is within one hit of the other and
 * the threshold is a band, not a cliff the player can feel a tick of.
 */
export function unbrokenHoldsRecharge(player: PlayerEntity): boolean {
  if (!keystoneActive(player, LANE)) return false;
  const health = player.hasHealth;
  if (health.maxHp <= 0) return false;
  return health.hp / health.maxHp > lineageUnit('unbrokenHpFraction');
}
