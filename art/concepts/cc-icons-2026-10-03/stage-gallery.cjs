const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const repoRoot = path.resolve(__dirname, '../../..');
const manifestPath = path.join(repoRoot, 'art/manifests/cc-icons.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let staged = 0;
for (const entry of manifest.entries) {
  if (entry.status === 'accepted') continue;
  const source = path.join(__dirname, 'candidates', entry.id + '.png');
  const receipt = path.join(__dirname, 'receipts', entry.id + '.json');
  if (!fs.existsSync(source) || !fs.existsSync(receipt)) {
    throw new Error('Missing archived candidate or receipt: ' + entry.id);
  }
  const meta = JSON.parse(fs.readFileSync(receipt, 'utf8'));
  if (digest(source) !== meta.candidateSha256) throw new Error('Candidate hash mismatch: ' + entry.id);
  const directory = path.join(repoRoot, 'art/candidates', manifest.category, entry.id);
  const target = path.join(directory, 'candidate-1.png');
  if (fs.existsSync(target) && digest(target) !== meta.candidateSha256) {
    throw new Error('Different local candidate exists; preserve it: ' + target);
  }
  fs.mkdirSync(directory, { recursive: true });
  fs.copyFileSync(source, target);
  fs.writeFileSync(path.join(directory, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  staged++;
}
console.log('Staged ' + staged + ' pending candidates for art:review; manifest statuses unchanged.');
