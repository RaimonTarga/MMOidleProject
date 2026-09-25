import { createHash } from "node:crypto";
import { readFileSync, type Stats } from "node:fs";
import path from "node:path";
import type { Response } from "express";
import express from "express";

// Vite emits content-hashed bundles like `assets/index-C_tdNMRn.js`; those
// never change under the same name, so browsers may keep them forever.
const HASHED_BUNDLE = /[\\/]assets[\\/][^\\/]+-[A-Za-z0-9_-]{8}\.(?:js|css)$/;

// Everything else (public art, audio, atlases) keeps its name across deploys.
// Express's default ETag is size+mtime, and every deploy rebuilds the image
// with fresh mtimes — so every player re-downloaded ~100 MB of unchanged art
// after each deploy. A content-hash ETag keeps 304s valid across deploys.
const contentEtags = new Map<string, string>();

function contentEtag(filePath: string, stat: Stats): string {
  const cacheKey = `${filePath}:${stat.size}:${stat.mtimeMs}`;
  let etag = contentEtags.get(cacheKey);
  if (!etag) {
    const digest = createHash("sha1").update(readFileSync(filePath)).digest("base64url");
    etag = `"${digest}"`;
    contentEtags.set(cacheKey, etag);
  }
  return etag;
}

function setCacheHeaders(res: Response, filePath: string, stat: Stats): void {
  if (HASHED_BUNDLE.test(filePath)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }
  res.setHeader("ETag", contentEtag(filePath, stat));
  if (path.extname(filePath) === ".html" || filePath.endsWith("-sw.js")) {
    // Entry points must revalidate so a deploy's new bundle hashes are seen.
    res.setHeader("Cache-Control", "no-cache");
  } else {
    // Short freshness window avoids a revalidation storm on reload; after
    // that the content ETag turns re-fetches into bodiless 304s.
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
}

/** express.static with deploy-stable caching for the built client/admin. */
export function serveBuiltApp(root: string): express.RequestHandler {
  return express.static(root, { lastModified: false, setHeaders: setCacheHeaders });
}
