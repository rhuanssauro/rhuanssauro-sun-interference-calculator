---
title: "Security hardening: input clamping and production CSP docs for sun-interference-calculator"
author: Rhuan
date: 2026-11-14
branch: main
cost: { minutes: 7, tokens: 130113 }
id: l-1a8c29fe
scope: repo
status: active
src: agent
touches:
  - README.md
  - js/app.js
  - js/export-report.js
  - js/catalog.js
---

## Decided
Applied input clamping hardening and documented production CSP headers for the sun-interference-calculator. Removed AI context files (.ai-memory.toml, opencode.json, .mcp.json) from git tracking.

## Tried and ruled out
- Full audit mode: requires explicit user request per security-audit skill. Guidance mode was the correct default.
- Server-side validation: not applicable — pure static client-side calculator.
- Custom CSP builder: over-engineering; documented nginx/Cloudflare/GitHub Pages snippets instead.

## Watch out
- If CSP breaks theme switcher, `unsafe-inline` for styles is required (inline `data-theme` attribute).
- Input clamping in `readForm()` only affects committed state; invalid entries still show form errors first.
- Live Celestrak refresh requires `connect-src https://celestrak.org` in CSP.

## In the code:
- Repo: rhuanssauro/rhuanssauro-sun-interference-calculator
- js/app.js:370-374 — lat/lon/diameter clamped before state commit
- README.md:140-156 — production CSP headers for nginx/Cloudflare/GitHub Pages
- .gitignore — AI context files excluded from version control
- All 61 tests pass (21309a2)
