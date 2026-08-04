import { SUMMONER_SPECIALIZATION_TUNING } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../../../combat/buffs/descriptor';
import { summonerProfileFor } from '../profile';

function livingCount(
  world: Parameters<BuffDescriptor['project']>[0]['world'],
  player: Parameters<BuffDescriptor['project']>[0]['player'],
): number {
  return player.summonsMinions?.minionIds.reduce((count, id) => {
    const minion = id ? world.getMinionEntity(id) : undefined;
    return count + (minion && minion.hasHealth.hp > 0 ? 1 : 0);
  }, 0) ?? 0;
}

function ownsSpecialization(
  player: Parameters<BuffDescriptor['project']>[0]['player'],
  specialization: ReturnType<typeof summonerProfileFor>['specialization'],
): boolean {
  return player.summonsMinions !== undefined
    && summonerProfileFor(player).specialization === specialization;
}

export const SUMMONER_T4_BUFFS = [
  defineBuff(
    'summoner-volatile-brood',
    ({ player, world, now }) => {
      if (!ownsSpecialization(player, 'volatile-brood') || !player.summonsMinions || !player.controlsSummons) return null;
      const nextAt = player.controlsSummons.volatileNextDetonationAt;
      const interval = SUMMONER_SPECIALIZATION_TUNING.volatileBrood.detonationIntervalMs;
      const remaining = nextAt > 0 ? Math.max(0, nextAt - now) : interval;
      const marked = player.summonsMinions.volatileMarkedSlotId ? 1 : 0;
      return {
        id: 'summoner-volatile-brood', label: 'VOLAT', stacks: Math.max(1, marked),
        durationPct: Math.min(100, (remaining / interval) * 100), color: '#ff7043',
        logSourceName: 'Volatile Brood', logSourceSide: 'ally',
        logDetail: marked ? 'one summon is armed for detonation' : 'preparing the next detonation',
      };
    },
    { category: 'summoner', shape: 'diamond', color: '#ff7043', label: 'VOLAT' },
  ),
  defineBuff(
    'summoner-endless-swarm',
    ({ player, world }) => ownsSpecialization(player, 'endless-swarm') && player.summonsMinions
      ? {
          id: 'summoner-endless-swarm', label: 'SWARM', stacks: Math.max(1, livingCount(world, player)),
          durationPct: -1, color: '#7bd389', logSourceName: 'Endless Swarm', logSourceSide: 'ally',
          logDetail: `${livingCount(world, player)}/${player.summonsMinions.targetCount} summons active`,
        }
      : null,
    { category: 'summoner', shape: 'circle', color: '#7bd389', label: 'SWARM' },
  ),
  defineBuff(
    'summoner-harrier-brood',
    ({ player, target }) => {
      if (!ownsSpecialization(player, 'harrier-brood') || !player.controlsSummons || !target) return null;
      const state = player.controlsSummons.harrierMarksByTarget[target.isMonster.id];
      return {
        id: 'summoner-harrier-brood', label: 'HARRY', stacks: Math.max(1, state?.slotIds.length ?? 0),
        durationPct: -1, color: '#e6c35c', logSourceName: 'Harrier Brood', logSourceSide: 'ally',
        logDetail: `${state?.slotIds.length ?? 0} unique summons marking ${target.isMonster.name}`,
        logTargetId: target.isMonster.id, logTargetName: target.isMonster.name, logTargetType: 'monster',
      };
    },
    { category: 'summoner', shape: 'diamond', color: '#e6c35c', label: 'HARRY' },
  ),
  defineBuff(
    'summoner-coordinated-hunt',
    ({ player, target }) => {
      if (!ownsSpecialization(player, 'coordinated-hunt') || !player.controlsSummons) return null;
      const targetId = target?.isMonster.id;
      const serial = targetId ? (player.controlsSummons.cycleSerialByTarget[targetId] ?? 0) : 0;
      const contributors = targetId ? (player.controlsSummons.cycleContributorsByTarget[targetId]?.length ?? 0) : 0;
      const needed = SUMMONER_SPECIALIZATION_TUNING.coordinatedHunt.cyclesRequired;
      return {
        id: 'summoner-coordinated-hunt', label: 'HUNT', stacks: Math.max(1, contributors),
        durationPct: 100 - ((serial % needed) / needed) * 100, color: '#f3aa52',
        logSourceName: 'Coordinated Hunt', logSourceSide: 'ally',
        logDetail: `formation cycle ${serial % needed}/${needed}; ${contributors} current contributors`,
      };
    },
    { category: 'summoner', shape: 'square', color: '#f3aa52', label: 'HUNT' },
  ),
  defineBuff(
    'summoner-withering-chorus',
    ({ player, target }) => {
      if (!ownsSpecialization(player, 'withering-chorus') || !player.controlsSummons || !target) return null;
      const voices = player.controlsSummons.chorusByTarget[target.isMonster.id]?.slotIds.length ?? 0;
      return {
        id: 'summoner-withering-chorus', label: 'CHORUS', stacks: Math.max(1, voices),
        durationPct: -1, color: '#9d6ad6', logSourceName: 'Withering Chorus', logSourceSide: 'ally',
        logDetail: `${voices} unique voices established on ${target.isMonster.name}`,
        logTargetId: target.isMonster.id, logTargetName: target.isMonster.name, logTargetType: 'monster',
      };
    },
    { category: 'summoner', shape: 'diamond', color: '#9d6ad6', label: 'CHORUS' },
  ),
  defineBuff(
    'summoner-grand-ritual',
    ({ player, now }) => {
      if (!ownsSpecialization(player, 'grand-ritual') || !player.summonsMinions || !player.controlsSummons) return null;
      const charges = player.summonsMinions.ritualCharges?.reduce((sum, value) => sum + value, 0) ?? 0;
      const interval = SUMMONER_SPECIALIZATION_TUNING.grandRitual.intervalMs;
      const remaining = player.controlsSummons.ritualNextAt > 0
        ? Math.max(0, player.controlsSummons.ritualNextAt - now)
        : interval;
      return {
        id: 'summoner-grand-ritual', label: 'RITUAL', stacks: Math.max(1, charges),
        durationPct: charges > 0 ? -1 : Math.min(100, (remaining / interval) * 100), color: '#66c7d7',
        logSourceName: 'Grand Ritual', logSourceSide: 'ally',
        logDetail: charges > 0 ? `${charges} empowered summon attacks remain` : 'awaiting the next ritual',
      };
    },
    { category: 'summoner', shape: 'square', color: '#66c7d7', label: 'RITUAL' },
  ),
  defineBuff(
    'summoner-colossus',
    ({ player, world }) => ownsSpecialization(player, 'colossus')
      ? {
          id: 'summoner-colossus', label: 'COLOSS', stacks: 1, durationPct: -1, color: '#b58a58',
          logSourceName: 'Colossus', logSourceSide: 'ally',
          logDetail: livingCount(world, player) > 0 ? 'the condensed formation is active' : 'the condensed formation is reconstructing',
        }
      : null,
    { category: 'summoner', shape: 'circle', color: '#b58a58', label: 'COLOSS' },
  ),
  defineBuff(
    'summoner-battle-bond',
    ({ player }) => {
      if (!ownsSpecialization(player, 'battle-bond') || !player.controlsSummons) return null;
      const progress = player.controlsSummons.bondProgress;
      const threshold = SUMMONER_SPECIALIZATION_TUNING.battleBond.threshold;
      return {
        id: 'summoner-battle-bond', label: 'BOND', stacks: Math.max(1, progress),
        durationPct: 100 - (progress / threshold) * 100, color: '#f0d878',
        logSourceName: 'Battle Bond', logSourceSide: 'ally',
        logDetail: `${progress}/${threshold} fixed contributions toward a linked strike`,
      };
    },
    { category: 'summoner', shape: 'diamond', color: '#f0d878', label: 'BOND' },
  ),
  defineBuff(
    'summoner-twin-covenant',
    ({ player, world }) => {
      if (!ownsSpecialization(player, 'twin-covenant') || !player.summonsMinions) return null;
      const living = livingCount(world, player);
      return {
        id: 'summoner-twin-covenant', label: 'TWINS', stacks: Math.max(1, living),
        durationPct: -1, color: '#d28fca', logSourceName: 'Twin Covenant', logSourceSide: 'ally',
        logDetail: living === 1 ? 'one twin survives with a bounded fallback' : `${living}/2 complementary twins active`,
      };
    },
    { category: 'summoner', shape: 'circle', color: '#d28fca', label: 'TWINS' },
  ),
] as const satisfies readonly BuffDescriptor[];
