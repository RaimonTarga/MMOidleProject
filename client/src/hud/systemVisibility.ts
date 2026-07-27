/**
 * The visibility policy itself lives in shared (pure logic over authoritative
 * state, and therefore testable by the repo runner). This re-export keeps the
 * HUD's import paths pointing at the HUD.
 */
export {
  masteryIsVisible,
  resolveSystemVisibility,
  type SystemVisibility,
  type SystemVisibilityInput,
} from "@mmo-idle/shared";
