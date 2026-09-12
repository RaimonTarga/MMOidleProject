import { runeBudgetForGlobalMastery } from "@mmo-idle/shared";
import type { Observation } from "../state/observation";
import type { Intents, CraftOutcome } from "../net/intents";
import { BuildError, buildKey, buildRP, observedBuild, validateBuild, type DesiredBuild } from "./loadout";

export interface BuildControl {
  obs: Observation;
  intents: Intents;
  wait(predicate: () => boolean, what: string): Promise<void>;
  mutate(send: () => Promise<CraftOutcome>): Promise<CraftOutcome>;
  report(detail: Record<string, unknown>): void;
}

/** Serial authoritative edits. Clear dependencies/reservations before additions.
 * No rollback is claimed: a failed partial application is recorded and terminal.
 */
export async function applyBuild(desired: DesiredBuild, control: BuildControl): Promise<void> {
  const { obs, intents } = control;
  const requested = structuredClone(desired);
  const diagnostics = () => ({ requested, observed: obs.self ? observedBuild(obs.self) : null,
    observedRP: obs.self ? buildRP(observedBuild(obs.self)) : null,
    budget: obs.self ? runeBudgetForGlobalMastery(obs.self.globalMastery) : null });
  try {
    if (!obs.self) throw new BuildError("STATE_SYNC_FAILURE", "No synchronized player");
    const issues = validateBuild(requested, obs.self);
    control.report({ phase: "preflight", ...diagnostics(), requestedRP: issues.length ? null : buildRP(requested), issues });
    if (issues.length) throw new BuildError(issues[0].code, issues.map(i => i.reason).join("; "), { issues });
    if (buildKey(observedBuild(obs.self)) === buildKey(requested)) {
      control.report({ phase: "verified", ...diagnostics(), idempotent: true });
      return;
    }
    const edit = async (system: string, send: () => Promise<CraftOutcome>, predicate: () => boolean) => {
      if (predicate()) return;
      const result = await control.mutate(send);
      if (!result.success) {
        const reason = result.reason ?? "Unspecified loadout rejection";
        const code = /Runic Points|\bRP\b/.test(reason) ? "INSUFFICIENT_RP"
          : /not learned|unowned/.test(reason) ? "MISSING_UNLOCK"
          : /Unknown|Malformed/.test(reason) ? "STALE_IMPLEMENTATION" : "GAME_REJECTION";
        throw new BuildError(code, reason, { system, result });
      }
      try { await control.wait(predicate, `${system} authoritative state`); }
      catch (error) { throw new BuildError("STATE_SYNC_FAILURE", `Accepted ${system} did not converge`, { cause: String(error) }); }
      control.report({ phase: "applied", system, ...diagnostics() });
    };
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    await edit("clear Rune dependencies", () => intents.setRuneLoadout([]), () => obs.self?.runesEquipped.length === 0);
    await edit("release Rites", () => intents.setRiteLoadout([]), () => obs.self?.equippedRites.length === 0);
    await edit("release abilities", () => intents.setAbilityLoadout({ techniques: [], guards: [] }),
      () => !!obs.self && obs.self.attunedAbilities.techniques.length + obs.self.attunedAbilities.guards.length === 0);
    await edit("release stances", () => intents.setDefaultStance(null, []),
      () => !!obs.self && obs.self.attunedStances.length === 0 && obs.self.equippedStances.default === null);
    await edit("abilities", () => intents.setAbilityLoadout(requested.abilities),
      () => same(obs.self?.attunedAbilities.techniques, requested.abilities.techniques)
        && same(obs.self?.attunedAbilities.guards, requested.abilities.guards));
    await edit("stances", () => intents.setDefaultStance(requested.stances.default, requested.stances.attuned),
      () => same(obs.self?.attunedStances, requested.stances.attuned) && obs.self?.equippedStances.default === requested.stances.default);
    await edit("rites", () => intents.setRiteLoadout(requested.rites), () => same(obs.self?.equippedRites, requested.rites));
    await edit("runes", () => intents.setRuneLoadout(requested.runeRules),
      () => !!obs.self && buildKey({ ...requested, runeRules: obs.self.runesEquipped }) === buildKey(requested));
    if (!obs.self || buildKey(observedBuild(obs.self)) !== buildKey(requested)) throw new BuildError("STATE_SYNC_FAILURE", "Final build mismatch");
    control.report({ phase: "verified", ...diagnostics() });
  } catch (error) {
    const failure = error instanceof BuildError ? error : new BuildError("STATE_SYNC_FAILURE", String(error));
    control.report({ phase: "failed", code: failure.code, reason: failure.message, ...failure.detail, ...diagnostics() });
    throw failure;
  }
}
