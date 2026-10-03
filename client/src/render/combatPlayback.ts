import type { CombatEvent, DeltaSnapshot, PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from './state';
import { capturePlayerAttack, dispatchCombatEvent, type PlayerAttackPresentation } from './combatFx';
import { prepareCombatText, renderCombatText, type CombatTextBatch } from './combatText';
import { shouldRunClientFx } from '../fx/guard';
import { spawnDamageNumber } from '../fx/particles';
import { fxBossDeath, fxMobDeath } from '../fx/monsterDeath';
import { playSfx } from '../audio/audioEngine';
import { PAYLOAD_FX, hitPresentationDelayMs, isPayloadFx } from '../fx/lineagePayloadModel';

export type CombatPlaybackItem =
  | { kind: 'reward'; event: Extract<CombatEvent, { kind: 'essence-drop' }> }
  // A lineage payload's look (`card-fx`) or the loaded carry's beat
  // (`lineage-load`): played on the beat of the hit that caused it.
  | { kind: 'payload'; event: Extract<CombatEvent, { kind: 'card-fx' | 'lineage-load' }> }
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

/**
 * A lineage payload's look plays on the playback clock with the hit it rode
 * (course-correction W2-C): pushed in the same tick as that hit, it would
 * otherwise draw a quarter second BEFORE the swing it belongs to. A payload whose
 * timing is `immediate` (the Technique refund, HUD first) and a player whose hits
 * are not buffered keep their immediate dispatch.
 */
function queuePayload(state: RenderState, event: Extract<CombatEvent, { kind: 'card-fx' | 'lineage-load' }>): boolean {
  if (!Number.isFinite(event.at)) return false;
  if (event.kind === 'card-fx' && isPayloadFx(event.fx) && PAYLOAD_FX[event.fx].timing === 'immediate') return false;
  const player = state.view.get(event.playerId) as PlayerView | undefined;
  if (player && !isBufferedPlayer(player, event)) return false;
  state.combatPlayback.enqueue(event.at!, { kind: 'payload', event });
  return true;
}

/** True means handled, including a cosmetic drop when the queue is full. */
export function queuePlayerAttack(state: RenderState, event: CombatEvent): boolean {
  if (event.kind === 'essence-drop' && Number.isFinite(event.at)) {
    state.combatPlayback.enqueue(event.at!, { kind: 'reward', event });
    return true;
  }
  if (event.kind === 'card-fx' || event.kind === 'lineage-load') return queuePayload(state, event);
  if (event.kind !== 'player-hit' && event.kind !== 'player-kill') return false;
  if (!Number.isFinite(event.at)) return false;
  const killedBy = event.kind === 'player-kill' ? state.combatPlayback.latestTime(item =>
    item.kind === 'attack' && item.event.kind === 'player-hit' &&
    item.event.playerId === event.playerId && item.event.targetId === event.targetId) : undefined;
  if (event.kind === 'player-kill' && killedBy === undefined) return false;
  const presentation = capturePlayerAttack(state, event);
  if (!presentation || !isBufferedPlayer(presentation.player, event)) return false;
  const text = prepareCombatText([event]);
  for (const entry of text.entries) {
    entry.targetPos = presentation.to;
    entry.targetKind = 'monster';
  }
  // A lineage payload's OWN hit is presented as the payload: the echo a beat after
  // the hit it echoes, the lunge's hit at the end of its dash. A kill plays no
  // earlier than the hit that made it (an echo can be the killing blow).
  const at = event.kind === 'player-hit'
    ? event.at! + hitPresentationDelayMs(event.effects)
    : Math.max(event.at!, killedBy!);
  state.combatPlayback.enqueue(at, { kind: 'attack', event, presentation, text });
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
    else if (item.kind === 'reward' || item.kind === 'payload') dispatchCombatEvent(state, item.event, scene);
    else dispatchCombatEvent(state, item.event, scene, item.presentation);
  }
}
