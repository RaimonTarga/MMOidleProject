import { useAtomValue } from "jotai";
import { dungeonAtom, playerNodeIdAtom, playerPosAtom } from "./atoms";
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
  const dungeon = useAtomValue(dungeonAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const pos = useAtomValue(playerPosAtom);

  if (!dungeon || nodeId !== dungeon.nodeId) return null;

  const near =
    !!pos &&
    distanceSq(pos, dungeon.altar) <=
      dungeon.altar.activationRadius * dungeon.altar.activationRadius;
  const canBegin = dungeon.status === "idle" && near && dungeon.canActivate;

  const buttonText = (() => {
    if (dungeon.status === "cooldown") return cooldownLabel(dungeon.cooldownRemainingMs);
    if (dungeon.status === "bossAwakening") return awakeningLabel(dungeon.bossAwakeningRemainingMs);
    if (dungeon.status === "boss") return "Boss Awakened";
    return near ? "Disturb the Altar" : "Move Closer to Altar";
  })();

  const progressText = (() => {
    if (dungeon.status === "idle") {
      return `${dungeon.guardLabel}: ${dungeon.guardianAlive}/${dungeon.guardianTotal} guardians remain`;
    }
    if (dungeon.status === "bossAwakening") {
      return dungeon.guardianAlive > 0
        ? `${dungeon.guardianAlive} guardians still stand`
        : "The guard is broken";
    }
    if (dungeon.status === "boss") return "Boss awakened";
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
