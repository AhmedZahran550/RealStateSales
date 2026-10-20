<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Design system rules (mandatory for all UI work)

This project uses a **light-only token design system** defined in `src/app/globals.css` (`@theme` + `@layer components`). Read `docs/DESIGN_RULES.md` before writing or updating any UI. The short version — these rules exist because mixing light-only tokens with raw palette colors and ad-hoc `dark:` variants produced invisible text (light-on-light / dark-on-dark):

1. **Never use raw Tailwind palette colors** (`stone-*`, `slate-*`, `emerald-*`, `red-*`, `amber-*`, …) for `bg-*` or `text-*` in components. Use the semantic tokens: `surface`, `surface-container-*`, `on-surface`, `on-surface-variant`, `primary`/`on-primary`, `success`/`success-container`, `error`/`error-container`, `warning`, `info`, `outline`, `outline-variant`, `primary-fixed`.
2. **Never add `dark:` variants.** Light-only system; if dark mode is required, build a real dark token theme first.
3. **Every background has a paired `on-*` text token** — e.g. `bg-primary` ⇒ `text-on-primary`. Tinted text (e.g. `text-success`) is only allowed on its light container (`bg-success-container`), never directly on a saturated/colored background.
4. **Text over imagery always sits on a guaranteed element**: the black scrim gradient, `bg-black/70` chips, or `.price-pill`. It must also work over the `hero-gradient` fallback when a unit/past-work item has no photo.
5. **Reuse the semantic component classes** (`.card`, `.panel-section`, `.chip`, `.input-base`, `.btn-primary`, `.btn-tonal`, `.price-pill`, `.empty-state*`, `.hero-gradient`, `.switch-*`) instead of hand-writing class strings; extend `globals.css` rather than inventing one-off styles per file.
6. **Contrast floor**: ≥ 4.5:1 for all text (including small 10–12px bold labels) against the actual background; ≥ 3:1 for large text.
7. RTL-first (`dir="rtl"`, Arabic copy): icons inside inputs go at `right-3`, `pr-10`-style spacing as in existing files; keep the Cairo font weights already used (`font-semibold`/`font-bold`/`font-black`).

Before finishing any UI change, run the reviewer checklist at the end of `docs/DESIGN_RULES.md`.
