// ─── Skill tree types ─────────────────────────────────────────────────────────

/** Stat deltas applied immediately and permanently when a node is unlocked. */
export interface StatEffects {
  attack?: number;
  defense?: number;
  attackRange?: number;
  /** Negative value reduces cooldown (faster attacks). Clamped on apply to ≥200ms. */
  attackCooldown?: number;
  maxHp?: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  /**
   * Progression tier. 0 = class root (choose your class), 1–N = progression layers.
   * Unlock rules use ONLY this field — parent/children are cosmetic.
   */
  tier: number;
  /**
   * Which class this node belongs to. Equals the class root's id.
   * Used for class-lock validation without any tree traversal.
   */
  classId: string;
  /** Cosmetic only — not used for unlock logic. */
  parent: string | null;
  /** Cosmetic only — not used for unlock logic. */
  children: string[];
  statEffects: StatEffects;
}

// ─── Tree data ────────────────────────────────────────────────────────────────
//
// Four classes × (1 root + 3 tiers × 3 choices) = 40 nodes.
// Costs scale with tier: tier 0 = 1 pt, tier 1 = 2 pt, tier 2 = 3 pt, tier 3 = 4 pt.
//
// Tier structure per class:
//   Tier 0: class root (1 node  — pick your class)
//   Tier 1: 3 nodes    — broad direction
//   Tier 2: 3 nodes    — deeper specialisation
//   Tier 3: 3 nodes    — capstone power

export const SKILL_TREE: Map<string, SkillNode> = new Map([

  // ══════════════════════════════════════════════════════════════════════════════
  // WARRIOR  (attack-root)  —  raw damage focus
  // ══════════════════════════════════════════════════════════════════════════════

  ['attack-root', {
    id: 'attack-root', name: 'Warrior', tier: 0, classId: 'attack-root',
    parent: null, children: [],
    description: 'Harness raw physical power. Foundation of all offensive builds.',
    cost: 1, statEffects: { attack: 2 },
  }],

  // Tier 1 — broad offensive directions
  ['attack-fury', {
    id: 'attack-fury', name: 'Fury', tier: 1, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Pure rage channelled into devastating strikes.',
    cost: 2, statEffects: { attack: 4 },
  }],
  ['attack-precision', {
    id: 'attack-precision', name: 'Precision', tier: 1, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Every strike finds a gap in the enemy\'s defenses.',
    cost: 2, statEffects: { attack: 2, attackRange: 10 },
  }],
  ['attack-discipline', {
    id: 'attack-discipline', name: 'Discipline', tier: 1, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Controlled aggression that also hardens your guard.',
    cost: 2, statEffects: { attack: 3, defense: 1 },
  }],

  // Tier 2 — deeper specialisation
  ['attack-rampage', {
    id: 'attack-rampage', name: 'Rampage', tier: 2, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Unstoppable momentum — each kill fuels the next strike.',
    cost: 3, statEffects: { attack: 5 },
  }],
  ['attack-snipe', {
    id: 'attack-snipe', name: 'Snipe', tier: 2, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Strike from a distance others cannot match.',
    cost: 3, statEffects: { attack: 3, attackRange: 15 },
  }],
  ['attack-mastery', {
    id: 'attack-mastery', name: 'Mastery', tier: 2, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Honed technique delivers power without sacrificing defence.',
    cost: 3, statEffects: { attack: 4, defense: 1 },
  }],

  // Tier 3 — capstone power
  ['attack-warlord', {
    id: 'attack-warlord', name: 'Warlord', tier: 3, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'A force of nature. Nothing survives your wrath.',
    cost: 4, statEffects: { attack: 7 },
  }],
  ['attack-deadeye', {
    id: 'attack-deadeye', name: 'Deadeye', tier: 3, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Anatomical precision from any distance.',
    cost: 4, statEffects: { attack: 4, attackRange: 20 },
  }],
  ['attack-champion', {
    id: 'attack-champion', name: 'Champion', tier: 3, classId: 'attack-root',
    parent: 'attack-root', children: [],
    description: 'Offensive mastery and ironclad discipline combined.',
    cost: 4, statEffects: { attack: 5, defense: 2 },
  }],

  // ══════════════════════════════════════════════════════════════════════════════
  // GUARDIAN  (defense-root)  —  defense / HP focus
  // ══════════════════════════════════════════════════════════════════════════════

  ['defense-root', {
    id: 'defense-root', name: 'Guardian', tier: 0, classId: 'defense-root',
    parent: null, children: [],
    description: 'Stand firm while others fall. Foundation of all defensive builds.',
    cost: 1, statEffects: { defense: 2 },
  }],

  // Tier 1
  ['defense-shield', {
    id: 'defense-shield', name: 'Shield', tier: 1, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'A wall of iron between you and harm.',
    cost: 2, statEffects: { defense: 3 },
  }],
  ['defense-vitality', {
    id: 'defense-vitality', name: 'Vitality', tier: 1, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'A vast reservoir of life that outlasts any assault.',
    cost: 2, statEffects: { defense: 1, maxHp: 25 },
  }],
  ['defense-endure', {
    id: 'defense-endure', name: 'Endure', tier: 1, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'Suffer punishment and keep fighting regardless.',
    cost: 2, statEffects: { defense: 2, maxHp: 10 },
  }],

  // Tier 2
  ['defense-bulwark', {
    id: 'defense-bulwark', name: 'Bulwark', tier: 2, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'An unyielding bastion on the battlefield.',
    cost: 3, statEffects: { defense: 4 },
  }],
  ['defense-ironhide', {
    id: 'defense-ironhide', name: 'Iron Hide', tier: 2, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'Skin like forged metal. Pain is a distant memory.',
    cost: 3, statEffects: { defense: 2, maxHp: 35 },
  }],
  ['defense-resilience', {
    id: 'defense-resilience', name: 'Resilience', tier: 2, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'Hardened by every wound taken.',
    cost: 3, statEffects: { defense: 3, maxHp: 15 },
  }],

  // Tier 3
  ['defense-fortress', {
    id: 'defense-fortress', name: 'Fortress', tier: 3, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'You are the wall. Nothing gets through.',
    cost: 4, statEffects: { defense: 5, maxHp: 10 },
  }],
  ['defense-juggernaut', {
    id: 'defense-juggernaut', name: 'Juggernaut', tier: 3, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'Sheer mass of life force outlasts everything.',
    cost: 4, statEffects: { defense: 3, maxHp: 50 },
  }],
  ['defense-paladin', {
    id: 'defense-paladin', name: 'Paladin', tier: 3, classId: 'defense-root',
    parent: 'defense-root', children: [],
    description: 'Equal parts unbreakable and enduring.',
    cost: 4, statEffects: { defense: 4, maxHp: 25 },
  }],

  // ══════════════════════════════════════════════════════════════════════════════
  // ROGUE  (speed-root)  —  attack speed focus
  // ══════════════════════════════════════════════════════════════════════════════

  ['speed-root', {
    id: 'speed-root', name: 'Rogue', tier: 0, classId: 'speed-root',
    parent: null, children: [],
    description: 'Strike before they can react. Foundation of all speed builds.',
    cost: 1, statEffects: { attackCooldown: -150 },
  }],

  // Tier 1
  ['speed-quick', {
    id: 'speed-quick', name: 'Quick', tier: 1, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Pure acceleration — attacks flow without hesitation.',
    cost: 2, statEffects: { attackCooldown: -200 },
  }],
  ['speed-tempo', {
    id: 'speed-tempo', name: 'Tempo', tier: 1, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Find the rhythm of battle and exploit every opening.',
    cost: 2, statEffects: { attackCooldown: -100, attack: 2 },
  }],
  ['speed-flick', {
    id: 'speed-flick', name: 'Flick', tier: 1, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Lightning reflexes extend your reach in the same motion.',
    cost: 2, statEffects: { attackCooldown: -150, attackRange: 5 },
  }],

  // Tier 2
  ['speed-flurry', {
    id: 'speed-flurry', name: 'Flurry', tier: 2, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'A storm of blows too fast for the eye to follow.',
    cost: 3, statEffects: { attackCooldown: -250 },
  }],
  ['speed-rhythm', {
    id: 'speed-rhythm', name: 'Rhythm', tier: 2, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Each strike flows naturally into the next with growing power.',
    cost: 3, statEffects: { attackCooldown: -150, attack: 3 },
  }],
  ['speed-blur', {
    id: 'speed-blur', name: 'Blur', tier: 2, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Move so fast enemies cannot track you — and deal damage doing it.',
    cost: 3, statEffects: { attackCooldown: -200, attackRange: 8 },
  }],

  // Tier 3
  ['speed-tornado', {
    id: 'speed-tornado', name: 'Tornado', tier: 3, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Become a whirlwind of unstoppable, endless strikes.',
    cost: 4, statEffects: { attackCooldown: -300 },
  }],
  ['speed-surge', {
    id: 'speed-surge', name: 'Surge', tier: 3, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Explosive speed paired with devastating impact.',
    cost: 4, statEffects: { attackCooldown: -250, attack: 4 },
  }],
  ['speed-phantom', {
    id: 'speed-phantom', name: 'Phantom', tier: 3, classId: 'speed-root',
    parent: 'speed-root', children: [],
    description: 'Strike so fast you blur the line between presence and absence.',
    cost: 4, statEffects: { attackCooldown: -350 },
  }],

  // ══════════════════════════════════════════════════════════════════════════════
  // HUNTER  (range-root)  —  attack range focus
  // ══════════════════════════════════════════════════════════════════════════════

  ['range-root', {
    id: 'range-root', name: 'Hunter', tier: 0, classId: 'range-root',
    parent: null, children: [],
    description: 'Engage enemies before they reach you. Foundation of all range builds.',
    cost: 1, statEffects: { attackRange: 15 },
  }],

  // Tier 1
  ['range-reach', {
    id: 'range-reach', name: 'Reach', tier: 1, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Extend the boundary of your danger zone ever further.',
    cost: 2, statEffects: { attackRange: 20 },
  }],
  ['range-sight', {
    id: 'range-sight', name: 'Sight', tier: 1, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Map the battlefield and exploit safe angles of attack.',
    cost: 2, statEffects: { attackRange: 15, defense: 1 },
  }],
  ['range-aim', {
    id: 'range-aim', name: 'Aim', tier: 1, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Accuracy translates directly into offensive punch.',
    cost: 2, statEffects: { attackRange: 15, attack: 1 },
  }],

  // Tier 2
  ['range-extend', {
    id: 'range-extend', name: 'Extend', tier: 2, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Strike at distances most warriors cannot even see.',
    cost: 3, statEffects: { attackRange: 25 },
  }],
  ['range-sentinel', {
    id: 'range-sentinel', name: 'Sentinel', tier: 2, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Hold ground and control space with range and resilience.',
    cost: 3, statEffects: { attackRange: 20, defense: 2 },
  }],
  ['range-focus', {
    id: 'range-focus', name: 'Focus', tier: 2, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Pinpoint strikes from outside the enemy\'s response range.',
    cost: 3, statEffects: { attackRange: 20, attack: 2 },
  }],

  // Tier 3
  ['range-longshot', {
    id: 'range-longshot', name: 'Long Shot', tier: 3, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'The longest reach on the battlefield belongs to you.',
    cost: 4, statEffects: { attackRange: 35 },
  }],
  ['range-warden', {
    id: 'range-warden', name: 'Warden', tier: 3, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Dominate the zone with impenetrable range and iron defence.',
    cost: 4, statEffects: { attackRange: 25, defense: 3 },
  }],
  ['range-tactician', {
    id: 'range-tactician', name: 'Tactician', tier: 3, classId: 'range-root',
    parent: 'range-root', children: [],
    description: 'Positional mastery converts range advantage into raw damage.',
    cost: 4, statEffects: { attackRange: 25, attack: 4 },
  }],
]);
