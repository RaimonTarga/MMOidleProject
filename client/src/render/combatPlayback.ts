import type { CombatEvent, DeltaSnapshot, PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from './state';
import { capturePlayerAttack, dispatchCombatEvent, type PlayerAttackPresentation } from './combatFx';
import { prepareCombatText, renderCombatText, type CombatTextBatch } from './combatText';
import { shouldRunClientFx } from '../fx/guard';
import { spawnDamageNumber } from '../fx/particles';
import { fxBossDeath, fxMobDeath } from '../fx/monsterDeath';
import { playSfx } from '../audio/audioEngine';

export type CombatPlaybackItem =
  | { kind: 'reward'; event: Extract<CombatEvent, { kind: 'essence-drop' }> }
  | { kind: 'attack'; event: CombatEvent; presentation: PlayerAttackPresentation; text: CombatTextBatch }
  | { kind: 'death'; play: () => void };

export function beginCombatPlayback(state: RenderState, snapshot: DeltaSnapshot, stateSync: boolean): boolean {
  if (stateSync || !shouldRunClientFx() || !Number.isFinite(snapshot.serverTime)) {
    state.combatPlayback.reset();
    return false;
  }
  state.combatPlayback.observe(snapshot.nodeId, snapshot.serverTime!, performance.now());
  return true;
}

/** Channels/teleports and summon attacks have existing time-sensitive render owners. */
function isBufferedPlayer(player: PlayerView, event: CombatEvent): boolean {
  if ((player.summonsMinions ?? 0) > 0 || (player.passives['reload.laser'] ?? 0) > 0) return false;
  return !(event.kind === 'player-hit' && event.effects?.some(effect =>
    effect === 'flash-teleport' || effect === 'channel-beam' || effect === 'holy-flash'));
}

/** True means handled, including a cosmetic drop when the queue is full. */
export function queuePlayerAttack(state: RenderState, event: CombatEvent): boolean {
  if (event.kind === 'essence-drop' && Number.isFinite(event.at)) {
    state.combatPlayback.enqueue(event.at!, { kind: 'reward', event });
    return true;
  }
  if (event.kind !== 'player-hit' && event.kind !== 'player-kill') return false;
  if (!Number.isFinite(event.at)) return false;
  if (event.kind === 'player-kill' && state.combatPlayback.latestTime(item =>
    item.kind === 'attack' && item.event.kind === 'player-hit' &&
    item.event.playerId === event.playerId && item.event.targetId === event.targetId) === undefined) return false;
  const presentation = capturePlayerAttack(state, event);
  if (!presentation || !isBufferedPlayer(presentation.player, event)) return false;
  const text = prepareCombatText([event]);
  for (const entry of text.entries) {
    entry.targetPos = presentation.to;
    entry.targetKind = 'monster';
  }
  state.combatPlayback.enqueue(event.at!, { kind: 'attack', event, presentation, text });
  return true;
}

/**
 * Hold only the noninteractive sprite until its last confirmed hit plays.
 * destroyEntity still removes all targeting, view, bars and world membership NOW.
 * Reuse the existing death FX afterwards; no extra clone during the buffer.
 */
export function queueCombatDeath(state: RenderState, scene: GameScene, id: string): boolean {
  const at = state.combatPlayback.latestTime(item =>
    item.kind === 'attack' && 'targetId' in item.event && item.event.targetId === id);
  const sprite = state.sprite.get(id);
  if (at === undefined || !sprite || !shouldRunClientFx()) return false;
  const boss = state.entity.get(id)?.isMonster?.isBoss ?? false;
  const dispose = () => sprite.destroy();
  const play = () => {
    if (boss) { fxBossDeath(scene, sprite); playSfx('boss-death'); }
    else fxMobDeath(scene, sprite);
    dispose();
  };
  state.sprite.delete(id);
  sprite.disableInteractive();
  scene.tweens.killTweensOf(sprite);
  if ('anims' in sprite) sprite.anims.stop();
  state.combatPlayback.enqueue(at, { kind: 'death', play }, dispose);
  return true;
}

/** One bounded drain per frame; simultaneous hits share the existing text budget. */
export function stepCombatPlayback(state: RenderState, scene: GameScene): void {
  if (!shouldRunClientFx()) { state.combatPlayback.reset(); return; }
  const ready = state.combatPlayback.drain(performance.now());
  if (ready.length === 0) return;
  const text: CombatTextBatch = { entries: [] };
  for (const item of ready) if (item.kind === 'attack') text.entries.push(...item.text.entries);
  renderCombatText(text, state, (pos, offset, amount, color, style) =>
    spawnDamageNumber(scene, pos, offset, amount, color, style));
  for (const item of ready) {
    if (item.kind === 'death') item.play();
    else if (item.kind === 'reward') dispatchCombatEvent(state, item.event, scene);
    else dispatchCombatEvent(state, item.event, scene, item.presentation);
  }
}
