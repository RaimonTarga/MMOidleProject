import type { AcceptedSfxId } from './acceptedCatalog';

/** Pure semantic routing: no timers, render state, or gameplay decisions. */
export function attackCue(archetype: string | null, style: string, empowered = false, element?: string): AcceptedSfxId {
  if (style.startsWith('conduit-') || archetype === 'summoner') return 'summon-hit';
  if (empowered) {
    if (archetype === 'energy') return 'spirit-empowered';
    if (archetype === 'cooldown') return 'squire-empowered';
    if (archetype === 'cadence') return 'striker-empowered';
  }
  if (archetype === 'energy') return 'spirit';
  if (archetype === 'reload') return 'shot';
  if (archetype === 'cooldown') return 'blunt';
  if (archetype === 'cadence') return 'slash';
  if (archetype === 'dot') return element === 'frost' || element === 'ice' ? 'ice' : element === 'poison' ? 'poison' : 'fire';
  return STYLE_CUES[style] ?? 'blunt';
}
const STYLE_CUES: Record<string, AcceptedSfxId> = {
  poison:'poison', impact:'blunt', gore:'bite', fire:'fire', quake:'slam', bite:'bite', magic:'magic',
  frost:'ice', arrow:'bow', 'reptile-tail':'maul', 'bite-trench':'bite', 'claws-light':'claw',
  'troll-fist':'maul', talons:'claw', 'ape-fist':'maul', slash:'slash', sandblast:'sand',
  stonespit:'rock-launch', hex:'curse', boulder:'rock-launch', 'bite-venom':'bite', 'bite-fire':'bite',
  'fire-spit':'fire', 'claws-frost':'claw', 'frost-bolt':'ice', bone:'bone', 'bear-claws':'claw',
  dart:'bow', peck:'claw', gunshot:'shot', void:'magic',
};
const WINDUP: Record<string, AcceptedSfxId> = {
  'charge-lane':'charge', burrow:'burrow', 'predator-flee':'escape',
};
const RELEASE: Record<string, AcceptedSfxId> = {
  howl:'rally', 'chest-beat':'frenzy', barrage:'bow', 'petrifying-gaze':'snare', sunbeam:'sunbeam',
  'numbing-sting':'slow', wither:'curse', 'plague-hex':'curse', 'pressure-lance':'pressure-lance',
  'stalactite-shot':'rock-impact', 'death-sting':'mark', frostbind:'freeze', 'avalanche-ram':'maul',
  execution:'execution', 'pool-spawn':'pool', 'ground-slam':'slam', 'glacial-slam':'shatter',
  'deep-core-eruption':'emerge', shatter:'shatter', 'cataclysm-impact':'cataclysm', bombardment:'explosion',
  'deep-freeze-area':'freeze', devour:'devour', 'huge-boulder':'rock-launch', deathroll:'deathroll',
  'trench-lunge':'bite', 'trench-depth-bolt':'pressure-lance', 'frost-tusk-impact':'maul',
  'volcanic-eruption':'explosion', 'trench-lantern-pulse':'curse', 'timberclaw-swipe':'claw',
  'trench-tail-sweep':'maul', 'trench-body-sweep':'maul', 'trench-silt-mine':'explosion',
  'trench-current':'undertow', 'trench-surge':'undertow', 'trench-carapace':'shield-up',
  'volcanic-guard':'shield-up', 'volcanic-shell':'shield-up', 'dive-bomb':'ambush', 'rime-pounce':'ambush',
  'strong-kick':'maul', 'savage-maul':'maul', 'power-shot':'bow', 'predator-ambush':'ambush',
  constrict:'constrict', 'fault-lines':'fault-lines', 'raise-dead':'raise-dead',
};
export function castCue(fx: string | undefined, phase: 'start' | 'end', fired = true, label?: string): AcceptedSfxId | undefined {
  if (!fx || (phase === 'end' && !fired)) return undefined;
  if (phase === 'end' && label) {
    const named: Record<string, AcceptedSfxId> = {
      Constrict:'constrict', Devour:'devour', 'Abyssal Bite':'bite', 'Venomous Bite':'ambush',
      Ambush:'ambush', 'Raise Dead':'raise-dead', 'Mass Resurrection':'raise-dead',
      'Rallying Cry':'rally', 'Bestial Frenzy':'frenzy',
    };
    if (named[label]) return named[label];
  }
  return (phase === 'start' ? WINDUP : RELEASE)[fx];
}
export const ecologyCues: Record<string, AcceptedSfxId> = {
  'pack-call':'pack', 'shell-up':'shield-up', 'frost-shatter':'shatter', 'raise-dead':'raise-dead',
  'sun-mark':'sand',
};
export const bossCues: Record<string, AcceptedSfxId> = {
  slam:'slam', summon:'summon', shield:'shield-up', roar:'rally', frenzy:'frenzy', stagger:'shield-break',
};
export function statusCue(buff: { id: string; label?: string; iconKey?: string }): AcceptedSfxId | undefined {
  if (buff.id === 'debuff-slow') return 'slow';
  if (buff.id === 'debuff-root') return 'snare';
  if (buff.id === 'debuff-antiheal') return 'curse';
  // Frozen is voiced by its overlay. Chill stacks, armor erosion, and DoT ticks stay silent.
  if (buff.id !== 'debuff-dot' && buff.id !== 'debuff-swamp-rot') return undefined;
  if (buff.iconKey === 'debuff-poison' || /poison|venom|rot|plague/i.test(buff.label ?? '')) return 'poison-status';
  if (/burn|fire|scorch/i.test(buff.label ?? '')) return 'burn-status';
  return undefined;
}
