import type { SummonerSpecialization, SummonSlotView } from '@mmo-idle/shared';
import type { SummonHealthView } from '../atoms';

export type CadenceMechanicModel = {
  kind: 'cadence';
  count: number;
  threshold: number;
  armed: boolean;
};

export type CooldownMechanicModel = {
  kind: 'cooldown';
  isChanneling: boolean;
  channelRemainingPct: number;
  executionPct: number;
  executionReady: boolean;
  /** A Squire with Response rules. Without it the cooldown dial stays. */
  responses: boolean;
  /** Pip fill and bar size. Meaningful when `responses` is set. */
  resolve: number;
  resolveMax: number;
};

export type EnergyMechanicModel = {
  kind: 'energy';
  value: number;
  max: number;
  pct: number;
};

export type ReloadMechanicModel = {
  kind: 'reload';
  ammo: number;
  ammoMax: number;
  /** A Slinger with a Loadout. The ring takes the loaded clip's colour. */
  loadout: boolean;
  clipColor: string | null;
  nextClipColor: string | null;
  clipName: string | null;
  nextClipName: string | null;
  reloadRemainingMs: number;
  reloadDurationMs: number;
};

export type SummonerMechanicModel = {
  kind: 'summoner';
  specialization: SummonerSpecialization | null;
  activeCount: number;
  slotCount: number;
  slots: Array<SummonSlotView & { health: SummonHealthView | null }>;
};

export type DotElement = 'poison' | 'fire' | 'frost' | 'doom';

export type DotMechanicModel = {
  kind: 'dot';
  element: DotElement;
  stackLabel: string;
  stacks: number;
  maxStacks: number;
  stackPct: number;
  tickPct: number;
  tickSerial: number;
  hasTarget: boolean;
  chillStacks: number;
  chillMax: number;
  showsChill: boolean;
  frozen: boolean;
};

export type MechanicViewModel =
  | CadenceMechanicModel
  | CooldownMechanicModel
  | EnergyMechanicModel
  | ReloadMechanicModel
  | SummonerMechanicModel
  | DotMechanicModel;
