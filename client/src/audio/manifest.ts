import { ACCEPTED_SFX, type AcceptedSfxId } from './acceptedCatalog';
export type SfxId = AcceptedSfxId | 'attack-melee' | 'attack-blunt' | 'attack-ranged' | 'attack-magic'
  | 'take-damage' | 'kill' | 'frozen' | 'debuff-apply' | 'debuff-receive' | 'empowered' | 'pack-call'
  | 'tutorial-ready' | 'tutorial-action';
export interface SynthTone {
  freq: number; delay?: number; duration: number; gain?: number; type?: OscillatorType;
}
export interface SfxDef {
  file?: string | string[];
  fallback: SynthTone[];
  gainVariance?: number; pitchVariance?: number;
  gain?: number; cooldownMs?: number; maxVoices?: number; priority?: number;
}
export const AUDIO_SFX_DIR = '/assets/audio/SFX';
export const SFX_MANIFEST = {} as Record<SfxId, SfxDef>;

// Old call sites share accepted masters until they can select a more specific family.
const aliases: Record<string, AcceptedSfxId> = {
  'attack-melee': 'slash', 'attack-blunt': 'blunt', 'attack-ranged': 'bow',
  'attack-magic': 'magic', 'take-damage': 'hurt', kill: 'death-humanoid',
  frozen: 'freeze', 'debuff-apply': 'curse', 'debuff-receive': 'curse',
  empowered: 'striker-empowered', 'pack-call': 'pack', death: 'player-death',
};
const ROUTINE_SFX = ['slash','blunt','shot','spirit','fire','ice','poison','magic','bone','claw','bite','maul','bow','rock-launch','summon-hit'];
export const DEATH_SFX = ['death-magic', 'death-animal', 'death-humanoid', 'death-undead', 'death-stone', 'death-aquatic'] as const;
/**
 * Loaded with the game: routine combat and all death cues. Other cast and status
 * cues are fetched the first time they play, like zone art, so a
 * visitor never downloads effects for content they have not reached.
 */
// `death` aliases player death; `kill` owns the separate enemy-collapse buffer.
export const PRELOADED_SFX: ReadonlySet<string> = new Set([
  ...ROUTINE_SFX, ...DEATH_SFX, 'boss-death', 'hurt', 'death', 'kill', 'dodge', 'striker-empowered', 'squire-empowered', 'spirit-empowered',
]);
for (const [id, stems] of Object.entries(ACCEPTED_SFX)) {
  const routine = ROUTINE_SFX.includes(id);
  const major = ['cataclysm','boss-death','player-death'].includes(id);
  const dispersal = id.startsWith('death-');
  SFX_MANIFEST[id as SfxId] = {
    file: stems.map(stem => `${AUDIO_SFX_DIR}/accepted/${stem}.ogg`), fallback: [],
    gain: id === 'summon-hit' ? 0.3 : id === 'boss-death' ? 0.65 : routine ? 0.55 : major ? 0.8 : 0.65,
    pitchVariance: major ? 0 : dispersal ? 0.025 : 0.035, gainVariance: major ? 0 : 0.08,
    cooldownMs: id === 'summon-hit' ? 300 : dispersal ? 220 : routine ? 110 : 180,
    maxVoices: major ? 1 : 2, priority: major ? 3 : dispersal ? 1 : routine ? 0 : 2,
  };
}
for (const [alias, id] of Object.entries(aliases)) SFX_MANIFEST[alias as SfxId] = SFX_MANIFEST[id];

// Guided tutorial UI cues (client/src/tutorial). The designer's recordings go at
// these paths; until a file exists the soft synth fallback plays instead, so the
// cue is never silent. Kept quiet and unjittered: they are UI, not combat.
SFX_MANIFEST['tutorial-ready'] = {
  file: `${AUDIO_SFX_DIR}/ui/tutorial-ready.ogg`,
  // A gentle rising two-note chime: "your turn".
  fallback: [
    { freq: 659, duration: 0.18, gain: 0.22 },
    { freq: 988, delay: 0.12, duration: 0.3, gain: 0.2 },
  ],
  gain: 0.5, cooldownMs: 600, maxVoices: 1, priority: 2,
};
SFX_MANIFEST['tutorial-action'] = {
  file: `${AUDIO_SFX_DIR}/ui/tutorial-action.ogg`,
  // A short soft tick when the guide presses a button.
  fallback: [{ freq: 1320, duration: 0.06, gain: 0.14, type: 'triangle' }],
  gain: 0.4, cooldownMs: 120, maxVoices: 1, priority: 1,
};

/** Normalized list of variant file paths for a SFX def (empty if none). */
export function sfxFiles(def: SfxDef): string[] {
  if (!def.file) return [];
  return Array.isArray(def.file) ? def.file : [def.file];
}

/** Phaser cache key for a SFX id's variant (index defaults to 0). */
export function sfxKey(id: SfxId, variant = 0): string {
  return `sfx-${sfxFiles(SFX_MANIFEST[id])[variant]?.split('/').pop() ?? id}`;
}
