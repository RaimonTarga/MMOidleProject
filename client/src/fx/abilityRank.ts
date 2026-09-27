/**
 * ABILITY RANK — the visual progression of Guards and Techniques (2026-09-27),
 * the ability half of the attack progression in attackFlair.ts.
 *
 * An ability's rank is `playerTier - homeTier + 1` (shared `abilityRankNumber`),
 * so it is computable for any player on the client with no protocol. Each ability
 * keeps its own animation; the rank adds layers AROUND it, in the ability's colour:
 *
 *   I    the ability's animation alone: the plain version;
 *   II   + a resonance ring and a spray of sparks;
 *   III  + a rune circle turning on the ground under it;
 *   IV   + a pillar of light and a wider ring (and a light impact for your own).
 *
 * Also `abilityCallout`: the floating skill name carries the numeral from II on
 * ("Brace III"), so the rank reads in words as well as in light.
 */
import {
  abilityDef,
  abilityRankNumber,
  abilityRankNumeral,
  type PlayerView,
} from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { drawSigil, ring } from './bossKit';
import { impact } from './impactFeel';
import { shouldRunClientFx } from './guard';

type P = { x: number; y: number };

/** Each ability's colour, matched to its own animation / callout. */
const ABILITY_COLOR: Record<string, number> = {
  // Guards
  brace: 0x9cd2ff,
  cleanse: 0xeef6ff,
  'second-wind': 0x9cff8a,
  endure: 0xe0c07a,
  'bramble-guard': 0xc4e88a,
  'break-free': 0xd9c2ff,
  recuperate: 0xbdf3e4,
  // Techniques
  sweep: 0xffd24a,
  'power-strike': 0xffb040,
  'expose-weakness': 0xff5a8a,
  hamstring: 0xff7a4a,
  charge: 0xffe0a0,
  contagion: 0x9ad65a,
  slam: 0xc8b89a,
  'binding-strike': 0x9ad6a0,
  frenzy: 0xff3b2f,
  'quick-strike': 0xfff0a0,
  detonate: 0xff8a3a,
  disengage: 0x9fd0ff,
  snipe: 0xffe066,
  'stunning-strike': 0xffe07a,
  'imbue-lightning': 0xc77dff,
};

/** The rank this player casts this ability at (1 when unknown). */
export function abilityRankFor(scene: GameScene, playerId: string, abilityId: string): number {
  const def = abilityDef(abilityId);
  const view = scene.state.view.get(playerId) as PlayerView | undefined;
  if (!def || !view) return 1;
  return abilityRankNumber(def, view.playerTier ?? 0);
}

/** The floating skill name, with its rank numeral from II on. */
export function abilityCallout(scene: GameScene, playerId: string, abilityId: string): string {
  const name = abilityDef(abilityId)?.name ?? abilityId;
  const rank = abilityRankFor(scene, playerId, abilityId);
  return rank >= 2 ? `${name} ${abilityRankNumeral(rank)}` : name;
}

/**
 * Draw the rank layers for one use of an ability, at `at` (the caster for a Guard
 * or self-cast, the impact for a strike). A no-op at rank I.
 */
export function playAbilityRank(scene: GameScene, playerId: string, abilityId: string, at: P): void {
  if (!shouldRunClientFx()) return;
  const rank = abilityRankFor(scene, playerId, abilityId);
  if (rank < 2) return;
  const color = ABILITY_COLOR[abilityId] ?? 0xffe0a0;

  // II: resonance.
  ring(scene, at.x, at.y, color, { from: 14, scale: 2.6 + 0.3 * rank, width: 2, ms: 340, alpha: 0.8 });
  burstFx(scene, 'ptx-spark', at.x, at.y, 4 + rank * 2, 420, {
    tint: [color, 0xffffff], speed: { min: 40, max: 90 + rank * 25 }, angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
  });
  if (rank < 3) return;

  // III: a rune circle turning on the ground beneath.
  const rune = scene.add.graphics({ x: at.x, y: at.y + 14 }).setDepth(DEPTH.SPRITE - 1);
  const began = performance.now();
  const spin = { a: 0 };
  scene.tweens.add({
    targets: spin, a: 1, duration: 520, ease: 'Quad.easeOut',
    onUpdate: () => {
      rune.clear();
      const k = Math.min(1, (performance.now() - began) / 200);
      drawSigil(rune, 0, 0, 26, k, color, 0.85 * (1 - spin.a * 0.7), spin.a * 2.4, 6, 0.4);
    },
    onComplete: () => rune.destroy(),
  });
  if (rank < 4) return;

  // IV: a pillar of light, a wider ring, and weight for your own.
  const pillar = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
  pillar.fillStyle(color, 0.35);
  pillar.fillRect(-9, -110, 18, 118);
  pillar.fillStyle(0xffffff, 0.5);
  pillar.fillRect(-3, -110, 6, 118);
  pillar.setScale(0.3, 1);
  scene.tweens.add({
    targets: pillar, scaleX: 1.2, alpha: 0, duration: 420, ease: 'Quad.easeOut', onComplete: () => pillar.destroy(),
  });
  ring(scene, at.x, at.y + 12, color, { from: 20, scale: 4.2, width: 3, ms: 460, alpha: 0.7, flat: true });
  if (playerId === scene.state.ownId) impact(scene, 'light', at);
}
