import type { SummonSlotView } from '@mmo-idle/shared';
import type { SummonHealthView } from '../atoms';
import type { OrderResource } from '../orderResource';

export type CadenceMechanicModel = {
  kind: 'cadence';
  count: number;
  threshold: number;
  armed: boolean;
  /** The Striker's T2 discipline resource (null before a discipline is picked). */
  resource: OrderResource | null;
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
  /** The pips that arm the slam; the bar can be longer than this. */
  resolveBudget: number;
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
  /** The Slinger's T2 discipline: twin guns, the shell, the called shot. Null without one. */
  discipline: 'gunslinger' | 'siege' | 'trickshot' | null;
  /** Gunslinger: the second gun's clip. The even rounds on the ring are its. */
  twinClipColor: string | null;
  twinClipName: string | null;
  /** Siege: the damage banked in the shell. 0 when empty. */
  shell: number;
  /** Trickshot: the last round is next and will fly to the rule's pick. */
  calledShot: boolean;
};

export type SummonerMechanicModel = {
  kind: 'summoner';
  specialization: null;
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
};

export type MechanicViewModel =
  | CadenceMechanicModel
  | CooldownMechanicModel
  | EnergyMechanicModel
  | ReloadMechanicModel
  | SummonerMechanicModel
  | DotMechanicModel;
