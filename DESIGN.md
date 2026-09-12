# Design

## Product
Sun Interference: a file-openable, task-first orbital workspace for GSO sun-transit.

## Scene
A teleport operator on night shift in Macaé sits a dark console. The only heat in the room is the solar-disk amber of an impending sun outage. Fluorescent overheads are off; the belt of GEO slots is the light source.

## Register
product

## Color strategy
Restrained neutral surfaces. Solar amber emphasizes the action and selected result; cyan marks references and setup steps. Green claw branding is preserved. Status is always written in text, never conveyed by color alone.

```css
--bg: oklch(0.10 0 0);
--surface: oklch(0.155 0 0);
--surface-2: oklch(0.20 0 0);
--ink: oklch(0.94 0.02 38);
--muted: oklch(0.72 0.02 38);
--primary: oklch(0.8 0.13 75);
--accent: oklch(0.74 0.12 215);
--danger: oklch(0.68 0.18 28);
--ok: oklch(0.78 0.13 150);
```

Dark-mode amber buttons use near-black text for contrast. Light-mode buttons use the darker amber token and near-white text. Danger/OK are text accents, not low-contrast filled badges.

### Light theme (operator-selectable)
Dark stays the default. A header control (Dark / Light / System, persisted in `localStorage`, applied as `data-theme` on `<html>`) swaps the token set. Light is paper/ink — neutral chroma-0 surfaces, **not** cream — with the same amber (hue 38) and cyan (hue 215) darkened for WCAG AA on paper:

```css
--bg: oklch(0.96 0 0);
--surface: oklch(0.99 0 0);
--ink: oklch(0.24 0.015 38);
--primary: oklch(0.51 0.14 38);
--accent: oklch(0.46 0.09 215);
```

The web footer's existing light bitmap sits on a dark strip in light mode. Detached HTML/PDF reports use a compact native green claw and live dark-ink wordmark directly on the white paper background, with no banner or image dependency.

## Typography
System UI stack (Segoe UI, system-ui, -apple-system), with ui-monospace for UTC and engineering values. No font download. Fixed rem sizes, body 1rem and header 2.6rem desktop / 2rem mobile. Tabular numerals on times and angles.

## Layout
Named grid: brand/navigation/themes, compact illustrated header, UTC/catalog status, station setup | prediction, collapsible Clarke belt, map/weather, explanatory alignment and sources. Original images are static and captioned as illustrations; titles and essential explanations are live HTML. Native fieldsets and disclosures, 44px targets, scoped table overflow. Stack at 860px; verify down to 320px and at 200% text zoom.

## Motion
No continuous animation or page-load choreography. State changes are immediate. Reduced-motion preference disables any transitions.

## Anti-references applied
No cream body, no hero metrics, no side-stripe, no gradient text, no glass cards, no sketch sun.
