/**
 * ABILITY KEYSTONE FX — each keystone verb's ONE bespoke animation (design §22.7,
 * ability pass W2-D), keyed by the verb id the server puts on its `card-fx`.
 *
 * The premium grammar (docs/combat-animation-current-state.md): a readable wind-up
 * clock, a visible payoff, body motion through `bodyPose`, weight through
 * `impactFeel` on your own screen only, and a lasting mark where the rule leaves
 * one. Guards use the face grammar (avoid = blur, sustain = pulse or shell,
 * endure = chips) at full size. A keystone never adds a floating word: the word is
 * the weapon verb's teaching channel (design §26.4), and a keystone's `card-fx`
 * carries no `cardId`.
 *
 * A verb with no animation here yet is a keyed STUB (`KEYSTONE_STUBS`): the caller
 * draws its lane fx, at keystone scale, exactly as before this pass; a WIND-UP
 * beat (`windupMs`) of a stub draws nothing, so its payoff is not drawn twice.
 *
 * Every animation draws from the event's `pos` — the verb's DELIVERY BODY (design
 * §22.10: the summon that landed it on a Conduit, the owner elsewhere).
 */
import type { CombatEvent } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';

type CardFxEvent = Extract<CombatEvent, { kind: 'card-fx' }>;
type KeystoneAnimation = (scene: GameScene, ev: CardFxEvent) => void;

/** The bespoke animations, by verb id. Kept in step with `KEYSTONE_ANIMATED`. */
const KEYSTONE_ANIMATIONS: Record<string, KeystoneAnimation> = {};

/**
 * Draw a keystone verb's `card-fx`. Returns true when the verb's own animation
 * drew it (or deliberately drew nothing, for a stub's wind-up beat); false when
 * the caller should draw the lane fx — the stub.
 */
export function drawAbilityKeystoneFx(scene: GameScene, ev: CardFxEvent): boolean {
  if (!ev.keystone) return false;
  const animation = KEYSTONE_ANIMATIONS[ev.keystone];
  if (animation) {
    animation(scene, ev);
    return true;
  }
  // A stub has no wind-up to draw: its payoff's own card-fx draws the lane fx.
  return ev.windupMs !== undefined;
}

/** The verb ids with an animation registered here (the test holds it to the model). */
export function animatedKeystoneIds(): string[] {
  return Object.keys(KEYSTONE_ANIMATIONS);
}
