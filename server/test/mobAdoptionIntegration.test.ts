import { MONSTER_DATABASE, BIOME_DATABASE } from '@mmo-idle/shared';
import { DURABILITY22_HP } from '../bench/balance/durability22Spec';
import { DURABILITY24_HP } from '../bench/balance/durability24Spec';
import { DURABILITY34_JUNGLE_HP } from '../bench/balance/durability34Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * The consolidated mob adoption of 2026-09-18: the retained Forest/Volcano,
 * Graveyard, Desert, Mountain, Tundra and Trench packages, plus the Jungle
 * duration ladder accepted from Durability36 Block J.
 *
 * This guards the four failure modes an adoption of this size actually has:
 *  - a value silently drifting back,
 *  - a retained overlay applying a SECOND time on top of the adopted baseline,
 *  - an HP change silently inflating a defence field that is a PERCENTAGE OF HP,
 *  - a species being swept along that was never in any package.
 */

// ── 1. Every adopted stat, as an absolute value.
const ADOPTED: Record<string, { hp: number; attack: number }> = {
  // Forest T2 (Durability19)
  'ancient-wolf': { hp: 1575, attack: 22 },
  'ironwood-golem': { hp: 945, attack: 25 },
  // Volcano T3 (Durability19 via Durability15)
  'magma-brute': { hp: 3000, attack: 90 }, // 116 -> 90 volcanic T3 pass, 2026-09-26
  'ash-slinger': { hp: 1330, attack: 50 }, // 84 -> 70 -> 50 Volcano nerfs, 2026-09-25/26
  // Volcano T4 (Durability23)
  'obsidian-tortoise': { hp: 4488, attack: 100 },
  'magma-salamander': { hp: 5808, attack: 150 },
  // Graveyard T4 (Durability24) — leader up, escorts down
  'gravewright': { hp: 5702, attack: 90 },
  'bone-crawler': { hp: 1235, attack: 85 },
  'plague-hound': { hp: 1901, attack: 105 },
  'carrion-vulture': { hp: 1616, attack: 95 },
  'plague-rat': { hp: 950, attack: 65 },
  // Desert T2 (Durability27)
  'sand-scorpion': { hp: 1365, attack: 65 },
  'stone-basilisk': { hp: 1365, attack: 55 },
  // Desert T4 (Durability22 + Durability26)
  'sand-viper': { hp: 4029, attack: 78 },
  'dune-basilisk': { hp: 9006, attack: 90 },
  'dune-tyrant': { hp: 6952, attack: 140 },
  // Mountain T2 (Durability27 + Durability29)
  'granite-titan': { hp: 1656, attack: 54 },
  'stone-eagle': { hp: 340, attack: 60 },
  'peak-archer': { hp: 385, attack: 72 },
  // Mountain T4 (Durability22 + Durability26 HP, Durability29 attack)
  'granite-mammoth': { hp: 13800, attack: 147 },
  'cragback-rhino': { hp: 6600, attack: 90 },
  'cliffside-roc': { hp: 1700, attack: 143 },
  'avalanche-tyrant': { hp: 1600, attack: 116 },
  // Trench T4 (Durability22)
  'elder-leviathan': { hp: 17640, attack: 210 },
  'abyssal-serpent': { hp: 16800, attack: 190 },
  'hadal-stalker': { hp: 16800, attack: 175 },
  // Tundra T4 (Durability22)
  'permafrost-behemoth': { hp: 7656, attack: 220 },
  'glacial-direbear': { hp: 4884, attack: 220 },
  'rime-tusk-mastodon': { hp: 3300, attack: 230 },
  'hoarfrost-yeti': { hp: 1800, attack: 190 },
  // Jungle T3/T4 (Durability36 Block J)
  'silverback': { hp: 3200, attack: 83 },
  'jungle-stalker': { hp: 1250, attack: 55 },
  'canopy-harrier': { hp: 1150, attack: 45 },
  'apex-silverback': { hp: 10000, attack: 77 },
  'emerald-constrictor': { hp: 12000, attack: 66 },
  'hunting-panther': { hp: 2400, attack: 52 },
  'thornback-lizard': { hp: 2500, attack: 52 },
};

for (const [id, want] of Object.entries(ADOPTED)) {
  const d = MONSTER_DATABASE.get(id);
  assert(!!d, `${id} must exist`);
  assert(d.stats.hp === want.hp, `${id}: adopted HP must be ${want.hp}, found ${d.stats.hp}`);
  assert(d.stats.attack === want.attack, `${id}: adopted attack must be ${want.attack}, found ${d.stats.attack}`);
}

// ── 2. Fields the adoption was required NOT to move.
{
  // Jungle T2 is the ladder's anchor and is deliberately untouched.
  for (const [id, hp] of [['jungle-snake', 480], ['jungle-ape', 1200], ['jungle-blowdarter', 450]] as const) {
    assert(MONSTER_DATABASE.get(id)!.stats.hp === hp, `${id}: T2 Jungle is the ladder anchor and must stay ${hp}`);
  }
  // T1 Mountain was adopted separately and is unchanged by this patch.
  for (const id of ['ridge-archer', 'cliff-hopper']) {
    assert(MONSTER_DATABASE.get(id)!.stats.attack === 40, `${id}: the T1 Mountain package stays at 40`);
  }
  assert(MONSTER_DATABASE.get('ridge-archer')!.chargedAttack?.multiplier === 2.2,
    'Power Shot stays 2.2; the parked 1.8 candidate was never adopted');
  assert(MONSTER_DATABASE.get('cliff-hopper')!.chargedAttack?.multiplier === 1.9, 'Strong Kick stays 1.9');

  // hadal-stalker: 16800 was retained, 21000 was rejected.
  assert(MONSTER_DATABASE.get('hadal-stalker')!.stats.hp !== 21000,
    'hadal-stalker 21000 was REJECTED and must never be written');

  // The Jungle correction is HP-only: the old private ramp was already removed
  // in favor of the shared Chestbeat rally; cadence and finisher parameters stay put.
  const apex = MONSTER_DATABASE.get('apex-silverback')!;
  assert(apex.rampOnCombat === undefined,
    'the removed Apex private ramp must stay absent from the HP-only Jungle ladder');
  assert(apex.stats.attackCooldown === 1800, 'Apex cadence unchanged');
  const constrictor = MONSTER_DATABASE.get('emerald-constrictor')!;
  assert(constrictor.cadenceFinisher?.everyNAttacks === 4
    && constrictor.cadenceFinisher?.multiplier === 2.0
    && constrictor.cadenceFinisher?.rootMs === 1200, 'Constrict is untouched by the HP ladder');

  // No unlisted species in a changed biome was swept along.
  for (const [id, hp] of [['mountain-colossus', 4675], ['avalanche-ram', 0]] as const) {
    if (hp === 0) continue;
    assert(MONSTER_DATABASE.get(id)!.stats.hp === hp, `${id}: not in any adopted package, must stay ${hp}`);
  }
}

// ── 3. Absolute defence capacities, after the runtime's own rounding.
//
// Every field below is multiplied by the monster's maxHp at runtime, so raising
// HP without scaling the percentage silently multiplies the barrier. The rule the
// retained Durability22 installer states, and this adoption applies uniformly, is:
// hold the PRE-ADOPTION ABSOLUTE budget.
{
  const near = (actual: number, expected: number, what: string) =>
    assert(Math.abs(actual - expected) < 0.51, `${what}: absolute budget is ${actual}, expected ${expected}`);

  const mammoth = MONSTER_DATABASE.get('granite-mammoth')!;
  near(mammoth.stats.hp * mammoth.lowHealthWard!.wardPct, 0.25 * 1150, 'granite-mammoth Granite Barrier');

  const direbear = MONSTER_DATABASE.get('glacial-direbear')!;
  near(direbear.stats.hp * direbear.enemyShield!.shieldPct, 0.22 * 1221, 'glacial-direbear barrier');
  near(direbear.stats.hp * direbear.enemyShield!.shatter!.selfDamagePct, 0.14 * 1221,
    'glacial-direbear self-shatter');

  // Nested monster-ability shield actions are the coupling a summary table hides.
  const nestedShield = (id: string): number => {
    const d = MONSTER_DATABASE.get(id)!;
    for (const ability of d.monsterAbilities ?? []) {
      for (const action of ability.actions) {
        if (action.type === 'shield') return d.stats.hp * action.shieldPct;
      }
    }
    throw new Error(`${id}: expected a nested shield action`);
  };
  near(nestedShield('magma-brute'), 0.14 * 2000, 'magma-brute Molten Guard');
  near(nestedShield('magma-salamander'), 0.28 * 2904, 'magma-salamander Obsidian Shell');
  near(nestedShield('elder-leviathan'), 0.18 * 5880, 'elder-leviathan Carapace Renewal');

  // granite-titan's HP did NOT move, only its attack, so its ward must NOT be rescaled.
  assert(MONSTER_DATABASE.get('granite-titan')!.lowHealthWard!.wardPct === 0.25,
    'granite-titan keeps wardPct 0.25: its HP is unchanged, so rescaling it would be a real nerf');

  // cragback-rhino's soft cap is deliberately NOT rescaled: capPct is a fraction of
  // the monster's own pool, so it is self-relative, and the retained installer never
  // touched it either. Its absolute clip threshold therefore moves 275 -> 1650.
  const rhino = MONSTER_DATABASE.get('cragback-rhino')!;
  assert(rhino.enemySoftCap?.capPct === 0.25 && rhino.enemySoftCap?.capMult === 0.5,
    'cragback-rhino keeps its authored soft cap; the adoption deliberately left it self-relative');
}

// ── 4. Retained overlays are inert: re-running one cannot double-apply.
{
  for (const [id, [before, after]] of Object.entries(DURABILITY22_HP)) {
    assert(before === after, `${id}: the retired Durability22 overlay must no longer move anything`);
    assert(MONSTER_DATABASE.get(id)!.stats.hp === after, `${id}: Durability22 row must match live source`);
  }
  for (const [id, before, after] of DURABILITY24_HP) {
    assert(before === after, `${id}: the retired Durability24 overlay must no longer move anything`);
    assert(MONSTER_DATABASE.get(id)!.stats.hp === after, `${id}: Durability24 row must match live source`);
  }
  for (const [id, [before, after]] of Object.entries(DURABILITY34_JUNGLE_HP)) {
    assert(before === after, `${id}: the retired Durability34 overlay must no longer move anything`);
    assert(MONSTER_DATABASE.get(id)!.stats.hp === after,
      `${id}: the Durability34 row must carry the SUPERSEDING Durability36 value, not 2900/3400`);
  }
}

// ── 5. Same-role tier ladders, against the biome pools that actually exist.
//
// Tiers are derived from `monsterPoolByTier`, never from a doc label: four labels
// in the adoption manifest had drifted (obsidian-tortoise and magma-salamander are
// T4 Volcano, not T3; sand-scorpion and stone-basilisk are T2 Desert, not T4).
{
  const tierOf = new Map<string, number>();
  for (const biome of BIOME_DATABASE.values()) {
    for (const [tier, pool] of Object.entries(biome.monsterPoolByTier ?? {})) {
      for (const id of pool) tierOf.set(id, Number(tier));
    }
  }
  for (const id of Object.keys(ADOPTED)) {
    assert(tierOf.has(id), `${id}: adopted but absent from every biome pool — the package would never be fought`);
  }
  for (const [id, tier] of [
    ['obsidian-tortoise', 4], ['magma-salamander', 4], ['sand-scorpion', 2], ['stone-basilisk', 2],
  ] as const) {
    assert(tierOf.get(id) === tier, `${id}: lives at T${tierOf.get(id)}, the adoption assumed T${tier}`);
  }

  const hp = (id: string) => MONSTER_DATABASE.get(id)!.stats.hp;

  // The Jungle lineages the adopted ladder is about, by role.
  const ladders: [string, string[]][] = [
    ['jungle primary (ape line)', ['jungle-ape', 'silverback', 'apex-silverback']],
    ['jungle fast melee', ['jungle-snake', 'jungle-stalker', 'hunting-panther']],
    ['jungle concealed ranged', ['jungle-blowdarter', 'canopy-harrier', 'thornback-lizard']],
  ];
  for (const [name, line] of ladders) {
    for (let i = 1; i < line.length; i++) {
      assert(hp(line[i]!) > hp(line[i - 1]!),
        `${name}: ${line[i]} (${hp(line[i]!)}) must out-last ${line[i - 1]} (${hp(line[i - 1]!)})`);
    }
  }

  // The durable role must stay clearly separated from the fast role at every
  // Jungle tier: this is a role-based correction, not a flat biome scale.
  for (const [durable, fast] of [
    ['jungle-ape', 'jungle-snake'], ['silverback', 'jungle-stalker'], ['apex-silverback', 'hunting-panther'],
  ] as const) {
    assert(hp(durable) > hp(fast) * 2,
      `${durable} must remain clearly more durable than ${fast}`);
  }

  // Emerald Constrictor stays the tougher, separate T4 control predator.
  assert(hp('emerald-constrictor') > hp('apex-silverback'),
    'the T4 control predator must stay tougher than the primary lineage apex');
}

console.log('mobAdoptionIntegration: ok');
