/**
 * Keeping `holdsInventory.lineages` in step with what the player actually holds.
 *
 * Split out of `lineages.ts` so the ordinary equip path can call it without
 * importing the handlers, which import the equip path back.
 */
import { LINEAGE_DATABASE, baseFormRecipeId, emptyLineageProgress, lineageForRecipeId } from '@mmo-idle/shared';
import type { LineageDefinition, LineageProgress } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { mutateSlice } from '../../../ecs/dirtyHelpers';

/**
 * The player's tree for a lineage, created on first touch.
 *
 * A tree is born the moment the player holds the lineage's crafted T1 form —
 * there is no separate "unlock the tree" step, because the slot holds the
 * lineage and the base form IS how you take the slot (design §2).
 */
export function ensureLineageProgress(
  world: World,
  entity: PlayerEntity,
  lineage: LineageDefinition,
): LineageProgress {
  const existing = entity.holdsInventory.lineages?.[lineage.id];
  if (existing) return existing;

  const base = baseFormRecipeId(lineage);
  const held = base !== undefined
    && (entity.holdsInventory.inventory.includes(base)
      || entity.holdsInventory.equipment[lineage.slot] === base);
  // A player who does not hold the base form gets a TRANSIENT empty tree that is
  // never saved. Persisting it was review finding B1 (2026-10-02): every lineage
  // request wrote `{ownedForms: []}`, and hydration then handed that tree its base
  // form, so twenty rejected requests and a relog were twenty free T1 items. The
  // handlers write a tree only on success, and only through `writeLineageProgress`.
  if (!held) return { ownedCards: [], active: {}, ownedForms: [], wornForm: '' };

  const fresh = emptyLineageProgress(lineage);
  mutateSlice(world, entity, 'holdsInventory', (inv) => {
    inv.lineages = { ...(inv.lineages ?? {}), [lineage.id]: fresh };
  });
  return fresh;
}

/**
 * Write one lineage's tree from an updater over its current state. The current
 * state is the saved tree when there is one, else the transient `fallback` the
 * handler validated against, so a successful action on a tree that was never
 * saved creates it here and nowhere else.
 */
export function writeLineageProgress(
  world: World,
  entity: PlayerEntity,
  lineageId: string,
  fallback: LineageProgress,
  update: (current: LineageProgress) => LineageProgress,
): void {
  mutateSlice(world, entity, 'holdsInventory', (inv) => {
    const saved = inv.lineages?.[lineageId];
    const next = update(saved ?? fallback);
    // A tree that was never saved and still holds nothing (a row cleared on a
    // lineage the player has no form of) is not worth a record.
    if (!saved && next.ownedForms.length === 0 && next.ownedCards.length === 0) return;
    inv.lineages = { ...(inv.lineages ?? {}), [lineageId]: next };
  });
}

/**
 * Give every lineage the player already holds a form of its tree.
 *
 * Runs on load, after crafting, and after equipping. Two cases matter:
 *
 *  - The ordinary one: crafting the T1 base form IS how you take the slot's
 *    lineage (design §2), so the tree opens with it rather than asking for a
 *    second purchase.
 *  - The legacy one: a save written before Phase 1 may hold a TIER-2 form it
 *    evolved up the old +N ladder — a Gale Needle with no Flash Rapier left.
 *    That form was paid for, so every form of the lineage the character holds
 *    is recorded as owned, which is the "retained forms" half of the removal
 *    policy. Cards are never granted: nothing was ever paid for one.
 *
 * Idempotent: relogging must not duplicate a form.
 */
export function syncLineagesFromInventory(world: World, entity: PlayerEntity): void {
  for (const lineage of LINEAGE_DATABASE.values()) {
    const equipped = entity.holdsInventory.equipment[lineage.slot];
    const held = lineage.forms
      .map((f) => f.recipeId)
      .filter((id) => entity.holdsInventory.inventory.includes(id) || equipped === id);
    if (held.length === 0) continue;

    const current = entity.holdsInventory.lineages?.[lineage.id];
    const missing = held.filter((id) => !current?.ownedForms.includes(id));
    // The worn form must be one the player holds, and the equipped item wins.
    const worn = (equipped && held.includes(equipped)) ? equipped : (current?.wornForm || held[0]!);
    if (missing.length === 0 && current?.wornForm === worn) continue;

    mutateSlice(world, entity, 'holdsInventory', (inv) => {
      const existing = inv.lineages?.[lineage.id];
      inv.lineages = {
        ...(inv.lineages ?? {}),
        [lineage.id]: {
          ownedCards: existing?.ownedCards ?? [],
          active: existing?.active ?? {},
          ownedForms: [...new Set([...(existing?.ownedForms ?? []), ...held])],
          wornForm: worn,
        },
      };
    });
  }
}

/**
 * Keep `wornForm` honest when the player equips a lineage form through the
 * ordinary inventory path rather than through the tree panel.
 *
 * Without this the two can drift, and `resolveActiveLineages` deliberately
 * contributes nothing when they disagree — so a tree would silently go dark.
 */
export function syncWornFormFromEquipment(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
): void {
  const lineage = lineageForRecipeId(recipeId);
  if (!lineage) return;
  const current = entity.holdsInventory.lineages?.[lineage.id];
  if (current?.wornForm === recipeId) return;
  // Equipping a form the player somehow holds without having paid its gate also
  // records it as owned: the item in their hands is the authority.
  mutateSlice(world, entity, 'holdsInventory', (inv) => {
    const existing = inv.lineages?.[lineage.id];
    inv.lineages = {
      ...(inv.lineages ?? {}),
      [lineage.id]: {
        ownedCards: existing?.ownedCards ?? [],
        active: existing?.active ?? {},
        ownedForms: [...new Set([...(existing?.ownedForms ?? []), recipeId])],
        wornForm: recipeId,
      },
    };
  });
}
