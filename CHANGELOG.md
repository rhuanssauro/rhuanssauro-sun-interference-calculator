# Changelog

Notable changes to the Rhuanssauro Sun Interference Calculator. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-12

Calculator-first orbital workspace and report refinements in [#3](https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator/pull/3).

### Added

- Ground-station hemisphere selection: Auto from latitude, Northern or Southern. Signed coordinates remain authoritative; contradictory selections block calculation and export.
- Static satellite imagery and an alignment schematic, with source provenance documented in `assets/SOURCES.md`. No new runtime dependency or build step.

### Changed

- Station setup and UTC predictions precede the full satellite catalog. Native disclosures retain RF settings and engineering detail; keyboard targets, responsive layouts and themes support the compact workspace.
- HTML/PDF reports use one small native dinosaur scratch and live-text signature across the white page. Repeated header branding is removed and licensing remains at the bottom.
- The bundled catalog is available immediately; completed live refreshes apply on the next valid calculation without changing an existing report.

### Fixed

- Reject malformed, empty and out-of-range numeric inputs; invalidate stale results and exports until recalculation.
- Prevent late place-lookup responses from replacing a newer calculation and show actionable lookup failures.
- Preserve separate UTC-midnight window segments and use consistent scan resolution for the daily summary and nearby dates.
- Synchronize embedded map pins with station coordinates and retain satellite selection and keyboard focus during catalog updates.

The calculator remains a geometric estimate, not a confirmed circuit-outage prediction. Existing CSV, HTML and PDF exports remain client-side.

## [1.1.0] - 2026-09-11

First public packaging of the features merged in [#1](https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator/pull/1).

### Added

- Live **UTC now** header clock (about once a second, with milliseconds) next to a separate **Last check** stamp — the epoch the geometry was actually evaluated at, updated on every check or input change. The catalog line stays the Celestrak fetch stamp.
- **Dark / Light / System** theme control. Dark is the night-shift default; light is a paper/ink palette with the same solar amber and lock cyan; System follows the OS. Choice persists in `localStorage`, applied via `data-theme` on `<html>`.
- **CSV / HTML / PDF** export of the current prediction — site, satellite, band, diameter, frequency, carrier, verdict, and the geometric windows — as a branded Rhuanssauro Tech Inc report with an angles-only disclaimer. All three run client-side with no server and no build step.
- Dual-theme dashboard screenshots under `docs/` (`dashboard-dark.png`, `dashboard-light.png`) and a **v1.1 dashboard** section in the README.
- `package.json` now carries the public version (`1.1.0`, `"private": false`) to match the public GitHub repository.
