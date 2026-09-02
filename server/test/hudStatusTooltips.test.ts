// Wiring + formatting test for the HUD's status explanation layer.
//
// It lives in server/test/ for the same reason describeText.test.ts does: the
// runner only discovers `server/test/` and `shared/src/`, and everything under
// test here is pure data-in/data-out with no DOM — the builders in
// `client/src/hud/statusTooltips.ts` deliberately return plain content objects
// so the rendering component is the only part that needs a browser.
//
// What it holds:
//   - every buff that can reach the wire has authored explanatory copy;
//   - an UNKNOWN status still produces a legible card rather than a blank or a
//     throw, so shipping a new mechanic before its wording is not a crash;
//   - the tooltip reads the SERVER-RESOLVED value (a slow after resistance),
//     not the authored one, and not a string parsed back out of `logDetail`;
//   - abilities resolve their rank from player tier and report ready/cooling/
//     casting honestly.
//
// Nothing here asserts a balance number.

import {
  BUFF_IDS,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityDef,
  applyStatusEffect,
  emptyEquipment,
  type AbilityDef,
  type PlayerBuff,
  type TargetStatusView,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { syncPlayerBuffs } from "../src/systems/combat/buffs/buffSync";
import { World } from "../src/world/World";
import {
  authoredStatusIds,
  buffHelp,
  prettifyStatusId,
  targetStatusHelp,
} from "../../client/src/hud/statusHelp";
import {
  abilityAccessibleLabel,
  abilityTooltipContent,
  bossEffectTooltipContent,
  buffTooltipContent,
  targetStatusTooltipContent,
} from "../../client/src/hud/statusTooltips";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const BAD = /NaN|undefined|\[object|^\s*$/;

/** Every string a player can read on a card, flattened. */
function readableStrings(content: {
  title: string;
  kicker?: string;
  body?: string;
  rows?: readonly { label: string; value: string }[];
  current?: readonly { label: string; value: string }[];
  footnote?: string;
}): string[] {
  return [
    content.title,
    content.kicker ?? "",
    content.body ?? "",
    content.footnote ?? "",
    ...(content.rows ?? []).flatMap((r) => [r.label, r.value]),
    ...(content.current ?? []).flatMap((r) => [r.label, r.value]),
  ].filter((s) => s.length > 0);
}

function assertLegible(content: Parameters<typeof readableStrings>[0], what: string): void {
  for (const text of readableStrings(content)) {
    assert(!BAD.test(text), `${what}: unreadable tooltip text ${JSON.stringify(text)}`);
  }
}

// ── Coverage: every wire-visible buff explains itself ────────────────────────
{
  const missing = BUFF_IDS.filter((id) => buffHelp(id) === undefined);
  assert(
    missing.length === 0,
    `every BuffId needs authored copy in client/src/hud/statusHelp.ts — missing: ${missing.join(", ")}`,
  );

  // The registry must not accumulate copy for ids that no longer exist: a stale
  // entry is copy nobody will ever see, and it hides the fact that the real id
  // renamed. Target/boss ids are raw effect names and are deliberately exempt.
  const live = new Set<string>(BUFF_IDS);
  const stale = authoredStatusIds().player.filter((id) => !live.has(id));
  assert(stale.length === 0, `statusHelp has copy for dead buff ids: ${stale.join(", ")}`);
}

// ── Fallback: an unauthored status is still legible ──────────────────────────
{
  const unknown: PlayerBuff = {
    id: "not-a-real-buff-id" as PlayerBuff["id"],
    label: "WEIRD",
    stacks: 3,
    durationPct: 50,
    color: "#888888",
    category: "neutral",
    iconKey: "not-a-real-buff-id",
    shape: "square",
  };
  const content = buffTooltipContent(unknown);
  assertLegible(content, "unknown buff");
  assert(content.title.length > 0, "an unknown buff must still have a title");
  assert((content.body ?? "").length > 0, "an unknown buff must still have body copy");
  assert(
    content.current?.some((row) => row.label === "Stacks" && row.value === "3"),
    "an unknown buff should still report the state the client does know",
  );

  assert(prettifyStatusId("debuff-frost-ramp") === "Frost Ramp", "prettify should drop the namespace");
  assert(prettifyStatusId("mob-sprint") === "Sprint", "prettify should drop the mobility namespace");
  assert(
    targetStatusHelp("expose-weakness") !== undefined,
    "the ability debuff on a monster must be explained on the target frame",
  );
  // A mechanic with only a player-side entry still resolves through the target
  // lookup, so one edit covers both frames instead of two paraphrases drifting.
  assert(
    targetStatusHelp("debuff-sundered") !== undefined,
    "target lookup should fall back to the player-side entry for a shared id",
  );
}

// ── Structured values, never parsed prose ───────────────────────────────────
{
  const frost: PlayerBuff = {
    id: "debuff-frost-ramp",
    label: "FROST",
    stacks: 4,
    durationPct: 60,
    remainingMs: 3200,
    color: "#aaddff",
    category: "neutral",
    iconKey: "debuff-frost-ramp",
    shape: "diamond",
    logDetail: "move -28%, attack -16%",
    values: [
      { label: "Stacks", value: "4" },
      { label: "Movement speed", value: "-28%", good: false },
      { label: "Attack cooldown", value: "+16%", good: false },
    ],
  };
  const content = buffTooltipContent(frost);
  assertLegible(content, "frost");
  const labels = (content.current ?? []).map((r) => r.label);
  assert(
    labels.filter((l) => l === "Stacks").length === 1,
    "a projection that publishes its own Stacks row must not get a second one",
  );
  assert(
    content.current?.some((r) => r.label === "Movement speed" && r.value === "-28%"),
    "structured values must survive into the CURRENT block",
  );
  assert(
    content.current?.some((r) => r.label === "Remaining" && r.value === "3.2s"),
    "remainingMs must be rendered as seconds — durationPct alone cannot be",
  );
}

// ── Target statuses ─────────────────────────────────────────────────────────
{
  const dot: TargetStatusView = {
    id: "dot",
    stacks: 5,
    remainingMs: 4000,
    totalMs: 6000,
    values: [
      { label: "Damage per stack", value: "12 per tick", good: true },
      { label: "Damage per tick", value: "60", good: true },
    ],
  };
  const content = targetStatusTooltipContent(dot, "DoT");
  assertLegible(content, "target dot");
  assert(
    content.current?.some((r) => r.label === "Damage per tick" && r.value === "60"),
    "a target DoT should report what it is actually doing per tick",
  );
  assert(
    content.current?.some((r) => r.label === "Remaining"),
    "a timed target status should report its remaining time",
  );

  const permanent = targetStatusTooltipContent(
    { id: "plating-shred", stacks: 3, remainingMs: -1, totalMs: 0 },
    "Shred",
  );
  assertLegible(permanent, "permanent target status");
  assert(
    permanent.current?.some((r) => r.value === "Permanent"),
    "a permanent status must say so rather than showing an empty clock",
  );

  // A status the server publishes no magnitudes for still gets a full card.
  const bare = targetStatusTooltipContent(
    { id: "totally-unknown-effect", stacks: 1, remainingMs: 2000, totalMs: 2000 },
    "",
  );
  assertLegible(bare, "unknown target status");

  const boss = bossEffectTooltipContent("enrage", "Enraged", 1);
  assertLegible(boss, "boss effect");
  assert(boss.title === "Enraged", "an authored boss effect should use its authored title");
}

// ── Abilities: rank by tier, and honest runtime state ───────────────────────
{
  const sweep: AbilityDef | undefined = abilityDef("sweep");
  assert(sweep !== undefined, "test needs the sweep ability to exist");

  const lowTier = { playerTier: sweep.tier, passives: {}, attack: 100, maxHp: 500, attackRange: 60 };
  const highTier = { ...lowTier, playerTier: sweep.tier + sweep.ranks.length - 1 };

  const ready = abilityTooltipContent(sweep, lowTier, { state: "ready" });
  assertLegible(ready, "ability ready");
  assert(ready.title.startsWith(sweep.name), "an ability tooltip leads with its name");
  assert(
    ready.current?.some((r) => r.label === "Status" && r.value === "Ready"),
    "a ready ability must say Ready",
  );
  assert((ready.rows ?? []).length > 0, "an ability must show what it does at this rank");
  assert(
    (ready.rows ?? []).every((r) => r.key !== "ability:rank"),
    "the rank row is in the title already and must not be repeated as a row",
  );

  const deep = abilityTooltipContent(sweep, highTier, { state: "ready" });
  assert(
    deep.title !== ready.title,
    "a higher player tier must resolve a higher rank in the title",
  );

  const cooling = abilityTooltipContent(sweep, lowTier, {
    state: "cooling",
    cooldownRemainingMs: 3600,
  });
  assert(
    cooling.current?.some((r) => r.label === "Cooldown remaining" && r.value === "3.6s"),
    "a cooling ability must report how long is left",
  );
  assert(
    !cooling.current?.some((r) => r.label === "Wind-up remaining"),
    "a cooling ability must not claim a cast it is not doing",
  );

  const casting = abilityTooltipContent(sweep, lowTier, {
    state: "casting",
    castRemainingMs: 800,
  });
  assert(
    casting.current?.some((r) => r.label === "Wind-up remaining" && r.value === "0.8s"),
    "a casting ability must report its wind-up",
  );

  const label = abilityAccessibleLabel(sweep, lowTier, {
    state: "cooling",
    cooldownRemainingMs: 3600,
  });
  assert(!BAD.test(label), `accessible label must be legible: ${label}`);
  assert(label.includes(sweep.name), "the accessible label must name the ability");

  // Every authored ability must build a legible card at its own home tier.
  for (const id of ["brace", "second-wind"]) {
    const def = abilityDef(id);
    if (!def) continue;
    assertLegible(
      abilityTooltipContent(def, { ...lowTier, playerTier: def.tier }, { state: "active" }),
      `ability ${id}`,
    );
  }
}

// ── The value is the RESOLVED one, off a real world ─────────────────────────
{
  initCombatSystems();

  const makeSlices = (id: string): PersistedPlayerSlices => ({
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  });

  const world = new World();
  const bare = world.attachPlayerEntity(makeSlices("slow-bare"), "slow-bare");
  const tough = world.attachPlayerEntity(makeSlices("slow-tough"), "slow-tough");
  // Slow resistance is exactly the layer a client-side reimplementation would
  // get wrong, so it is the one this test insists reaches the tooltip.
  tough.usesSkills.passives["mobility.slow-resistance"] = 0.5;

  for (const player of [bare, tough]) {
    applyStatusEffect(player.tracksCombat, {
      id: "slow",
      stacks: 1,
      remainingMs: 4000,
      sourceId: "test",
      data: { speedMult: 0.5, totalMs: 4000 },
    });
  }

  syncPlayerBuffs(world, Date.now());

  const slowOf = (id: string): PlayerBuff => {
    const player = id === "slow-bare" ? bare : tough;
    const buff = (player.hasStatus.activeBuffs ?? []).find((b) => b.id === "debuff-slow");
    assert(buff, `${id} should be carrying a projected slow debuff`);
    return buff;
  };

  const bareBuff = slowOf("slow-bare");
  const toughBuff = slowOf("slow-tough");

  assert(bareBuff.values !== undefined, "the slow projection must publish structured values");
  const bareMove = bareBuff.values!.find((v) => v.label === "Movement speed");
  const toughMove = toughBuff.values!.find((v) => v.label === "Movement speed");
  assert(bareMove && toughMove, "the slow must publish a movement-speed value on both players");

  assert(
    bareMove!.value !== toughMove!.value,
    "slow resistance must change the value the tooltip shows — it is the resolved " +
      "figure that reaches the HUD, not the authored one",
  );
  assert(
    Math.round(bareBuff.speedMult! * 100) === Number(bareMove!.value.replace("%", "")),
    "the published value must agree with the speedMult the client extrapolates from",
  );
  assert(
    Math.round(toughBuff.speedMult! * 100) === Number(toughMove!.value.replace("%", "")),
    "the resisted value must agree with the resisted speedMult",
  );

  // And the tooltip built from it is legible end to end.
  const card = buffTooltipContent(toughBuff);
  assertLegible(card, "projected slow");
  assert(
    card.current?.some((r) => r.label === "Remaining"),
    "a timed projected debuff should carry remainingMs through to the card",
  );
}

console.log("hudStatusTooltips: ok");
