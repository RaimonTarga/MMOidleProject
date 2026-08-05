import { useAtomValue } from "jotai";
import {
  STANCE_DATABASE,
  stanceDef,
  type StanceDef,
  type StanceSlot,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  activeStanceAtom,
  equippedStancesAtom,
  knownStancesAtom,
} from "../hud/atoms";
import { LoadoutBrowser, type LoadoutSlot } from "./LoadoutBrowser";
import { stanceIconSource } from "./conceptIcons";
import "./buildPanel.css";

const SLOTS: { slot: StanceSlot; label: string; hint: string }[] = [
  { slot: "default", label: "Default", hint: "Your baseline combat posture." },
  { slot: "reactive", label: "Reactive", hint: "Used by Switch Stance rune rules." },
];

export function StancesPanelContent() {
  const known = useAtomValue(knownStancesAtom);
  const equipped = useAtomValue(equippedStancesAtom);
  const active = useAtomValue(activeStanceAtom);

  const slots: LoadoutSlot[] = SLOTS.map(({ slot, label, hint }) => {
    const currentId = equipped[slot];
    return {
      key: slot,
      label,
      hint,
      currentId,
      badge: currentId !== null && currentId === active ? "Active" : undefined,
    };
  });

  const candidates = known
    .map((id) => STANCE_DATABASE.get(id))
    .filter((stance): stance is StanceDef => !!stance)
    .map((stance) => ({
      id: stance.id,
      name: stance.name,
      blurb: stance.blurb,
      icon: stanceIconSource(stance.id),
    }));

  return (
    <LoadoutBrowser
      label="Stance slots"
      iconKind="stance"
      slots={slots}
      candidatesFor={() => candidates}
      nameOf={(id) => stanceDef(id)?.name ?? null}
      blurbOf={(id) => stanceDef(id)?.blurb ?? ""}
      iconOf={stanceIconSource}
      onEquip={(key, id) => hudBus.requestSetStanceLoadout(key as StanceSlot, id)}
      emptyCandidates="Learn stances in Crafting → Craft to fill this slot."
    />
  );
}
