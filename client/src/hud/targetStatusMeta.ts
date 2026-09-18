// Display metadata for target-frame debuff tiles. Status ids come straight from
// the server's TracksCombat effects; boss-effect names from bossScripts. Unknown
// ids fall back to a prettified label so nothing renders blank.

export interface StatusMeta {
  label: string;
  color: string;
}

const STATUS_META: Record<string, StatusMeta> = {
  dot:             { label: 'DoT',     color: '#7ac74f' },
  'dot-chill':     { label: 'Chill',   color: '#6fd0ff' },
  'dot-frozen':    { label: 'Frozen',  color: '#9fe8ff' },
  'dot-smolder':   { label: 'Smolder', color: '#ff8a3c' },
  'dot-conf':      { label: 'Conflag', color: '#ff5a2c' },
  slow:            { label: 'Slow',    color: '#88aaff' },
  root:            { label: 'Root',    color: '#aa77ee' },
  'ability-slowed': { label: 'Hamstrung', color: '#88aaff' },
  'ability-rooted': { label: 'Bound', color: '#aa77ee' },
  stunned:         { label: 'Stunned', color: '#ffdd44' },
  'stun-immune':   { label: 'Stun ward', color: '#c6a8ff' },
  'enemy-barrier': { label: 'Barrier', color: '#5599ff' },
  'canopy-chameleon-barrage': { label: 'Barrage', color: '#89dd59' },
  'thornback-chameleon-barrage': { label: 'Barrage', color: '#89dd59' },
  'boss-roar-haste': { label: 'Rallying Cry', color: '#b18cff' },
  'monster-death-empower': { label: 'Necrotic Surge', color: '#c678e8' },
  'elder-carapace-renewal': { label: 'Abyssal Carapace', color: '#5ccdd0' },
  'magma-molten-guard': { label: 'Molten Guard', color: '#ff7a3c' },
  'magma-obsidian-shell': { label: 'Obsidian Shell', color: '#df6248' },
  'shatter-vulnerable': { label: 'Shatter Window', color: '#78cfff' },
  'plating-shred': { label: 'Shred',   color: '#d8b24a' },
  'reload-suppress-shred': { label: 'Suppressed', color: '#d8b24a' },
  'cadence-hemorrhage': { label: 'Bleed', color: '#c41e1e' },
  'energy-storm':       { label: 'Storm', color: '#c77dff' },
  brittle:         { label: 'Brittle', color: '#d88a4a' },
  'dr-shatter':    { label: 'Shattered', color: '#f0c04a' },
  // Weapon reservoir-DoT effects (poison → Poison, fire → Burn, frost → Chill).
  // Swamp owns poison, Volcanic owns fire, Tundra owns frost.
  'poison-dagger-burn':     { label: 'Poison', color: '#7ac74f' },
  'swamp-mirebrand-burn':   { label: 'Poison', color: '#7ac74f' },
  'swamp-blightbrand-burn': { label: 'Poison', color: '#7ac74f' },
  'cinderbrand-burn':       { label: 'Burn',   color: '#ff7a3c' },
  'tundra-rimebrand-burn':  { label: 'Chill',  color: '#6fd0ff' },
  'rimebrand-burn':         { label: 'Chill',  color: '#6fd0ff' },
  'void-corruption':         { label: 'Corrupt', color: '#b06cff' },
  vuln:            { label: 'Vuln',    color: '#ff5577' },
  vulnerability:   { label: 'Vuln',    color: '#ff5577' },
  'expose-weakness': { label: 'Exposed', color: '#ff5577' },
  'summoner-harried': { label: 'Accused', color: '#e6c35c' },
  'summoner-withering-chorus': { label: 'Chorus', color: '#9d6ad6' },
  'monster-howl-haste': { label: 'Howl', color: '#b18cff' },
  'monster-ape-chestbeat': { label: 'Chestbeat', color: '#c98b5b' },
  'thorn-spitter-barrage': { label: 'Barrage', color: '#89dd59' },
  'granite-barrier': { label: 'Granite Barrier', color: '#8faed0' },
  shelled: { label: 'Shelled', color: '#9fca68' },
  'carrion-screech-haste': { label: 'Necrotic Screech', color: '#b18cff' },
  // Pre-encounter aura SOURCE (pack caller / den alpha) — "this one buffs its allies".
};

const BOSS_META: Record<string, StatusMeta> = {
  enrage:      { label: 'Enraged',   color: '#ff4444' },
  regen:       { label: 'Regen',     color: '#44dd77' },
  shield:      { label: 'Shield',    color: '#5599ff' },
  summon:      { label: 'Summon',    color: '#cc88ff' },
  'stat-buff': { label: 'Empowered', color: '#ffaa33' },
  'stat-buff-attack': { label: 'Enraged', color: '#ff5544' },
  'stat-buff-speed': { label: 'Frenzied', color: '#ff8844' },
  'stat-buff-attackSpeed': { label: 'Frenzied', color: '#ff8844' },
  'stat-buff-plating': { label: 'Hardened', color: '#9fb7c9' },
  'stat-buff-damageReduction': { label: 'Fortified', color: '#5599ff' },
  'stat-buff-evasion': { label: 'Elusive', color: '#b18cff' },
  'relentless-pursuit': { label: 'Relentless Pursuit', color: '#f08a45' },
  'crag-rush': { label: 'Crag Rush', color: '#c58b5a' },
  'cinder-fury': { label: 'Cinder Fury', color: '#ff6b38' },
  'earthshaker-rush': { label: 'Earthshaker Rush', color: '#d6a25e' },
  sandsurge: { label: 'Sandsurge', color: '#e4b84f' },
  'bestial-frenzy': { label: 'Bestial Frenzy', color: '#e85d45' },
  'caldera-fury': { label: 'Caldera Fury', color: '#ff6b38' },
  'blood-in-the-water': { label: 'Blood in the Water', color: '#e05252' },
  morph:       { label: 'Morph',     color: '#dd66cc' },
  slam:        { label: 'Slam',      color: '#ff7744' },
  // The punish window at the end of an authored boss sequence. Yellow because it is
  // the one boss effect that is GOOD for the player — every other entry here is a
  // thing being done TO them.
  'charge-instinct': { label: 'Instinct', color: '#ffbb66' },
  'escape-instinct': { label: 'Escape Instinct', color: '#aadd77' },
  'boss-stunned': { label: 'Stunned', color: '#ffdd44' },
};

function prettify(id: string): string {
  return id
    .replace(/^dot-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusMeta(id: string): StatusMeta {
  if (id.startsWith('barrier:')) return STATUS_META['enemy-barrier'];
  return STATUS_META[id] ?? { label: prettify(id), color: '#b0a8d0' };
}

export function bossEffectMeta(name: string): StatusMeta {
  return BOSS_META[name] ?? { label: prettify(name), color: '#ffcc55' };
}
