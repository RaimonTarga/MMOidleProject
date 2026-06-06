import type { TargetStatusView, TracksCombat } from '@mmo-idle/shared';
import type { World } from '../../world/World';

// Mirrors the full debuff list of each player's current attack target onto the
// monster's networked hasStatus.targetStatus, so the HUD target frame can show
// what's afflicting the thing you're fighting. Scoped to targeted monsters only
// (bounded by player count) — not every monster every tick. Stale lists are
// cleared when a monster stops being anyone's target.
const lastTargeted = new Set<string>();

export function mirrorTargetStatus(world: World): void {
  const nowTargeted = new Set<string>();

  for (const player of world.livePlayers) {
    const targetId = player.hasAttackTarget?.targetId;
    if (!targetId || nowTargeted.has(targetId)) continue;
    const monster = world.getMonsterEntity(targetId);
    if (!monster?.hasStatus || !monster.tracksCombat) continue;
    nowTargeted.add(targetId);
    monster.hasStatus.targetStatus = buildTargetStatus(monster.tracksCombat);
  }

  // Clear lists left on monsters that are no longer anyone's target.
  for (const id of lastTargeted) {
    if (nowTargeted.has(id)) continue;
    const monster = world.getMonsterEntity(id);
    if (monster?.hasStatus?.targetStatus && monster.hasStatus.targetStatus.length > 0) {
      monster.hasStatus.targetStatus = [];
    }
  }

  lastTargeted.clear();
  for (const id of nowTargeted) lastTargeted.add(id);
}

function buildTargetStatus(tracksCombat: TracksCombat): TargetStatusView[] {
  const out: TargetStatusView[] = [];
  for (const fx of tracksCombat.statusEffects) {
    if (fx.remainingMs === 0) continue; // expired this tick
    out.push({
      id: fx.id,
      stacks: fx.stacks,
      remainingMs: fx.remainingMs,
      totalMs: fx.data.totalMs ?? 0,
    });
  }
  return out;
}
