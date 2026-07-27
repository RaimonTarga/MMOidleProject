import { useMemo, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import {
  BIOME_DATABASE,
  MAX_ITEM_TIER,
  MAX_UPGRADE,
  RUNE_POINT_GLOBAL_MASTERY_STEP,
  biomeLevelCap,
  globalMasteryRequiredForUpgrade,
  runeBudgetForGlobalMastery,
  upgradeCeilingFromGlobalMastery,
} from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  globalMasteryAtom,
  playerTierAtom,
} from '../hud/atoms';
import {
  DialogHeader,
  EngravedMeter,
  GameDialog,
  GlyphTile,
  MilestonePips,
} from '../hud/primitives';
import { BiomeIcon } from './map/BiomeIcon';
import { tileColor } from './map/constants';
import { GameIcon } from './GameIcon';
import { masterySectionIconSource } from './systemIcons';
import './crafting.css';

interface Props {
  onClose: () => void;
}

/**
 * A milestone is reached or it is not, so it reads as one filled or hollow pip
 * rather than the literal 'OK' / '--' this column used to print. The label is
 * what assistive tech and the tooltip get.
 */
function MilestoneStatus({ unlocked, label }: { unlocked: boolean; label: string }) {
  return (
    <span
      className={`craft-unlock-row__status${unlocked ? ' craft-unlock-row__status--ok' : ''}`}
      title={`${label}: ${unlocked ? 'reached' : 'not yet reached'}`}
    >
      <MilestonePips
        states={[unlocked ? 'done' : 'pending']}
        label={`${label}: ${unlocked ? 'reached' : 'not yet reached'}`}
        tone={unlocked ? 'success' : 'primary'}
      />
    </span>
  );
}

function biomeLabel(group: string): string {
  return BIOME_DATABASE.get(group)?.name ?? group;
}

export function MasteryPanel({ onClose }: Props) {
  const gm = useAtomValue(globalMasteryAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const playerTier = useAtomValue(playerTierAtom);
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
      <DialogHeader
        title="Global Mastery"
        icon={
          <GameIcon
            source={masterySectionIconSource('summary')}
            size={22}
            fallback={null}
            decorative
          />
        }
        closeLabel="Close global mastery"
      />
      <div className="mastery-dialog__content">

        {/* Three self-labelling figures instead of a headline plus a comma-joined
            sentence of caps. */}
        <div className="mastery-summary">
          <GlyphTile
            value={gm}
            label="Global Mastery"
            icon={masterySectionIconSource('summary')}
            fallback={null}
          />
          <GlyphTile
            value={unlockedCaps.length === 0
              ? '+0'
              : `+${Math.max(...unlockedCaps.map(({ cap }) => cap))}`}
            label="Best item cap"
            icon={masterySectionIconSource('items')}
            fallback={null}
            title={unlockedCaps.length === 0
              ? 'No item upgrade tiers unlocked yet'
              : unlockedCaps.map(({ tier, cap }) => `Tier ${tier}: +${cap}`).join(' · ')}
          />
          <GlyphTile
            value={runeBudget}
            label="Rune points"
            icon={masterySectionIconSource('runes')}
            fallback={null}
          />
        </div>

        <div className="craft-body">
          <section className="craft-biome-section craft-biome-section--current">
            <div className="craft-biome-section__header">
              <span className="craft-biome-section__name craft-biome-section__name--icon">
                <GameIcon
                  source={masterySectionIconSource('items')}
                  size={18}
                  fallback={null}
                  decorative
                />
                Item Upgrades
              </span>
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
                    <MilestoneStatus unlocked={maxed} label={`Tier ${tier} items`} />
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
              <span className="craft-biome-section__name craft-biome-section__name--icon">
                <GameIcon
                  source={masterySectionIconSource('runes')}
                  size={18}
                  fallback={null}
                  decorative
                />
                Rune Points
              </span>
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
                    <MilestoneStatus
                      unlocked={unlocked}
                      label={`${runeBudgetForGlobalMastery(req)} rune points`}
                    />
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
              <span className="craft-biome-section__name craft-biome-section__name--icon">
                <GameIcon
                  source={masterySectionIconSource('biomes')}
                  size={18}
                  fallback={null}
                  decorative
                />
                Biome Levels
              </span>
              <span className="craft-biome-section__level">{biomeRows.length} biomes</span>
            </div>
            {biomeRows.length === 0 ? (
              <div className="craft-empty">No mastery yet.</div>
            ) : (
              <div className="mastery-biome-grid">
                {biomeRows.map(([group, level]) => {
                  const cap = biomeLevelCap(playerTier, group);
                  const atCap = cap > 0 && level >= cap;
                  return (
                    <div
                      key={group}
                      className="mastery-biome-row"
                      style={{ '--biome-accent': tileColor(group) } as CSSProperties}
                      title={`${biomeLabel(group)}: level ${level} of ${cap} at tier ${playerTier}`}
                    >
                      <BiomeIcon biomeGroup={group} size={18} className="mastery-biome-row__icon" />
                      <span className="mastery-biome-row__name">{biomeLabel(group)}</span>
                      {/* A level with a tier ceiling is a bounded value, so it
                          earns the engraved grammar — "Lv 4" alone never said
                          how much of this biome was left. */}
                      <EngravedMeter
                        className="mastery-biome-row__meter"
                        fraction={cap > 0 ? level / cap : 0}
                        tone={atCap ? 'warning' : 'primary'}
                        decorative
                      />
                      <strong className="mastery-biome-row__level">
                        {level}<span className="mastery-biome-row__cap">/{cap}</span>
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </GameDialog>
  );
}
