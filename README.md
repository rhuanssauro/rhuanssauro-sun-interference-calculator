# Sun Interference

![A geostationary communications satellite over South America, solar arrays lit, the Sun lining up behind the bus — sun-transit geometry](docs/geo-hero.jpg)

Twice a year the Sun lines up behind a geostationary satellite as seen from a receiving earth station. The dish cannot tell solar noise from the carrier. This dashboard predicts that geometry for every Clarke-belt bird in view of a remote site.

Default site: **Macaé, Rio de Janeiro, Brazil**. Favorites at the top of the list: **Intelsat 37e** (C and Ku), **Telesat T-19**, **Hispasat H36W**, **Intelsat 10-02**. The rest of the in-view belt is still selectable.

Rhuanssauro Inc. — a datacenter in the jungle.

## What it does

- Pick a satellite, a remote site, antenna diameter, and band.
- Optionally enter **outbound** (remote RX), **inbound** (remote TX), and **carrier size** (MHz or Hz).
- Get an owner-style geometric verdict: impacted / not impacted / not in view / out of season, plus UTC start–end when a window exists.

The page is static HTML. No account, no backend, no operator-portal scrape. Catalog is a bundled Celestrak GEO snapshot; live refresh is attempted only over http(s).

## Requirements

| Runtime | Needed for | Notes |
|---|---|---|
| A web browser | Using the dashboard | Current Chrome, Firefox, Safari, or Edge |
| Python 3.9+ | Local HTTP server | Standard library only — see `requirements.txt` |
| Node.js 18+ | Optional tests / catalog rebuild | `npm test` |

No pip packages. No bundler. No compile step.

## Usage

### macOS

```bash
git clone  git@github.com:rhuanssauro/sun-interference.git
cd sun-interference
chmod +x install.sh serve.py
./install.sh
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/). Stop with Ctrl+C.

You can also double-click `index.html` (live Celestrak refresh will not run on `file://`).

### Linux

```bash
git clone  git@github.com:rhuanssauro/sun-interference.git
cd sun-interference
python3 serve.py --port 8765
```

If `python3` is missing:

```bash
# Debian / Ubuntu
sudo apt-get update && sudo apt-get install -y python3

# Fedora
sudo dnf install -y python3
```

Then open http://127.0.0.1:8765/ in your browser.

### Windows

1. Install [Python 3](https://www.python.org/downloads/) and tick **Add python.exe to PATH**.
2. Clone with Git for Windows or GitHub Desktop:

```powershell
git clone  git@github.com:rhuanssauro/sun-interference.git
cd sun-interference
py -3 serve.py --port 8765
```

Or from PowerShell:

```powershell
.\serve.ps1
```

Open http://127.0.0.1:8765/ in Edge or Chrome. Stop with Ctrl+C.

Double-clicking `index.html` also works.

## How to read a check

1. Choose a **Favorite** satellite (or any in-view bird).
2. Confirm site (Macaé is the default) and dish diameter.
3. Set **Band**, or type **Outbound** frequency in MHz or GHz — that receive frequency drives the beamwidth when present.
4. **Inbound** and **Carrier size** are recorded for the circuit; they do not change the geometric window.
5. Read the verdict and the nearby UTC table.

Larger dishes → shorter windows. Sites west of the satellite tend to see morning windows; east, afternoon.

## Method

Owner-style geometry, not a portal scrape.

- Hispasat: estimates based exclusively on geometric angles (no RF margin, un-pointing, or performance).
- Intelsat: interference duration from receive antenna beamwidth. Allow a ±10 min operational pad.
- ITU-R S.1525-1: θ₃dB = 70 λ / D. Solar optical diameter ≈ 0.48°. Hour angle ≈ 0.25°/min.
- This checker: outage while the solar disk (~0.5°) is inside the receive 3 dB beam — half beamwidth + 0.25° solar radius.

Official calculators (no public JSON API):

- [Intelsat / SES](https://my.intelsat.com/si/public/)
- [Hispasat](https://www.hispasat.com/en/useful-information/solar-interference-calculator)
- [Telesat](https://app.telesat.com/sun-transit-calculator)

Orbital longitudes come from [Celestrak GP `GROUP=geo`](https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json). Respect their one-download-per-update policy.

## Tests (optional)

```bash
npm test
npm run catalog    # rebuild data/geo-snapshot.json from data/celestrak-geo-raw.json
```

## Layout

```
index.html          dashboard
serve.py            stdlib HTTP server (macOS / Linux / Windows)
install.sh          Unix launcher
serve.ps1           Windows launcher
css/ dashboard.css
js/  sun-transit.js catalog.js app.js
data/               bundled GEO snapshot
assets/             brand watermark
docs/geo-hero.jpg   README hero
tests/              node --test
```

## License

© 2026 Rhuanssauro Tech Inc. All rights reserved. Private repository. See [LICENSE](LICENSE).
