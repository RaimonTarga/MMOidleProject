import Phaser from "phaser";
import type { GameScene } from "../scenes/game/GameScene";

export const MIST_PIPELINE_KEY = "VoidMistPostFx";

// Full fade-in / fade-out duration in seconds.
const FADE_SECONDS = 1.5;

const FRAG_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 outTexCoord;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec4 base = texture2D(uMainSampler, outTexCoord);

  // Aspect-correct the sample space so the noise cells stay square.
  vec2 uv = outTexCoord;
  uv.x *= uResolution.x / max(uResolution.y, 1.0);

  float t = uTime * 0.05;

  // Domain-warped fbm for a churning, billowing miasma.
  vec2 q = vec2(
    fbm(uv * 3.0 + vec2(t, t * 0.5)),
    fbm(uv * 3.0 + vec2(-t * 0.7, t * 0.3) + 5.2)
  );
  float mist = fbm(uv * 3.0 + q * 1.5 + vec2(t * 0.3, -t * 0.2));
  mist = smoothstep(0.15, 0.95, mist);

  vec3 deep = vec3(0.16, 0.02, 0.28);
  vec3 bright = vec3(0.55, 0.20, 0.85);
  vec3 mistColor = mix(deep, bright, mist);

  // Heavier mist toward the screen edges.
  vec2 centered = outTexCoord - 0.5;
  float vignette = smoothstep(0.9, 0.15, length(centered));

  float amount = uIntensity * (0.30 + 0.40 * mist) * mix(0.65, 1.0, vignette);
  vec3 outColor = mix(base.rgb, mistColor, clamp(amount, 0.0, 0.82));

  // Slow ambient pulse so the haze feels alive.
  outColor += mistColor * uIntensity * 0.05 * (0.5 + 0.5 * sin(uTime * 0.8));

  gl_FragColor = vec4(outColor, base.a);
}
`;

class MistPostFxPipeline extends Phaser.Renderer.WebGL.Pipelines
  .PostFXPipeline {
  private mistTime = 0;
  private mistIntensity = 0;

  constructor(game: Phaser.Game) {
    super({
      game,
      name: MIST_PIPELINE_KEY,
      fragShader: FRAG_SHADER,
    });
  }

  setMistUniforms(timeSeconds: number, intensity: number): void {
    this.mistTime = timeSeconds;
    this.mistIntensity = intensity;
  }

  onPreRender(): void {
    this.set1f("uTime", this.mistTime);
    this.set1f("uIntensity", this.mistIntensity);
    this.set2f("uResolution", this.renderer.width, this.renderer.height);
  }
}

function getWebGLRenderer(
  scene: GameScene,
): Phaser.Renderer.WebGL.WebGLRenderer | null {
  const renderer = scene.game.renderer;
  return renderer.type === Phaser.WEBGL
    ? (renderer as Phaser.Renderer.WebGL.WebGLRenderer)
    : null;
}

let pipelineRegistered = false;

/** Register the mist post-processing pipeline. Safe no-op under Canvas. */
export function initMistPostFx(scene: GameScene): void {
  const renderer = getWebGLRenderer(scene);
  if (!renderer || pipelineRegistered) return;
  renderer.pipelines.addPostPipeline(MIST_PIPELINE_KEY, MistPostFxPipeline);
  pipelineRegistered = true;
}

function getAttachedPipeline(scene: GameScene): MistPostFxPipeline | null {
  const result = scene.cameras.main.getPostPipeline(MIST_PIPELINE_KEY);
  if (!result) return null;
  const pipe = Array.isArray(result) ? result[0] : result;
  return pipe instanceof MistPostFxPipeline ? pipe : null;
}

/**
 * Drive the mist effect each frame. Fades the purple miasma in while `active`,
 * out otherwise, attaching the pipeline only while it is visible.
 */
export function updateMistPostFx(
  scene: GameScene,
  active: boolean,
  timeMs: number,
  dt: number,
): void {
  const renderer = getWebGLRenderer(scene);
  if (!renderer) return;

  const target = active ? 1 : 0;
  const step = dt / FADE_SECONDS;
  if (scene.mistIntensity < target) {
    scene.mistIntensity = Math.min(target, scene.mistIntensity + step);
  } else if (scene.mistIntensity > target) {
    scene.mistIntensity = Math.max(target, scene.mistIntensity - step);
  }

  const camera = scene.cameras.main;
  const intensity = scene.mistIntensity;

  if (intensity <= 0) {
    if (getAttachedPipeline(scene)) {
      camera.removePostPipeline(MIST_PIPELINE_KEY);
    }
    return;
  }

  let pipe = getAttachedPipeline(scene);
  if (!pipe) {
    camera.setPostPipeline(MIST_PIPELINE_KEY);
    pipe = getAttachedPipeline(scene);
  }
  pipe?.setMistUniforms(timeMs / 1000, intensity);
}
