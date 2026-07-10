// art:review — local gallery for curating generated candidates.
//
// Usage: pnpm art:review [--port=4114]
//
// Shows each awaiting-review entry's candidates next to the current live art.
// Accept writes the winner to art/src/<out> (NN-resized to the manifest size)
// and marks the entry accepted; Reject marks it regen with a note for the next
// prompt tweak. Then run pnpm art:pack to ship accepted art into the client.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import sharp from 'sharp';
import {
  loadManifests,
  resolveEntries,
  saveManifest,
  type ResolvedEntry,
} from './lib/manifest';
import { totalSpendUsd } from './lib/lock';
import { CANDIDATES_DIR, srcPathFor } from './lib/paths';
import { fileURLToPath } from 'node:url';

const PORT = Number(
  process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? 4114,
);
const GALLERY_HTML = path.join(path.dirname(fileURLToPath(import.meta.url)), 'gallery.html');

const SAFE_SEGMENT = /^[\w.-]+$/;

function findEntry(category: string, id: string): ResolvedEntry | undefined {
  return resolveEntries(loadManifests()).find(
    (r) => r.category === category && r.entry.id === id,
  );
}

function candidateFiles(category: string, id: string): string[] {
  const dir = path.join(CANDIDATES_DIR, category, id);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .sort();
}

function buildState(): unknown {
  const manifests = loadManifests();
  return {
    spendUsd: totalSpendUsd(),
    categories: manifests.map(({ manifest }) => ({
      category: manifest.category,
      entries: manifest.entries.map((e) => ({
        id: e.id,
        out: e.out,
        size: e.size,
        status: e.status,
        prompt: e.prompt,
        notes: e.notes ?? '',
        sources: e.sources ?? [],
        hasCurrent: fs.existsSync(srcPathFor(e.out)),
        candidates: candidateFiles(manifest.category, e.id),
      })),
    })),
  };
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function sendPng(res: http.ServerResponse, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
  fs.createReadStream(filePath).pipe(res);
}

function readBody(req: http.IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function accept(category: string, id: string, file: string): Promise<void> {
  if (!SAFE_SEGMENT.test(file)) throw new Error('bad candidate filename');
  const r = findEntry(category, id);
  if (!r) throw new Error(`unknown entry ${category}/${id}`);
  const candidatePath = path.join(CANDIDATES_DIR, category, id, file);
  if (!fs.existsSync(candidatePath)) throw new Error(`candidate not found: ${file}`);

  const { w, h } = r.entry.size;
  const meta = await sharp(candidatePath).metadata();
  const outPath = srcPathFor(r.entry.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (meta.width === w && meta.height === h) {
    fs.copyFileSync(candidatePath, outPath);
  } else {
    // Nearest-neighbor keeps pixel art crisp when scaling to the ship size.
    await sharp(candidatePath).resize(w, h, { kernel: 'nearest' }).png().toFile(outPath);
  }
  fs.rmSync(path.join(CANDIDATES_DIR, category, id), { recursive: true, force: true });
  r.entry.status = 'accepted';
  saveManifest(r.loaded);
}

function reject(category: string, id: string, note: string): void {
  const r = findEntry(category, id);
  if (!r) throw new Error(`unknown entry ${category}/${id}`);
  r.entry.status = 'regen';
  if (note) r.entry.notes = note;
  fs.rmSync(path.join(CANDIDATES_DIR, category, id), { recursive: true, force: true });
  saveManifest(r.loaded);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(GALLERY_HTML));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      sendJson(res, 200, buildState());
      return;
    }
    if (req.method === 'GET' && url.pathname === '/img/current') {
      const out = url.searchParams.get('out') ?? '';
      if (out.split('/').some((seg) => !SAFE_SEGMENT.test(seg))) throw new Error('bad out path');
      sendPng(res, srcPathFor(out));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/img/candidate') {
      const [category, id, file] = ['category', 'id', 'file'].map(
        (k) => url.searchParams.get(k) ?? '',
      );
      if (![category, id, file].every((s) => SAFE_SEGMENT.test(s))) throw new Error('bad path');
      sendPng(res, path.join(CANDIDATES_DIR, category, id, file));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/accept') {
      const { category, id, file } = await readBody(req);
      await accept(category, id, file);
      sendJson(res, 200, { ok: true });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/reject') {
      const { category, id, note } = await readBody(req);
      reject(category, id, note ?? '');
      sendJson(res, 200, { ok: true });
      return;
    }
    res.writeHead(404);
    res.end('not found');
  } catch (err) {
    sendJson(res, 400, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`art:review gallery → http://localhost:${PORT}`);
  console.log('Accept moves winners into art/src; run pnpm art:pack afterwards. Ctrl+C to stop.');
});
