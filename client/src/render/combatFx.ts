import {
  ABILITY_BINDING_STRIKE_FX,
  ABILITY_EXPOSE_WEAKNESS_FX,
  ABILITY_HAMSTRING_FX,
  ABILITY_IMBUE_FX,
  ABILITY_QUICK_STRIKE_FX,
  ABILITY_SWEEP_FX,
  ABILITY_TECHNIQUE_FIRED_FX,
  abilityDef,
  ESSENCE_COLORS,
  GAME_CONFIG,
  isRangedPlayerView,
  type CombatArchetype,
  type CombatEvent,
  type PlayerView,
  type Vec2,
} from "@mmo-idle/shared";
import { activateLaserBeam } from "../fx/laser";
import { fxConduitBeam, fxConduitBolt } from "../fx/conduitSummon";
import { activateHolyBeam, fxHolyFlash } from "../fx/holyBeam";
import { fxCannonBlast } from "../fx/cannonFx";
import { fxVoidDischarge } from "../fx/voidDischarge";
import { fxPoisonExplosion } from "../fx/poisonExplosion";
import { fxFirebrand } from "../fx/firebrand";
import { fxConflagrationTick } from "../fx/conflagrationTick";
import { fxDoomTick, fxDoomCloud } from "../fx/doom";
import {
  playOneShotEffect,
  spawnDamageNumber,
  EMPOWERED_DAMAGE_COLOR,
  EMPOWERED_DAMAGE_SIZE_PX,
} from "../fx/particles";
import { getDotPath, type DotPath } from "../fx/dot";
import { fxApprenticeCast, fxApprenticeCloseCast } from "../fx/apprenticeCast";
import { PARTIAL_EVADE_COLOR } from "./damageNumberStyle";
import { fxSlash } from "../fx/slash";
import { fxImpact } from "../fx/impact";
import { fxGunshot, fxDuelistShot, fxAltShot, fxDeathMarkBlast } from "../fx/gunshot";
import { fxBoulder } from "../fx/boulder";
import { fxArrow } from "../fx/arrow";
import { fxBite } from "../fx/bite";
import { fxSlam } from "../fx/bossSlam";
import { fxSavageMaul } from "../fx/savageMaul";
import { fxStrongKick } from "../fx/strongKick";
import { fxSandblast } from "../fx/sandblast";
import { fxQuake } from "../fx/quake";
import { fxHex } from "../fx/hex";
import { fxStoneSpit } from "../fx/stoneSpit";
import {
  fxSummonBurst,
  fxShieldUp,
  fxMorph,
  fxBossRoar,
  fxBestialFrenzy,
  fxDireHowl,
  fxChestBeat,
  fxThornBarrage,
  fxShellUp,
  fxTrenchSweep,
  fxTrenchMine,
  fxTrenchCurrent,
  fxTrenchPulse,
} from "../fx/bossCues";
import { fxLightning } from "../fx/lightning";
import { fxFireFlame } from "../fx/dotFire";
import { fxFrostSnowflake } from "../fx/dotFrost";
import { fxPoisonSmog } from "../fx/dotPoison";
import { fxPoison } from "../fx/poison";
import { fxMagic } from "../fx/magic";
import { fxFrost } from "../fx/frost";
import { fxFire } from "../fx/fire";
import { fxVoid } from "../fx/voidFx";
import { fxFirstStrike } from "../fx/firstStrike";
import { fxAftershock } from "../fx/aftershock";
import { fxDualSlash } from "../fx/dualSlash";
import { fxBearClaws } from "../fx/bearClaws";
import { fxSweep } from "../fx/sweep";
import { fxExposeWeakness } from "../fx/heavyStrike";
import { fxBrace } from "../fx/brace";
import { fxSecondWind } from "../fx/secondWind";
import { fxEndure } from "../fx/endure";
import { fxBreakFree } from "../fx/breakFree";
import { fxRecuperate } from "../fx/recuperate";
import { fxBramble } from "../fx/bramble";
import { fxFrenzy } from "../fx/frenzy";
import { fxContagion } from "../fx/contagion";
import { fxDetonate } from "../fx/detonate";
import { fxImbueCast, fxImbueCrackle } from "../fx/imbueLightning";
import { fxHamstring } from "../fx/hamstring";
import { fxBindingStrike } from "../fx/bindingStrike";
import { fxQuickStrike } from "../fx/quickStrike";
import { fxPowerStrike } from "../fx/powerStrike";
import { fxSnipe } from "../fx/snipe";
import { fxStunningStrike } from "../fx/stunningStrike";
import { fxCharge, fxDisengage } from "../fx/reposition";
import { fxCleanse } from "../fx/cleanse";
import { fxPowerShot } from "../fx/powerShot";
import { fxDiveBomb, fxTalonStrike } from "../fx/talonStrike";
import { shouldRunClientFx } from "../fx/guard";
import { playSfx } from "../audio/audioEngine";
import type { SfxId } from "../audio/manifest";
import { startCastBar, endCastBar } from "./castBars";
import { spawnSkillCallout } from "./skillCallouts";
import {
  notifyAbilityCastEnded,
  notifyAbilityCastStarted,
  notifyAbilityCooldownStarted,
  notifyAbilityFired,
} from "../hud/atoms";
import type { GameScene } from "../scenes/GameScene";
import { applyLunge } from "./interpolation";
import { nodeToScene } from "./sceneCoords";
import type { RenderState } from "./state";
import { DEPTH } from "./depth";

type NonNullArchetype = Exclude<CombatArchetype, null>;

const RANGED_ATTACK_STYLES = new Set(["gunshot", "boulder"]);
const MAGIC_ATTACK_STYLES = new Set([
  "magic", "fire", "frost", "poison", "void",
  "conduit-beam", "conduit-bolt",
]);

/** Pick the SFX cue for the local player's attack from archetype/style. */
function attackSfxFor(archetype: CombatArchetype, style: string): SfxId {
  if (archetype === "reload") return "attack-ranged";
  if (archetype === "energy" || archetype === "dot") return "attack-magic";
  // Cooldown hits land as heavy, blunt blows rather than bladed slashes.
  if (archetype === "cooldown") return "attack-blunt";
  if (archetype === "cadence" || archetype === "summoner") return "attack-melee";
  if (RANGED_ATTACK_STYLES.has(style)) return "attack-ranged";
  if (MAGIC_ATTACK_STYLES.has(style)) return "attack-magic";
  if (style === "impact") return "attack-blunt";
  return "attack-melee";
}

// Positional SFX falloff for snapshot-driven (other-entity) attacks: full volume
// within INNER scene px of the local player, fading to silent by OUTER — so an
// off-screen source reads as a faint noise. Pure distance attenuation (no stereo
// pan); tune the radii to taste.
const SFX_FALLOFF_INNER_PX = 300;
const SFX_FALLOFF_OUTER_PX = 1150;

function listenerGain(scene: GameScene, sourceX: number, sourceY: number): number {
  const own = scene.state.ownId
    ? scene.state.sprite.get(scene.state.ownId)
    : undefined;
  const lx = own?.x ?? scene.cameras.main.worldView.centerX;
  const ly = own?.y ?? scene.cameras.main.worldView.centerY;
  const dist = Math.hypot(sourceX - lx, sourceY - ly);
  if (dist <= SFX_FALLOFF_INNER_PX) return 1;
  if (dist >= SFX_FALLOFF_OUTER_PX) return 0;
  return (
    1 - (dist - SFX_FALLOFF_INNER_PX) / (SFX_FALLOFF_OUTER_PX - SFX_FALLOFF_INNER_PX)
  );
}
type PlayerHitEvent = CombatEvent & { kind: "player-hit" };
type PlayerKillEvent = CombatEvent & { kind: "player-kill" };

function spawnRewardFloaters(scene: GameScene, ev: PlayerKillEvent): void {
  const target = scene.state.sprite.get(ev.targetId);
  const x = target?.x ?? scene.cameras.main.worldView.centerX;
  const y = target?.y ?? scene.cameras.main.worldView.centerY;
  const lines: { text: string; color: string }[] = [];
  if (ev.biomeXpGained > 0)
    lines.push({ text: `+${ev.biomeXpGained} XP`, color: "#88ddff" });
  if (ev.essenceGained > 0)
    lines.push({
      text: `+${ev.essenceGained} ●`,
      color: ESSENCE_COLORS[ev.essenceType],
    });

  lines.forEach((line, index) => {
    const text = scene.add
      .text(x, y - 32 - index * 18, line.text, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: line.color,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.FX);
    scene.tweens.add({
      targets: text,
      y: text.y - 34,
      alpha: 0,
      duration: 900,
      ease: "Power2",
      onComplete: () => text.destroy(),
    });
  });
}

interface AttackFxArgs {
  scene: GameScene;
  ev: PlayerHitEvent;
  player: PlayerView;
  from: Vec2;
  to: Vec2;
  dotPath?: DotPath;
}

type AttackFxFn = (args: AttackFxArgs) => void;

const FLASH_CLIENT_EFFECT = "flash-teleport";
const FIRST_STRIKE_CLIENT_EFFECT = "first-strike";
const AFTERSHOCK_CLIENT_EFFECT = "aftershock";
const SWIFTBLADE_CLIENT_EFFECT = "swiftblade";
const CHANNEL_BEAM_CLIENT_EFFECT = "channel-beam";
const HOLY_FLASH_CLIENT_EFFECT = "holy-flash";
const EXPLODING_CLIP_CLIENT_EFFECT = "reload-exploding-clip";
const ALT_ONHIT_CLIENT_EFFECT = "reload-alt-onhit";
const DEATH_MARK_BLAST_CLIENT_EFFECT = "death-mark-blast";
const CANNON_BLAST_CLIENT_EFFECT = "reload-cannon-blast";
const VOID_DISCHARGE_CLIENT_EFFECT = "void-discharge";

// Biome-ecology call-allies pulse — a warm warning accent on an alerted pack
// member. It should read as "the pack noticed you" without looking like damage.
const PACK_CALL_PULSE_COLOR = 0xffaa55;
const PACK_CALL_PULSE_DARK = 0x7a2f13;
const ECOLOGY_PULSE_COLOR = 0xff7733;
// Desert Sun Mark — a hotter amber ring when a marker paints its target, distinct
// from the pack-call orange so the "you're marked" tell reads on its own.
const SUN_MARK_PULSE_COLOR = 0xffcc33;
// Tundra ice-armor shatter — an icy blue burst when a frost shell breaks.
const FROST_SHATTER_PULSE_COLOR = 0x88ddff;
const DEATH_EMPOWER_PULSE_COLOR = 0xcc66dd;
// Wasteland raise — a sickly plague-green ring at the corpse a necromancer just
// pulled back up. Deliberately a different family from the purple death-empower
// surge so the two wasteland death tells never read as the same event.
const RAISE_DEAD_PULSE_COLOR = 0x88dd66;
/** Snapper shell closing/opening — dull shell green. */
const SHELL_PULSE_COLOR = 0x77aa66;
/** Carrion Vulture screech hastening nearby undead — sickly bone yellow. */
const ALLY_HASTE_PULSE_COLOR = 0xddcc77;
/** Camouflaged ambusher breaking cover — bright foliage flash. */
const REVEAL_PULSE_COLOR = 0x99ff66;

function snapPlayerToServerTarget(
  state: RenderState,
  scene: GameScene,
  playerId: string,
  targetId: string,
  playerPos?: Vec2,
): void {
  const transform = state.transform.get(playerId);
  const interp = state.interpolation.get(playerId);
  const sprite = state.sprite.get(playerId);
  if (!transform || !interp || !sprite) return;

  if (playerId === state.ownId) {
    scene.flashCameraHold = scene.flashCameraHoldTargetId === targetId;
    scene.flashCameraHoldTargetId = targetId;
  }
  scene.tweens.killTweensOf(interp.lungeOffset);
  interp.lungeOffset.x = 0;
  interp.lungeOffset.y = 0;
  if (playerPos) {
    interp.base.x = playerPos.x;
    interp.base.y = playerPos.y;
    transform.target = { ...playerPos };
  }
}

function fxAoeRing(
  scene: GameScene,
  pos: Vec2,
  radius: number,
  color: number,
): void {
  const scenePos = nodeToScene(pos.x, pos.y);
  const ring = scene.add.graphics({ x: scenePos.x, y: scenePos.y }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, color, 0.65);
  ring.strokeCircle(0, 0, 1);
  scene.tweens.add({
    targets: ring,
    scaleX: radius,
    scaleY: radius,
    alpha: 0,
    duration: 420,
    ease: "Power2",
    onComplete: () => ring.destroy(),
  });
}

function fxPackCall(scene: GameScene, pos: Vec2): void {
  const scenePos = nodeToScene(pos.x, pos.y);
  const g = scene.add.graphics({ x: scenePos.x, y: scenePos.y }).setDepth(DEPTH.FX);
  const state = { t: 0, alpha: 1 };

  scene.tweens.add({
    targets: state,
    t: 1,
    alpha: 0,
    duration: 520,
    ease: "Cubic.Out",
    onUpdate: () => {
      const t = state.t;
      const outer = 18 + t * 34;
      const inner = 9 + t * 14;
      g.clear();
      g.lineStyle(3, PACK_CALL_PULSE_DARK, 0.28 * state.alpha);
      g.strokeCircle(0, 0, outer + 1.5);
      g.lineStyle(1.5, PACK_CALL_PULSE_COLOR, 0.78 * state.alpha);
      g.strokeCircle(0, 0, outer);
      g.lineStyle(1, PACK_CALL_PULSE_COLOR, 0.38 * state.alpha);
      g.strokeCircle(0, 0, inner);

      for (let i = 0; i < 3; i++) {
        const angle = -Math.PI / 2 + (i - 1) * 0.62;
        const r0 = outer + 6;
        const r1 = outer + 14;
        g.lineStyle(2, PACK_CALL_PULSE_COLOR, 0.55 * state.alpha);
        g.beginPath();
        g.moveTo(Math.cos(angle) * r0, Math.sin(angle) * r0);
        g.lineTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
        g.strokePath();
      }
    },
    onComplete: () => g.destroy(),
  });
}

function playEmpoweredRing(args: AttackFxArgs): void {
  const { scene, ev, player, to } = args;
  if (!ev.empowered && !ev.execution) return;
  const ringColor =
    player.combatArchetype === "cadence"
      ? 0x4499ff
      : player.combatArchetype === "cooldown"
        ? 0xddeeff
        : player.combatArchetype === "energy"
          ? 0x88aaff
          : player.combatArchetype === "reload"
            ? 0xffeedd
            : 0xffdd22;
  fxAoeRing(scene, to, GAME_CONFIG.EMPOWERED_AOE_RADIUS, ringColor);
}

const ATTACK_FX_BY_ARCHETYPE: Record<NonNullArchetype, AttackFxFn> = {
  cadence: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered, true),
  cooldown: ({ scene, ev, to }) => fxImpact(scene, to.x, to.y, ev.execution),
  reload: ({ scene, ev, from, to }) =>
    fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered),
  energy: ({ scene, ev, from, to }) =>
    fxLightning(scene, from.x, from.y, to.x, to.y, ev.empowered),
  dot: ({ scene, ev, player, from, to, dotPath }) => {
    const element = dotPath ?? "poison";
    const cast = player.selectedRange?.endsWith("-range-close")
      ? fxApprenticeCloseCast
      : fxApprenticeCast;
    cast(
      scene,
      from.x,
      from.y,
      to.x,
      to.y,
      element,
      ev.empowered,
      () => {
        switch (element) {
          case "fire":
            fxFireFlame(scene, to.x, to.y, ev.empowered);
            break;
          case "frost":
            fxFrostSnowflake(scene, to.x, to.y, ev.empowered);
            break;
          case "doom":
            fxDoomCloud(scene, to.x, to.y, ev.empowered);
            break;
          default:
            fxPoisonSmog(scene, to.x, to.y, ev.empowered);
        }
      },
    );
  },
  // Summoner uses a plain melee impact from the slime — the slime sprite is
  // the FX, and the empowered ring is handled separately via the player's
  // existing empoweredRing pass.
  summoner: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered),
};

const ATTACK_FX_BY_STYLE: Record<string, AttackFxFn> = {
  slash: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered),
  'bear-claws': ({ scene, ev, to }) =>
    fxBearClaws(scene, to.x, to.y, ev.empowered),
  talons: ({ scene, from, to }) =>
    fxTalonStrike(scene, from.x, from.y, to.x, to.y),
  poison: ({ scene, to }) => fxPoison(scene, to.x, to.y),
  magic: ({ scene, from, to }) => fxMagic(scene, from.x, from.y, to.x, to.y),
  // Conduit summons — range picks which of these their attacks use.
  'conduit-beam': ({ scene, from, to }) =>
    fxConduitBeam(scene, from.x, from.y, to.x, to.y),
  'conduit-bolt': ({ scene, from, to }) =>
    fxConduitBolt(scene, from.x, from.y, to.x, to.y),
  frost: ({ scene, to }) => fxFrost(scene, to.x, to.y),
  fire: ({ scene, to }) => fxFire(scene, to.x, to.y),
  void: ({ scene, to }) => fxVoid(scene, to.x, to.y),
  impact: ({ scene, ev, to }) => fxImpact(scene, to.x, to.y, ev.execution),
  gunshot: ({ scene, ev, from, to }) =>
    fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered),
  boulder: ({ scene, from, to }) =>
    fxBoulder(scene, from.x, from.y, to.x, to.y),
  // Bow / thorn-volley mobs fling a real traveling arrow.
  arrow: ({ scene, ev, from, to }) =>
    fxArrow(scene, from.x, from.y, to.x, to.y, ev.empowered),
  // Fanged predators (wolves, hounds, stalkers) snap a chomp on the target.
  bite: ({ scene, ev, to }) => fxBite(scene, to.x, to.y, ev.empowered),
  // Desert royals' signature sun-baked sand gout.
  sandblast: ({ scene, from, to }) =>
    fxSandblast(scene, from.x, from.y, to.x, to.y),
  // Mountain/cave behemoth bosses' heavy cap-tripping slam.
  quake: ({ scene, to }) => fxQuake(scene, to.x, to.y),
  // Swamp casters' sickly rot-curse bolt.
  hex: ({ scene, from, to }) => fxHex(scene, from.x, from.y, to.x, to.y),
  // Cave gargoyles spit flung stone.
  stonespit: ({ scene, from, to }) =>
    fxStoneSpit(scene, from.x, from.y, to.x, to.y),
};

// Self-facing Guard FX, keyed by ability id. Drawn on the firing player's sprite
// from a `player-guard` event. Abilities without an entry just pulse the HUD icon.
const GUARD_FX_BY_ABILITY: Record<
  string,
  (scene: GameScene, x: number, y: number) => void
> = {
  brace: fxBrace,
  cleanse: fxCleanse,
  "second-wind": fxSecondWind,
  endure: fxEndure,
  "bramble-guard": fxBramble,
  "break-free": fxBreakFree,
  recuperate: fxRecuperate,
};

/**
 * Self-facing TECHNIQUE FX, keyed by ability id. A Technique is usually
 * enemy-facing, but an instant offensive self-buff (Frenzy) has no target to
 * draw on — it plays on the caster, exactly like a Guard, and still belongs to
 * the Technique slot.
 */
const TECHNIQUE_SELF_FX_BY_ABILITY: Record<
  string,
  (
    scene: GameScene,
    x: number,
    y: number,
    options?: {
      durationMs?: number;
      follow?: () => { x: number; y: number } | null;
    },
  ) => void
> = {
  frenzy: fxFrenzy,
};

/**
 * Resolve FX for a completed CAST, keyed by ability id. A cast resolves on its
 * own target instead of riding an attack, so it has no `player-hit` to hang FX
 * on — the `player-cast-end` event carries the impact point instead.
 */
const CAST_FX_BY_ABILITY: Record<
  string,
  (scene: GameScene, from: Vec2, to: Vec2) => void
> = {
  "power-strike": (scene, _from, to) => fxPowerStrike(scene, to.x, to.y),
  "stunning-strike": (scene, _from, to) => fxStunningStrike(scene, to.x, to.y),
  // Snipe is the one cast whose FX needs BOTH points: the distance crossed is
  // the ability, and an impact alone would not show it.
  snipe: (scene, from, to) => fxSnipe(scene, from.x, from.y, to.x, to.y),
  // A self-cast resolves on the caster, so both endpoints are the player.
  "imbue-lightning": (scene, from) => fxImbueCast(scene, from.x, from.y),
};

/** Reposition FX, keyed by ability id. Both endpoints come from the event. */
const REPOSITION_FX_BY_ABILITY: Record<
  string,
  (scene: GameScene, from: Vec2, to: Vec2) => void
> = {
  charge: fxCharge,
  disengage: fxDisengage,
};

// Skill-callout text colors: Guards keyed by ability id (matched to each Guard's
// FX palette), Techniques share one offensive amber (matched to the Sweep arc).
const GUARD_CALLOUT_COLORS: Record<string, string> = {
  brace: "#9cd2ff",
  cleanse: "#eef6ff",
  "second-wind": "#9cff8a",
  endure: "#e0c07a",
  "bramble-guard": "#c4e88a",
  "break-free": "#d9c2ff",
  recuperate: "#bdf3e4",
};
const GUARD_CALLOUT_FALLBACK = "#9cd2ff";
const TECHNIQUE_CALLOUT_COLOR = "#ffd24a";

const TECHNIQUE_CONSUMED_TAGS = [
  ABILITY_SWEEP_FX,
  ABILITY_EXPOSE_WEAKNESS_FX,
  ABILITY_HAMSTRING_FX,
  ABILITY_BINDING_STRIKE_FX,
  ABILITY_QUICK_STRIKE_FX,
  ABILITY_IMBUE_FX,
  ABILITY_TECHNIQUE_FIRED_FX,
];

/**
 * The rising label used for combat outcomes that are not a number: DODGE, MISS,
 * GRAZE. Three copies of this tween were already written by hand; a fourth for
 * grazes would have made it four.
 */
function floatLabel(
  scene: GameScene,
  at: { x: number; y: number },
  label: string,
  opts?: { color?: string; sizePx?: number; rise?: number; dx?: number; dy?: number },
): void {
  const text = scene.add
    .text(at.x + (opts?.dx ?? 0), at.y - (opts?.dy ?? 40), label, {
      fontFamily: "monospace",
      fontSize: `${opts?.sizePx ?? 14}px`,
      color: opts?.color ?? "#ddddff",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.FX);
  scene.tweens.add({
    targets: text,
    y: text.y - (opts?.rise ?? 28),
    alpha: 0,
    duration: 650,
    onComplete: () => text.destroy(),
  });
}

/** Screen position of an entity, from its live sprite. */
function spritePos(state: RenderState, id: string): { x: number; y: number } | null {
  const sprite = state.sprite.get(id);
  return sprite ? { x: sprite.x, y: sprite.y } : null;
}

/**
 * A partial evade is a real dodge that happened to be worth half the blow rather
 * than all of it. Without a label of its own it was only a faintly tinted damage
 * number — which is why evasion looked like it never fired. Deliberately quieter
 * than DODGE: smaller, offset off the damage number, and silent, because the hit
 * it accompanies already played a sound.
 */
function spawnGrazeLabel(state: RenderState, scene: GameScene, targetId: string): void {
  if (!shouldRunClientFx()) return;
  const at = spritePos(state, targetId);
  if (!at) return;
  floatLabel(scene, at, "GRAZE", {
    color: PARTIAL_EVADE_COLOR,
    sizePx: 12,
    dy: 30,
    dx: -20,
    rise: 22,
  });
}

export function dispatchCombatEvent(
  state: RenderState,
  ev: CombatEvent,
  scene: GameScene,
): void {
  // dot-tick / monster-hit events are consumed as damage-number style hints in
  // deltaApplier. The lightning element (Tempest storm) also cracks a bolt down onto
  // the target on each tick for a "storm" read.
  if (ev.kind === "dot-tick") {
    if (shouldRunClientFx()) {
      const spr = state.sprite.get(ev.targetId);
      const tx = spr?.x ?? ev.targetPos.x;
      const ty = spr?.y ?? ev.targetPos.y;
      if (ev.fx === "conflagration") fxConflagrationTick(scene, tx, ty);
      else if (ev.element === "lightning") fxLightning(scene, tx, ty - 130, tx, ty, true);
      else if (ev.element === "doom") fxDoomTick(scene, tx, ty);
    }
    return;
  }
  if (ev.kind === "monster-hit") {
    // The local player took a hit — play the damage cue (own-player only).
    if (ev.targetId === scene.myId && shouldRunClientFx()) playSfx("take-damage");
    if (ev.evadedPartial) spawnGrazeLabel(state, scene, ev.targetId);
    return;
  }

  if (ev.kind === "monster-dodge") {
    if (!shouldRunClientFx()) return;
    playSfx("dodge");
    const target =
      ev.targetPos ??
      (state.sprite.get(ev.monsterId)
        ? {
            x: state.sprite.get(ev.monsterId)!.x,
            y: state.sprite.get(ev.monsterId)!.y,
          }
        : null);
    if (target) floatLabel(scene, target, "DODGE");
    return;
  }

  if (ev.kind === "player-evade") {
    if (!shouldRunClientFx()) return;
    if (ev.playerId === scene.myId) playSfx("dodge");
    const sprite = state.sprite.get(ev.playerId);
    const target =
      (sprite ? { x: sprite.x, y: sprite.y } : null) ?? ev.targetPos ?? null;
    if (target) floatLabel(scene, target, "DODGE");
    return;
  }

  if (ev.kind === "player-miss") {
    if (!shouldRunClientFx()) return;
    const target =
      ev.targetPos ??
      (state.sprite.get(ev.targetId)
        ? {
            x: state.sprite.get(ev.targetId)!.x,
            y: state.sprite.get(ev.targetId)!.y,
          }
        : null);
    if (target) floatLabel(scene, target, "MISS", { color: "#bbbbbb" });
    return;
  }

  if (ev.kind === "ecology-pulse") {
    // Node-wide ecology tells, not own-player gated.
    if (shouldRunClientFx()) {
      if (ev.pulse === "pack-call") {
        playSfx("pack-call");
        fxPackCall(scene, ev.pos);
        return;
      }
      if (ev.pulse === "shell-up") {
        fxShellUp(scene, ev.pos.x, ev.pos.y);
        return;
      }
      if (ev.pulse === "frost-shatter") playSfx("frozen");
      const color =
        ev.pulse === "sun-mark"
          ? SUN_MARK_PULSE_COLOR
          : ev.pulse === "frost-shatter"
            ? FROST_SHATTER_PULSE_COLOR
            : ev.pulse === "death-empower"
              ? DEATH_EMPOWER_PULSE_COLOR
              : ev.pulse === "raise-dead"
                ? RAISE_DEAD_PULSE_COLOR
                : ev.pulse === "shell-open"
                  ? SHELL_PULSE_COLOR
                  : ev.pulse === "ally-haste"
                    ? ALLY_HASTE_PULSE_COLOR
                    : ev.pulse === "reveal"
                      ? REVEAL_PULSE_COLOR
                      : ECOLOGY_PULSE_COLOR;
      // A shell closing is a bigger, slower beat than a status pulse: it is the
      // moment the fight changes shape, so it gets a wider ring.
      const radius = 70;
      fxAoeRing(scene, ev.pos, radius, color);
    }
    return;
  }

  if (ev.kind === "monster-cast-start") {
    // Node-wide telegraph: open the cast bar over the charging monster.
    startCastBar(state, ev.monsterId, ev.castMs, ev.label);
    return;
  }

  if (ev.kind === "monster-cast-end") {
    endCastBar(state, ev.monsterId);
    // On a fired shot, rip the flashy projectile from the monster to its target.
    if (ev.fired && shouldRunClientFx()) {
      const monster = state.sprite.get(ev.monsterId);
      const target = ev.targetId ? state.sprite.get(ev.targetId) : undefined;
      const impact = ev.pos ? nodeToScene(ev.pos.x, ev.pos.y) : undefined;
      if (monster && ev.fx === "howl") {
        fxDireHowl(scene, monster.x, monster.y);
      } else if (monster && ev.fx === "chest-beat") {
        fxChestBeat(scene, monster.x, monster.y);
      } else if (monster && ev.fx === "barrage") {
        fxThornBarrage(scene, monster.x, monster.y);
      } else if (monster && target && ev.fx === "trench-lunge") {
        fxSavageMaul(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "trench-depth-bolt") {
        fxPowerShot(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && (ev.fx === "frost-tusk-impact" || ev.fx === "volcanic-eruption")) {
        fxStrongKick(scene, target.x, target.y);
      } else if (ev.fx === "trench-lantern-pulse") {
        // Anchor on the victim, else the caster, else the broadcast impact. Every
        // branch must resolve a real anchor — a missing sprite must skip the cue,
        // not draw it at the scene origin.
        const at = target ?? monster ?? impact;
        if (at) fxTrenchPulse(scene, at.x, at.y, 0xe0a8ff);
      } else if (impact && ev.fx === "trench-tail-sweep") {
        fxTrenchSweep(scene, impact.x, impact.y, ev.radius ?? 145);
      } else if (impact && ev.fx === "trench-body-sweep") {
        fxTrenchSweep(scene, impact.x, impact.y, ev.radius ?? 155);
      } else if (impact && ev.fx === "trench-silt-mine") {
        fxTrenchMine(scene, impact.x, impact.y, ev.radius ?? 115);
      } else if (monster && ev.fx === "trench-current") {
        fxTrenchCurrent(scene, monster.x, monster.y);
      } else if (monster && ev.fx === "trench-surge") {
        fxTrenchPulse(scene, monster.x, monster.y, 0x82c8ff);
      } else if (monster && ev.fx === "trench-carapace") {
        fxShieldUp(scene, monster.x, monster.y);
      } else if (monster && (ev.fx === "volcanic-guard" || ev.fx === "volcanic-shell")) {
        fxShieldUp(scene, monster.x, monster.y);
      } else if (monster && target && ev.fx === "dive-bomb") {
        fxDiveBomb(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target) {
        if (ev.fx === "strong-kick") {
          fxStrongKick(scene, target.x, target.y);
        } else if (ev.fx === "savage-maul") {
          fxSavageMaul(scene, monster.x, monster.y, target.x, target.y);
        } else {
          fxPowerShot(scene, monster.x, monster.y, target.x, target.y);
        }
      }
    }
    return;
  }

  if (ev.kind === "boss-fx") {
    // Node-wide cosmetic cue for a boss scripted action.
    if (shouldRunClientFx()) {
      const sprite = state.sprite.get(ev.monsterId);
      // A slam lands on its PLANTED point, which is not where the caster stands
      // by the time the wind-up finishes — always anchor it to the broadcast
      // impact position. Every other cue is centred on the monster itself, where
      // the live sprite position is the smoother anchor.
      const at =
        ev.fx !== "slam" && sprite
          ? { x: sprite.x, y: sprite.y }
          : nodeToScene(ev.pos.x, ev.pos.y);
      if (ev.fx === "slam") {
        playSfx("attack-blunt");
        fxSlam(scene, at.x, at.y, ev.radius ?? 120, ev.element);
      } else if (ev.fx === "summon") {
        fxSummonBurst(scene, at.x, at.y);
      } else if (ev.fx === "shield") {
        fxShieldUp(scene, at.x, at.y);
      } else if (ev.fx === "morph") {
        fxMorph(scene, at.x, at.y);
      } else if (ev.fx === "roar") {
        fxBossRoar(scene, at.x, at.y, ev.radius ?? 260);
      } else if (ev.fx === "frenzy") {
        fxBestialFrenzy(scene, at.x, at.y);
      }
    }
    return;
  }

  if (ev.kind === "player-guard") {
    // A self-facing Guard fired — overlay its FX on the player's sprite plus a
    // lingering skill-name callout (shown to the whole node so allies see each
    // other react). Pulse the HUD Guard icon for the local player only.
    if (shouldRunClientFx()) {
      const sprite = state.sprite.get(ev.playerId);
      if (sprite) {
        const fx = GUARD_FX_BY_ABILITY[ev.ability];
        if (fx) fx(scene, sprite.x, sprite.y);
        const name = abilityDef(ev.ability)?.name ?? ev.ability;
        spawnSkillCallout(
          state,
          scene,
          ev.playerId,
          name,
          GUARD_CALLOUT_COLORS[ev.ability] ?? GUARD_CALLOUT_FALLBACK,
        );
      }
      if (ev.playerId === scene.myId) {
        playSfx("empowered");
        notifyAbilityCooldownStarted(ev.ability);
        notifyAbilityFired(ev.ability);
      }
    }
    return;
  }

  if (ev.kind === "player-technique-armed") {
    // A Technique armed the player's next attack. Track the armed state (drives
    // the red cooldown-bar tint until the consuming hit clears it) and pop a
    // lingering callout over the player. Node-wide, mirroring `player-guard`.
    state.techniqueArmed.set(ev.playerId, {
      abilityId: ev.ability,
      armedAt: Date.now(),
    });
    if (ev.playerId === scene.myId) {
      notifyAbilityCooldownStarted(ev.ability);
    }
    if (shouldRunClientFx()) {
      const sprite = state.sprite.get(ev.playerId);
      if (sprite) {
        // An instant Technique has no target to draw on, so it plays on the
        // caster. It also never arms anything, so the red armed-bar telegraph
        // above would otherwise sit there until some unrelated hit cleared it.
        const selfFx = TECHNIQUE_SELF_FX_BY_ABILITY[ev.ability];
        if (selfFx) {
          // `durationMs` lets a window-opening Technique (Frenzy) sustain an
          // in-world cue for as long as the buff actually lasts, and `follow`
          // keeps that cue on the sprite while the player moves — a one-shot
          // burst at the fire position would be left behind immediately.
          selfFx(scene, sprite.x, sprite.y, {
            durationMs: ev.durationMs,
            follow: () => {
              const live = state.sprite.get(ev.playerId);
              return live ? { x: live.x, y: live.y } : null;
            },
          });
          state.techniqueArmed.delete(ev.playerId);
          if (ev.playerId === scene.myId) notifyAbilityFired(ev.ability);
        }
        const name = abilityDef(ev.ability)?.name ?? ev.ability;
        spawnSkillCallout(
          state,
          scene,
          ev.playerId,
          name,
          TECHNIQUE_CALLOUT_COLOR,
        );
      }
    }
    return;
  }

  if (ev.kind === "player-reposition") {
    // A reposition is an instant server-side move: without a trail along the old
    // path the sprite just blinks and nothing tells the player an ability fired.
    if (shouldRunClientFx()) {
      const fx = REPOSITION_FX_BY_ABILITY[ev.ability];
      if (fx) fx(scene, ev.from, ev.to);
      if (state.sprite.has(ev.playerId)) {
        spawnSkillCallout(
          state,
          scene,
          ev.playerId,
          abilityDef(ev.ability)?.name ?? ev.ability,
          TECHNIQUE_CALLOUT_COLOR,
        );
      }
      if (ev.playerId === scene.myId) {
        notifyAbilityCooldownStarted(ev.ability);
        notifyAbilityFired(ev.ability);
      }
    }
    return;
  }

  if (ev.kind === "player-cast-start") {
    // A casted Technique's wind-up. Reuses the monster charged-attack telegraph
    // wholesale — `castState` is keyed by entity id and players have sprites, so
    // the floating skill-name label and the red cooldown-bar tint both apply.
    startCastBar(
      state,
      ev.playerId,
      ev.castMs,
      abilityDef(ev.ability)?.name ?? ev.ability,
    );
    if (ev.playerId === scene.myId) {
      notifyAbilityCastStarted(ev.ability, ev.castMs);
    }
    return;
  }

  if (ev.kind === "dot-spread") {
    // Contagion. One tendril per (victim × element), tinted by that element, so
    // the player can see WHICH afflictions took hold where. Node-wide: an ally
    // watching a swamp build work should see the infection travel.
    if (shouldRunClientFx() && ev.links.length > 0) {
      fxContagion(scene, ev.from, ev.links);
    }
    return;
  }

  if (ev.kind === "dot-detonate") {
    // Detonate. The element is resolved server-side from whichever affliction
    // was owed the most damage, so the explosion is coloured by what actually
    // did the work rather than by whatever landed first.
    if (shouldRunClientFx()) {
      fxDetonate(scene, ev.pos.x, ev.pos.y, ev.element);
    }
    return;
  }

  if (ev.kind === "player-cast-end") {
    endCastBar(state, ev.playerId);
    // A cast resolves on its own target rather than riding an attack, so its
    // impact FX hangs off this event and its carried impact point — there is no
    // `player-hit` for it. Node-wide, so allies see each other's casts land.
    if (ev.fired && shouldRunClientFx()) {
      const fx = CAST_FX_BY_ABILITY[ev.ability];
      const origin = state.sprite.get(ev.playerId);
      // A SELF-cast carries no `targetPos` — it never had a target. Both
      // endpoints collapse onto the caster rather than the FX being skipped,
      // which is what would happen if this still required an impact point.
      const impact = ev.targetPos ?? (origin ? { x: origin.x, y: origin.y } : undefined);
      if (fx && origin && impact) fx(scene, { x: origin.x, y: origin.y }, impact);
    }
    if (ev.playerId === scene.myId) {
      notifyAbilityCastEnded();
      // Only a cast that actually RESOLVED pays a cooldown — an interrupted
      // wind-up costs nothing, so don't start a sweep for it.
      if (ev.fired) {
        notifyAbilityCooldownStarted(ev.ability);
        notifyAbilityFired(ev.ability);
        playSfx("empowered");
      }
    }
    return;
  }

  // A landed hit tagged with an ability client-effect consumed the armed
  // Technique — clear the armed telegraph. Runs BEFORE the own-player gate so
  // other players' red bars clear too (their hit FX stay snapshot-driven).
  if (
    ev.kind === "player-hit" &&
    state.techniqueArmed.has(ev.playerId) &&
    ev.effects?.some((fx) => TECHNIQUE_CONSUMED_TAGS.includes(fx))
  ) {
    // The armed entry is the only place the CONSUMED ability's id is known —
    // the hit event carries FX tags, not the ability. Pulse the right HUD tile
    // here, before the entry is dropped; with two Technique slots equipped a
    // slot-kind guess would pulse the wrong one.
    if (ev.playerId === scene.myId) {
      notifyAbilityFired(state.techniqueArmed.get(ev.playerId)!.abilityId);
    }
    state.techniqueArmed.delete(ev.playerId);
  }

  const isOwnPlayerEvent = ev.playerId === scene.myId;
  const isWatchedPlayerEvent =
    scene.spectatorMode && ev.playerId === scene.spectatorTargetId;
  if (!isOwnPlayerEvent && !isWatchedPlayerEvent) return;
  const actorId = isOwnPlayerEvent ? state.ownId : ev.playerId;

  if (ev.kind === "player-knockback") {
    if (!actorId) return;
    const transform = state.transform.get(actorId);
    const interp = state.interpolation.get(actorId);
    if (!transform || !interp) return;
    // The client owns own-player prediction and glides toward `transform.target`,
    // so a small authoritative backward shift is invisible while moving. Snap the
    // render baseline and prediction target to the recoil position so the shove
    // actually lands; movement re-paths forward from here on the next tick.
    scene.tweens.killTweensOf(interp.lungeOffset);
    interp.lungeOffset.x = 0;
    interp.lungeOffset.y = 0;
    interp.base.x = ev.pos.x;
    interp.base.y = ev.pos.y;
    transform.target = { x: ev.pos.x, y: ev.pos.y };
    return;
  }

  if (ev.kind === "player-hit") {
    const player = actorId
      ? (state.view.get(actorId) as PlayerView | undefined)
      : undefined;
    if (shouldRunClientFx()) {
      // Throttled in the engine, so pellet bursts collapse to one cue.
      if (ev.empowered || ev.execution) playSfx("empowered");
      else playSfx(attackSfxFor(player?.combatArchetype ?? null, player?.attackStyle ?? ""));
    }
    // Minion hits already play FX from minions.ts (lastAttackAt); skip body lunge/FX.
    if (shouldRunClientFx() && (player?.summonsMinions ?? 0) === 0) {
      runFxForAttackStyle(state, ev, scene);
    }
    // The mirror of the player's own graze: the target rolled with the blow.
    if (ev.evadedPartial) spawnGrazeLabel(state, scene, ev.targetId);
  }

  if (ev.kind === "player-kill") {
    if (shouldRunClientFx()) {
      // Bosses get their own death sting from the removal path (deltaApplier);
      // don't also fire the generic enemy-death cue for them.
      const killedBoss = state.entity.get(ev.targetId)?.isMonster?.isBoss ?? false;
      if (!killedBoss) playSfx("kill");
      const target = scene.state.sprite.get(ev.targetId);
      if (target && ev.damage > 0) {
        const meta = scene.state.spriteMeta.get(ev.targetId);
        const empowered = ev.empowered || ev.execution;
        spawnDamageNumber(
          scene,
          { x: target.x, y: target.y },
          meta?.barOffsetY ?? 40,
          Math.round(ev.damage),
          empowered ? EMPOWERED_DAMAGE_COLOR : "#ffffff",
          empowered
            ? { sizePx: EMPOWERED_DAMAGE_SIZE_PX, suffix: "!" }
            : undefined,
        );
      }
      spawnRewardFloaters(scene, ev);
    }
  }
}

function runFxForAttackStyle(
  state: RenderState,
  ev: PlayerHitEvent,
  scene: GameScene,
): void {
  const actorId = ev.playerId;
  const actorSprite = state.sprite.get(actorId);
  const targetSprite = state.sprite.get(ev.targetId);
  const player = state.view.get(actorId) as PlayerView | undefined;
  const targetInterp = state.interpolation.get(ev.targetId);
  const isFlashTeleport = ev.effects?.includes(FLASH_CLIENT_EFFECT) ?? false;
  const isSwiftblade = ev.effects?.includes(SWIFTBLADE_CLIENT_EFFECT) ?? false;
  const isHolyBeam = ev.effects?.includes(CHANNEL_BEAM_CLIENT_EFFECT) ?? false;
  const isHolyFlash = ev.effects?.includes(HOLY_FLASH_CLIENT_EFFECT) ?? false;
  const isDuelistShot = ev.effects?.includes(EXPLODING_CLIP_CLIENT_EFFECT) ?? false;
  const isAltShot = ev.effects?.includes(ALT_ONHIT_CLIENT_EFFECT) ?? false;
  const isDeathMarkBlast = ev.effects?.includes(DEATH_MARK_BLAST_CLIENT_EFFECT) ?? false;
  const isCannonBlast = ev.effects?.includes(CANNON_BLAST_CLIENT_EFFECT) ?? false;
  const isVoidDischarge = ev.effects?.includes(VOID_DISCHARGE_CLIENT_EFFECT) ?? false;

  if (!targetSprite) {
    if (isFlashTeleport) {
      snapPlayerToServerTarget(state, scene, actorId, ev.targetId, ev.playerPos);
    }
    return;
  }

  if (!actorSprite || !player) return;

  const dotPath =
    player.combatArchetype === "dot" ? getDotPath(player) : undefined;
  const bossScale =
    Math.max(targetSprite.displayWidth, targetSprite.displayHeight) > 64
      ? 1.33
      : 1;
  const targetEffectScale = 1.5 * bossScale;
  const isLaser =
    player.combatArchetype === "reload" &&
    (player.passives["reload.laser"] ?? 0) > 0;

  const from = { x: actorSprite.x, y: actorSprite.y };
  const to = ev.targetPos
    ? nodeToScene(ev.targetPos.x, ev.targetPos.y)
    : { x: targetSprite.x, y: targetSprite.y };
  const args: AttackFxArgs = { scene, ev, player, from, to, dotPath };

  // Blunderbuss volley: each pellet is its own bullet, all fired at once from a
  // shared muzzle to its own scattered endpoint (angle + distance randomized
  // server-side). Randomize each bullet's animation speed too so the burst
  // reads as a chaotic shotgun blast, not an ordered sweep.
  if (
    !isLaser &&
    player.combatArchetype === "reload" &&
    ev.pelletIndex !== undefined
  ) {
    if (!document.hidden) {
      const durationScale = 0.55 + Math.random() * 0.9;
      fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered, durationScale);
    }
    return;
  }

  if (isLaser) {
    activateLaserBeam(state, scene, ev.targetId);
  } else if (isHolyBeam) {
    activateHolyBeam(state, scene, ev.targetId);
  } else if (isHolyFlash) {
    // Execution "cast" that opens the channel — holy flash instead of melee lunge/ring.
    fxHolyFlash(scene, from.x, from.y);
    fxHolyFlash(scene, to.x, to.y, 0.8);
  } else if (isDuelistShot) {
    // Duelist last-bullet: red power shot + empowered ring (replaces the normal gunshot).
    playEmpoweredRing(args);
    fxDuelistShot(scene, from.x, from.y, to.x, to.y);
  } else if (isAltShot) {
    // Dualslinger on-hit (odd) round: blue shot instead of the normal gunshot.
    fxAltShot(scene, from.x, from.y, to.x, to.y);
  } else if (isDeathMarkBlast) {
    // Bounty Hunter detonation: a small explosion on the target (no shot tracer).
    fxDeathMarkBlast(scene, to.x, to.y);
  } else if (isCannonBlast) {
    // Cannoneer burst: a big explosion on the target when the stored pool fires.
    fxCannonBlast(scene, to.x, to.y);
  } else if (isVoidDischarge) {
    // Voidwalker singularity discharge: void implosion → detonation on the target.
    fxVoidDischarge(scene, to.x, to.y);
  } else if (isSwiftblade) {
    // Swiftblade replaces the default cadence slash with its dual diagonal slash;
    // both the primary and the extra strikes carry this effect.
    playEmpoweredRing(args);
    fxDualSlash(scene, to.x, to.y, ev.empowered);
  } else {
    playEmpoweredRing(args);
    const archetype = player.combatArchetype;
    if (archetype && ATTACK_FX_BY_ARCHETYPE[archetype]) {
      ATTACK_FX_BY_ARCHETYPE[archetype](args);
    } else {
      const styleFn =
        ATTACK_FX_BY_STYLE[player.attackStyle] ?? ATTACK_FX_BY_STYLE.impact;
      styleFn(args);
    }
  }

  if (isFlashTeleport) {
    snapPlayerToServerTarget(state, scene, actorId, ev.targetId, ev.playerPos);
  }

  for (const effectId of ev.effects ?? []) {
    if (effectId === FLASH_CLIENT_EFFECT) continue;
    if (effectId === SWIFTBLADE_CLIENT_EFFECT) continue; // handled above
    if (effectId === CHANNEL_BEAM_CLIENT_EFFECT) continue; // handled above
    if (effectId === HOLY_FLASH_CLIENT_EFFECT) continue; // handled above
    if (effectId === EXPLODING_CLIP_CLIENT_EFFECT) continue; // handled above
    if (effectId === ALT_ONHIT_CLIENT_EFFECT) continue; // handled above
    if (effectId === DEATH_MARK_BLAST_CLIENT_EFFECT) continue; // handled above
    if (effectId === CANNON_BLAST_CLIENT_EFFECT) continue; // handled above
    if (effectId === VOID_DISCHARGE_CLIENT_EFFECT) continue; // handled above
    if (effectId === ABILITY_SWEEP_FX) {
      // Sweep Technique: a bold horizontal cleave ON TOP of the normal attack FX,
      // plus a Technique HUD-icon pulse so the fire is visible both in-world and
      // on the ability bar.
      fxSweep(scene, from.x, from.y, to.x, to.y, ev.empowered);
      continue;
    }
    if (effectId === ABILITY_EXPOSE_WEAKNESS_FX) {
      // Expose Weakness: target-marking impact cue plus a Technique HUD-icon pulse.
      fxExposeWeakness(scene, to.x, to.y, ev.empowered);
      continue;
    }
    if (effectId === ABILITY_HAMSTRING_FX) {
      // Played low, at the legs — the slow is what the ability bought.
      fxHamstring(scene, to.x, to.y, ev.empowered);
      continue;
    }
    if (effectId === ABILITY_BINDING_STRIKE_FX) {
      fxBindingStrike(scene, to.x, to.y, ev.empowered);
      continue;
    }
    if (effectId === ABILITY_QUICK_STRIKE_FX) {
      fxQuickStrike(scene, to.x, to.y, ev.empowered);
      continue;
    }
    if (effectId === ABILITY_IMBUE_FX) {
      // A charge being spent. Drawn on the ATTACKER, not the victim: the storm
      // is in the player's hands, and putting it on the target would read as a
      // debuff rather than as a self-buff being consumed.
      fxImbueCrackle(scene, from.x, from.y);
      continue;
    }
    if (effectId === ABILITY_TECHNIQUE_FIRED_FX) {
      continue;
    }
    if (effectId === FIRST_STRIKE_CLIENT_EFFECT) {
      fxFirstStrike(scene, to.x, to.y);
      continue;
    }
    if (effectId === AFTERSHOCK_CLIENT_EFFECT) {
      fxAftershock(scene, to.x, to.y);
      continue;
    }
    if (effectId === "poison-explosion") {
      fxPoisonExplosion(scene, to.x, to.y);
      continue;
    }
    if (effectId === "firebrand") {
      fxFirebrand(scene, to.x, to.y);
      continue;
    }
    playOneShotEffect(scene, effectId, to, { scale: targetEffectScale });
  }

  if (
    !isLaser &&
    !isHolyBeam &&
    !isHolyFlash &&
    !isFlashTeleport &&
    !isRangedPlayerView(player) &&
    targetInterp
  ) {
    applyLunge(state, actorId, { ...targetInterp.base }, scene);
  }
}

/** Style-based FX for snapshot-driven attacks (other players / monsters). */
export function spawnAttackEffect(
  scene: GameScene,
  style: string,
  from: Vec2,
  to: Vec2,
  flags?: {
    empowered?: boolean;
    execution?: boolean;
    archetype?: CombatArchetype;
    dotPath?: DotPath;
    selectedRange?: string | null;
  },
): void {
  if (!shouldRunClientFx()) return;
  const ev: PlayerHitEvent = {
    kind: "player-hit",
    playerId: scene.myId,
    targetId: "",
    targetName: "",
    damage: 0,
    empowered: flags?.empowered ?? false,
    execution: flags?.execution ?? false,
  };
  const player = {
    attackStyle: style,
    combatArchetype: flags?.archetype ?? null,
    selectedRange: flags?.selectedRange ?? null,
  } as PlayerView;
  const args: AttackFxArgs = {
    scene,
    ev,
    player,
    from,
    to,
    dotPath: flags?.dotPath,
  };

  playEmpoweredRing(args);
  const archetype = flags?.archetype;
  if (archetype && ATTACK_FX_BY_ARCHETYPE[archetype]) {
    ATTACK_FX_BY_ARCHETYPE[archetype](args);
  } else {
    const styleFn = ATTACK_FX_BY_STYLE[style] ?? ATTACK_FX_BY_STYLE.impact;
    styleFn(args);
  }

  // Spatialized attack SFX for other players / monsters / minions: attenuate by
  // distance from the local player so off-screen sources are faint. (Own-player
  // attacks come through the event path in dispatchCombatEvent at full volume.)
  const gainMult = listenerGain(scene, from.x, from.y);
  if (gainMult > 0) {
    const sfx =
      flags?.empowered || flags?.execution
        ? "empowered"
        : attackSfxFor(flags?.archetype ?? null, style);
    playSfx(sfx, { gainMult });
  }
}
