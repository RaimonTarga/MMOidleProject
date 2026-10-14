#!/usr/bin/env node
// Agent worktrees for the class-first rework.
//
// A fresh `git worktree add` has no node_modules, and `pnpm install` is off the table
// (slow, and the Docker store-in-repo trap). This script gives a new worktree working
// node_modules by junctioning the donor checkout's pnpm store and mirroring every link,
// then repointing `@mmo-idle/*` at the NEW worktree. Without that last step every agent
// compiles the donor's `shared/` and its edits appear to do nothing.
//
//   node tools/worktree/agent-worktree.mjs create <name> [--base <ref>] [--branch <name>]
//        [--path <dir>] [--donor <dir>]
//   node tools/worktree/agent-worktree.mjs links <dir> [--donor <dir>]   (re-link an existing worktree)
//   node tools/worktree/agent-worktree.mjs remove <name|dir> [--force]
//
// Defaults: path ../mmo-rw-<name>, branch rw/<name>, base rework/class-first, donor = the
// main checkout (the first entry of `git worktree list`).
//
// Windows only in practice (junctions). The donor must outlive every worktree linked to it.
// `remove` unlinks the junctions BEFORE deleting anything, so it can never follow one into
// the donor's store.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PACKAGES = ['client', 'admin', 'server', 'bot', 'shared'];
const WORKSPACE_SCOPE = '@mmo-idle';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i += 1; }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function mainCheckout(cwd) {
  const list = git(['worktree', 'list', '--porcelain'], cwd);
  const first = list.split('\n').find((line) => line.startsWith('worktree '));
  return path.resolve(first.slice('worktree '.length));
}

function isLink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}

function junction(target, linkPath) {
  if (fs.existsSync(linkPath) || isLink(linkPath)) unlinkJunction(linkPath);
  fs.symlinkSync(target, linkPath, 'junction');
}

function unlinkJunction(p) {
  // A directory junction is removed with rmdir (unlink fails on Windows); neither follows it.
  try { fs.rmdirSync(p); } catch { fs.unlinkSync(p); }
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (isLink(from)) junction(fs.realpathSync(from), to);
    else if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

/** Mirror one node_modules directory: junction links, copy .bin and loose files, recurse into scopes. */
function mirrorNodeModules(donorDir, dstDir, dstRoot, { isRoot }) {
  if (!fs.existsSync(donorDir)) return 0;
  fs.mkdirSync(dstDir, { recursive: true });
  let links = 0;
  for (const entry of fs.readdirSync(donorDir, { withFileTypes: true })) {
    const name = entry.name;
    const from = path.join(donorDir, name);
    const to = path.join(dstDir, name);
    if (isRoot && name === '.pnpm') { junction(fs.realpathSync(from), to); links += 1; continue; }
    if (name === '.bin') { copyDir(from, to); continue; }
    if (isLink(from)) { junction(fs.realpathSync(from), to); links += 1; continue; }
    if (entry.isDirectory()) {
      if (name === WORKSPACE_SCOPE) {
        fs.mkdirSync(to, { recursive: true });
        for (const pkg of fs.readdirSync(from)) {
          junction(path.join(dstRoot, pkg), path.join(to, pkg));
          links += 1;
        }
      } else if (name.startsWith('@')) {
        fs.mkdirSync(to, { recursive: true });
        for (const child of fs.readdirSync(from)) {
          const childFrom = path.join(from, child);
          if (isLink(childFrom)) { junction(fs.realpathSync(childFrom), path.join(to, child)); links += 1; }
        }
      }
      // Other real directories (.vite, .cache, .ignored_*) are caches: skip.
      continue;
    }
    if (entry.isFile()) fs.copyFileSync(from, to);
  }
  return links;
}

function linkWorktree(dst, donor) {
  let total = mirrorNodeModules(path.join(donor, 'node_modules'), path.join(dst, 'node_modules'), dst, { isRoot: true });
  for (const pkg of PACKAGES) {
    total += mirrorNodeModules(path.join(donor, pkg, 'node_modules'), path.join(dst, pkg, 'node_modules'), dst, { isRoot: false });
  }
  // Prove the workspace links point at THIS worktree.
  for (const pkg of PACKAGES) {
    const shared = path.join(dst, pkg, 'node_modules', WORKSPACE_SCOPE, 'shared');
    if (isLink(shared) && path.resolve(fs.realpathSync(shared)) !== path.resolve(dst, 'shared')) {
      throw new Error(`${shared} does not point at ${path.join(dst, 'shared')}`);
    }
  }
  return total;
}

/** Remove every junction under the worktree's node_modules trees, deepest first, never following one. */
function unlinkAll(dst) {
  const roots = [path.join(dst, 'node_modules'), ...PACKAGES.map((pkg) => path.join(dst, pkg, 'node_modules'))];
  let removed = 0;
  const walk = (dir) => {
    if (!fs.existsSync(dir) || isLink(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      if (isLink(p)) { unlinkJunction(p); removed += 1; }
      else if (fs.lstatSync(p).isDirectory()) walk(p);
    }
  };
  for (const root of roots) walk(root);
  for (const root of roots) if (fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
  return removed;
}

function create(name, flags, cwd) {
  const donor = path.resolve(flags.donor ?? mainCheckout(cwd));
  const dst = path.resolve(flags.path ?? path.join(path.dirname(donor), `mmo-rw-${name}`));
  const branch = flags.branch ?? `rw/${name}`;
  const base = flags.base ?? 'rework/class-first';
  if (fs.existsSync(dst)) throw new Error(`${dst} already exists`);
  const branchExists = (() => {
    try { git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], cwd); return true; } catch { return false; }
  })();
  if (branchExists) git(['worktree', 'add', dst, branch], cwd);
  else git(['worktree', 'add', dst, '-b', branch, base], cwd);
  const links = linkWorktree(dst, donor);
  console.log(`worktree ${dst}`);
  console.log(`branch   ${branch}${branchExists ? ' (existing)' : ` (new, from ${base} ${git(['rev-parse', '--short', base], cwd)})`}`);
  console.log(`linked   ${links} node_modules entries from ${donor}`);
  console.log('next     cd into it, then `pnpm typecheck` (never `pnpm install`)');
}

function remove(target, flags, cwd) {
  const donor = mainCheckout(cwd);
  const dst = path.resolve(fs.existsSync(target) ? target : path.join(path.dirname(donor), `mmo-rw-${target}`));
  if (path.resolve(dst) === path.resolve(donor)) throw new Error('refusing to remove the main checkout');
  const removed = unlinkAll(dst);
  const args = ['worktree', 'remove', dst];
  if (flags.force) args.push('--force');
  git(args, cwd);
  console.log(`unlinked ${removed} junctions and removed ${dst} (the branch is kept)`);
}

const [command, ...rest] = process.argv.slice(2);
const { positional, flags } = parseArgs(rest);
const cwd = process.cwd();
try {
  if (command === 'create' && positional[0]) create(positional[0], flags, cwd);
  else if (command === 'links' && positional[0]) {
    const dst = path.resolve(positional[0]);
    console.log(`linked ${linkWorktree(dst, path.resolve(flags.donor ?? mainCheckout(cwd)))} entries into ${dst}`);
  } else if (command === 'remove' && positional[0]) remove(positional[0], flags, cwd);
  else {
    console.log('usage: agent-worktree.mjs create <name> [--base ref] [--branch name] [--path dir] [--donor dir]');
    console.log('       agent-worktree.mjs links <dir> [--donor dir]');
    console.log('       agent-worktree.mjs remove <name|dir> [--force]');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`agent-worktree: ${error.message}`);
  process.exitCode = 1;
}
