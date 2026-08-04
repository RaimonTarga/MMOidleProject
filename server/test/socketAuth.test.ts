import { authenticateSocketHandshake } from '../src/auth/socketAuth';
import type { DB } from '../src/db/playerRepo';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDevBypass = process.env.AUTH_DEV_BYPASS;
  const unusedDb = {} as DB;

  try {
    process.env.NODE_ENV = 'development';
    delete process.env.AUTH_DEV_BYPASS;

    const refusedLegacy = await authenticateSocketHandshake(unusedDb, {
      accountId: 'legacy-account',
      displayName: 'Legacy Hero',
    });
    assert(refusedLegacy === null, 'client-supplied account identity should be refused');

    const disabledDev = await authenticateSocketHandshake(unusedDb, {
      devAccountId: 'dev-account',
    });
    assert(disabledDev === null, 'explicit dev identity should require the bypass flag');

    process.env.AUTH_DEV_BYPASS = '1';
    const dev = await authenticateSocketHandshake(unusedDb, {
      devAccountId: 'dev-account',
    });
    assert(dev?.kind === 'dev', 'explicit dev identity should work when enabled');

    process.env.NODE_ENV = 'production';
    const refusedDev = await authenticateSocketHandshake(unusedDb, {
      devAccountId: 'dev-account',
    });
    const refusedProductionLegacy = await authenticateSocketHandshake(unusedDb, {
      accountId: 'legacy-account',
    });
    assert(refusedDev === null, 'dev bypass should be refused in production');
    assert(refusedProductionLegacy === null, 'legacy identity should be refused in production');

    const spectator = await authenticateSocketHandshake(unusedDb, { spectate: true });
    assert(spectator?.kind === 'spectator', 'anonymous spectator auth should work in production');
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalDevBypass === undefined) delete process.env.AUTH_DEV_BYPASS;
    else process.env.AUTH_DEV_BYPASS = originalDevBypass;
  }
}

void main().then(() => console.log('socketAuth.test.ts: ok'));
