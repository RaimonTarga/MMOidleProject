import { useAtomValue } from 'jotai';
import {
  SEALS_REQUIRED_BY_TIER,
  sealsHeldAtTier,
} from '@mmo-idle/shared';
import {
  bossesClearedAtom,
  playerTierAtom,
} from '../hud/atoms';
import {
  DialogHeader,
  GameDialog,
  GlyphTile,
} from '../hud/primitives';
import { BiomeIcon } from './map/BiomeIcon';
import { sealSourceViewsAtTier } from './sealPresentation';
import './sealLedger.css';

interface Props {
  onClose: () => void;
}

export function SealLedgerPanel({ onClose }: Props) {
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const playerTier = useAtomValue(playerTierAtom);

  const tiers = Object.entries(SEALS_REQUIRED_BY_TIER)
    .map(([tier, required]) => ({ tier: Number(tier), required }))
    .sort((a, b) => a.tier - b.tier);
  const totalHeld = tiers.reduce(
    (sum, { tier }) => sum + sealsHeldAtTier(bossesCleared, tier),
    0,
  );
  const passagesCleared = tiers.filter(({ tier, required }) => (
    sealsHeldAtTier(bossesCleared, tier) >= required
  )).length;

  return (
    <GameDialog size="standard" className="seal-ledger" onClose={onClose}>
      <DialogHeader
        title="Boss Seal Ledger"
        icon={<span className="seal-ledger__header-mark">◆</span>}
        closeLabel="Close boss seal ledger"
      />
      <div className="seal-ledger__content">
        <div className="seal-ledger__intro">
          <div>
            <div className="seal-ledger__eyebrow">Passage record</div>
            <p>
              Every biome guardian carries one seal per tier. Earn the required
              number from distinct bosses; the rest remain optional trophies.
            </p>
          </div>
          <div className="seal-ledger__summary">
            <GlyphTile value={totalHeld} label="Seals held" fallback="◆" size="sm" />
            <GlyphTile
              value={`${passagesCleared}/${tiers.length}`}
              label="Passages"
              fallback="T"
              size="sm"
            />
          </div>
        </div>

        <div className="seal-ledger__tiers">
          {tiers.map(({ tier, required }) => {
            const held = sealsHeldAtTier(bossesCleared, tier);
            const complete = held >= required;
            const current = tier === playerTier;
            const sources = sealSourceViewsAtTier(bossesCleared, tier);

            return (
              <section
                key={tier}
                className={[
                  'seal-ledger-tier',
                  complete ? 'seal-ledger-tier--complete' : '',
                  current ? 'seal-ledger-tier--current' : '',
                ].filter(Boolean).join(' ')}
              >
                <header className="seal-ledger-tier__header">
                  <div className="seal-ledger-tier__crest" aria-hidden="true">
                    <span>T{tier}</span>
                  </div>
                  <div className="seal-ledger-tier__title">
                    <span>Tier {tier} Passage</span>
                    <small>
                      {complete ? 'Passage secured' : `${required - held} still required`}
                    </small>
                  </div>
                  <div className="seal-ledger-tier__progress">
                    <strong>{held} held / {required} need</strong>
                  </div>
                </header>

                <div className="seal-ledger-tier__sources">
                  {sources.map((source) => {
                    const optional = complete && !source.obtained;
                    const status = source.obtained
                      ? 'Obtained'
                      : optional
                        ? 'Optional'
                        : 'Available';
                    return (
                      <div
                        key={source.biomeGroup}
                        className={[
                          'seal-ledger-source',
                          source.obtained ? 'seal-ledger-source--obtained' : '',
                          optional ? 'seal-ledger-source--optional' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        <span className="seal-ledger-source__icon" aria-hidden="true">
                          <BiomeIcon biomeGroup={source.biomeGroup} size={24} />
                        </span>
                        <span className="seal-ledger-source__copy">
                          <strong>{source.name}</strong>
                          <small>{status}</small>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </GameDialog>
  );
}
