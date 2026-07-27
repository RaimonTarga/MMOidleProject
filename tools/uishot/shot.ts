// ui:shot — screenshot and audit a page at the project's standard viewports.
//
// Usage:
//   pnpm ui:shot --url=http://localhost:3000
//   pnpm ui:shot --html=tools/uishot/harness/bestiary.html --audit
//   pnpm ui:shot --url=... --viewport=1366x768,1440x900 --out=.uishot
//   pnpm ui:shot --url=... --wait=.bestiary__body --shot-only
//
// The audit is the point. A screenshot tells you something looks wrong; the
// audit tells you *which element* is clipped and by how many pixels, by walking
// the DOM for content taller than its own scrollport and checking whether an
// ancestor with a non-visible overflow is actually cutting it off. That turns a
// vague "it crops" report into a specific selector and a number.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The widths the UI plan's verification matrix names, plus the mobile boundary. */
const DEFAULT_VIEWPORTS = ['1366x768', '1440x900', '1920x1080', '1101x900', '1100x900'];

interface Args {
  url?: string;
  html?: string;
  viewports: Array<{ w: number; h: number; label: string }>;
  out: string;
  wait?: string;
  audit: boolean;
  shotOnly: boolean;
  fontScale?: string;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const get = (name: string): string | undefined =>
    raw.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

  const viewportSpec = (get('viewport') ?? DEFAULT_VIEWPORTS.join(',')).split(',');
  const viewports = viewportSpec.map((spec) => {
    const [w, h] = spec.trim().split('x').map(Number);
    if (!Number.isFinite(w) || !Number.isFinite(h)) {
      throw new Error(`bad --viewport entry '${spec}'; expected WIDTHxHEIGHT`);
    }
    return { w, h, label: `${w}x${h}` };
  });

  return {
    url: get('url'),
    html: get('html'),
    viewports,
    out: get('out') ?? '.uishot',
    wait: get('wait'),
    audit: raw.includes('--audit'),
    shotOnly: raw.includes('--shot-only'),
    fontScale: get('font-scale'),
  };
}

interface Clip {
  selector: string;
  overflowBy: number;
  scrollHeight: number;
  clientHeight: number;
  clippedBy: string | null;
  scrollable: boolean;
  /** Scrolls, but renders no scrollbar the player can see. */
  silentScroll: boolean;
}

/**
 * Runs in the page. Reports elements whose content exceeds their box, and
 * whether that content is reachable (the element scrolls) or simply cut off by
 * an ancestor that hides its overflow — the second case is the actual defect.
 *
 * Passed as source text rather than a function: tsx compiles this file with
 * esbuild's keepNames, which injects a `__name` helper that does not exist once
 * Playwright serialises a function into the browser.
 */
const AUDIT_SOURCE = `(() => {
  function describe(el) {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.')
      : '';
    return el.tagName.toLowerCase() + id + cls;
  }

  const results = [];
  for (const el of Array.from(document.querySelectorAll('*'))) {
    const overflowBy = el.scrollHeight - el.clientHeight;
    if (overflowBy <= 1) continue;
    const style = getComputedStyle(el);
    const scrollable = /auto|scroll/.test(style.overflowY);

    let clippedBy = null;
    let parent = el.parentElement;
    while (parent) {
      const ps = getComputedStyle(parent);
      if (/hidden|clip/.test(ps.overflowY)) {
        const pr = parent.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        if (er.bottom > pr.bottom + 1 || er.height > pr.height + 1) {
          clippedBy = describe(parent);
        }
        break;
      }
      parent = parent.parentElement;
    }

    // A scroll region that reserves no gutter renders an overlay scrollbar or
    // none at all, so overflowing content reads as simply cut off. That is the
    // defect behind more than one "it crops" report in this app.
    const border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    const gutter = Math.round(el.offsetWidth - el.clientWidth - border);
    const styledThumb = style.scrollbarWidth === 'thin' || style.scrollbarColor !== 'auto';

    results.push({
      selector: describe(el),
      overflowBy,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      clippedBy,
      scrollable,
      silentScroll: scrollable && gutter <= 0 && !styledThumb,
    });
  }
  return results.sort((a, b) => b.overflowBy - a.overflowBy).slice(0, 25);
})()`;

async function auditClipping(page: Page): Promise<Clip[]> {
  return page.evaluate(AUDIT_SOURCE) as Promise<Clip[]>;
}

function splitQuery(spec: string): [string, string | undefined] {
  const at = spec.indexOf('?');
  return at === -1 ? [spec, undefined] : [spec.slice(0, at), spec.slice(at + 1)];
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args.url && !args.html) {
    throw new Error('need --url=<address> or --html=<file>');
  }

  // A harness path may carry a query (`harness.html?rows=10`). Split it off
  // before resolving, or pathToFileURL percent-encodes the '?' into the filename.
  let target: string;
  if (args.url) {
    target = args.url;
  } else {
    const [filePart, queryPart] = splitQuery(args.html!);
    target = pathToFileURL(path.resolve(REPO_ROOT, filePart)).href
      + (queryPart ? `?${queryPart}` : '');
  }
  const outDir = path.resolve(REPO_ROOT, args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  let failures = 0;

  try {
    for (const viewport of args.viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.w, height: viewport.h },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const problems: string[] = [];
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
      });

      await page.goto(target, { waitUntil: 'networkidle' });
      if (args.fontScale) {
        await page.evaluate((scale) => {
          document.documentElement.style.setProperty('--ui-font-scale', scale);
        }, args.fontScale);
      }
      if (args.wait) await page.waitForSelector(args.wait, { timeout: 15_000 });
      // Let fonts and any entry transitions settle before measuring.
      await page.waitForTimeout(400);

      const file = path.join(outDir, `${viewport.label}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`\n── ${viewport.label} → ${path.relative(REPO_ROOT, file)}`);

      for (const problem of problems) console.log(`   ! ${problem}`);

      if (args.audit && !args.shotOnly) {
        const clips = await auditClipping(page);
        const cutOff = clips.filter((c) => c.clippedBy && !c.scrollable);
        if (cutOff.length === 0) {
          console.log('   no clipped content');
        } else {
          failures += cutOff.length;
          for (const c of cutOff) {
            console.log(
              `   CLIPPED ${c.selector}: content ${c.scrollHeight}px in a `
              + `${c.clientHeight}px box (${c.overflowBy}px lost), cut by ${c.clippedBy}`,
            );
          }
        }
        const silent = clips.filter((c) => c.silentScroll);
        if (silent.length > 0) {
          failures += silent.length;
          for (const c of silent) {
            console.log(
              `   SILENT  ${c.selector}: ${c.scrollHeight}px of content in `
              + `${c.clientHeight}px, scrollable but NO visible scrollbar `
              + `(reads as cropped)`,
            );
          }
        }
        const scrolls = clips.filter((c) => c.scrollable && !c.silentScroll && c.overflowBy > 1);
        for (const c of scrolls) {
          console.log(
            `   scrolls  ${c.selector}: ${c.scrollHeight}px of content in ${c.clientHeight}px`,
          );
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (failures > 0) {
    console.log(`\n${failures} clipped element(s) found.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
