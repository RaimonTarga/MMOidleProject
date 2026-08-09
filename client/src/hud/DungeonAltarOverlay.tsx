import { useAtomValue } from "jotai";
import { dungeonGauntletAtom, playerNodeIdAtom, playerPosAtom } from "./atoms";
import { hudBus } from "../hudBus";
import "./hud.css";

function distanceSq(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function cooldownLabel(ms: number | undefined): string {
  const seconds = Math.max(0, Math.ceil((ms ?? 0) / 1000));
  return `Altar Reforming... ${seconds}s`;
}

function awakeningLabel(ms: number | undefined): string {
  const seconds = Math.max(0, Math.ceil((ms ?? 0) / 1000));
  return `Boss Awakening... ${seconds}s`;
}

export function DungeonAltarOverlay() {
  const gauntlet = useAtomValue(dungeonGauntletAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const pos = useAtomValue(playerPosAtom);

  if (!gauntlet || nodeId !== gauntlet.nodeId) return null;

  const near =
    !!pos &&
    distanceSq(pos, gauntlet.altar) <=
      gauntlet.altar.activationRadius * gauntlet.altar.activationRadius;
  const canBegin = gauntlet.status === "idle" && near && gauntlet.canActivate;

  const buttonText = (() => {
    if (gauntlet.status === "cooldown") return cooldownLabel(gauntlet.cooldownRemainingMs);
    if (gauntlet.status === "bossAwakening") return awakeningLabel(gauntlet.bossAwakeningRemainingMs);
    if (gauntlet.status === "boss") return "Boss Awakened";
    if (gauntlet.status === "active") return "Trial in Progress";
    return near ? "Activate Trial" : "Move Closer to Altar";
  })();

  const progressText = (() => {
    if (gauntlet.status === "idle") {
      if (gauntlet.preEncounterLabel) {
        return `${gauntlet.guardianAlive}/${gauntlet.guardianTotal} ${gauntlet.preEncounterLabel} threats remain`;
      }
      return `${gauntlet.guardianAlive}/${gauntlet.guardianTotal} guardians remain`;
    }
    if (gauntlet.status === "active") {
      const label = gauntlet.phaseLabel ?? "Trial";
      return `${label}: ${gauntlet.killsInPhase}/${gauntlet.requiredKillsForCurrentPhase} defeated`;
    }
    if (gauntlet.status === "bossAwakening") return "Recover before the boss awakens";
    if (gauntlet.status === "boss") return "Boss awakened";
    return "The altar is reforming";
  })();

  return (
    <div className="dungeon-altar">
      <div className="dungeon-altar__progress">{progressText}</div>
      <button
        className="dungeon-altar__button"
        disabled={!canBegin}
        onClick={() => hudBus.requestActivateDungeonAltar()}
      >
        {buttonText}
      </button>
    </div>
  );
}
