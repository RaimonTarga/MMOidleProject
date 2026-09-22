import assert from 'node:assert/strict';
import { DUNGEON_DEFS, MONSTER_DATABASE } from '@mmo-idle/shared';
import { BREADTH_CELLS, type BreadthCell } from './playerBreadthSpec';

export interface SpiritBossCell extends BreadthCell { seed: number; boss: string }
const identities = ['spirit-light', 'spirit-balanced', 'spirit-heavy', 'slinger-light', 'squire-heavy'];
const bosses = ['apex-timberclaw', 'stoneplate-juggernaut'];
export const SPIRIT_BOSS_CELLS: SpiritBossCell[] = [101009, 101021].flatMap((seed, block) =>
  (block ? [...identities].reverse() : identities).flatMap(name => bosses.map(boss => {
    const identityId = `breadth-t2-${name}`;
    const c = structuredClone(BREADTH_CELLS.find(c => c.identityId === identityId && c.role === 'boss')!) as SpiritBossCell;
    assert(c);
    const dungeon = [...DUNGEON_DEFS.values()].find(d => d.boss.bossId === boss);
    assert(dungeon && dungeon.biomeTier === 2);
    const spirit = c.className === 'spirit', melee = c.className === 'squire';
    const forest = boss === 'apex-timberclaw';
    const armor = !forest || spirit ? 'mountain' : melee ? 'plains' : 'jungle';
    const charm = !forest || spirit ? 'mountain' : 'swamp';
    Object.assign(c, { id: `sbc-${name}-${forest ? 'forest' : 'mountain'}-s${seed}`, seed, boss,
      nodeId: dungeon.nodeId, targetTypes: [boss], stance: 'offensive-stance',
      abilities: { techniques: ['power-strike'], guards: ['second-wind', 'brace'] },
      preparationNotes: ['Fixed designer boss package; mature synthetic T2; no rites/relic, tuning or rescue variant.'] });
    c.build.id = c.id;
    c.build.gearItemIds = { weapon: c.frame === 'heavy' ? 'quake-hammer' : 'jungle-stinger-rapier',
      armor: `${armor}-vest-t2`, recovery: `${charm}-charm-t2`, mobility: `${melee ? 'mountain' : 'desert'}-boots-t2`, core: 'core-tempered' };
    return c;
  })));
export const SPIRIT_BOSS_BLOCKS = Object.fromEntries(SPIRIT_BOSS_CELLS.map(c =>
  [c.id, { cells: [c], durationMs: 300000, pilotIds: [] as string[] }]));
export function assertSpiritBossDefinitions() {
  assert.equal(SPIRIT_BOSS_CELLS.length, 20);
  assert.equal(new Set(SPIRIT_BOSS_CELLS.map(c => c.id)).size, 20);
  for (const c of SPIRIT_BOSS_CELLS) {
    assert(MONSTER_DATABASE.get(c.boss)?.isBoss);
    assert.equal(c.build.skillPath.length, 2);
    assert.equal(c.upgradeLevel, 5);
    assert(c.runeRules!.some(r => r.conditionId === 'target-casting' && r.targetAbilityId === 'brace'));
    assert.equal(c.runeRules!.some(r => r.actionId === 'orbit'), c.className !== 'squire');
    const peer = SPIRIT_BOSS_CELLS.find(p => p.identityId === c.identityId && p.boss === c.boss && p.seed !== c.seed)!;
    const semantic = (x: SpiritBossCell) => ({ ...x, id: '', seed: 0, build: { ...x.build, id: '' } });
    assert.deepEqual(semantic(c), semantic(peer));
  }
}
