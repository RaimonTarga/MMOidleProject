/**
 * Moments: the one vocabulary of fight triggers every class system reads (build plan §3.7).
 *
 * The Squire's responses answer them, the Apprentice drops payoffs on them, the Spirit's
 * spends wait for them, the Slinger's clip rules and the Striker's free rules test them, and
 * the universal standing orders use the same ids. This file is only the vocabulary; the
 * server's moments registry implements each one, tier by tier (`firstTier` says when the
 * content first needs it). A class that needs a new trigger adds it here first, so two
 * classes never name the same thing twice.
 *
 * Class-internal states (a full Resolve bar, the storm at its floor, reloading) are not
 * moments: they belong to the class runtime.
 */

export interface MomentInfo {
  /** Whose state or action it reads. */
  subject: 'me' | 'target' | 'enemy' | 'ally' | 'fight';
  /** The first product tier whose content uses it. */
  firstTier: number;
  /** Player-facing wording, used by the class screens. */
  text: string;
  /** The one tunable a rule may set, with its default. */
  param?: { name: string; default: number };
}

export const MOMENTS = {
  // ── An enemy acts against you ──────────────────────────────────────────────
  'enemy-winds-up': { subject: 'enemy', firstTier: 1, text: 'an enemy you fight starts a wind-up' },
  'enemy-casts': { subject: 'enemy', firstTier: 1, text: 'an enemy you fight starts a cast' },
  'telegraph-at-me': { subject: 'enemy', firstTier: 1, text: 'a telegraphed blow is aimed at you' },
  'inside-telegraph': { subject: 'me', firstTier: 1, text: 'you stand in a ground telegraph' },
  'repeat-hits': {
    subject: 'enemy', firstTier: 1, text: 'one enemy lands several hits on you',
    param: { name: 'hits', default: 3 },
  },
  'big-hit': {
    subject: 'me', firstTier: 1, text: 'a hit takes a big share of your HP',
    param: { name: 'hpShare', default: 0.25 },
  },
  'dot-landed': { subject: 'me', firstTier: 1, text: 'a poison or bleed lands on you' },
  'enemy-joins': { subject: 'fight', firstTier: 1, text: 'an enemy joins the fight against you' },
  'charging-at-me': { subject: 'enemy', firstTier: 2, text: 'an enemy charges or leaps at you' },
  'control-on-me': { subject: 'me', firstTier: 2, text: 'a stun, root or knockdown lands on you' },
  'debuff-landed': { subject: 'me', firstTier: 2, text: 'a mark, slow, curse or corrosion lands on you' },
  'burrow-at-me': { subject: 'enemy', firstTier: 2, text: 'an enemy burrows or dashes unseen toward you' },
  'ambush': { subject: 'enemy', firstTier: 2, text: 'an ambusher strikes from cover or appears beside you' },
  'ranged-attacker': { subject: 'enemy', firstTier: 2, text: 'an enemy hits you from range or kites you' },
  'drag-or-push': { subject: 'me', firstTier: 3, text: 'something drags or pushes you' },
  'fire-attack': { subject: 'enemy', firstTier: 3, text: 'a fire attack or burning shot comes at you' },
  'chill-threshold': { subject: 'me', firstTier: 3, text: 'the Chill on you reaches its threshold' },

  // ── Your own state ─────────────────────────────────────────────────────────
  'hp-low': {
    subject: 'me', firstTier: 1, text: 'your HP is low',
    param: { name: 'hpShare', default: 0.25 },
  },
  'enemies-near': {
    subject: 'me', firstTier: 1, text: 'several enemies are near you',
    param: { name: 'count', default: 3 },
  },
  'touched': { subject: 'me', firstTier: 1, text: 'an enemy is in melee with you' },
  'carrying-dot': { subject: 'me', firstTier: 1, text: 'you carry a poison or bleed' },
  'dodged': { subject: 'me', firstTier: 1, text: 'you dodge a hit' },
  'moving': { subject: 'me', firstTier: 1, text: 'you are moving' },
  'out-of-combat': { subject: 'me', firstTier: 1, text: 'no enemy is fighting you' },

  // ── Your target ────────────────────────────────────────────────────────────
  'target-full': { subject: 'target', firstTier: 1, text: 'the target carries a full bar of your marks' },
  'target-low': {
    subject: 'target', firstTier: 1, text: 'the target is low on HP',
    param: { name: 'hpShare', default: 0.33 },
  },
  'target-elite': { subject: 'target', firstTier: 1, text: 'the target is an elite or a boss' },
  'target-plated': { subject: 'target', firstTier: 1, text: 'the target has plating' },
  'target-closing-fast': { subject: 'target', firstTier: 1, text: 'a fast enemy is closing on you' },
  'target-dies': { subject: 'target', firstTier: 1, text: 'the target dies' },
  'target-shielded': { subject: 'target', firstTier: 2, text: 'the target raises a shield, barrier or shell' },
  'target-frozen': { subject: 'target', firstTier: 2, text: 'the target is frozen or brittle' },
  'target-flees': { subject: 'target', firstTier: 2, text: 'the target flees or kites away' },
  'target-out-of-reach': { subject: 'target', firstTier: 2, text: 'the target burrows, dives or vanishes out of reach' },
  'target-resurfaces': { subject: 'target', firstTier: 2, text: 'the target comes back within reach' },
  'target-staggered': { subject: 'target', firstTier: 3, text: 'the target is staggered, stunned or knocked down' },

  // ── Allies and the fight ───────────────────────────────────────────────────
  'ally-threatened': { subject: 'ally', firstTier: 2, text: 'an ally stands under a telegraph or is low on HP' },
  'risen': { subject: 'fight', firstTier: 4, text: 'a fallen enemy rises near you' },
} as const satisfies Record<string, MomentInfo>;

export type MomentId = keyof typeof MOMENTS;

export function isMomentId(id: string): id is MomentId {
  return Object.prototype.hasOwnProperty.call(MOMENTS, id);
}
