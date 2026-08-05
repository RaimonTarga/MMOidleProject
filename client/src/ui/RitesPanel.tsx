import { useAtomValue } from "jotai";
import { RITE_DATABASE, riteDef, type RiteDef } from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import { equippedRitesAtom, knownRitesAtom, riteSlotsAtom } from "../hud/atoms";
import { LoadoutBrowser, type LoadoutSlot } from "./LoadoutBrowser";
import { riteIconSource } from "./conceptIcons";
import "./buildPanel.css";

export function RitesPanelContent() {
  const known = useAtomValue(knownRitesAtom);
  const equipped = useAtomValue(equippedRitesAtom);
  const slotCount = useAtomValue(riteSlotsAtom);

  /** The server takes the whole dense list, so clearing removes rather than blanks. */
  function setSlot(index: number, riteId: string | null): void {
    const next = [...equipped];
    if (riteId === null) next.splice(index, 1);
    else next[index] = riteId;
    const cleaned = [...new Set(next.filter((id): id is string => !!id))];
    hudBus.requestSetRiteLoadout(cleaned);
  }

  const slots: LoadoutSlot[] = Array.from({ length: slotCount }, (_, index) => ({
    key: String(index),
    label: `Rite ${index + 1}`,
    hint: "Always-on between-fight behavior.",
    currentId: equipped[index] ?? null,
  }));

  function candidatesFor(key: string) {
    const index = Number(key);
    const usedElsewhere = new Set(equipped.filter((_id, other) => other !== index));
    return known
      .map((id) => RITE_DATABASE.get(id))
      .filter((rite): rite is RiteDef => !!rite)
      .map((rite) => ({
        id: rite.id,
        name: rite.name,
        blurb: rite.blurb,
        icon: riteIconSource(rite.id),
        disabledReason: usedElsewhere.has(rite.id) ? "Already in another slot" : undefined,
      }));
  }

  return (
    <LoadoutBrowser
      label="Rite slots"
      iconKind="rite"
      slots={slots}
      candidatesFor={candidatesFor}
      nameOf={(id) => riteDef(id)?.name ?? null}
      blurbOf={(id) => riteDef(id)?.blurb ?? ""}
      iconOf={riteIconSource}
      onEquip={(key, id) => setSlot(Number(key), id)}
      emptyCandidates="Learn rites in Crafting → Craft to fill this slot."
    />
  );
}
