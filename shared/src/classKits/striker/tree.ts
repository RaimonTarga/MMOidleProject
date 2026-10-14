/**
 * The Striker's Passive Tree content: the disciplines (§12.5), specializations (§12.6) and
 * T4 leaves (§12.7).
 *
 * The disciplines bring the class's resource (the shine, the edge, Momentum), not pieces. A
 * specialization bends that resource and may change where, when or how often the finisher
 * lands, never what it does (§12.6). The T4 leaves answer "what kills you?": the spike, the
 * swarm or the slow bleed, one each per discipline (§12.7).
 */
import type { DisciplineDef, LeafDef, SpecializationDef } from '../types';

function discipline(entry: Omit<DisciplineDef, 'classId' | 'params'>): DisciplineDef {
  return { classId: 'cadence', params: {}, ...entry };
}

function specialization(entry: Omit<SpecializationDef, 'classId' | 'params'>): SpecializationDef {
  return { classId: 'cadence', params: {}, ...entry };
}

function leaf(entry: Omit<LeafDef, 'classId' | 'params' | 'tier'>): LeafDef {
  return { classId: 'cadence', params: {}, tier: 4, ...entry };
}

export const STRIKER_DISCIPLINES: readonly DisciplineDef[] = [
  discipline({
    id: 'striker-light',
    name: 'Light',
    fantasy: 'A storm of blades; the finisher is a flourish that lights the next combo.',
    text: "Your finisher lights up the next combo: its beats hit harder and carry a spark finisher's twist.",
  }),
  discipline({
    id: 'striker-balanced',
    name: 'Balanced',
    fantasy: 'The technique fighter; the blade sharpens through the combo.',
    text: 'Your edge sharpens with every beat, so damage techniques and the finisher hit harder the later they come. The edge resets at the finisher.',
  }),
  discipline({
    id: 'striker-heavy',
    name: 'Heavy',
    fantasy: 'Every swing a wind-up for one blow.',
    text: 'Your soft beats build Momentum and setups multiply it; the finisher spends it all in your biggest blow.',
  }),
];

export const STRIKER_SPECIALIZATIONS: readonly SpecializationDef[] = [
  // ── Light (the shine) ──
  specialization({
    id: 'striker-thousand-cuts',
    disciplineId: 'striker-light',
    name: 'Thousand Cuts',
    text: 'Your lit beats set off their hit effects twice.',
  }),
  specialization({
    id: 'striker-afterimage',
    disciplineId: 'striker-light',
    name: 'Afterimage',
    text: 'Your beats hold back part of their damage; the finisher replays every slash with its share, then lands its twist. The replays set off no hit effects.',
  }),
  specialization({
    id: 'striker-afterglow',
    disciplineId: 'striker-light',
    name: 'Afterglow',
    text: 'The shine also lights your finisher and lasts one combo more.',
  }),
  // ── Balanced (the edge) ──
  specialization({
    id: 'striker-iaido',
    disciplineId: 'striker-balanced',
    name: 'Iaido',
    text: 'Every cast sharpens your edge further, and damage techniques that are casts cut with a far sharper edge.',
  }),
  specialization({
    id: 'striker-tempered',
    disciplineId: 'striker-balanced',
    name: 'Tempered',
    text: 'At the finisher your edge only falls partway instead of resetting; a stun or a break still resets it.',
  }),
  specialization({
    id: 'striker-cascade',
    disciplineId: 'striker-balanced',
    name: 'Cascade',
    text: 'Each damage technique sharpens your edge an extra step.',
  }),
  // ── Heavy (Momentum) ──
  specialization({
    id: 'striker-subjugator',
    disciplineId: 'striker-heavy',
    name: 'Subjugator',
    text: 'Control techniques build Momentum much faster, and the finisher hits a slowed, stunned, rooted or knocked-down enemy much harder.',
  }),
  specialization({
    id: 'striker-frenzy',
    disciplineId: 'striker-heavy',
    name: 'Frenzy',
    text: 'As the fight goes on, a second, lighter finisher joins your combo; your techniques stay where you put them.',
  }),
  specialization({
    id: 'striker-crescendo',
    disciplineId: 'striker-heavy',
    name: 'Crescendo',
    text: 'Momentum has no cap and carries from combo to combo. The finisher waits for the moment you choose: the target staggered, a shell up, or its HP low.',
  }),
];

/** T4 asks "what kills you?" (§12.7): columns `spike`, `swarm`, `slow-bleed`. */
export const STRIKER_LEAVES: readonly LeafDef[] = [
  // ── Light: not being there ──
  leaf({
    id: 'striker-ghoststep',
    disciplineId: 'striker-light',
    column: 'spike',
    name: 'Ghoststep',
    text: 'Every few seconds, a hit that would take a big share of your HP misses you.',
  }),
  leaf({
    id: 'striker-slip-through',
    disciplineId: 'striker-light',
    column: 'swarm',
    name: 'Slip Through',
    text: 'The more enemies around you, the more of their hits miss you.',
  }),
  leaf({
    id: 'striker-shake-it-off',
    disciplineId: 'striker-light',
    column: 'slow-bleed',
    name: 'Shake It Off',
    text: 'Debuffs on you wear off much faster.',
  }),
  // ── Balanced: composure ──
  leaf({
    id: 'striker-read-the-blow',
    disciplineId: 'striker-balanced',
    column: 'spike',
    name: 'Read the Blow',
    text: 'Telegraphed attacks aimed at you deal much less damage.',
  }),
  leaf({
    id: 'striker-centered',
    disciplineId: 'striker-balanced',
    column: 'swarm',
    name: 'Centered',
    text: 'While several enemies attack you, you take less damage.',
  }),
  leaf({
    id: 'striker-poise',
    disciplineId: 'striker-balanced',
    column: 'slow-bleed',
    name: 'Poise',
    text: 'When your HP runs low, your Recovery is much stronger.',
  }),
  // ── Heavy: endurance ──
  leaf({
    id: 'striker-unbreakable',
    disciplineId: 'striker-heavy',
    column: 'spike',
    name: 'Unbreakable',
    text: 'Once per fight, a hit that would kill you leaves you on your last sliver of HP, and nothing can hurt you for a moment.',
  }),
  leaf({
    id: 'striker-immovable',
    disciplineId: 'striker-heavy',
    column: 'swarm',
    name: 'Immovable',
    text: "Ordinary enemies can't knock you back, slow you or stun you.",
  }),
  leaf({
    id: 'striker-thick-blood',
    disciplineId: 'striker-heavy',
    column: 'slow-bleed',
    name: 'Thick Blood',
    text: 'Damage over time hurts you much less.',
  }),
];
