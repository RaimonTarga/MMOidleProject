/**
 * The Stats panel (design §26.4): a panel of its own in the menu, in the dense
 * ordered layout of the prototype run's thesis D — offence, defence, recovery,
 * movement & rhythm — every number with its source, the lean's share in its
 * lane colour. It replaces the Character panel's expanding details ("nothing
 * expands on the left any more"); the explained reference rows that lived there
 * (rites, defence and mobility passives) close the panel.
 *
 * Everything shown is `buildStatsPanel` (statsPanelModel.ts), which reads the
 * server's own stat formula on a detached copy. This file only lays it out.
 */
import { useMemo, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import { riteDef } from '@mmo-idle/shared';
import {
  activeStanceAtom,
  barrierMaxAtom,
  combatArchetypeAtom,
  equipmentAtom,
  equippedRitesAtom,
  hpAtom,
  itemUpgradesAtom,
  lineagesAtom,
  maxHpAtom,
  passivesAtom,
  playerIdAtom,
  playerTierAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  unlockedSkillsAtom,
} from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { DefensePassivesSection, MobilityPassivesSection, StatRow } from '../../hud/stat/components';
import { buildStatsPanel, type StatsGroup, type StatsSource } from './statsPanelModel';
import './stats.css';

type LaneStyle = CSSProperties & { '--lane': string };

function Source({ source }: { source: StatsSource }) {
  const style = source.color ? ({ '--lane': source.color } as LaneStyle) : undefined;
  return (
    <span className={`sp-src sp-src--${source.kind}`} style={style}>
      {source.amount && <b>{source.amount}</b>}
      {source.amount ? ' ' : ''}{source.label}
    </span>
  );
}

function Group({ group }: { group: StatsGroup }) {
  return (
    <section className={`sp-group sp-group--${group.key}`} aria-label={group.title}>
      <h3>{group.title}</h3>
      {group.rows.map((row) => (
        <div key={row.key} className="sp-row">
          <span className="sp-row__k">{row.label}</span>
          <span className="sp-row__v">{row.value}</span>
          <span className="sp-row__src">
            {row.sources.map((source, i) => <Source key={`${source.kind}:${source.label}:${i}`} source={source} />)}
          </span>
        </div>
      ))}
    </section>
  );
}

/** The panel's body, shared by the desktop dialog and the phone's Stats sheet. */
export function StatsView() {
  const playerId = useAtomValue(playerIdAtom);
  const equipment = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const passives = useAtomValue(passivesAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const lineages = useAtomValue(lineagesAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const barrierMax = useAtomValue(barrierMaxAtom);
  const hpFraction = hp / Math.max(1, maxHp);

  const data = useMemo(() => buildStatsPanel({
    build: {
      usesSkills: {
        unlockedSkills, passives, selectedClass: combatArchetype ? `${combatArchetype}-root` : null,
        selectedSubVariant, selectedRange, combatArchetype,
      },
      equipment, itemUpgrades, playerTier, activeStance, equippedRites, hpFraction, lineages,
    },
    barrierMax,
  }), [unlockedSkills, passives, combatArchetype, selectedSubVariant, selectedRange, equipment,
    itemUpgrades, playerTier, activeStance, equippedRites, hpFraction, lineages, barrierMax]);

  if (!playerId) return <div className="sp-empty">Not connected.</div>;

  const rites = equippedRites.flatMap((id) => {
    const def = riteDef(id);
    return def ? [def] : [];
  });

  return (
    <div className="sp-body">
      {data.lean && (
        <p className="sp-lean" style={{ '--lane': data.lean.color } as LaneStyle}>
          <span className="sp-lean__tag">Lean</span>
          <b>{data.lean.name}</b>
          {data.lean.rank && <span className="sp-lean__rank">{data.lean.rank}</span>}
          {data.lean.sentence && <span className="sp-lean__sentence">{data.lean.sentence}</span>}
        </p>
      )}
      <div className="sp-grid">
        {data.groups.map((group) => <Group key={group.key} group={group} />)}
      </div>
      <p className="sp-note">
        Each number says where it comes from: an item, your lean (in its lane colour), or the base you started with.
      </p>
      <div className="sp-more">
        <div className="stat-section">
          <div className="stat-section-title">Rites</div>
          {rites.length > 0
            ? rites.map((rite) => <StatRow key={rite.id} label={rite.name} value={`${rite.runeCost} RP`} help={rite.blurb} />)
            : <StatRow label="Equipped" value="None" dim />}
        </div>
        <DefensePassivesSection passives={passives ?? {}} />
        <MobilityPassivesSection passives={passives ?? {}} />
      </div>
    </div>
  );
}

export function StatsPanel({ onClose }: { onClose: () => void }) {
  return (
    <GameDialog size="wide" className="stats-dialog" onClose={onClose}>
      <DialogHeader title="Stats" closeLabel="Close stats" />
      <div className="sp-scroll">
        <StatsView />
      </div>
    </GameDialog>
  );
}
