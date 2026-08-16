import { atom } from 'jotai';
import type {
  AdminActionResult,
  AdminAnalyticsSnapshot,
  AdminCharacterRecord,
  AdminLogEntry,
  AdminPlayerSummary,
  AdminWorldLogEntry,
  NodeTelemetrySnapshot,
  BalanceLabSnapshot,
} from '@mmo-idle/shared';

export const connectedAtom = atom(false);
export const connectionErrorAtom = atom<string | null>(null);
export const playersAtom = atom<AdminPlayerSummary[]>([]);
export const charactersAtom = atom<AdminCharacterRecord[]>([]);
export const analyticsAtom = atom<AdminAnalyticsSnapshot | null>(null);
export const logsAtom = atom<AdminLogEntry[]>([]);
export const worldLogAtom = atom<AdminWorldLogEntry[]>([]);
export const telemetryAtom = atom<NodeTelemetrySnapshot | null>(null);
export const actionResultsAtom = atom<AdminActionResult[]>([]);
export const balanceLabAtom = atom<BalanceLabSnapshot | null>(null);
