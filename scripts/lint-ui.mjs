#!/usr/bin/env node
/**
 * lint:ui — design-system enforcement for the light-only token system.
 *
 * Bans in src/**:
 *   1. Any `dark:` variant (the system is light-only; dark themes need a real token theme first).
 *   2. Raw Tailwind palette classes (slate/stone/amber/emerald/red/rose/sky/indigo/purple/…)
 *      in any color-assigning utility. Use the semantic tokens from @theme instead
 *      (surface*, on-surface*, primary/on-primary, success*, warning*, info*, error*,
 *      accent-*, outline*, inverse*).
 *
 * Allowed exceptions:
 *   - text-white / bg-white / bg-black scrims over imagery and dark canvases (DESIGN_RULES rule 4/5).
 *   - file-specific allowlist below (marked with the reason).
 */
import fs from 'node:fs';
import path from 'node:path';

const BANNED = [
  /\bdark:[a-zA-Z0-9[\]#/%._\-]+/g,
  /\b(?:bg|text|border|divide|ring|outline|from|via|to|placeholder|decoration|shadow|accent|fill|stroke|caret)-[a-z]*?(?:slate|stone|zinc|gray|neutral|amber|emerald|green|red|rose|sky|cyan|blue|indigo|violet|purple|fuchsia|pink|lime|yellow|orange|teal)-\d/g,
  // palette shades that don't need a scale number (e.g. bg-red-500 is caught above, this catches raw hexes outside allowlist)
  /\bbg-\[#[0-9a-fA-F]{3,8}\]/g,
];

// per-file allowed raw hexes (reason: deliberate dark canvas / brand art surfaces)
const ALLOWLIST = new Map([
  ['src/components/map/MapViewer.tsx', [/#0c1017/g, /#070a0e/g]], // masterplan canvas backgrounds
]);

const ROOT = path.resolve(process.cwd(), 'src');
const EXTS = ['.ts', '.tsx'];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXTS.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let violations = 0;

for (const file of files) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  const allowed = ALLOWLIST.get(rel) || [];
  const lines = src.split(/\r?\n/);

  lines.forEach((line, i) => {
    for (const re of BANNED) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        if (allowed.some((a) => (a.lastIndex = 0) || a.test(line))) continue;
        violations++;
        console.log(`${rel}:${i + 1}  ${m[0]}`);
      }
    }
    for (const a of allowed) {
      a.lastIndex = 0;
    }
  });
}

if (violations > 0) {
  console.error(`\n✖ lint:ui failed — ${violations} banned pattern(s). See docs/DESIGN_RULES.md.`);
  process.exit(1);
} else {
  console.log('✓ lint:ui passed — no raw palette classes or dark: variants in src/**');
}
