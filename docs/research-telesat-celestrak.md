# Telesat sun-transit calculator, GEO fleet (South America / Atlantic), CelesTrak GP/SupGP, ITU-R S.1525-1

Retrieved 2026-09-10. Primary sources only except where noted as adjacent (Shaw Direct) or as a live catalog snapshot.

---

## 1. Telesat Sun Transit Calculator

**URL:** <https://app.telesat.com/sun-transit-calculator>

**Reachability (this retrieval):** public. HTTP/2 200, `content-type: text/html; charset=utf-8`. No login wall, no CAPTCHA on first load. Title: `Telesat Tools`. It is a JavaScript PWA (`webpackJsonptelesat-tools-pwa`). `<noscript>`: “You need to enable JavaScript to run this app.” Static HTML is an empty `#root`; the form is not available without JS.

Last-modified on the HTML shell: 2026-05-07. Client libraries under `/static/lib/` carry Telesat Canada copyright 1998–2015 and cite Vuong & Forsey plus Telesat file 24-5-8-2 (SUNT1/SUNT2, 1982). C/N path is ported from SunTRVB 1.2 (Wong, TMI / Telesat, 1999–2001) and uses the ITU-R IS.847-1 antenna pattern.

### 1.1 Inputs (left-hand form)

Documented from the live bundle (`/static/js/main.ba18d377.chunk.js`) plus Shaw Direct’s first-party-adjacent walkthrough. Shaw Direct is a Telesat Anik customer and publishes the same field list.

| UI label | Internal name | Values / constraints | Notes |
| --- | --- | --- | --- |
| **Select a satellite** | `satellite` | Required. Keys of the onboard fleet catalog `L`. | Dropdown optgroups: Anik, Nimiq, Telstar. |
| **Enter a location** | `location` + hidden `lat`/`lng` | Address or city; geocoded to decimal latitude / longitude. | Validation: lat/lng must not be `NaN`. Marker on the right-hand map. |
| **Prediction year** | `predictionYear` | `2023, 2024, 2025, 2026` (hard-coded `E.data.sunTransit.years`). Default option is the current calendar year. | |
| **Prediction season** | `predictionSeason` | `January to May` (`Spring`) or `August to November` (`Fall`). | Engine: `setFullYear(year, Spring? 3 : 9)` then `getEquinoxTime` − 90 d, window +180 d (MJD). |
| **Modes** | `mode` | **C/N Mode** (`CNR`, default) or **FDS Angle Mode** (`Angle`). | Radio buttons. |
| **Frequency Band** | `band` | Required only in C/N Mode. Union of the selected satellite’s `bands[]`: `C`, `Ka`, `Ku`, `X`, `DBS`. | Selecting a band writes hidden `frequency` (GHz) and default `temperature` (K). |
| **Antenna diameter (m)** | `antenna` | Required only in C/N Mode. Number, **0.1–50 m**. | |
| **System temperature (K)** | `temperature` | Required only in C/N Mode. Number (Kelvin). | Auto-filled from band; user can override. |

Submit button: **Calculate**.

### 1.2 Band → frequency / Tsys defaults (C/N Mode)

From the `useEffect` on `band`:

| Band | Frequency (GHz) | System temperature (K) |
| --- | --- | ---: |
| C | 4 | 114 |
| Ka | 19.9 | 235 |
| **Ku** | **12** | **158** |
| X | 12 | 138 |
| DBS | 12.5 | 163 |

Shaw Direct’s Ku walkthrough matches the Ku row (12 GHz implied, Tsys **158 K**, dish **0.6 m**). The X-band default frequency of 12 GHz is what the shipped code writes; it is not an X-band RF centre (typical X-band user ~7–8 GHz). Treat it as a calculator quirk, not a physical X-band assignment.

Hidden C/N engine constants (not on the form):

- `CNRThreshold = 1.5` dB (outage if peak C/N degradation exceeds this).
- `LookupSolarFlux = true`; fallback `SolarFlux = 100.7` sfu. 10.7 cm flux table in `/static/lib/sfu.js` is generated from CelesTrak space-weather (`sw20100101.txt`).
- Antenna pattern: ITU-R IS.847-1 (`Disc847` / `G847`), `D/λ` via `Diameter * Frequency` (m × GHz). Solar disc half-angle in the double integral: `RSU = 0.25°` (0.5° diameter). Aperture efficiency 0.65 (Gaussian branch only; default branch is IS.847).

FDS Angle Mode does **not** require band, diameter, or Tsys. Angular gates are hard-coded: **inner 1°**, **outer 5°** (`googleMaps.config.sunTransit.innerLimit/outerLimit`). Times are the instants the Sun–satellite off-axis angle crosses those cones.

### 1.3 Satellite list in the calculator

Catalog longitudes are degrees **east**, negative = west. Live centre-of-box overlay: `GET https://app.telesat.com/data/FleetLong.csv` (west-positive 0–360°; e.g. Telstar 18 VANTAGE `222.000` = 138°E). Snapshot 2026-09-09 07:20:04 UTC:

| Calculator name | Key | Nominal lng (catalog) | Bands | FleetLong.csv (west °) |
| --- | --- | ---: | --- | ---: |
| Anik F1R | `anik_f1r` | −107.3 (subtitle: inclined orbit) | C, Ku | 107.300 |
| Anik F2 | `anik_f2` | −111.1 (inclined orbit) | C, Ka, Ku | 111.100 |
| Anik F3 | `anik_f3` | −118.7 | C, Ka, Ku | 118.700 |
| Anik G1 | `anik_g1` | −107.3 | C, Ku, X | 107.300 |
| Nimiq 4 | `nimiq_4` | −82 | DBS, Ka | 82.000 |
| Nimiq 5 | `nimiq_5` | −72.7 | DBS | 72.700 |
| Nimiq 6 | `nimiq_6` | −91.1 | DBS | 91.100 |
| Telstar 11N | `t11n` | −37.5 | Ku | 37.550 |
| Telstar 12 Vantage | `t12v` | −15 | Ku | 15.000 |
| Telstar 18 Vantage | `t18v` | +138 | C, Ka, Ku | 222.000 |
| Telstar 19 Vantage | `t19v` | −63 | Ka, Ku | 63.000 |

`Telstar14R` is **mapped** in the FleetLong parser (`D("Telstar14R") → t14r`) and appears in FleetLong as `Telstar14R,15.000` (same west longitude as Telstar 12V). It is **not** in the sun-transit dropdown catalog `L` and is **not** on <https://www.telesat.com/geo-satellites/> as of this retrieval. See §2.5.

The look-angle tool’s satellite picker still lists CSV ephemerides `Telstar11N.C.csv`, `Telstar12.C.csv`, `Telstar12V.C.csv`, `Telstar18V.C.csv`, `Telstar19V.C.csv` (no 14R CSV).

### 1.4 Results

C/N Mode table columns (UTC via `Date.prototype.toTod` → `getUTCHours/Minutes/Seconds`):

- Date (Year/Mn/Dy)
- Peak Transit (Hr:Mn:Sc)
- Transit Start (Hr:Mn:Sc)
- Transit End (Hr:Mn:Sc)
- Transit Duration (min)
- Max C/N Degrad. (dB)

FDS Angle Mode columns:

- Date
- Enters 5 Degree / Enters 1 Degree / Leaves 1 Degree / Leaves 5 Degree (Hr:Mn:Sc)
- Duration (min)

Right-hand map: station, satellite longitude, inner/outer sun-transit footprints. Station summary: Location, Satellite, Satellite longitude (E), Station longitude (E), Station latitude (N), Antenna Size (m), System temperature (K), Solar Flux Index at 2800 MHz (SFU).

### 1.5 Shaw Direct (first-party-adjacent) field list

If the SPA is ever login-walled or JS-blocked, Shaw Direct’s support article is the public field-by-field description of the same calculator:

- EN: <https://www.shawdirect.ca/english/support/article/8325/>
- FR: <https://www.shawdirect.ca/francais/soutien/article?articleid=8325&languageid=3084>

Shaw Direct instructs: satellite **Anik G1**, location = address/city, year = current, season January–May or August–November, leave **C/N Mode**, band **Ku**, antenna **0.6** m, system temperature default **158**. Results of interest: **Date**, **Transit Start**, **Transit End**. Phenology they quote: up to 20 minutes, once a day, up to 14 consecutive days.

---

## 2. Telesat GEO that can serve South America / Atlantic

Official fleet index: <https://www.telesat.com/geo-satellites/> (retrieved 2026-09-10). That page no longer lists Telstar 14R. Coverage claims below are from Telesat footprint brochures and the 2024 Form 20-F.

### 2.1 Telstar 19 VANTAGE — 63.0° WL (primary Brazil / SA / Atlantic HTS)

| | |
| --- | --- |
| NORAD / COSPAR | 43562 / 2018-059A |
| Operator slot | 63.0° WL, co-located (historically) with Telstar 14R |
| Bands | Ku regional + Ku HTS spots; Ka HTS spots |
| In service | August 2018 (brochure); launched Jul 2018 (20-F) |
| 20-F regions | Brazil and portions of Latin America, North America, Atlantic Ocean, Caribbean |
| Manufacturer EOS / EOM | 2033 / 2037 (20-F as of 31 Dec 2024) |

Brochure: <https://www.telesat.com/resources/telstar-19-vantage-satellite-footprint/>

Beams named in the brochure and in the calculator catalog: Ku NAOR, Ku Brazil regional, Ku Andean + Brazil HTS spots, Ka NAOR HTS, Ka Caribbean HTS, Ka Northern Canada HTS, Ka gateways (MD / MTJ / SK). Text: “broad beam Ku-band coverage of the North Atlantic and South America” plus Ku HTS in Brazil and the Andean region; Ka HTS over North Atlantic, Caribbean, South America.

CelesTrak GP (GROUP=geo, epoch 2026-09-09/10): mean Earth-fixed longitude from OMM ≈ **−63.02°** (see §3.4). Still in `FILE=telesat` SupGP (`DATA_SOURCE=Telesat-E`).

### 2.2 Telstar 12 VANTAGE — 15.0° WL (Brazil, Caribbean, South Atlantic, PanAm)

| | |
| --- | --- |
| NORAD / COSPAR | 41036 / 2015-068A |
| Operator slot | 15.0° WL |
| Bands | Ku wide + Ku spots |
| In service | December 2015 |
| 20-F regions | Eastern United States, SE Canada, Europe, Russia, Middle East, South Africa, **portions of South and Central America** |
| Manufacturer EOS / EOM | 2030 / 2032 |

Brochure: <https://www.telesat.com/resources/telstar-12-vantage-satellite-footprint/>

Beams include **Brazil**, **Pan American**, **Caribbean**, **South Atlantic**, Africa, Europe/Middle East, North Sea, Mediterranean. “Wide Atlantic Ocean beam extends from the Americas to Europe & Africa and from the Arctic Circle to the Equator.”

CelesTrak GP longitude ≈ **−15.00°**. Present in `FILE=telesat` SupGP.

### 2.3 Telstar 11N — 37.5° WL (Atlantic Ocean Region)

| | |
| --- | --- |
| NORAD / COSPAR | 34111 / 2009-009A |
| Operator slot | 37.5° WL (20-F: 37.55° WL) |
| Bands | Ku only |
| In service | March 2009 |
| 20-F regions | North and Central America, Europe, Africa and the **maritime Atlantic Ocean region** |
| Manufacturer EOS / EOM | 2024 / 2027 |

Brochure: <https://www.telesat.com/resources/telstar-11n-satellite-footprint/>

Beams: North and Central America; Europe and North Africa; **Atlantic Ocean**; Sub-Saharan Africa. “Wide Atlantic Ocean beam extends from the Americas to Europe & Africa and from the Arctic Circle to the Equator.” 20-F history note: first satellite to provide Ku-band coverage of the Atlantic from the Arctic Circle to the Equator.

CelesTrak GP longitude ≈ **−37.56°**. Present in `FILE=telesat` SupGP.

### 2.4 Anik G1 — 107.3° WL (full-continent South America C + Ku)

Not an Atlantic bird, but it **does** serve South America from a Pacific/Americas slot.

| | |
| --- | --- |
| NORAD / COSPAR | 39127 / 2013-014A |
| Operator slot | 107.3° WL (co-located with Anik F1R) |
| Bands | C, Ku, X (calculator); brochure: 24 × 36 MHz SA C, 12 × 36 MHz SA Ku, 16 × 27 MHz extended Ku (Canada DTH), 3 × 36 MHz X |
| In service | May 2013 |

Brochure: <https://www.telesat.com/resources/anik-g1-satellite-footprint/> — “Powerful capacity for South America”; “single beam coverage of entire continent in both C-band and Ku-band.” Maps: Ku South America, C-band South America, X-band North & South America.

CelesTrak GP longitude ≈ **−107.30°**. Present in `FILE=telesat` SupGP. This is the satellite Shaw Direct tells customers to pick in the sun-transit calculator.

### 2.5 Telstar 14R / Estrela do Sul 2 — historically 63° WL Brazil; end of life 2026

| | |
| --- | --- |
| NORAD / COSPAR | 37602 / 2011-021A |
| Historical slot | 63° WL, co-located with Telstar 19 VANTAGE |
| Bands | Ku (Brazil, Southern Cone, Andean, NAOR, CONUS/Caribbean) |
| Launch | 20 May 2011 |
| 20-F (FY2024) | 63° WL; Brazil and portions of Latin America, North America, Atlantic Ocean; manufacturer EOS **2026**; EOM **2026** |

**Current operational status (2026-09-10):** treat as **out of the GEO service fleet**.

- Telesat GEO fleet page does **not** list it.
- Sun-transit dropdown does **not** list it.
- CelesTrak `GROUP=geo` (567 OMMs, 2026-09-10) has **no** TELSTAR 14R / 37602.
- CelesTrak `GROUP=telesat` and `FILE=telesat` SupGP also omit it.
- Telesat Q4 2025 earnings transcript (2026-03): GEO 2026 guidance cites “our **T 14R satellite reaching end of life**.”
- Telesat footprint URL <https://www.telesat.com/resources/telstar-14r-satellite-footprint> now **404**. A 2022 brochure (still indexed by search) described Brazil / Southern Cone / Andean / North Atlantic / CONUS-Caribbean Ku beams at 63° WL.
- Broadcast marketing page still says “Telstar 14R / Estrela do Sul 2 serves regional broadcasters in Brazil” (<https://www.telesat.com/solutions/broadcast/>, page dated 2025-12-16) — stale relative to the fleet page and earnings.
- `FleetLong.csv` still emits `Telstar14R,15.000` (west), i.e. the 15°W number, not 63°W. Do not use that row as a 63°W Brazil-beam slot.
- Third-party SatBeams (not primary) marks the spacecraft deorbited / graveyard; a 2026-08 TLE with mean motion ≈ 0.98986 rev/day is super-GEO, consistent with graveyard.

For a 2026 Macaé / Brazil sun-outage product, **Telstar 19 VANTAGE at 63°W is the live 63°W Telesat bird**. Keep 14R only as a historical alias of that slot.

### 2.6 Other Telstar / Anik (not SA/Atlantic service)

| Satellite | Slot (Telesat) | Why not in the SA/Atlantic service set |
| --- | --- | --- |
| Telstar 18 VANTAGE | 138.0° EL | Asia / Australia / Pacific / Hawaii. |
| Anik F1R, F2, F3 | 107.3 / 111.1 / 118.7° WL | North America (F1R/F2 inclined). |
| Nimiq 4 / 5 / 6 | 82 / 72.7 / 91.1° WL | Canadian DTH (DBS). Nimiq 2 is inclined and not on the public GEO fleet table. |

20-F (FY2024) in-orbit table is the audited inventory: Anik F1R, F2, F3, G1; Nimiq 4, 5, 6; Telstar 11N, 12 VANTAGE, **14R**, 18 VANTAGE, 19 VANTAGE; plus LEO 3. SCC: Ottawa flies 11N / 12V / 18V (and the Aniks/Nimiqs); **Rio de Janeiro SCC flies 14R and 19V**.

### 2.7 NORAD cross-walk (CelesTrak `GROUP=telesat`, 2026-09-10)

| Name | NORAD | Int’l des | Period (min) | Incl (°) | In `FILE=telesat` SupGP |
| --- | ---: | --- | ---: | ---: | --- |
| NIMIQ 2 | 27632 | 2002-062A | 1436.10 | 9.64 | yes |
| ANIK F2 | 28378 | 2004-027A | 1436.10 | 3.50 | yes |
| ANIK F1R | 28868 | 2005-036A | 1436.10 | 4.52 | yes |
| ANIK F3 | 31102 | 2007-009A | 1436.10 | 1.41 | yes |
| NIMIQ 4 | 33373 | 2008-044A | 1436.09 | 0.01 | yes |
| TELSTAR 11N | 34111 | 2009-009A | 1436.11 | 0.04 | yes |
| TERRESTAR-1 | 35496 | 2009-035A | 1436.10 | 5.22 | yes |
| NIMIQ 5 | 35873 | 2009-050A | 1436.11 | 0.04 | yes |
| SKYTERRA 1 | 37218 | 2010-061A | 1436.10 | 5.30 | yes |
| NIMIQ 6 | 38342 | 2012-026A | 1436.09 | 0.04 | yes |
| ANIK G1 | 39127 | 2013-014A | 1436.10 | 0.04 | yes |
| TELSTAR 12V | 41036 | 2015-068A | 1436.13 | 0.03 | yes |
| TELSTAR 19V | 43562 | 2018-059A | 1436.12 | 0.01 | yes |
| TELSTAR 18V | 43611 | 2018-069A | 1436.12 | 0.03 | yes |

`GROUP=telesat` also contains VIASAT-2, LEO 1 (LEO VANTAGE 1, not GEO), and AMOS-17 — not Telesat-operated GEO service birds. `FILE=telesat` SupGP is the operator-ephemeris subset (14 objects, all `DATA_SOURCE=Telesat-E`, `CLASSIFICATION_TYPE=C`).

---

## 3. CelesTrak GEO catalog and Telesat/Intelsat SupGP

### 3.1 GP query (18 SDS / Space-Track via CelesTrak)

```
https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json
```

General form: `https://celestrak.org/NORAD/elements/gp.php?{QUERY}=VALUE[&FORMAT=VALUE]`

`QUERY` (must be uppercase): `CATNR`, `INTDES`, `GROUP`, `NAME`, `SPECIAL` (`GPZ`, `GPZ-PLUS`, `DECAYING`).

`FORMAT`: `TLE`/`3LE`, `2LE`, `XML`, `KVN`, `JSON`, `JSON-PRETTY`, `CSV`. **Default FORMAT is CSV as of 2026-05-09** — always pass `FORMAT=json` if JSON is required.

This retrieval: `GROUP=geo&FORMAT=json` returned **567** OMMs. TLE format will not cover catalog numbers ≥ 100000 (5-digit TLE field exhausted 2026-07-11 at 69999, not 99999). Use CSV/JSON/XML.

JSON keys (CCSDS OMM Table 4-1 subset; CelesTrak omits redundant `CENTER_NAME=EARTH`, `REF_FRAME=TEME`, `TIME_SYSTEM=UTC`, `MEAN_ELEMENT_THEORY=SGP4`):

`OBJECT_NAME`, `OBJECT_ID`, `EPOCH` (ISO 8601 UTC), `MEAN_MOTION` (rev/day), `ECCENTRICITY`, `INCLINATION` (°), `RA_OF_ASC_NODE` (°), `ARG_OF_PERICENTER` (°), `MEAN_ANOMALY` (°), `EPHEMERIS_TYPE`, `CLASSIFICATION_TYPE` (`U` = Space-Track), `NORAD_CAT_ID`, `ELEMENT_SET_NO`, `REV_AT_EPOCH`, `BSTAR`, `MEAN_MOTION_DOT`, `MEAN_MOTION_DDOT`.

Docs: <https://celestrak.org/NORAD/documentation/gp-data-formats.php>  
OMM standard: CCSDS 502.0-B-3.

Prefer `https://celestrak.org` (not `.com`). `.com` returns HTTP 301; M2M clients that ignore 301 get blocked.

### 3.2 Supplemental GP (owner/operator ephemeris)

```
https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=intelsat&FORMAT=json
https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=telesat&FORMAT=json
```

(`FILE=intelsat|telesat` in the task is two `FILE` values, not a single OR query.)

Same `{QUERY}` set as GP, plus:

- `FILE` — named SupGP set (`intelsat`, `telesat`, `ses`, `starlink`, …).
- `SOURCE` — e.g. `Telesat-E`, `Intelsat-E`, `Intelsat-11P`, `SES-E`.

Docs: <https://celestrak.org/NORAD/documentation/sup-gp-queries.php>  
Index: <https://celestrak.org/NORAD/elements/supplemental/> (this retrieval: current as of 2026-09-10 12:16:15 UTC).

| FILE | Provenance |
| --- | --- |
| `intelsat` | Intelsat public ephemeris, IESS 412 Rev 3. Weekly + post-maneuver (`[PM]` suffix). |
| `telesat` | Telesat ephemeris on Space-Track, with Telesat permission. Fitted SGP4, `DATA_SOURCE=Telesat-E`. |

SupGP extras vs GP: `RMS`, `DATA_SOURCE`; `CLASSIFICATION_TYPE=C` (CelesTrak), not `U`. Multiple epochs per object are possible (Intelsat weekly vs `[PM]`). SupGP is fit **forward** from current epoch; GP is fit to past SSN observations.

This retrieval of `FILE=telesat`: 14 objects, epochs ~2026-09-10 03:00–04:00 UTC, RMS ~0.8–1.1 km. **No TELSTAR 14R.**

### 3.3 Usage policy — do not hammer; one download per 2-hour update

Authoritative:

- <https://celestrak.org/usage-policy.php> (2026-05-15, updated 2026-05-22)
- FAQ addendum on <https://celestrak.org/NORAD/documentation/gp-data-formats.php> (updated 2026-03-26)

Rules that apply to this project:

1. CelesTrak checks for new **GP data once every 2 hours**. There is no benefit to polling faster. 18 SDS GP itself only refreshes ~2–3 times/day.
2. **One download per update.** Cache locally; re-fetch only if the local file is **> 2 hours** old. As of 2026-03-26 this is enforced for large groups (`GROUP=active`, Starlink); a second fetch before the next update returns HTTP **403** with body like: “GP data has not updated since your last successful download of GROUP=active at … Data is updated once every 2 hours.”
3. Same 2-hour cadence is requested for **SupGP** even though constellations update on different internal schedules.
4. Only download the group you will use (`GROUP=geo` or `FILE=telesat` / `FILE=intelsat`), not `GROUP=active` plus every operator file.
5. On any non-200 (`301`, `403`, `404`, `50x`) **stop immediately** and page a human. Repeating 403/404 will firewall the IP (threshold: 50 HTTP errors in a 2-hour window).
6. Bandwidth: users above ~100 MB/day risk the firewall. Prefer CSV over JSON when size matters (JSON is ~3× CSV).
7. Use documented query URLs, not deleted legacy `*.txt` TLE files.

Practical client: if `mtime` of `data/celestrak-geo-raw.json` is < 2 h, skip the fetch.

### 3.4 Earth-fixed GEO longitude from an OMM

GP/SupGP mean elements are **TEME**, theory **SGP4**. For a near-circular, near-equatorial GEO object the Earth-fixed geographic longitude at epoch is the TEME mean longitude minus Greenwich Mean Sidereal Time:

\[
\lambda_{\mathrm{ECEF}} = \Omega + \omega + M - \theta_{\mathrm{GMST}}(t_{\mathrm{epoch}})
\]

then wrap to (−180°, +180°] (east-positive).

| Symbol | OMM field | Meaning |
| --- | --- | --- |
| \(\Omega\) | `RA_OF_ASC_NODE` | Right ascension of the ascending node (TEME, deg) |
| \(\omega\) | `ARG_OF_PERICENTER` | Argument of perigee (deg) |
| \(M\) | `MEAN_ANOMALY` | Mean anomaly (deg) |
| \(t_{\mathrm{epoch}}\) | `EPOCH` | UTC epoch of the mean elements |
| \(\theta_{\mathrm{GMST}}\) | — | Greenwich Mean Sidereal Time at that epoch, in degrees |

\(\Omega + \omega + M\) is the mean argument of longitude from the TEME x-axis (vernal equinox). Subtracting GMST rotates TEME → a Greenwich-tied equatorial frame. For \(e \approx 0\) and \(i \approx 0\), mean longitude ≈ true geographic longitude of the sub-satellite point.

**GMST (IAU 1982 / Vallado, seconds of time at date, then ×360/86400 for degrees).** Telesat’s own calculator uses the same polynomial in `/static/lib/epoch.js` `gha()`:

\[
\begin{aligned}
T_u &= (t_{\mathrm{UT1}} - 2451545.0)/36525 \\
\theta_{\mathrm{GMST,0h}} &= 24110.54841 + 8640184.812866\,T_u + 0.093104\,T_u^2 - 6.2\times10^{-6}\,T_u^3 \quad \text{(seconds)} \\
\theta_{\mathrm{GMST}} &= 360^\circ \left(\frac{\theta_{\mathrm{GMST,0h}}}{86400} + \{t_{\mathrm{UT1}}\}\right) \bmod 360^\circ
\end{aligned}
\]

where \(\{t_{\mathrm{UT1}}\}\) is the fractional day. DUT1 ≈ 0 is fine at the ~0.01° level.

**Limits of the shortcut**

- Inclined GEO (Anik F1R ~4.5°, F2 ~3.5°, Nimiq 2 ~9.6°): this is **mean** longitude; instantaneous sub-satellite longitude oscillates. Use SGP4 → TEME \(r\), then ECEF via GMST (and polar motion if you have EOP).
- Eccentricity and \(J_2\) mean-to-osculating differences are centimetre-to-kilometre in inertial position; for a station-kept GEO slot they are usually << 0.05° in longitude.
- For sun-outage geometry, operator **centre-of-box** (Telesat `FleetLong.csv`, Intelsat 11-parameter) is what the dish is pointed at; GP longitude is the current osculating/mean slot, typically within a few hundredths of a degree of the filed location for station-kept birds.

**Check against this `GROUP=geo` snapshot** (IAU-82 GMST, wrap to ±180°):

| OBJECT_NAME | NORAD | \(\lambda_{\mathrm{ECEF}}\) | Telesat filed slot |
| --- | ---: | ---: | ---: |
| TELSTAR 19V | 43562 | −63.02° | 63.0° WL |
| TELSTAR 12V | 41036 | −15.00° | 15.0° WL |
| TELSTAR 11N | 34111 | −37.56° | 37.5° WL |
| TELSTAR 18V | 43611 | +138.01° | 138.0° EL |
| ANIK G1 | 39127 | −107.30° | 107.3° WL |
| ANIK F1R | 28868 | −107.30° | 107.3° WL |
| ANIK F2 | 28378 | −111.11° | 111.1° WL |
| ANIK F3 | 31102 | −118.71° | 118.7° WL |
| NIMIQ 4 | 33373 | −81.98° | 82° WL |
| NIMIQ 5 | 35873 | −72.70° | 72.7° WL |
| NIMIQ 6 | 38342 | −91.11° | 91.1° WL |

Agreement is at the 0.02° level for the station-kept Telstars used in South America / Atlantic.

---

## 4. ITU-R S.1525-1 (in force)

**Title:** Impact of interference from the Sun into a geostationary-satellite orbit fixed-satellite service link  
**Status:** S.1525-1 (09/2002), in force (S.1525-0 superseded).  
**PDF:** <https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1525-1-200209-I!!PDF-E.pdf>  
**Index:** <https://www.itu.int/rec/R-REC-S.1525/en>

*Recommends:* Annex 1 for C/N degradation; Annex 2 for date/time of a Sun transit.

### 4.1 Geometry used in the duration / day-count approximations (Annex 2 §3.5)

Half-power beamwidth (deg), antenna diameter \(d_{\mathrm{ant}}\) and wavelength \(\lambda\) in the same units:

\[
\theta_{3\mathrm{dB}} = 70 \times \frac{\lambda}{d_{\mathrm{ant}}}
\]

Optical diameter of the Sun used in these formulae: **0.48°**.  
(Annex 1 separately notes the **microwave** apparent diameter at equinox ≈ **0.53°**; that 0.53° figure is *not* the one in the duration formulae.)

Declination of the Sun near equinox: **≈ 0.4° per day**.  
Hour angle of the Sun: **≈ 0.25° per minute**.

Worked example in the Rec: 11 m antenna at 11 GHz → \(\theta_{3\mathrm{dB}} = 0.17^\circ\).

### 4.2 Affected days, max duration, total duration

**Number of affected days** at each equinox:

\[
N_{\mathrm{days}} = \frac{\theta_{3\mathrm{dB}} + 0.48^\circ}{0.4^\circ/\mathrm{day}}
\]

11 m / 11 GHz: 1–2 successive days.

**Maximum duration** of a Sun transit through the 3 dB beam (minutes):

\[
T_{\max} = \frac{\theta_{3\mathrm{dB}} + 0.48^\circ}{0.25^\circ/\mathrm{min}}
\]

11 m / 11 GHz: ≈ 2.5 min.

**Total duration at each equinox** (mean chord of a circle swept by parallel daily tracks):

\[
T_{\mathrm{total}} = \frac{\pi\,(\theta_{3\mathrm{dB}} + 0.48^\circ)^{2}}{4 \times 0.4^\circ \times 0.25^\circ}
\]

11 m / 11 GHz: ≈ 3.5 min per equinox.

### 4.3 Other S.1525-1 facts useful for the dashboard

- Sun transits occur twice a year near the equinoxes; considering (a) says 3–9 days twice a year depending on antenna diameter. Annex 2 §1: 0–21 days before or after equinox depending on hemisphere.
- Effect is a **system noise-temperature increase**, not a fade. Outage iff degradation exceeds clear-sky margin.
- Quiet-Sun brightness (Annex 1): \(T = 120\,000 \times \gamma \times f\) with \(f\) in GHz and \(\gamma = 0.5\) for polarization; ~21 000 K at 4 GHz quiet, ~90 000 K at sunspot maximum. Telesat’s `SolarDiscTemperature()` is a different (flux-scaled) model.
- Example plots use **Tsys = 150 K** and Rec. ITU-R S.465 patterns at 11 GHz. Peak C/N degradation for a 10 m antenna can reach ~15 dB; a 0.6 m antenna is shallower but longer.
- Annex 2 peak-time method (equatorial coordinates + GAST) was checked at an operating earth station to **±15 s**.

Telesat C/N Mode is closer to Annex 1 (noise-temperature / C/N degradation, 1.5 dB threshold). Telesat FDS Angle Mode (1° / 5°) is **not** the S.1525 3 dB + 0.48° disk; it is a flight-dynamics cone. A geometric “owner-style” verdict that matches S.1525 should use \(\theta_{3\mathrm{dB}}+0.48^\circ\), not the 1°/5° FDS gates.

---

## 5. Implications for this repo

- Cite the Telesat calculator as the owner tool; it is public as of 2026-09-10. Mirror Shaw Direct’s field list if the SPA is down.
- Highlight Telesat birds in view of Macaé: **Telstar 19V (63°W)**, **Telstar 12V (15°W)**, **Telstar 11N (37.5°W)**, **Anik G1 (107.3°W, SA C/Ku)**. Do not treat Telstar 14R as an in-service 63°W Brazil beam in 2026.
- Pull Clarke-belt ephemeris from `GROUP=geo` (full belt) and, if operator-quality slots are needed, `FILE=telesat` / `FILE=intelsat` SupGP. Cache ≥ 2 h. Always send `FORMAT=json` (or `csv`).
- Filed / COB longitude: Telesat `FleetLong.csv` (west-positive) or the OMM shortcut \(\Omega+\omega+M-\theta_{\mathrm{GMST}}\). Both recover the Telstar SA/Atlantic slots to ~0.02°.
- Duration model: ITU-R S.1525-1 §3.5, \(\theta_{3\mathrm{dB}}=70\lambda/D\), solar optical diameter 0.48°, 0.4°/day, 0.25°/min.

### Sources

1. Telesat Tools SPA, <https://app.telesat.com/sun-transit-calculator> and `/static/lib/{util,sun,epoch,sfu,cnr,transit,shadow,look_angle}.js`, `/static/js/main.ba18d377.chunk.js` (2026-09-10).
2. Telesat `FleetLong.csv`, <https://app.telesat.com/data/FleetLong.csv> (2026-09-09 07:20:04 UTC).
3. Shaw Direct, “Your signal may be affected by sun transit”, <https://www.shawdirect.ca/english/support/article/8325/>.
4. Telesat, GEO Satellites, <https://www.telesat.com/geo-satellites/>.
5. Telesat brochures: Telstar 19 VANTAGE, Telstar 12 VANTAGE, Telstar 11N, Anik G1 (resources URLs above).
6. Telesat Corporation Form 20-F for the year ended 31 Dec 2024, <https://www.telesat.com/wp-content/uploads/2025/05/3-Telesat-Corporation_20-F.pdf>.
7. Telesat Q4 2025 earnings transcript, <https://www.telesat.com/wp-content/uploads/2026/03/Q4-2025-Earnings-Transcript.pdf> (T14R EOL).
8. CelesTrak GP formats, usage policy, SupGP queries, `GROUP=geo`, `GROUP=telesat`, `FILE=telesat` (URLs in §3).
9. CCSDS 502.0-B-3 Orbit Data Messages (OMM).
10. Recommendation ITU-R S.1525-1, <https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1525-1-200209-I!!PDF-E.pdf>.
