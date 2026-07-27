import { useAtomValue } from 'jotai';
import { dodgeRateAtom, evadeChargeAtom, evadeMitigationAtom } from '../atoms';
import { MechanicFrame } from './MechanicFrame';

/**
 * Evasion, in the class-mechanic language. Not a class mechanic — it appears
 * beside whichever one the player has, whenever they have any evasion at all.
 *
 * The point of the instrument is that evasion here is **deterministic**: the
 * charge sums `dodgeRate` per hit taken and evades when it crosses 1. So when
 * `charge + dodgeRate >= 1` the next hit *will* be evaded, and the frame says so
 * rather than hinting at a probability. That satisfies the mechanics' standard
 * of authoritative anticipation — the same reason the DoT widget can show its
 * next tick — and it is the whole reason `charge` is networked.
 *
 * The evade itself already produces a floater (DODGE at full mitigation, GRAZE
 * at partial), so this shows the build-up, not the event.
 */
export function EvasionInstrument() {
  const dodgeRate = useAtomValue(dodgeRateAtom);
  const charge = useAtomValue(evadeChargeAtom);
  const mitigation = useAtomValue(evadeMitigationAtom);

  // dodgeRate > 0 is the client's view of the `evadesHits` component being
  // attached at all — the server only attaches it when the player has evasion.
  if (dodgeRate <= 0) return null;

  const primed = charge + dodgeRate >= 1;
  const pct = Math.min(100, Math.max(0, charge * 100));
  const hitsAway = Math.max(1, Math.ceil((1 - charge) / dodgeRate));
  const mitigationPct = Math.round(mitigation * 100);

  return (
    <MechanicFrame
      kind="evasion"
      title="Evasion"
      state={primed ? 'primed' : undefined}
      status={
        <span
          title={
            `Evasion is deterministic — no dice. Each hit taken adds `
            + `${Math.round(dodgeRate * 100)}% charge, and at full charge the hit is `
            + `evaded for ${mitigationPct}% less damage.`
          }
        >
          {mitigationPct}%
        </span>
      }
    >
      <div
        className="evasion-gauge"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={primed
          ? 'Evasion primed: the next hit taken will be evaded'
          : `Evasion charge ${Math.round(pct)}%, ${hitsAway} hits until the next evade`}
      >
        <span className="evasion-gauge__track">
          <span className="evasion-gauge__fill" style={{ width: `${pct}%` }} />
          {/* The threshold the charge is climbing toward, drawn where the next
              hit's contribution would land it. */}
          <span
            className="evasion-gauge__threshold"
            style={{ left: `${Math.min(100, (1 - dodgeRate) * 100)}%` }}
            aria-hidden="true"
          />
        </span>
        <span className="evasion-gauge__ticks" aria-hidden="true">
          {Array.from({ length: Math.min(8, hitsAway) }, (_, i) => (
            <i key={i} className="evasion-gauge__tick" />
          ))}
        </span>
      </div>
    </MechanicFrame>
  );
}
