/** Preserve the familiar 60 Hz response at any render rate. */
export function cameraFollowAlpha(dt: number, auto: boolean): number {
  return 1 - Math.pow(1 - (auto ? 0.3 : 0.1), Math.max(0, dt) * 60);
}

/** Ease out of boundary framing without a discontinuous edge-pin release. */
export function edgeCameraPosition(position: number, size: number): number {
  const band = 160;
  const distance = Math.min(position, size - position);
  if (distance >= band) return position;
  const t = Math.max(0, distance / band);
  const weight = t * t * (3 - 2 * t);
  return position < size / 2 ? distance * weight : size - distance * weight;
}
