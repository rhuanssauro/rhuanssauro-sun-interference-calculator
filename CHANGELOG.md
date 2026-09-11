# Changelog

Notable changes to the Rhuanssauro Sun Interference Calculator. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-11

First public packaging of the features merged in [#1](https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator/pull/1).

### Added

- Live **UTC now** header clock (about once a second, with milliseconds) next to a separate **Last check** stamp — the epoch the geometry was actually evaluated at, updated on every check or input change. The catalog line stays the Celestrak fetch stamp.
- **Dark / Light / System** theme control. Dark is the night-shift default; light is a paper/ink palette with the same solar amber and lock cyan; System follows the OS. Choice persists in `localStorage`, applied via `data-theme` on `<html>`.
- **CSV / HTML / PDF** export of the current prediction — site, satellite, band, diameter, frequency, carrier, verdict, and the geometric windows — as a branded Rhuanssauro Tech Inc report with an angles-only disclaimer. All three run client-side with no server and no build step.
- Dual-theme dashboard screenshots under `docs/` (`dashboard-dark.png`, `dashboard-light.png`) and a **v1.1 dashboard** section in the README.
- `package.json` now carries the public version (`1.1.0`, `"private": false`) to match the public GitHub repository.
