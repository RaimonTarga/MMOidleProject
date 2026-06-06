import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEV_SERVICES = ['server-dev', 'client-dev', 'admin-dev'];
const DEV_VOLUME_SUFFIXES = [
  'dev-root-node-modules',
  'dev-server-node-modules',
  'dev-client-node-modules',
  'dev-admin-node-modules',
  'dev-shared-node-modules',
];

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
}

function runQuiet(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: 'ignore', shell: true });
  } catch {
    // Best-effort cleanup steps may fail if containers/volumes are already gone.
  }
}

run(`docker compose --profile dev stop ${DEV_SERVICES.join(' ')}`);
runQuiet(`docker compose --profile dev rm -f ${DEV_SERVICES.join(' ')}`);

const volumeNames = execSync('docker volume ls --format "{{.Name}}"', {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .map((name) => name.trim())
  .filter(Boolean);

for (const suffix of DEV_VOLUME_SUFFIXES) {
  const match = volumeNames.find(
    (name) => name === suffix || name.endsWith(`_${suffix}`),
  );
  if (match) runQuiet(`docker volume rm ${match}`);
}

run('docker compose --profile dev build');
run(`docker compose --profile dev up --force-recreate ${DEV_SERVICES.join(' ')}`);
