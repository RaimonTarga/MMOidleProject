import type { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { resolveEmpoweredMultiplier } from '@mmo-idle/shared';
import { combatArchetypeAtom, dodgeRateAtom, evadeChargeAtom, evadeMitigationAtom, passivesAtom } from '../atoms';
import type { MechanicViewModel } from './types';

/**
 * What the class mechanic in front of you actually does, with the numbers it is
 * currently running on.
 *
 * The instruments are deliberately wordless — they are a gauge you read at a
 * glance mid-fight — which left the rules behind them undocumented anywhere in
 * the game. This is the explanation layer for them, in the same hover grammar
 * the character sheet and the skill tree use.
 *
 * Copy states the RULE and then this character's current values, so it stays
 * true when a passive changes the threshold or the multiplier.
 */

const pct = (value: number): string => `${Math.round(value * 100)}%`;

function EmpoweredNote({ archetype }: { archetype: string | null }) {
  const passives = useAtomValue(passivesAtom);
  const empowered = resolveEmpoweredMultiplier(passives ?? {}, archetype);
  if (!empowered) return null;
  return (
    <div style={{ marginTop: 6 }}>
      Your empowered attack currently hits for ×{empowered.effective.toFixed(2)}.
    </div>
  );
}

export function useMechanicHelp(model: MechanicViewModel): ReactNode {
  const archetype = useAtomValue(combatArchetypeAtom);

  switch (model.kind) {
    case 'cadence': {
      const setupHits = Math.max(1, model.threshold - 1);
      return (
        <>
          <div>
            Landing attacks builds cadence. Every {setupHits} attack
            {setupHits === 1 ? '' : 's'} arms the next one as an empowered
            finisher, and landing it resets the count.
          </div>
          <div style={{ marginTop: 6 }}>
            {model.armed
              ? 'Armed now — your next attack is the finisher.'
              : `${model.count} of ${setupHits} landed.`}
          </div>
          <EmpoweredNote archetype={archetype} />
        </>
      );
    }

    case 'cooldown':
      return (
        <>
          <div>
            Your execution charges on a timer while you fight normally. When it
            comes up, your next attack is the execution — you do not spend it
            manually, and it will not fire without a target.
          </div>
          <div style={{ marginTop: 6 }}>
            {model.executionReady
              ? 'Ready now — your next attack executes.'
              : `${Math.round(model.executionPct)}% charged.`}
            {model.isChanneling && ' Channelling.'}
          </div>
          <EmpoweredNote archetype={archetype} />
        </>
      );

    case 'energy':
      return (
        <>
          <div>
            Every landed hit generates energy. At full energy your next attack
            discharges it as an empowered strike, emptying the bank.
          </div>
          <div style={{ marginTop: 6 }}>
            {model.empowered
              ? 'Full — your next attack discharges.'
              : `${Math.round(model.value)} of ${Math.round(model.max)} energy (${Math.round(model.pct)}%).`}
          </div>
          <EmpoweredNote archetype={archetype} />
        </>
      );

    case 'reload':
      return model.mode === 'ammo' ? (
        <>
          <div>
            You fire from a magazine. Empty it and you reload, which takes time
            you are not attacking for — the trade is that a full magazine fires
            faster than a single continuous attacker.
          </div>
          <div style={{ marginTop: 6 }}>
            {model.ammo} of {model.ammoMax} rounds loaded.
          </div>
          <div style={{ marginTop: 6 }}>
            While reloading, damage is halved and attack speed doubled as a final
            layer — the same total, delivered differently.
          </div>
        </>
      ) : (
        <>
          <div>
            Sustained fire builds heat. Overheat and you stop firing until it
            vents, so the skill is riding the gauge rather than emptying it.
          </div>
          <div style={{ marginTop: 6 }}>
            {model.overheated
              ? 'Overheated — venting before you can fire again.'
              : `${Math.round(model.heatPct)}% heat.`}
          </div>
        </>
      );

    case 'dot':
      return (
        <>
          <div>
            Your hits convert part of their damage into {model.stackLabel} rather
            than dealing it up front. Each stack ticks on its own timer, and
            stacks refresh as you keep hitting the same target.
          </div>
          <div style={{ marginTop: 6 }}>
            {model.hasTarget
              ? `${model.stacks} of ${model.maxStacks} stacks on your target.`
              : 'No target — stacks show once you are fighting something.'}
          </div>
          <div style={{ marginTop: 6 }}>
            Damage per stack comes from your attack, your conversion percentage
            and your max stacks together, so raising max stacks alone does not
            raise total damage.
          </div>
          {model.showsChill && (
            <div style={{ marginTop: 6 }}>
              Chill stacks slow the target's movement and attacks; filling them
              freezes it.
            </div>
          )}
        </>
      );

    case 'summoner':
      return (
        <>
          <div>
            Your minions fight for you and are replaced on a timer when they die.
            They inherit a share of your attack and health, so your own gear
            makes the whole pack stronger.
          </div>
          <div style={{ marginTop: 6 }}>
            {model.activeCount} of {model.slotCount} minions alive.
          </div>
        </>
      );
  }
}

/**
 * Evasion's explanation. Separate from the class mechanics because evasion is
 * not one — it appears beside whichever mechanic you have.
 */
export function useEvasionHelp(): ReactNode {
  const dodgeRate = useAtomValue(dodgeRateAtom);
  const charge = useAtomValue(evadeChargeAtom);
  const mitigation = useAtomValue(evadeMitigationAtom);
  const hitsAway = dodgeRate > 0 ? Math.max(1, Math.ceil((1 - charge) / dodgeRate)) : 0;
  const primed = charge + dodgeRate >= 1;

  return (
    <>
      <div>
        Evasion is deterministic — there is no dice roll. Every hit you take adds
        your evasion rate to a charge, and when the charge fills, that hit is
        evaded and the charge resets.
      </div>
      <div style={{ marginTop: 6 }}>
        At {pct(dodgeRate)} evasion you evade reliably every{' '}
        {Math.max(1, Math.ceil(1 / dodgeRate))} hits.
      </div>
      <div style={{ marginTop: 6 }}>
        An evade avoids {pct(mitigation)} of the hit — not automatically all of
        it. Evade mitigation from gear and passives pushes that toward a full
        block.
      </div>
      <div style={{ marginTop: 6 }}>
        An evaded hit also applies no debuffs or damage-over-time, unless the
        attacker specifically pierces evasion.
      </div>
      <div style={{ marginTop: 6 }}>
        {primed
          ? 'Primed — the next hit you take will be evaded.'
          : `${Math.round(charge * 100)}% charged, ${hitsAway} hit${hitsAway === 1 ? '' : 's'} until the next evade.`}
      </div>
    </>
  );
}
