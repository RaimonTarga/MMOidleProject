/**
 * The two ability-node rows, on the Abilities panel (design §19).
 *
 * Rendered with the lineage card shell and the lineage lane grid, deliberately:
 * a node row IS a lineage row — three options, one lane colour each, one active
 * at a time — and a player who has learned the tree in one panel should not have
 * to learn it again in the other. The CSS is `lineageTree.css`'s `.lin-row` /
 * `.lin-card`, not a copy of it.
 *
 * Gating is the SHARED check (`checkUnlockAbilityNode`, `checkSetAbilityNode`),
 * the same functions the server applies, so a button that is live here is a
 * purchase the server will honour.
 */
import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  TEST_ROOM_NODE_ID,
  abilityNodeDescription,
  abilityNodeName,
  abilityNodeProgressFor,
  abilityNodeTreeFor,
  checkSetAbilityNode,
  checkUnlockAbilityNode,
  packetDefaultFace,
  packetDefinition,
  resolveAbilityNodeOption,
} from '@mmo-idle/shared';
import type {
  AbilityDef, AbilityNodeOption, AbilityNodeRow, AbilityNodeWallet, LineagePayoff,
} from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import {
  abilityNodesAtom,
  biomeLevelAtom,
  capstonesAtom,
  essencesAtom,
  globalMasteryAtom,
  knownAbilitiesAtom,
  playerNodeIdAtom,
  playerTierAtom,
  shardsAtom,
} from '../hud/atoms';
import { CostChips, LineageCardShell, type CardShellState } from './lineage/CardShell';
import './lineage/lineageTree.css';

const ROW_LABEL: Record<AbilityNodeRow, string> = {
  packet: 'Packet',
  amplifier: 'Amplifier',
};
const ROW_HINT: Record<AbilityNodeRow, string> = {
  packet: 'what it also does',
  amplifier: 'deepens that packet',
};

const RESULT_NOTICE_MS = 3200;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** The resolved numbers, in the same voice the tree panel uses. */
function formatPayoff(payoff: LineagePayoff): string {
  const pct = `${round1(payoff.magnitude * 100)}%`;
  return payoff.durationMs ? `${pct} for ${(payoff.durationMs / 1000).toFixed(1)}s` : pct;
}

export function AbilityNodeRows({ ability }: { ability: AbilityDef }) {
  const nodes = useAtomValue(abilityNodesAtom);
  const essences = useAtomValue(essencesAtom);
  const shards = useAtomValue(shardsAtom);
  const capstones = useAtomValue(capstonesAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const knownAbilities = useAtomValue(knownAbilitiesAtom);
  const isTestRoom = useAtomValue(playerNodeIdAtom) === TEST_ROOM_NODE_ID;

  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ success: boolean; reason?: string; abilityId: string }>).detail;
      if (detail.success || detail.abilityId !== ability.id) return;
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      setNotice(detail.reason ?? 'That did not work.');
      noticeTimerRef.current = setTimeout(() => setNotice(null), RESULT_NOTICE_MS);
    };
    window.addEventListener('hud:abilityNodeResult', handler);
    return () => {
      window.removeEventListener('hud:abilityNodeResult', handler);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, [ability.id]);

  const tree = abilityNodeTreeFor(ability.id);
  if (!tree) return null;

  const progress = abilityNodeProgressFor(nodes, ability.id);
  const wallet: AbilityNodeWallet = {
    essences, shards, capstones, biomeLevels: biomeLevel,
    globalMastery, playerTier, knownAbilities, isTestRoom,
  };

  function tile(option: AbilityNodeOption) {
    const resolved = resolveAbilityNodeOption(option);
    const laneColor = packetDefinition(option.lane)?.color ?? '#a99e8a';
    const owned = progress.owned.includes(option.id);
    const active = progress.active[option.row] === option.id;
    const buy = checkUnlockAbilityNode({ option, progress, wallet });
    const slot = owned && !active
      ? checkSetAbilityNode({ abilityId: ability.id, progress, row: option.row, optionId: option.id })
      : null;
    const masteryLocked = !isTestRoom && globalMastery < resolved.requiredGlobalMastery;

    const state: CardShellState = active
      ? 'active'
      : owned ? 'owned' : masteryLocked ? 'locked' : 'available';
    const reason = masteryLocked
      ? `Requires Global Mastery ${resolved.requiredGlobalMastery}.`
      : (!owned && !buy.ok) ? buy.reason
        : (slot && !slot.ok) ? slot.reason : undefined;

    // The modified packet node sits directly above in the same lane column, so
    // the amplifier's tick always points at the truth.
    const modified = option.modifies
      ? tree!.options.find((o) => o.id === option.modifies)
      : undefined;

    return (
      <LineageCardShell
        key={option.id}
        laneColor={laneColor}
        name={abilityNodeName(option)}
        description={
          <>
            {abilityNodeDescription(option)}
            {resolved.payoff ? ` ${formatPayoff(resolved.payoff)}` : ''}
          </>
        }
        state={state}
        tie={modified ? { adjacent: true, name: abilityNodeName(modified) } : undefined}
        cost={!owned ? <CostChips cost={resolved.cost} wallet={wallet} /> : undefined}
        note={tree!.family === 'guard' ? `${packetDefaultFace(option.lane)} face` : undefined}
        disabled={masteryLocked || (!owned && !buy.ok) || (owned && !active && slot !== null && !slot.ok)}
        title={reason}
        onClick={() => {
          if (masteryLocked) return;
          if (!owned) {
            if (buy.ok) hudBus.requestAbilityUnlockNode(ability.id, option.id);
            return;
          }
          if (!active && slot?.ok) hudBus.requestAbilitySetNode(ability.id, option.row, option.id);
        }}
      />
    );
  }

  return (
    <div className="ability-nodes">
      <div className="ability-nodes__head">
        <strong>Nodes</strong>
        <span>
          Runes decide when this fires. Nodes decide what it does
          {tree.family === 'technique' ? ' when it lands.' : ' when it casts.'}
        </span>
      </div>
      {notice && <div className="lin-toast" role="status">{notice}</div>}
      {(['packet', 'amplifier'] as const).map((row) => (
        <div key={row} className="lin-row">
          <div className="lin-row__label">
            <b>{ROW_LABEL[row]}</b>
            <span>{ROW_HINT[row]} · T{tree.rowTier[row]}</span>
          </div>
          {tree.options.filter((o) => o.row === row).map(tile)}
        </div>
      ))}
    </div>
  );
}
