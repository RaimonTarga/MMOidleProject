/** Types and view readers shared by the aura engine and its definitions. */
import type { MonsterView, PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';

export type AuraSubject = 'boss' | 'monster' | 'player';
export type AnyView = MonsterView | PlayerView;

export interface AuraContext {
  scene: GameScene;
  id: string;
  x: number;
  y: number;
  /** Drawn body height / width, scene px. */
  h: number;
  w: number;
  /** 0..1 fade-in strength. */
  s: number;
  /** 0..1 pulse phase value. */
  pulse: number;
  /** Stack count (1 when the state does not stack). */
  stacks: number;
  /** ms since the aura began. */
  age: number;
}

export interface AuraDef {
  id: string;
  /** Which entities it can appear on (default `boss`). */
  on?: AuraSubject | readonly AuraSubject[];
  active(view: AnyView): boolean;
  stacks?(view: AnyView): number;
  pulseMs?: number;
  ground?: { color: number; scale: number; alpha?: number };
  body?: { color: number; alpha: [number, number] };
  overhead?(g: Phaser.GameObjects.Graphics, c: AuraContext): void;
  /** Custom drawing BENEATH the body, on the ground layer (trails, skid marks). */
  under?(g: Phaser.GameObjects.Graphics, c: AuraContext): void;
  beat?: { everyMs: number; draw(c: AuraContext): void };
  tremblePx?: number;
  onStart?(c: AuraContext, view: AnyView): void;
  onEnd?(c: AuraContext, view: AnyView): void;
}

/** Whether a row can appear on this kind of entity. */
export const auraAppliesTo = (def: AuraDef, subject: AuraSubject): boolean => {
  const on = def.on ?? 'boss';
  return typeof on === 'string' ? on === subject : on.includes(subject);
};

export const hasTargetStatus = (view: AnyView, id: string): boolean =>
  ((view as MonsterView).targetStatus ?? []).some((s) => s.id === id);
export const targetStatusStacks = (view: AnyView, id: string): number =>
  ((view as MonsterView).targetStatus ?? []).find((s) => s.id === id)?.stacks ?? 0;
export const hasBossEffect = (view: AnyView, id: string): boolean =>
  ((view as MonsterView).bossEffects ?? []).includes(id);
export const bossEffectStacks = (view: AnyView, id: string): number =>
  (view as MonsterView).bossEffectStacks?.[id] ?? 0;
export const hasPlayerBuff = (view: AnyView, id: string, instanceKey?: string): boolean =>
  ((view as PlayerView).activeBuffs ?? []).some(
    (b) => b.id === id && (instanceKey === undefined || b.instanceKey === instanceKey),
  );

