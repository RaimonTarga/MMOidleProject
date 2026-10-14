import { useMemo, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import {
  BIOME_DATABASE,
  biomeLevelCap,
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
} from '../hud/primitives';
import { BiomeIcon } from './map/BiomeIcon';
import { tileColor } from './map/constants';
import { GameIcon } from './GameIcon';
import { masterySectionIconSource } from './systemIcons';
import './crafting.css';

interface Props {
  onClose: () => void;
}

function biomeLabel(group: string): string {
  return BIOME_DATABASE.get(group)?.name ?? group;
}

export function MasteryPanel({ onClose }: Props) {
  const gm = useAtomValue(globalMasteryAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const playerTier = useAtomValue(playerTierAtom);

  const biomeRows = useMemo(
    () =>
      Object.entries(biomeLevel)
        .filter(([group, level]) => group !== 'clearing' && level > 0)
        .sort(([a], [b]) => biomeLabel(a).localeCompare(biomeLabel(b))),
    [biomeLevel],
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

        {/* Self-labelling figures instead of a headline plus a comma-joined
            sentence of caps. */}
        <div className="mastery-summary">
          <GlyphTile
            value={gm}
            label="Global Mastery"
            icon={masterySectionIconSource('summary')}
            fallback={null}
          />
        </div>

        <div className="craft-body">
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
                  // max(): legacy saves may sit above a retired biome's cap (T3 pass).
                  const cap = Math.max(biomeLevelCap(playerTier, group), level);
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
