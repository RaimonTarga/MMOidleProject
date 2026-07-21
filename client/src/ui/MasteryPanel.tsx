import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import {
  BIOME_DATABASE,
  MAX_ITEM_TIER,
  MAX_UPGRADE,
  RUNE_POINT_GLOBAL_MASTERY_STEP,
  globalMasteryRequiredForUpgrade,
  runeBudgetForGlobalMastery,
  upgradeCeilingFromGlobalMastery,
} from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  globalMasteryAtom,
} from '../hud/atoms';
import { DialogHeader, GameDialog } from '../hud/primitives';
import './crafting.css';

interface Props {
  onClose: () => void;
}

function milestoneStatus(unlocked: boolean): string {
  return unlocked ? 'OK' : '--';
}

function biomeLabel(group: string): string {
  return BIOME_DATABASE.get(group)?.name ?? group;
}

export function MasteryPanel({ onClose }: Props) {
  const gm = useAtomValue(globalMasteryAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const itemCaps = Array.from({ length: MAX_ITEM_TIER }, (_, i) => ({
    tier: i + 1,
    cap: upgradeCeilingFromGlobalMastery(gm, i + 1),
  }));
  const unlockedCaps = itemCaps.filter(({ cap }) => cap > 0);
  const nextItemTier = itemCaps.find(({ cap }) => cap < MAX_UPGRADE);
  const runeBudget = runeBudgetForGlobalMastery(gm);
  const nextRuneReq =
    (Math.floor(gm / RUNE_POINT_GLOBAL_MASTERY_STEP) + 1) *
    RUNE_POINT_GLOBAL_MASTERY_STEP;

  const biomeRows = useMemo(
    () =>
      Object.entries(biomeLevel)
        .filter(([group, level]) => group !== 'clearing' && level > 0)
        .sort(([a], [b]) => biomeLabel(a).localeCompare(biomeLabel(b))),
    [biomeLevel],
  );

  const runeMilestoneMax =
    Math.max(30, Math.floor(gm / RUNE_POINT_GLOBAL_MASTERY_STEP) * RUNE_POINT_GLOBAL_MASTERY_STEP + 20);
  const runeMilestones = Array.from(
    { length: Math.floor(runeMilestoneMax / RUNE_POINT_GLOBAL_MASTERY_STEP) + 1 },
    (_, i) => i * RUNE_POINT_GLOBAL_MASTERY_STEP,
  );

  return (
    <GameDialog size="standard" className="mastery-dialog" onClose={onClose}>
      <DialogHeader title="Global Mastery" closeLabel="Close global mastery" />
      <div className="mastery-dialog__content">

        <div className="mastery-summary">
          <div className="mastery-summary__main">
            <span className="mastery-summary__label">Global Mastery</span>
            <span className="mastery-summary__value">{gm}</span>
          </div>
          <div className="mastery-summary__stats">
            <span>
              Item cap{' '}
              {unlockedCaps.length === 0
                ? '+0'
                : unlockedCaps.map(({ tier, cap }) => `T${tier} +${cap}`).join(' ')}
            </span>
            <span>{runeBudget} RP</span>
          </div>
        </div>

        <div className="craft-body">
          <section className="craft-biome-section craft-biome-section--current">
            <div className="craft-biome-section__header">
              <span className="craft-biome-section__name">Item Upgrades</span>
              <span className="craft-biome-section__level">per item tier</span>
            </div>
            <div className="craft-unlock-path">
              {itemCaps.map(({ tier, cap }) => {
                const maxed = cap >= MAX_UPGRADE;
                const nextReq = globalMasteryRequiredForUpgrade(tier, Math.min(cap + 1, MAX_UPGRADE));
                return (
                  <div
                    key={tier}
                    className={[
                      'craft-unlock-row',
                      cap > 0 ? 'craft-unlock-row--unlocked' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="craft-unlock-row__level">
                      GM {maxed ? globalMasteryRequiredForUpgrade(tier, MAX_UPGRADE) : nextReq}
                    </span>
                    <span className="craft-unlock-row__name">
                      Tier {tier} items{maxed ? '' : ` — next +${cap + 1}`}
                    </span>
                    <span className="craft-unlock-row__slot">+{cap}</span>
                    <span className={`craft-unlock-row__status${maxed ? ' craft-unlock-row__status--ok' : ''}`}>
                      {milestoneStatus(maxed)}
                    </span>
                  </div>
                );
              })}
            </div>
            {nextItemTier && (
              <div className="mastery-note">
                Next: Tier {nextItemTier.tier} +{nextItemTier.cap + 1} at GM{' '}
                {globalMasteryRequiredForUpgrade(nextItemTier.tier, nextItemTier.cap + 1)}.
              </div>
            )}
          </section>

          <section className="craft-biome-section">
            <div className="craft-biome-section__header">
              <span className="craft-biome-section__name">Rune Points</span>
              <span className="craft-biome-section__level">
                every {RUNE_POINT_GLOBAL_MASTERY_STEP} GM
              </span>
            </div>
            <div className="craft-unlock-path">
              {runeMilestones.map((req) => {
                const unlocked = gm >= req;
                return (
                  <div
                    key={req}
                    className={[
                      'craft-unlock-row',
                      unlocked ? 'craft-unlock-row--unlocked' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="craft-unlock-row__level">GM {req}</span>
                    <span className="craft-unlock-row__name">
                      {runeBudgetForGlobalMastery(req)} rune points
                    </span>
                    <span className="craft-unlock-row__slot">RP</span>
                    <span className={`craft-unlock-row__status${unlocked ? ' craft-unlock-row__status--ok' : ''}`}>
                      {milestoneStatus(unlocked)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mastery-note">
              Next rune point at GM {nextRuneReq}.
            </div>
          </section>

          <section className="craft-biome-section">
            <div className="craft-biome-section__header">
              <span className="craft-biome-section__name">Biome Levels</span>
              <span className="craft-biome-section__level">{biomeRows.length} biomes</span>
            </div>
            {biomeRows.length === 0 ? (
              <div className="craft-empty">No mastery yet.</div>
            ) : (
              <div className="mastery-biome-grid">
                {biomeRows.map(([group, level]) => (
                  <div key={group} className="mastery-biome-row">
                    <span>{biomeLabel(group)}</span>
                    <strong>Lv {level}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </GameDialog>
  );
}
