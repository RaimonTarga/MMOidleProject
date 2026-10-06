/**
 * The four ability-node rows, on the Abilities panel (design §19, §22).
 *
 * Rendered with the lineage card shell and the lineage lane grid, deliberately:
 * a node row IS a lineage row — options, one lane colour each, one active at a
 * time — and a player who has learned the tree in one panel should not have to
 * learn it again in the other. The CSS is `lineageTree.css`'s `.lin-row` /
 * `.lin-card`, not a copy of it. Same card grammar as the weapon page since
 * §26.4: one sentence per card, no flavour text, lane colours on the packet
 * route's cards (the trio colours are the weapon page's T1 leans only and never
 * apply here).
 *
 *   Packet     what it also does — three offers
 *   Amplifier  every axis of the ACTIVE route (§22.10), the default first
 *   Keystone   the ability's three verbs (§22.11); a verb whose server rule has
 *              not landed is a silhouette — dimmed, never sold
 *   Cross      the other two offers, borrowed at the cross scalar
 *
 * Gating is the SHARED check (`checkUnlockAbilityNode`, `checkSetAbilityNode`),
 * the same functions the server applies, so a button that is live here is a
 * purchase the server will honour.
 */
import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  ABILITY_NODE_ROWS,
  TEST_ROOM_NODE_ID,
  abilityKeystoneDefinition,
  abilityNodeDescription,
  abilityNodeName,
  abilityNodeProgressFor,
  abilityNodeTreeFor,
  abilityNodeVisibleOptions,
  checkSetAbilityNode,
  checkUnlockAbilityNode,
  isKeystoneSilhouette,
  KEYSTONE_NOT_YET_REASON,
  nodeAxisLabel,
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
  keystone: 'Keystone',
  cross: 'Cross',
};
const ROW_HINT: Record<AbilityNodeRow, string> = {
  packet: 'what it also does',
  amplifier: 'how that route fires',
  keystone: 'what it becomes',
  cross: 'what it borrows',
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

/** The card's name: the lane for a route, the axis for an amplifier, the verb for a keystone. */
function optionName(option: AbilityNodeOption): string {
  if (option.row === 'amplifier') return nodeAxisLabel(option.amplifies ?? 'duration');
  if (option.row === 'keystone') return abilityKeystoneDefinition(option.keystone ?? '')?.name ?? 'Keystone';
  return abilityNodeName(option);
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
    const resolved = resolveAbilityNodeOption(option, progress);
    const laneColor = packetDefinition(option.lane)?.color ?? '#a99e8a';
    const owned = progress.owned.includes(option.id);
    const active = progress.active[option.row] === option.id;
    // A designed verb with no server rule yet: shown so the choice is visible from
    // the start (design §22.11), never sold.
    const silhouette = isKeystoneSilhouette(option);
    const buy = checkUnlockAbilityNode({ option, progress, wallet });
    const slot = owned && !active
      ? checkSetAbilityNode({ abilityId: ability.id, progress, row: option.row, optionId: option.id })
      : null;
    const masteryLocked = !isTestRoom && globalMastery < resolved.requiredGlobalMastery;

    const state: CardShellState = active
      ? 'active'
      : owned ? 'owned' : (masteryLocked || silhouette) ? 'locked' : 'available';
    const reason = silhouette ? KEYSTONE_NOT_YET_REASON
      : masteryLocked ? `Requires Global Mastery ${resolved.requiredGlobalMastery}.`
        : (!owned && !buy.ok) ? buy.reason
          : (slot && !slot.ok) ? slot.reason : undefined;

    // An amplifier names the route it modifies. With a packet slotted the row
    // shows only that route's axes, so a tick to the tile above would point at
    // the wrong column — name it instead.
    const modified = option.modifies
      ? tree!.options.find((o) => o.id === option.modifies)
      : undefined;
    const tie = modified
      ? { adjacent: !progress.active.packet, name: abilityNodeName(modified) }
      : undefined;

    return (
      <LineageCardShell
        key={option.id}
        laneColor={laneColor}
        name={optionName(option)}
        description={
          <>
            {abilityNodeDescription(option)}
            {resolved.payoff ? ` ${formatPayoff(resolved.payoff)}` : ''}
          </>
        }
        state={state}
        tie={tie}
        cost={!owned && !silhouette ? <CostChips cost={resolved.cost} wallet={wallet} /> : undefined}
        note={silhouette ? 'not yet'
          : tree!.family === 'guard' && option.row !== 'keystone' ? `${packetDefaultFace(option.lane)} face` : undefined}
        disabled={silhouette || masteryLocked || (!owned && !buy.ok) || (owned && !active && slot !== null && !slot.ok)}
        title={reason}
        onClick={() => {
          if (silhouette || masteryLocked) return;
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
      {ABILITY_NODE_ROWS.map((row) => {
        const options = abilityNodeVisibleOptions(tree, row, progress);
        if (options.length === 0) return null;
        const own = tree.rowOwnTier[row];
        const band = tree.rowTier[row];
        return (
          <div key={row} className={`lin-row${options.length > 3 ? ' lin-row--wide' : ''}`}>
            <div
              className="lin-row__label"
              title={own > band ? `A Tier ${own} row, bought in the Tier ${band} band until Tier ${own} opens.` : undefined}
            >
              <b>{ROW_LABEL[row]}</b>
              <span>{ROW_HINT[row]} · T{band}</span>
            </div>
            {options.map(tile)}
          </div>
        );
      })}
    </div>
  );
}
