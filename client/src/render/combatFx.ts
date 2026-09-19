import {
  ABILITY_BINDING_STRIKE_FX,
  ABILITY_EXPOSE_WEAKNESS_FX,
  ABILITY_HAMSTRING_FX,
  ABILITY_IMBUE_FX,
  ABILITY_QUICK_STRIKE_FX,
  ABILITY_DATABASE,
  ABILITY_SWEEP_FX,
  ABILITY_TECHNIQUE_FIRED_FX,
  abilityDef,
  ESSENCE_COLORS,
  GAME_CONFIG,
  isRangedPlayerView,
  CADENCE_CURSED_FINALE_FX,
  COOLDOWN_HOLLOW_FX,
  CADENCE_OVERLOAD_FX,
  CADENCE_VERDICT_EXECUTE_FX,
  COOLDOWN_SUNDER_FX,
  DOT_FROZEN_FX,
  DOT_MAXSTACK_BURST_FX,
  DOT_RIMESHATTER_FX,
  type CombatArchetype,
  type CombatEvent,
  type DamageElement,
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
} from "../fx/particles";
import { getDotPath, type DotPath } from "../fx/dot";
import { fxDotTick } from "../fx/dotTick";
import { fxHollowStrike } from "../fx/hollowStrike";
import { fxHeavyShell } from "../fx/heavyShell";
import { fxLightningDagger } from "../fx/lightningDagger";
import { fxBleedOpen } from "../fx/bleedOpen";
import { fxEquinoxArc } from "../fx/equinoxArc";
import {
  fxVerdictExecute,
  fxRampageOverload,
  fxCursedFinale,
  fxSunderShatter,
  fxMaxStackBurst,
  fxRimeshatter,
  fxFrozenShatter,
} from "../fx/t4Triggers";
import { fxApprenticeCast, fxApprenticeCloseCast } from "../fx/apprenticeCast";
import { PARTIAL_EVADE_COLOR } from "./damageNumberStyle";
import { fxSlash } from "../fx/slash";
import { fxStrikerSlash } from "../fx/strikerSlash";
import { resolveAttackTint, type AttackTint } from "../fx/elementTint";
import { fxSpearThrust } from "../fx/spearThrust";
import { fxPointBlankShot } from "../fx/pointBlankShot";
import { fxArcDischarge } from "../fx/arcDischarge";
import { fxBladeWave } from "../fx/bladeWave";
import { fxSiegeBlow } from "../fx/siegeBlow";
import { fxPikeBrace } from "../fx/pikeBrace";
import { fxSquireSlam } from "../fx/squireSlam";
import { fxImpact } from "../fx/impact";
import { fxGunshot, fxDuelistShot, fxAltShot, fxDeathMarkBlast } from "../fx/gunshot";
import { fxBoulder } from "../fx/boulder";
import { fxArrow } from "../fx/arrow";
import { fxBite } from "../fx/bite";
import { fxSlam } from "../fx/bossSlam";
import { fxSavageMaul } from "../fx/savageMaul";
import { fxTimberclawSwipe } from "../fx/timberclawSwipe";
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
// MONSTER/BOSS animation pass — see docs/briefs/monster-boss-animation-audit-2026-09-12.md.
import { fxBoneStrike } from "../fx/boneStrike";
import { fxPeck } from "../fx/peck";
import { fxDart, fxFireSpit, fxFrostBolt } from "../fx/rangedSpit";
import { fxGore } from "../fx/gore";
import { fxTrollFist } from "../fx/trollFist";
import { fxApeFist } from "../fx/apeFist";
import { fxReptileTail } from "../fx/reptileTail";
import { fxStagger } from "../fx/stagger";
import {
  fxPetrifyingGaze,
  fxSunbeam,
  fxNumbingSting,
  fxDeathSting,
  fxExecution,
} from "../fx/desertCues";
import {
  fxWither,
  fxPlagueHex,
  fxPoolSpawn,
  fxDeathrollCoil,
  fxDeathrollLunge,
  fxDragWake,
  fxDragDestination,
} from "../fx/swampCues";
import { fxDeepFreeze, fxFrostWindUp, fxShatter, fxGlacialSlam } from "../fx/tundraCues";
import { fxStalactiteShot, fxBurrow, fxEmerge } from "../fx/caveCues";
import { fxGroundSlam, fxChargeLane, fxBombardment } from "../fx/mountainCues";
import { fxPredatorFlee, fxPressureLance } from "../fx/predatorCues";
import { fxCataclysmCast, fxCataclysmImpact } from "../fx/cataclysm";
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
import {
  endDetonateWindup,
  startDetonateWindup,
} from "../fx/detonateWindup";
import {
  endAllyAoeFootprint,
  fxAllyAoeFootprint,
  startAllyAoeFootprint,
} from "../fx/allyAoeFootprint";
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
  notifyStanceCooldownStarted,
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

/** Small captured render context; never retains a removed entity or Phaser sprite. */
export interface PlayerAttackPresentation {
  player: PlayerView;
  from: Vec2;
  to: Vec2;
  targetSize: number;
  killedBoss: boolean;
}

export function capturePlayerAttack(
  state: RenderState,
  ev: PlayerHitEvent | PlayerKillEvent,
): PlayerAttackPresentation | undefined {
  const player = state.view.get(ev.playerId) as PlayerView | undefined;
  const actor = state.sprite.get(ev.playerId);
  const target = state.sprite.get(ev.targetId);
  if (!player || !actor || !target) return undefined;
  return {
    player,
    from: { x: actor.x, y: actor.y },
    to: ev.kind === 'player-hit' && ev.targetPos
      ? nodeToScene(ev.targetPos.x, ev.targetPos.y)
      : { x: target.x, y: target.y },
    targetSize: Math.max(target.displayWidth, target.displayHeight),
    killedBoss: state.entity.get(ev.targetId)?.isMonster?.isBoss ?? false,
  };
}

function spawnRewardFloaters(scene: GameScene, ev: PlayerKillEvent, pos?: Vec2): void {
  const target = scene.state.sprite.get(ev.targetId);
  const x = pos?.x ?? target?.x ?? scene.cameras.main.worldView.centerX;
  const y = pos?.y ?? target?.y ?? scene.cameras.main.worldView.centerY;
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
  /**
   * Cosmetic elemental recolor for this attack, from the equipped weapon's
   * element / the class DoT path / an active transient effect. Undefined means
   * "keep your own palette" — every FX treats it as optional.
   */
  tint?: AttackTint;
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

/**
 * Elements contributed by a TRANSIENT effect on this specific hit, keyed by the
 * client-effect tag the server already puts on the event. Imbue Lightning
 * needed no new protocol: `ABILITY_IMBUE_FX` is pushed onto every
 * charge-consuming hit (see abilityImbue.ts) and was already read below to
 * crack lightning over the attacker.
 *
 * Snapshot-driven attacks by OTHER players carry no effect list, so their
 * transient tints are simply absent — the same graceful degradation the imbue
 * crackle itself already has.
 */
const TRANSIENT_ELEMENT_BY_EFFECT: Record<string, DamageElement> = {
  [ABILITY_IMBUE_FX]: "lightning",
};

function transientElement(effects: string[] | undefined): DamageElement | null {
  for (const id of effects ?? []) {
    const element = TRANSIENT_ELEMENT_BY_EFFECT[id];
    if (element) return element;
  }
  return null;
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

/** The Apprentice attack, with the caller choosing the projectile or close cast. */
function dotAttackFx(args: AttackFxArgs, cast: typeof fxApprenticeCast): void {
  const { scene, ev, from, to, dotPath, tint } = args;
  const element = dotPath ?? "poison";
  cast(scene, from.x, from.y, to.x, to.y, element, ev.empowered, () => {
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
  }, tint);
}

const ATTACK_FX_BY_ARCHETYPE: Record<NonNullArchetype, AttackFxFn> = {
  cadence: ({ scene, ev, from, to, tint }) =>
    fxStrikerSlash(scene, from.x, from.y, to.x, to.y, ev.empowered, tint),
  // NOT fxImpact: that is the generic fallback style, authored on 41 monsters.
  // The heaviest chassis in the game gets its own weight.
  cooldown: ({ scene, ev, to, tint }) =>
    fxSquireSlam(scene, to.x, to.y, ev.execution, tint),
  reload: ({ scene, ev, from, to, tint }) =>
    fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered, 1, tint),
  energy: ({ scene, ev, from, to, tint }) =>
    fxLightning(scene, from.x, from.y, to.x, to.y, ev.empowered, tint),
  dot: (args) => dotAttackFx(args, fxApprenticeCast),
  // Summoner uses a plain melee impact from the slime — the slime sprite is
  // the FX, and the empowered ring is handled separately via the player's
  // existing empoweredRing pass.
  summoner: ({ scene, ev, from, to, tint }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered, false, tint),
};

/**
 * Attack FX for a specific tier-2 RANGE choice, keyed by the full skill id the
 * `selectedRange` slice carries (e.g. `cadence-range-mid`). A range pick is a
 * change to how the character fights, so it gets to replace the archetype's
 * baseline animation outright; anything absent here falls through to
 * {@link ATTACK_FX_BY_ARCHETYPE}.
 */
const ATTACK_FX_BY_RANGE: Record<string, AttackFxFn> = {
  // ── cadence ──
  // Lancer traded the In-Fighter's crescent for reach — so it thrusts.
  "cadence-range-mid": ({ scene, ev, from, to, tint }) =>
    fxSpearThrust(scene, from.x, from.y, to.x, to.y, ev.empowered, tint),
  // Phantom-Blade fights at 132px with a sword, so the cut is thrown.
  "cadence-range-far": ({ scene, ev, from, to, tint }) =>
    fxBladeWave(scene, from.x, from.y, to.x, to.y, ev.empowered, tint),

  // ── cooldown ──
  // Phalanx sets the pike and punches; Sentinel sends it through the ground.
  "cooldown-range-mid": ({ scene, ev, from, to, tint }) =>
    fxPikeBrace(scene, from.x, from.y, to.x, to.y, ev.execution, tint),
  "cooldown-range-far": ({ scene, ev, from, to, tint }) =>
    fxSiegeBlow(scene, from.x, from.y, to.x, to.y, ev.execution, tint),

  // ── reload / energy / dot ──
  // The three CLOSE picks all floor to 12px (stats.ts clamps negative range at
  // PLAYER_ATTACK_RANGE), so their parent classes' travel-based FX had no
  // distance left to draw. Each gets a contact animation instead.
  "reload-range-close": ({ scene, ev, from, to, tint }) =>
    fxPointBlankShot(scene, from.x, from.y, to.x, to.y, ev.empowered, tint),
  "energy-range-close": ({ scene, ev, from, to, tint }) =>
    fxArcDischarge(scene, from.x, from.y, to.x, to.y, ev.empowered, tint),
  // Hexblade drags the spell into the enemy instead of throwing it.
  "dot-range-close": (args) => dotAttackFx(args, fxApprenticeCloseCast),
};

/**
 * Tier-4 path THRESHOLD cues, keyed by the client-effect tag the server pushes.
 *
 * A table rather than seven more branches on the effects chain below, which was
 * already a dozen `if (effectId === …) continue` clauses long. These all draw on
 * the TARGET — every one of them is a threshold crossed on the thing you hit.
 */
const TRIGGER_FX_BY_EFFECT: Record<
  string,
  (scene: GameScene, at: Vec2, args: AttackFxArgs) => void
> = {
  [CADENCE_VERDICT_EXECUTE_FX]: (scene, at) => fxVerdictExecute(scene, at.x, at.y),
  [CADENCE_OVERLOAD_FX]: (scene, at) => fxRampageOverload(scene, at.x, at.y),
  [CADENCE_CURSED_FINALE_FX]: (scene, at) => fxCursedFinale(scene, at.x, at.y),
  [COOLDOWN_SUNDER_FX]: (scene, at) => fxSunderShatter(scene, at.x, at.y),
  [DOT_RIMESHATTER_FX]: (scene, at) => fxRimeshatter(scene, at.x, at.y),
  [DOT_FROZEN_FX]: (scene, at) => fxFrozenShatter(scene, at.x, at.y),
  // Element-driven so the burst matches the path that filled the bar.
  [DOT_MAXSTACK_BURST_FX]: (scene, at, args) =>
    fxMaxStackBurst(scene, at.x, at.y, args.dotPath ?? "poison"),
};

/**
 * Single resolution order for a basic-attack animation: range pick, then
 * archetype, then the raw attack style. Both the own-player event path and the
 * snapshot path for other entities go through this so they never diverge.
 */
function resolveAttackFx(
  archetype: CombatArchetype,
  selectedRange: string | null,
  style: string,
): AttackFxFn {
  const byRange = selectedRange ? ATTACK_FX_BY_RANGE[selectedRange] : undefined;
  if (byRange) return byRange;
  if (archetype && ATTACK_FX_BY_ARCHETYPE[archetype])
    return ATTACK_FX_BY_ARCHETYPE[archetype];
  return ATTACK_FX_BY_STYLE[style] ?? ATTACK_FX_BY_STYLE.impact;
}

const ATTACK_FX_BY_STYLE: Record<string, AttackFxFn> = {
  slash: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered),
  'bear-claws': ({ scene, ev, to }) =>
    fxBearClaws(scene, to.x, to.y, ev.empowered),
  talons: ({ scene, from, to }) =>
    fxTalonStrike(scene, from.x, from.y, to.x, to.y),
  poison: ({ scene, to }) => fxPoison(scene, to.x, to.y),
  magic: ({ scene, from, to }) => fxMagic(scene, from.x, from.y, to.x, to.y),
  // Conduit summons — range picks which of these their attacks use. They carry
  // the OWNER's weapon element (resolved in minions.ts), which is why these
  // three styles read `tint` while the purely monster-facing ones do not.
  'conduit-beam': ({ scene, from, to, tint }) =>
    fxConduitBeam(scene, from.x, from.y, to.x, to.y, tint),
  'conduit-bolt': ({ scene, from, to, tint }) =>
    fxConduitBolt(scene, from.x, from.y, to.x, to.y, tint),
  frost: ({ scene, to }) => fxFrost(scene, to.x, to.y),
  fire: ({ scene, to }) => fxFire(scene, to.x, to.y),
  void: ({ scene, to }) => fxVoid(scene, to.x, to.y),
  impact: ({ scene, ev, to, tint }) =>
    fxImpact(scene, to.x, to.y, ev.execution, tint),
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

  // ─── MONSTER ATTACK-STYLE SPLIT (2026-09-12) ────────────────────────────────
  // A monster's `attackStyle` is its ENTIRE basic-attack animation (monsters.ts
  // calls `spawnAttackEffect` with nothing but the style), so a style shared across
  // unrelated creature families means those families have no attack identity at all.
  // These keys split the two biggest shared channels by creature VERB.
  //
  // ⚠ This table is a `Record<string, …>`: a typo in a key silently falls through to
  // the `impact` fallback and TypeScript cannot see it. Every key added here must
  // match an `attackStyle` in `shared/src/data/monsters/`; `monsterStyleCoverage`
  // in server/test guards that both ways.

  // Clawed mobs join the Forest bears' rake by WEIGHT and palette rather than by
  // getting their own animation — the rake is the Forest lineage's identity.
  "claws-light": ({ scene, ev, to }) =>
    fxBearClaws(scene, to.x, to.y, ev.empowered, { weight: 0.55 }),
  "claws-frost": ({ scene, ev, to }) =>
    fxBearClaws(scene, to.x, to.y, ev.empowered, {
      weight: 1.05,
      main: 0xeaf7ff,
      glow: 0x5aa8d8,
    }),

  // Biters likewise share one jaw with a biome palette. `weight` keeps a leviathan
  // from snapping with a wolf's mouth; `gravityY` is the tell — embers rise, blood
  // and meltwater fall.
  "bite-trench": ({ scene, ev, to }) =>
    fxBite(scene, to.x, to.y, ev.empowered, {
      weight: 1.5,
      fang: 0xdff3ff,
      gore: 0x2f7f9e,
      gravityY: 120,
    }),
  "bite-fire": ({ scene, ev, to }) =>
    fxBite(scene, to.x, to.y, ev.empowered, {
      weight: 1.05,
      fang: 0xffe2a8,
      gore: 0xe04a1a,
      gravityY: -90,
    }),
  "bite-venom": ({ scene, ev, to }) =>
    fxBite(scene, to.x, to.y, ev.empowered, {
      weight: 0.85,
      fang: 0xe8f0c8,
      gore: 0x6f9c3a,
      gravityY: 140,
    }),

  // The `impact` split, by verb.
  gore: ({ scene, ev, to }) => fxGore(scene, to.x, to.y, ev.empowered),
  "troll-fist": ({ scene, ev, to }) => fxTrollFist(scene, to.x, to.y, ev.empowered),
  "ape-fist": ({ scene, ev, to }) => fxApeFist(scene, to.x, to.y, ev.empowered),
  "reptile-tail": ({ scene, ev, to }) => fxReptileTail(scene, to.x, to.y, ev.empowered),

  // Graveyard skeletons: both were authored on `poison` while carrying no DoT at all.
  bone: ({ scene, ev, to }) => fxBoneStrike(scene, to.x, to.y, ev.empowered),

  // Ranged mobs that previously drew NO projectile, because `fxPoison`/`fxFire`/
  // `fxFrost` take only a target position.
  peck: ({ scene, ev, from, to }) =>
    fxPeck(scene, from.x, from.y, to.x, to.y, ev.empowered),
  dart: ({ scene, from, to }) => fxDart(scene, from.x, from.y, to.x, to.y),
  "fire-spit": ({ scene, from, to }) => fxFireSpit(scene, from.x, from.y, to.x, to.y),
  "frost-bolt": ({ scene, from, to }) => fxFrostBolt(scene, from.x, from.y, to.x, to.y),
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
  // Slam reuses the boss ground-slam: it is already the game's "an area just got
  // hit" vocabulary (cracks, expanding shock rings, debris), it takes the kill
  // radius as an argument so the FX lands exactly on the circle the server
  // damaged, and reusing it means a player reads a Slam the same way they have
  // been reading telegraphed AoE since Mountain. Radius comes from the authored
  // rank rather than a client constant, so the ring can never drift from the
  // damage. The stone `impact` palette keeps it distinct from Power Strike's
  // single-target flash.
  slam: (scene, _from, to) => fxSlam(scene, to.x, to.y, slamRadius(), "impact"),
  "stunning-strike": (scene, _from, to) => fxStunningStrike(scene, to.x, to.y),
  // Snipe is the one cast whose FX needs BOTH points: the distance crossed is
  // the ability, and an impact alone would not show it.
  snipe: (scene, from, to) => fxSnipe(scene, from.x, from.y, to.x, to.y),
  // A self-cast resolves on the caster, so both endpoints are the player.
  "imbue-lightning": (scene, from) => fxImbueCast(scene, from.x, from.y),
};

/** Slam's authored impact radius — the same number the server damages with. */
function slamRadius(): number {
  const effect = ABILITY_DATABASE.get("slam")?.ranks[0]?.effect;
  return effect?.kind === "cast-strike" ? (effect.radius ?? 150) : 150;
}

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
const RELOAD_CALLOUT_COLOR = "#f0b04f";

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
  presentation?: PlayerAttackPresentation,
): void {
  if (ev.kind === 'damage') return; // Amount-only events render in deltaApplier.
  if (ev.kind === "stance-switch") {
    if (ev.playerId === scene.myId) notifyStanceCooldownStarted();
    return;
  }
  // dot-tick / monster-hit amounts render separately in deltaApplier.
  // The lightning element (Tempest storm) also cracks a bolt down onto
  // the target on each tick for a "storm" read.
  if (ev.kind === "dot-tick") {
    if (shouldRunClientFx()) {
      const spr = state.sprite.get(ev.targetId);
      const tx = spr?.x ?? ev.targetPos.x;
      const ty = spr?.y ?? ev.targetPos.y;
      if (ev.fx === "conflagration") fxConflagrationTick(scene, tx, ty);
      else if (ev.element === "lightning") fxLightning(scene, tx, ty - 130, tx, ty, true);
      else if (ev.element === "doom") fxDoomTick(scene, tx, ty);
      // Everything else — bleed, poison, frost, fire — used to render as a bare
      // damage number. Hemomancer in particular converts its whole finisher into
      // a bleed, so it had no in-world presence at all.
      else if (ev.element) fxDotTick(scene, tx, ty, ev.element);
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

  if (ev.kind === "monster-drag") {
    // Node-wide, like every other ecology tell: watching someone else get hauled into
    // a bog is information about the bog. The victim's actual motion arrives as
    // ordinary `player-knockback` steps — this only draws the furrow they leave.
    if (shouldRunClientFx()) {
      const at = nodeToScene(ev.pos.x, ev.pos.y);
      // `start` carries the DESTINATION, `wake` the victim's current position.
      if (ev.phase === "wake") fxDragWake(scene, at.x, at.y);
      else if (ev.phase === "start") fxDragDestination(scene, at.x, at.y, ev.durationMs);
    }
    return;
  }

  if (ev.kind === "monster-cast-start") {
    // Node-wide telegraph: open the cast bar over the charging monster.
    startCastBar(state, ev.monsterId, ev.castMs, ev.label);
    // WIND-UP cues. A boss-pattern `cast` step emits only this event — it has no
    // cast-end of its own — so a step whose whole point is the wind-up (a committed
    // charge, a burrow, an escape) can only be drawn here. Anchored on the caster,
    // which is where all three of these happen.
    if (shouldRunClientFx() && ev.fx) {
      const caster = state.sprite.get(ev.monsterId);
      if (caster) {
        if (ev.fx === "charge-lane") fxChargeLane(scene, caster.x, caster.y);
        else if (ev.fx === "burrow") fxBurrow(scene, caster.x, caster.y);
        else if (ev.fx === "predator-flee") fxPredatorFlee(scene, caster.x, caster.y);
        else if (ev.fx === "cataclysm-cast") fxCataclysmCast(scene, caster.x, caster.y);
        // The Bog Lurker gathering itself at the water's edge. This is the beat the
        // whole ability is solvable from, so it has to be drawn on the wind-up and
        // not only on what lands.
        else if (ev.fx === "deathroll") fxDeathrollCoil(scene, caster.x, caster.y);
        // Deep Freeze's wind-up. The RELEASE is already drawn on `monster-cast-end`
        // below (`frostbind` -> fxDeepFreeze, anchored on the victim), so this adds
        // only the caster-side tell and must not repeat the lock animation.
        else if (ev.fx === "frostbind") fxFrostWindUp(scene, caster.x, caster.y);
      }
    }
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
      // ─── MONSTER/BOSS ABILITY CUES (2026-09-12) ───────────────────────────
      // Named abilities that were drawing a borrowed cue. `power-shot` in
      // particular is the `else` fallback at the bottom of this chain, so 15
      // named abilities were rendering as the Ridge Ambusher's ARROW without ever
      // having been assigned it.
      //
      // Impact-anchored cues use `impact` (the PLANTED point) and never the caster
      // or victim: by resolution time the boss has moved and the victim may have
      // walked out, and drawing a committed slam on someone who successfully left
      // contradicts the counterplay the telegraph exists to offer.
      } else if (monster && target && ev.fx === "petrifying-gaze") {
        fxPetrifyingGaze(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "sunbeam") {
        fxSunbeam(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "numbing-sting") {
        fxNumbingSting(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "wither") {
        fxWither(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "plague-hex") {
        fxPlagueHex(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "pressure-lance") {
        fxPressureLance(scene, monster.x, monster.y, target.x, target.y);
      } else if (ev.fx === "stalactite-shot") {
        // Falls from the cave roof onto the victim, so it anchors on the target
        // rather than flying from the gargoyle's perch.
        const at = target ?? impact;
        if (at) fxStalactiteShot(scene, at.x, at.y);
      } else if (ev.fx === "death-sting") {
        const at = target ?? impact ?? monster;
        if (at) fxDeathSting(scene, at.x, at.y);
      } else if (ev.fx === "frostbind") {
        const at = target ?? impact;
        if (at) fxDeepFreeze(scene, at.x, at.y);
      } else if (ev.fx === "avalanche-ram") {
        const at = target ?? impact;
        if (at) fxGore(scene, at.x, at.y, true);
      } else if (ev.fx === "execution") {
        // The payoff step publishes no radius, so the mark's own footprint is the
        // default. Anchored on the victim: this cue CONSUMES a mark on them.
        const at = target ?? impact ?? monster;
        if (at) fxExecution(scene, at.x, at.y, ev.radius ?? 150);
      } else if (impact && ev.fx === "pool-spawn") {
        playSfx("attack-blunt");
        fxPoolSpawn(scene, impact.x, impact.y, ev.radius ?? 110);
      } else if (impact && ev.fx === "ground-slam") {
        playSfx("attack-blunt");
        fxGroundSlam(scene, impact.x, impact.y, ev.radius ?? 120);
      } else if (impact && ev.fx === "glacial-slam") {
        playSfx("attack-blunt");
        fxGlacialSlam(scene, impact.x, impact.y, ev.radius ?? 150);
      } else if (impact && ev.fx === "deep-core-eruption") {
        playSfx("attack-blunt");
        fxEmerge(scene, impact.x, impact.y, ev.radius ?? 160);
      } else if (impact && ev.fx === "shatter") {
        fxShatter(scene, impact.x, impact.y, ev.radius ?? 195);
      } else if (impact && ev.fx === "cataclysm-impact") {
        playSfx("attack-blunt");
        fxCataclysmImpact(scene, impact.x, impact.y, ev.radius ?? 2000);
      } else if (impact && ev.fx === "bombardment") {
        fxBombardment(scene, impact.x, impact.y, ev.radius ?? 130);
      } else if (impact && ev.fx === "deep-freeze-area") {
        fxDeepFreeze(scene, impact.x, impact.y);
      } else if (impact && ev.fx === "devour") {
        // The trench maw at full size, on the planted circle.
        fxBite(scene, impact.x, impact.y, true, {
          weight: 2.4,
          fang: 0xdff3ff,
          gore: 0x2f7f9e,
          gravityY: 120,
        });
      } else if (ev.fx === "huge-boulder") {
        // Boulder Thrower's named throw. This id was EMITTED by the data and
        // handled nowhere, so it fell through to `fxPowerShot` and rendered as a
        // glowing arrow — while `fxBoulder` was already drawing this same mob's
        // ordinary attack. Its big version looked less like a boulder than its small one.
        const land = impact ?? target;
        if (monster && land) {
          fxBoulder(scene, monster.x, monster.y, land.x, land.y);
          scene.time.delayedCall(260, () => {
            playSfx("attack-blunt");
            fxGroundSlam(scene, land.x, land.y, ev.radius ?? 83);
          });
        }
      } else if (monster && target && ev.fx === "deathroll") {
        fxDeathrollLunge(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "trench-lunge") {
        fxSavageMaul(scene, monster.x, monster.y, target.x, target.y);
      } else if (monster && target && ev.fx === "trench-depth-bolt") {
        fxPowerShot(scene, monster.x, monster.y, target.x, target.y);
      } else if (ev.fx === "frost-tusk-impact" || ev.fx === "volcanic-eruption") {
        // Anchor on the PLANTED circle when the ability broadcast one (the
        // Mastodon's Frost-Tusk Impact is a committed area now), and fall back to
        // the victim for the target-following version (Molten Eruption). Drawing a
        // committed slam on the player who successfully walked out of it would
        // contradict the counterplay the telegraph exists to offer.
        const at = impact ?? target;
        if (at) fxStrongKick(scene, at.x, at.y);
      } else if (ev.fx === "trench-lantern-pulse") {
        // Anchor on the victim, else the caster, else the broadcast impact. Every
        // branch must resolve a real anchor — a missing sprite must skip the cue,
        // not draw it at the scene origin.
        const at = target ?? monster ?? impact;
        if (at) fxTrenchPulse(scene, at.x, at.y, 0xe0a8ff);
      } else if (impact && ev.fx === "timberclaw-swipe") {
        // Anchored on the planted circle, never the caster: the boss has already
        // moved on by the time its sweep resolves.
        playSfx("attack-blunt");
        fxTimberclawSwipe(scene, impact.x, impact.y, ev.radius ?? 90);
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
      } else if (monster && target && ev.fx === "rime-pounce") {
        // Same committed rush line as Dive Bomb, in frost: the Frost Lurker is a
        // ground predator, so it reuses the motion primitive rather than the
        // raptor palette.
        fxDiveBomb(scene, monster.x, monster.y, target.x, target.y, 0x6699bb, 0xccffff);
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
      } else if (ev.fx === "stagger") {
        // The punish window. `bossPatterns.ts` has always published this and the
        // client never drew it, so breaking a plate or an escape-guard — the only
        // counterplay these encounters offer — was rewarded with silence.
        fxStagger(scene, at.x, at.y);
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

  if (ev.kind === 'player-reload-start') {
    if (shouldRunClientFx() && state.sprite.has(ev.playerId)) {
      spawnSkillCallout(
        state,
        scene,
        ev.playerId,
        'Reloading',
        RELOAD_CALLOUT_COLOR,
      );
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
    // An ability that shipped a target AND a colour gets a wind-up drawn on that
    // target for the whole cast. Both fields are optional on the event, so an
    // ability with nothing to say simply keeps the bare cast bar.
    if (shouldRunClientFx() && ev.targetId && ev.element) {
      startDetonateWindup(
        state,
        scene,
        ev.playerId,
        ev.targetId,
        ev.castMs,
        ev.element,
      );
    }
    // An AREA cast shows the ground it is about to cover for the whole wind-up,
    // in the friendly palette — Slam's blow, Contagion's spread. Gated on the
    // server having sent a radius rather than on the ability's name, so any cast
    // that declares an area is drawn and a single-target cast draws nothing. Node-
    // wide, because standing inside an ally's Slam is not information you should
    // have to guess at either.
    if (shouldRunClientFx() && ev.targetId && ev.aoeRadius) {
      startAllyAoeFootprint(
        state,
        scene,
        ev.playerId,
        ev.targetId,
        ev.castMs,
        ev.aoeRadius,
      );
    }
    if (ev.playerId === scene.myId) {
      notifyAbilityCastStarted(ev.ability, ev.castMs);
    }
    return;
  }

  if (ev.kind === "player-aoe-footprint") {
    // An armed attack's area, drawn only once it has ACTUALLY resolved — Sweep's
    // cleave around the monster the swing landed on. The same friendly green as
    // the cast footprint, but a quick after-the-fact pulse rather than a tracking
    // wind-up: there is nothing left to reposition for, so this reports what was
    // caught instead of warning about what is coming. The slash FX rides the
    // primary `player-hit` and is untouched by this.
    //
    // Radius and centre are used verbatim — they are the numbers the server
    // selected victims with, so the ring is exactly where the splash stopped.
    // Node-wide, like the cast footprint: an ally's cleave is worth seeing.
    if (shouldRunClientFx()) {
      const at = nodeToScene(ev.pos.x, ev.pos.y);
      fxAllyAoeFootprint(state, scene, ev.playerId, at.x, at.y, ev.radius);
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
      // Belt and braces: the release re-anchors the FX on the burst's own
      // position, so any wind-up still tracking a target that has since moved
      // (or died to the burst) stops here rather than on the next frame.
      endDetonateWindup(state, ev.playerId);
      fxDetonate(scene, ev.pos.x, ev.pos.y, ev.element);
      // Detonate always reads as a crit — it is the payoff of the whole
      // affliction pair. The audio half of the same tell the server flags on
      // the damage number, kept to the acting player so a node full of casters
      // cannot stack the cue.
      if (ev.playerId === scene.myId) playSfx("empowered");
    }
    return;
  }

  if (ev.kind === "player-cast-end") {
    endCastBar(state, ev.playerId);
    // Runs for BOTH outcomes: an interrupted cast must stop drawing its wind-up
    // just as surely as a resolved one, and this is the only event that fires
    // for both.
    endDetonateWindup(state, ev.playerId);
    endAllyAoeFootprint(state, ev.playerId);
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
  // Direct player hits use this event path for every viewer. Snapshot-driven
  // remote-player attacks used to collapse multiple shots into one animation.
  if (!isOwnPlayerEvent && !isWatchedPlayerEvent && ev.kind !== 'player-hit') return;
  const actorId = isOwnPlayerEvent ? state.ownId : ev.playerId;

  // Remote continuous beams/teleports retain their lightweight style renderer;
  // they must never activate the local player's beam or movement controllers.
  if (!isOwnPlayerEvent && !isWatchedPlayerEvent && ev.kind === 'player-hit') {
    const player = presentation?.player ?? state.view.get(ev.playerId) as PlayerView | undefined;
    const from = state.sprite.get(ev.playerId) ?? presentation?.from;
    const to = presentation?.to ?? state.sprite.get(ev.targetId);
    if (shouldRunClientFx() && player && from && to && (player.summonsMinions ?? 0) === 0) {
      spawnAttackEffect(scene, player.attackStyle, { x: from.x, y: from.y }, { x: to.x, y: to.y }, {
        archetype: player.combatArchetype ?? undefined,
        selectedRange: player.selectedRange,
        dotPath: player.combatArchetype === 'dot' ? getDotPath(player) : undefined,
      });
    }
    return;
  }

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
    const player = presentation?.player ?? (actorId
      ? (state.view.get(actorId) as PlayerView | undefined)
      : undefined);
    if (shouldRunClientFx() && (isOwnPlayerEvent || isWatchedPlayerEvent)) {
      // Throttled in the engine, so pellet bursts collapse to one cue.
      if (ev.empowered || ev.execution) playSfx("empowered");
      else playSfx(attackSfxFor(player?.combatArchetype ?? null, player?.attackStyle ?? ""));
    }
    // Minion hits already play FX from minions.ts (lastAttackAt); skip body lunge/FX.
    if (shouldRunClientFx() && (player?.summonsMinions ?? 0) === 0) {
      runFxForAttackStyle(state, ev, scene, presentation);
    }
    // The mirror of the player's own graze: the target rolled with the blow.
    if (ev.evadedPartial) spawnGrazeLabel(state, scene, ev.targetId);
  }

  if (ev.kind === "player-kill") {
    if (shouldRunClientFx()) {
      // Bosses get their own death sting from the removal path (deltaApplier);
      // don't also fire the generic enemy-death cue for them.
      const killedBoss = presentation?.killedBoss ?? state.entity.get(ev.targetId)?.isMonster?.isBoss ?? false;
      if (!killedBoss) playSfx("kill");
      spawnRewardFloaters(scene, ev, presentation?.to);
    }
  }
}

function runFxForAttackStyle(
  state: RenderState,
  ev: PlayerHitEvent,
  scene: GameScene,
  presentation?: PlayerAttackPresentation,
): void {
  const actorId = ev.playerId;
  const actorSprite = state.sprite.get(actorId);
  const targetSprite = state.sprite.get(ev.targetId);
  const player = presentation?.player ?? state.view.get(actorId) as PlayerView | undefined;
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

  if (!targetSprite && !presentation) {
    if (isFlashTeleport) {
      snapPlayerToServerTarget(state, scene, actorId, ev.targetId, ev.playerPos);
    }
    return;
  }

  if ((!actorSprite && !presentation) || !player) return;

  const dotPath =
    player.combatArchetype === "dot" ? getDotPath(player) : undefined;
  const bossScale =
    (presentation?.targetSize ?? Math.max(targetSprite!.displayWidth, targetSprite!.displayHeight)) > 64
      ? 1.33
      : 1;
  const targetEffectScale = 1.5 * bossScale;
  const isLaser =
    player.combatArchetype === "reload" &&
    (player.passives["reload.laser"] ?? 0) > 0;
  // Three paths whose ATTACK is wrong, all detectable from passives the client
  // already has — the same shape as isLaser above, so no new protocol.
  const isHeavyShell =
    player.combatArchetype === "reload" &&
    (player.passives["reload.snipe"] ?? 0) > 0;
  const isLightningDagger =
    player.combatArchetype === "energy" &&
    (player.passives["energy.flash"] ?? 0) > 0;
  // Hemomancer's finisher converts entirely into a bleed and lands no direct
  // damage, so only the EMPOWERED hit gets the wound treatment; its regular
  // attacks are ordinary and keep the normal crescent.
  const isBleedOpen =
    ev.empowered &&
    player.combatArchetype === "cadence" &&
    (player.passives["cadence.hemorrhage"] ?? 0) > 0;
  const isHollowStrike = ev.effects?.includes(COOLDOWN_HOLLOW_FX) ?? false;
  // Equinox: the phase is already on the wire as the aura id, so the attack can
  // match the glow without a protocol change of its own.
  const isEquinox =
    player.combatArchetype === "energy" &&
    (player.passives["energy.binary-cycle"] ?? 0) > 0;

  const from = actorSprite ? { x: actorSprite.x, y: actorSprite.y } : presentation!.from;
  const to = presentation?.to ?? (ev.targetPos
    ? nodeToScene(ev.targetPos.x, ev.targetPos.y)
    : { x: targetSprite!.x, y: targetSprite!.y });
  // Cosmetic elemental recolor. The class DoT path (Apprentice only) takes the
  // wash; the weapon and any transient effect take the lighter layers.
  const tint =
    resolveAttackTint(player, dotPath ?? null, transientElement(ev.effects)) ??
    undefined;
  const args: AttackFxArgs = { scene, ev, player, from, to, dotPath, tint };

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
  } else if (isHollowStrike) {
    // No empowered ring, no lunge FX, nothing but a dead tap.
    fxHollowStrike(scene, to.x, to.y);
  } else if (isBleedOpen) {
    fxBleedOpen(scene, from.x, from.y, to.x, to.y, ev.empowered);
  } else if (isHeavyShell) {
    playEmpoweredRing(args);
    fxHeavyShell(scene, from.x, from.y, to.x, to.y, ev.empowered, tint);
  } else if (isLightningDagger) {
    playEmpoweredRing(args);
    fxLightningDagger(
      scene,
      from.x,
      from.y,
      to.x,
      to.y,
      player.flashShiftPct ?? 0,
      ev.empowered,
      tint,
    );
  } else if (isEquinox) {
    playEmpoweredRing(args);
    fxEquinoxArc(
      scene,
      from.x,
      from.y,
      to.x,
      to.y,
      player.aura === "equinox-discharge",
      ev.empowered,
      tint,
    );
  } else if (isSwiftblade) {
    // Swiftblade replaces the default cadence slash with its dual diagonal slash;
    // both the primary and the extra strikes carry this effect.
    playEmpoweredRing(args);
    fxDualSlash(scene, to.x, to.y, ev.empowered);
  } else {
    playEmpoweredRing(args);
    resolveAttackFx(
      player.combatArchetype,
      player.selectedRange,
      player.attackStyle,
    )(args);
  }

  if (isFlashTeleport) {
    snapPlayerToServerTarget(state, scene, actorId, ev.targetId, ev.playerPos);
  }

  for (const effectId of ev.effects ?? []) {
    if (effectId === FLASH_CLIENT_EFFECT) continue;
    if (effectId === SWIFTBLADE_CLIENT_EFFECT) continue; // handled above
    if (effectId === COOLDOWN_HOLLOW_FX) continue; // handled above
    if (effectId === CHANNEL_BEAM_CLIENT_EFFECT) continue; // handled above
    if (effectId === HOLY_FLASH_CLIENT_EFFECT) continue; // handled above
    if (effectId === EXPLODING_CLIP_CLIENT_EFFECT) continue; // handled above
    if (effectId === ALT_ONHIT_CLIENT_EFFECT) continue; // handled above
    if (effectId === DEATH_MARK_BLAST_CLIENT_EFFECT) continue; // handled above
    if (effectId === CANNON_BLAST_CLIENT_EFFECT) continue; // handled above
    if (effectId === VOID_DISCHARGE_CLIENT_EFFECT) continue; // handled above
    const triggerFx = TRIGGER_FX_BY_EFFECT[effectId];
    if (triggerFx) {
      triggerFx(scene, to, args);
      continue;
    }
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
    /** Precomputed by the caller, which has the full PlayerView to read gear from. */
    tint?: AttackTint;
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
    tint: flags?.tint,
  };

  playEmpoweredRing(args);
  resolveAttackFx(flags?.archetype ?? null, flags?.selectedRange ?? null, style)(args);

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
