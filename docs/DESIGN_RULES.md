# Design System Rules — عقار سيلز (AqarSales Pro)

This is a **light-only** design system. All tokens live in `src/app/globals.css` under `@theme`.
The root cause of the original "invisible text" bug was mixing light-only tokens with raw
Tailwind palettes (`stone-*`, `slate-*`, `emerald-*`) and ad-hoc `dark:` variants that only
activate on dark-OS devices. These rules exist so this class of bug never returns.

## 1. Colors — tokens only

Use the semantic token pairs from `globals.css`. Never use raw Tailwind palette colors
(`stone-*`, `slate-*`, `zinc-*`, `emerald-*`, `red-*`, `amber-*`, …) for a `background-*` or
`text-*` in feature components.

### Approved pairs (background ⇒ text)

| Surface / background          | Text / icon color                | Usage                                   |
| ----------------------------- | -------------------------------- | --------------------------------------- |
| `bg-surface`, `bg-surface-container-*` | `text-on-surface` (headings/body) | Main backgrounds everywhere |
|                               | `text-on-surface-variant` (secondary text) | labels, meta, hints |
| `bg-primary`                  | `text-on-primary`                | primary buttons, active badges, icon tiles |
| `bg-primary-container`        | `text-on-primary-container`      | strong accent blocks                   |
| `bg-success`                  | `text-on-success`                | "negotiable" badge, sold tags          |
| `bg-success-container`        | `text-success` / `text-on-success-container` | price boxes, success banners |
| `bg-error`                    | `text-on-error`                  | destructive buttons                    |
| `bg-error-container`          | `text-on-error-container`        | error banners/messages                 |
| `bg-warning-container`        | `text-on-warning-container`      | warning banners                        |
| `bg-warning`                  | `text-on-warning`                | filled warning buttons/pills           |
| `bg-info-container`          | `text-on-info-container`         | info banners                           |
| `bg-info`                     | `text-on-info`                   | filled info buttons                    |
| `bg-accent-indigo-container`  | `text-on-accent-indigo-container`| CRM "viewed" stage                     |
| `bg-accent-purple-container`  | `text-on-accent-purple-container`| CRM "negotiating" stage                |
| `bg-accent-teal-container` / `bg-accent-pink-container` | `text-on-*-container` | extra category badges |
| `bg-inverse-surface`          | `text-inverse-on-surface`        | inverse chips/toasts/snackbars         |
| `border-outline-variant`      | —                                | card/divider/input borders             |
| `border-outline`              | —                                | emphasized borders, hover borders      |
| `text-outline`                | —                                | icons in muted inputs (not body text)   |

### Rules in detail

1. **Contrast first.** Any text must reach ≥ 4.5:1 against the background it actually sits on
   (≥ 3:1 for ≥ 18px bold / 24px text). If a color fails, add a container: put the price in a
   `price-pill`, or the tag on `bg-success`, etc. Never place tinted text directly on a colored
   surface (e.g. `text-emerald-400` on an emerald gradient — this was the original bug).
2. **Every `bg-c` has a defined `on-c`.** If you create a background from a token that doesn't
   have a matching `on-*` token, add the pair to `@theme` first.
3. **Text over imagery must sit on a guaranteed element**: the built-in scrim
   (`bg-gradient-to-t from-black/70 → transparent`), `bg-black/70`+ chips, or a `price-pill`.
   Never rely on the photo itself for contrast — units without images fall back to
   `hero-gradient`, so overlays must work on both.
4. **No `dark:` variants.** The system is light-only. If dark mode is ever needed, build a real
   dark token theme first (CSS variables switched by `.dark`), never per-component `dark:`
   classes.
5. **`bg-white/…` and `bg-black/…` alpha overlays are only allowed**: over the hero gradient /
   imagery (guaranteed dark beneath), for modal backdrops (`bg-black/70–85`), or over the dark
   masterplan canvas in `MapViewer`. Text on a black scrim/canvas must be `text-white*`
   or `text-warning-container` — never `text-on-surface-*` (dark gray-on-black).
6. **No `dark:` variants.** The system is light-only. If dark mode is ever needed, build a real
   dark token theme first (CSS variables switched by `.dark`), never per-component `dark:`
   classes.
7. **`primary-strong`** is the darker primary used for `hover:` states of filled primary
   buttons — never use `hover:bg-primary-container` (lighter = wrong direction).

## 2. Semantic component classes

Reuse these instead of hand-writing class strings (defined in `globals.css` → `@layer components`):

- `.hero-gradient` — brand gradient derived from `--color-primary`; white text on top.
- `.card` / `.card-bordered` — white card surface (optionally bordered).
- `.panel-section` — inset section inside a card (inputs summary boxes, spec tiles).
- `.chip` — small informational tag.
- `.badge` + `.badge-neutral|success|warning|error|info|accent-indigo|accent-purple|accent-teal|accent-pink`
  — pill tags; always use the paired variant so contrast is fixed. Use these (or the
  `*_container`/`on-*` token pairs) for any status/category label instead of raw colors.
- `.input-base` — all `input`/`textarea`/`select` styling (add sizing utilities on top).
- `.btn-primary` — filled primary button (`disabled:` handled).
- `.btn-tonal` — secondary button.
- `.price-pill` — price/negative display over imagery.
- `.empty-state`, `.empty-state-icon`, `.empty-state-title`, `.empty-state-hint` — empty states.
- `.switch-track` (`data-on`), `.switch-knob` — toggle switches.

To add a new component class or token pair, edit `globals.css`; do not invent one-off classes
inside a page file.

### Type scale tokens (`@theme`)

Semantic typography tokens exist and are usable on new UI: `text-label-xs|sm|md|lg`,
`text-body-sm|md`, `text-headline-lg|xl` (sizes + line-heights in `@theme`, families
`--font-label-*` / `--font-body-*` / `--font-headline-*` → Cairo). Legacy markup that carried
dead pairs like `font-label-md text-label-md text-xs` was cleaned to the plain utilities
(`text-xs`) during the token migration; new components should prefer the semantic classes.

## 3. Enforcement — `npm run lint:ui`

`scripts/lint-ui.mjs` scans `src/**/*.{ts,tsx}` and fails on:

1. any `dark:` variant,
2. raw palette classes (`slate/stone/amber/emerald/red/rose/sky/indigo/purple/violet/…`),
3. raw hex `bg-[#…]` (allowlisted only for the MapViewer masterplan canvas).

Run it before finishing any UI change (CI/pre-commit):

```
npm run lint:ui
```

## 4. Structure & code style

- RTL-first: the app is `dir="rtl"`. Icons in inputs sit at `right-3`; physical `pr-*`/`pl-*`
  utilities follow the visual side, matching existing components.
- Arabic (`ar`) labels: keep weights (Cairo `font-bold`/`font-black`) as used in existing
  files; never use `font-mono` for Arabic body copy.
- Buttons keep `cursor-pointer` (via `.btn-*`), `active:scale` feedback, and `disabled:opacity-60`.
- Focus visibility comes from `.input-base:focus` (ring via box-shadow). Keep it on any new input style.

## 5. Reviewer checklist for any new/updated UI

- [ ] `npm run lint:ui` passes (no raw palette / `dark:` / raw hex)
- [ ] No raw Tailwind palette colors for text/backgrounds
- [ ] No `dark:` classes anywhere
- [ ] Every `bg-*` has a paired `on-*` text color token
- [ ] Any text over an image/gradient/scrim sits on a scrim, chip, pill, or `text-white*`
- [ ] On dark canvases (MapViewer, modal backdrops) text is `text-white*` / `text-warning-container`
- [ ] Filled-button hovers darken (`bg-primary-strong` / `hover:bg-*-strong`), never lighten
- [ ] Used the semantic component classes instead of custom strings
- [ ] Empty and error states use `.empty-state` / `error-container` tokens
- [ ] Checked contrast of the smallest text (10–12px bold labels) — those need 4.5:1 too
