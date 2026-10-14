import type { EquippedRule } from "@mmo-idle/shared";
import type { Observation } from "../state/observation";
import type { Intents, CraftOutcome } from "../net/intents";
import { BuildError, runeLoadoutKey, validateRuneLoadout } from "./runes";

export interface RuneLoadoutControl {
  obs: Observation;
  intents: Pick<Intents, "setRuneLoadout">;
  wait(predicate: () => boolean, what: string): Promise<void>;
  mutate(send: () => Promise<CraftOutcome>): Promise<CraftOutcome>;
  report(detail: Record<string, unknown>): void;
}

/**
 * Equip exactly `rules`, in order, and verify the authoritative view agrees.
 * No rollback is claimed: a failed application is recorded and terminal.
 */
export async function applyRuneLoadout(rules: EquippedRule[], control: RuneLoadoutControl): Promise<void> {
  const { obs, intents } = control;
  const requested = structuredClone(rules);
  const diagnostics = () => ({ requested, observed: obs.self ? structuredClone(obs.self.runesEquipped) : null });
  try {
    if (!obs.self) throw new BuildError("STATE_SYNC_FAILURE", "No synchronized player");
    const issues = validateRuneLoadout(requested, obs.self);
    control.report({ phase: "preflight", ...diagnostics(), issues });
    if (issues.length) throw new BuildError(issues[0].code, issues.map(i => i.reason).join("; "), { issues });
    const converged = () => !!obs.self && runeLoadoutKey(obs.self.runesEquipped) === runeLoadoutKey(requested);
    if (converged()) {
      control.report({ phase: "verified", ...diagnostics(), idempotent: true });
      return;
    }
    const result = await control.mutate(() => intents.setRuneLoadout(requested));
    if (!result.success) {
      const reason = result.reason ?? "Unspecified loadout rejection";
      const code = /not learned|unowned/.test(reason) ? "MISSING_UNLOCK"
        : /Unknown|Malformed/.test(reason) ? "STALE_IMPLEMENTATION" : "GAME_REJECTION";
      throw new BuildError(code, reason, { system: "runes", result });
    }
    try { await control.wait(converged, "runes authoritative state"); }
    catch (error) { throw new BuildError("STATE_SYNC_FAILURE", "Accepted runes did not converge", { cause: String(error) }); }
    control.report({ phase: "verified", ...diagnostics() });
  } catch (error) {
    const failure = error instanceof BuildError ? error : new BuildError("STATE_SYNC_FAILURE", String(error));
    control.report({ phase: "failed", code: failure.code, reason: failure.message, ...failure.detail, ...diagnostics() });
    throw failure;
  }
}
