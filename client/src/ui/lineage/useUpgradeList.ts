import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { TEST_ROOM_NODE_ID, type LineageWallet } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  capstonesAtom,
  equipmentAtom,
  essencesAtom,
  globalMasteryAtom,
  lineagesAtom,
  playerNodeIdAtom,
  playerTierAtom,
  shardsAtom,
} from '../../hud/atoms';
import { buyableTotal, wornEntries, type WornEntry } from './upgradeListModel';

/** The wallet the shared lineage checks read, off the player's atoms (as the page builds it). */
export function useLineageWallet(): LineageWallet {
  const essences = useAtomValue(essencesAtom);
  const shards = useAtomValue(shardsAtom);
  const capstones = useAtomValue(capstonesAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  const isTestRoom = playerNodeId === TEST_ROOM_NODE_ID;
  return useMemo(() => ({
    essences, shards, capstones, biomeLevels: biomeLevel, globalMastery, playerTier, isTestRoom,
  }), [essences, shards, capstones, biomeLevel, globalMastery, playerTier, isTestRoom]);
}

/** The Upgrade panel's worn items (weapon first), from the player's atoms. */
export function useUpgradeList(): WornEntry[] {
  const equipment = useAtomValue(equipmentAtom);
  const lineages = useAtomValue(lineagesAtom);
  const wallet = useLineageWallet();
  return useMemo(() => wornEntries({ equipment, lineages, wallet }), [equipment, lineages, wallet]);
}

/** The Upgrade menu entry's count: what the worn weapon's page sells right now. */
export function useUpgradeBadge(): number {
  const entries = useUpgradeList();
  return entries.reduce((sum, entry) => sum + buyableTotal(entry.buyable), 0);
}
