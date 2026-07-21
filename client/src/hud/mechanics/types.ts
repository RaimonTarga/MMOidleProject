import type { SummonSlotView } from '@mmo-idle/shared';
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
};

export type EnergyMechanicModel = {
  kind: 'energy';
  value: number;
  max: number;
  pct: number;
  empowered: boolean;
  isFlash: boolean;
  shiftLabel: string;
  shiftColor: string;
};

export type ReloadMechanicModel = {
  kind: 'reload';
  mode: 'ammo' | 'heat';
  ammo: number;
  ammoMax: number;
  heatPct: number;
  overheated: boolean;
};

export type SummonerMechanicModel = {
  kind: 'summoner';
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
