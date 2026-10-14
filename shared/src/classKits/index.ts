/**
 * Class kits (class-first build plan §3.1): the public surface. The authoring helpers in
 * `kitHelpers.ts` and each kit's builders stay inside this folder.
 */
export * from './types';
export * from './moments';
export * from './budget';
export * from './scaling';
export * from './registry';
export { STRIKER_KIT, type StrikerFamily, type StrikerPiece, type StrikerPieceExtra, type StrikerTrophy, type StrikerTrophyKind } from './striker/kit';
export { SQUIRE_KIT, type SquireFamily, type SquirePiece, type SquirePieceExtra, type SquireTrophy, type SquireTrophyKind } from './squire/kit';
export { APPRENTICE_KIT, type ApprenticeSchool, type ApprenticePiece, type ApprenticePieceExtra, type ApprenticeTrophy, type ApprenticeTrophyKind } from './apprentice/kit';
export {
  SLINGER_KIT, SLINGER_LAST_ROUND_COLOR, SLINGER_RACK_SLOT_MAX, slingerRack,
  type SlingerFamily, type SlingerPiece, type SlingerPieceExtra, type SlingerTrophy, type SlingerTrophyKind,
} from './slinger/kit';
export { SPIRIT_KIT, type SpiritFamily, type SpiritPiece, type SpiritPieceExtra, type SpiritTrophy, type SpiritTrophyKind } from './spirit/kit';
export { CONDUIT_KIT, type ConduitRole, type ConduitPiece, type ConduitPieceExtra, type ConduitTrophy, type ConduitTrophyKind } from './conduit/kit';
