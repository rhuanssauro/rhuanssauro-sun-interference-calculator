# Design

## Product
Sun Interference 2026 — a file-openable NOC dashboard for GSO sun-transit.

## Scene
A teleport operator on night shift in Macaé sits a dark console. The only heat in the room is the solar-disk amber of an impending sun outage. Fluorescent overheads are off; the belt of GEO slots is the light source.

## Register
product

## Color strategy
Restrained. Near-black surfaces (chroma 0). Primary solar amber (hue 38, seed) used for impact, selection, and the drop zone. Accent lock-cyan for Intelsat/look-lock metadata. Status color never flies alone — every chip and verdict also carries a word.

```css
--bg: oklch(0.10 0 0);
--surface: oklch(0.155 0 0);
--surface-2: oklch(0.20 0 0);
--ink: oklch(0.94 0.02 38);
--muted: oklch(0.72 0.02 38);
--primary: oklch(0.72 0.16 38);
--accent: oklch(0.74 0.12 215);
--danger: oklch(0.68 0.18 28);
--ok: oklch(0.78 0.13 150);
```

Text on primary/danger/ok fills is near-white.

### Light theme (operator-selectable)
Dark stays the default. A header control (Dark / Light / System, persisted in `localStorage`, applied as `data-theme` on `<html>`) swaps the token set. Light is paper/ink — neutral chroma-0 surfaces, **not** cream — with the same amber (hue 38) and cyan (hue 215) darkened for WCAG AA on paper:

```css
--bg: oklch(0.96 0 0);
--surface: oklch(0.99 0 0);
--ink: oklch(0.24 0.015 38);
--primary: oklch(0.51 0.14 38);
--accent: oklch(0.46 0.09 215);
```

The footer watermark (light art on transparency) sits on a dark strip in light mode.

## Typography
IBM Plex Sans (UI) + IBM Plex Mono (slots, UTC, longitudes). Fixed rem scale, ratio ~1.2. Body 1rem. No fluid display type. `tabular-nums` on times and angles. `font-display: swap`, system-ui fallback so `file://` never blanks.

## Layout
Named grid: header, Clarke belt, checker | verdict, briefing, sources. Drop zone is the primary object — larger than the belt, not a card among cards. Belt is a 1-D longitude strip, not an identical card grid.

## Motion
150–220 ms on selection and drop highlight. No page-load choreography. `prefers-reduced-motion: reduce` → instant.

## Anti-references applied
No cream body, no hero metrics, no side-stripe, no gradient text, no glass cards, no sketch sun.
