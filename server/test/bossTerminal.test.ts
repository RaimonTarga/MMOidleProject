import {
  classifyBossTick, countsTowardAdds, isVictory, resolveTerminalBossHp,
  type BossTerminal, type BossTickInput,
} from '../bench/balance/bossTerminal';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const tick = (over: Partial<BossTickInput> = {}): BossTickInput => ({
  bossKillEvent: false, playerDead: false, bossPresent: true,
  dungeonReset: false, bossSeen: true, ...over,
});

const expect = (input: Partial<BossTickInput>, want: BossTerminal, why: string): void => {
  const got = classifyBossTick(tick(input));
  assert(got === want, `${why}: expected ${want}, got ${got}`);
};

// ── THE REGRESSION. This is the exact shape of `bossref-timberclaw-b-legacy`.
//
// On a player wipe, `resetDungeon(..., reason: "node_wipe")` removes the boss and
// respawns the guard in the SAME tick. The first runner read that absence as a
// kill, before it checked player death, and recorded a 100%-removed victory on a
// fight the player lost at 12,900 ms with the boss still alive.
{
  expect(
    { bossKillEvent: false, playerDead: true, bossPresent: false, dungeonReset: true },
    'bot-died',
    'wipe reset must never read as a victory',
  );
  // The same tick, with the death signal arriving only as the event record.
  expect(
    { bossKillEvent: false, playerDead: true, bossPresent: false, dungeonReset: false },
    'bot-died',
    'death outranks the boss going missing',
  );
}

// ── A victory requires boss-specific authoritative evidence. Absence never is.
{
  expect({ bossKillEvent: true }, 'boss-killed', 'a kill event is the only route to a victory');
  expect({ bossPresent: false }, 'boss-vanished-no-kill', 'disappearance alone is not a kill');
  expect({ bossPresent: false, dungeonReset: true }, 'encounter-reset', 'a reset is its own outcome');
  assert(isVictory('boss-killed'), 'boss-killed is a victory');
  for (const t of ['bot-died', 'encounter-reset', 'boss-vanished-no-kill', 'simultaneous-terminal', null] as BossTerminal[]) {
    assert(!isVictory(t), `${t} must not count as a victory`);
  }
}

// ── Simultaneous terminal events are reported, not silently resolved.
{
  expect({ bossKillEvent: true, playerDead: true }, 'simultaneous-terminal',
    'a kill and a death in one tick is ambiguous');
  expect({ bossKillEvent: true, playerDead: true, bossPresent: false, dungeonReset: true },
    'simultaneous-terminal', 'ambiguity survives the reset that accompanies it');
}

// ── Before the boss has ever been seen, absence is a wake-up, not a terminal.
{
  expect({ bossPresent: false, bossSeen: false }, null, 'pre-wake absence must not terminate');
  expect({ bossPresent: true, bossSeen: false }, null, 'a fight in progress is not terminal');
  expect({}, null, 'an ordinary tick is not terminal');
}

// ── Terminal boss HP is preserved, never fabricated.
{
  const killed = resolveTerminalBossHp('boss-killed', 1234);
  assert(killed.hp === 0 && killed.supported, 'a kill supports a terminal zero');

  for (const t of ['bot-died', 'encounter-reset', 'boss-vanished-no-kill', 'simultaneous-terminal'] as BossTerminal[]) {
    const r = resolveTerminalBossHp(t, 2410);
    assert(r.hp === 2410, `${t}: must carry the last supported HP, got ${r.hp}`);
    assert(r.supported, `${t}: a real reading is supported`);
  }

  // Never invent a zero for a boss that vanished without a kill -- that is precisely
  // how a loss was recorded as 100% of the boss removed.
  const vanished = resolveTerminalBossHp('boss-vanished-no-kill', 3750);
  assert(vanished.hp === 3750, 'a vanished boss keeps its last supported HP');
  assert(vanished.hp !== 0, 'a vanished boss must not report zero HP');

  const never = resolveTerminalBossHp('bot-died', null);
  assert(never.hp === null && !never.supported, 'no reading means unsupported, not zero');
}

// ── Post-terminal replacement guardians are excluded from add statistics.
//
// The wipe respawns a twelve-strong guard in the terminal tick. Counting it gave
// `maxAddsAlive: 12` on a boss with no `spawn-adds` at all.
{
  assert(countsTowardAdds(null), 'a running tick contributes add statistics');
  for (const t of ['boss-killed', 'bot-died', 'encounter-reset', 'boss-vanished-no-kill', 'simultaneous-terminal'] as BossTerminal[]) {
    assert(!countsTowardAdds(t), `${t}: replacement bodies must not count as adds`);
  }
}

console.log('bossTerminal: ok');
