import type { HasPosition, TracksProgression, HoldsInventory, UsesSkills, SummonsMinions } from '../components';
import type { PlayerView } from './views';

/** Persistent save slices; passives and position speed remain audit-only. */
export interface ProgressionCheckpointState {
  tracksProgression: TracksProgression;
  holdsInventory: HoldsInventory;
  usesSkills: UsesSkills;
  hasPosition: HasPosition;
  summonerState?: SummonsMinions;
}
export interface ProgressionCheckpointCapture {
  version: 1;
  boundaryId: string;
  restorePolicy: 'safe-rested-v1';
  sourceRevision: string;
  definitionsHash: string;
  definitionSections: Record<string,string>;
  stateHash: string;
  rewardMultiplier: number;
  capturedAtMs: number;
  persistent: ProgressionCheckpointState;
  view: PlayerView;
  runtimeEvidence: Record<string,unknown>;
}
export interface ProgressionCheckpointResult {
  success: boolean;
  reason?: string;
  capture?: ProgressionCheckpointCapture;
}
export interface ProgressionCheckpointRestore {
  capture: ProgressionCheckpointCapture;
  boundaryId: string;
  revisionPolicy: 'same-revision' | 'explicit-current-revision';
}
