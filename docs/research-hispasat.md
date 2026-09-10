# Hispasat solar interference — official sources

Retrieved 10 September 2026 from live `www.hispasat.com` HTML. Primary sources only unless a caveat is marked.

Dashboard citation set (canonical):

- Calculator (EN, public): <https://www.hispasat.com/en/useful-information/solar-interference-calculator>
- Calculator (ES): <https://www.hispasat.com/es/informacion-util/calculadora-de-interferencia-solar>
- Calculator (clients / installers, same form): <https://www.hispasat.com/en/clientes-e-instaladores/calculator>
- Coverage map (EN, *Mapa de coberturas*): <https://www.hispasat.com/en/fleet-and-infrastructure/coverage-map>
- Coverage map (ES): <https://www.hispasat.com/es/flota-e-infraestructura/mapa-de-coberturas>
- Fleet hub: <https://www.hispasat.com/en/fleet-and-infrastructure>
- Satellite fleet (nav index; the slug itself lands on 30W-5): <https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet>

`https://hispasat.com/en/useful-information/solar-interference-calculator` (no `www`) serves the same calculator. Prefer the `www` URLs.

---

## 1. Solar interference calculator

The public EN page and the clients/installers page host the **same form**. Selecting a satellite writes its option `value` into **Orbital position (W)** (`#longitudSatelite`). The operator can override that field. Site can be a country/city pair or typed **Longitude (W)** / **Latitude (N)**. Azimuth and elevation are computed, read-only. **Calculate** fills a table of **Date forecast for interference**, **Start time (UTC/GMT)**, **End time (UTC/GMT)**, **Length**.

### Satellite dropdown (exact labels + option values)

HTML `<select id="satelite">`, live options in page order. `ºO` = degrees west (*oeste*). The option `value` is the west longitude stuffed into the orbital-position field.

| Order | Visible label (exact) | `value` (deg W) |
|------:|-----------------------|-----------------|
| 1 | HispaSat 30W-5 (30ºO) | `30` |
| 2 | HispaSat 30W-6 (30ºO) | `30` |
| 3 | HispaSat 36W-1 (36ºO) | `36` |
| 4 | HispaSat 55W-2 (55,5ºO) | `55.5` |
| 5 | Amazonas 2 (61ºO) | `61` |
| 6 | Amazonas 3 (61ºO) | `61` |
| 7 | Amazonas 5 (61ºO) | `61` |
| 8 | Amazonas Nexus (61ºO) | `61` |
| 9 | HispaSat 70W-1 (70ºO) | `70` |
| 10 | HispaSat 74W-1 (74ºO) | `74` |

Commented-out (not offered): `Hispasat 30W-4 (30ºO)` (`value="30"`) and `Hispasat 84W-2 (84ºO)` (`value="83.8"`).

Default on first load: first live option **HispaSat 30W-5**, orbital position `30`.

### Geometric-only note (quote this)

EN (public + clients/installers):

> This calculator generates estimates based exclusively on geometric angles, and does not consider parameters such as link RF margin, antenna un-pointing, performance.

ES:

> Esta calculadora genera estimativas basadas exclusivamente en ángulos geométricos, y no considera parámetros como margen de link RF, desapuntamiento de antena, performance.

Intro copy (EN): solar interference lasts “a few minutes”; the tool estimates periods when the signal “could potentially be diminished,” earth-station pointing, and when Hispasat satellites “may be affected.”

A Portuguese calculator is indexed at <https://www.hispasat.com/pt/informacao-uteis/calculadora-de-interferencia-solar> with the same geometric disclaimer (*ângulos geométricos* / *margem de link RF* / *desapontamento de antena*). A locale-less fetch of that slug 404s; do not treat the PT URL as a live dashboard cite until it resolves without a PT cookie.

---

## 2. Bands, antenna units, season, Brazil

Confirmed on the live EN form (identical radios on the clients/installers page and on the ES calculator).

| Control | Live options / units |
|---------|----------------------|
| Band (`name="banda"`) | **C** (`value="1"`), **Ku** (`value="2"`), **Ka** (`value="3"`). Three radios, no default selected in the HTML. |
| Season (`name="estacion"`) | **Spring - March** (`value="1"`), **Fall -  September** (`value="2"`; two spaces after the dash in EN). ES: **Primavera - Marzo** / **Otoño - Septiembre**. Two radios, no default selected. |
| Antenna size | Label **Antenna size (metros X.X)** (`#meters`). Metres, one decimal. ES: **Tamaño de la antena (metros X.X)**. |
| Year | **Year (xxxx)** (`#year`). Default in the live HTML: `2026`. |
| Country | **BRASIL** is a selectable country (`<option value="1">BRASIL</option>`). Spelled BRASIL, not BRAZIL. It is the first country in the data set (`value="1"`) but not the first alphabetically in the list. |

Brazil cities in the same city `<select>` include **RIO DE JANEIRO**, **BRASILIA**, **SAO PAULO**, **BELEM**, **MANAUS**, and many others. **MACAÉ / MACAE is not in the city list.** Use typed lat/lon for Macaé.

Coordinates: **Longitude (W)** and **Latitude (N)** — west-positive / north-positive, so Brazil is south latitude (negative N) and west longitude.

---

## 3. Official orbital positions (coverage map + fleet pages)

Coverage Map table, EN page <https://www.hispasat.com/en/fleet-and-infrastructure/coverage-map> (ES *Mapa de coberturas* is the same grid). This is the official slot list to put on the dashboard.

| Orbital position (official) | Satellite (official name) | Transponders (map) | Launch year (map) | Dedicated fleet page |
|-----------------------------|---------------------------|--------------------|-------------------|----------------------|
| 30º West | HispaSat 30W-5 | 53 Ku, Ka | 2010 | [hispasat-30w-5](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/hispasat-30w-5) |
| 30º West | HispaSat 30W-6 | 40 Ku, 7 Ka, 10 C | 2018 | [hispasat-30w-6](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/hispasat-30w-6) |
| 36º West | HispaSat 36W-1 | 20 Ku, Ka | 2017 | [hispasat-36w-1](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/hispasat-36w-1) |
| 55.5º West | HispaSat 55W-2 | *(blank)* | *(blank)* | **No** fleet page |
| 61º West | Amazonas 2 | 54 Ku, 10 C | 2009 | [amazonas-2](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/amazonas-2) |
| 61º West | Amazonas 3 | 33 Ku, 19 C, 9 Ka | 2013 | [amazonas-3](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/amazonas-3) |
| 61º West | Amazonas 5 | 24 Ku, 34 Ka | 2017 | [amazonas-5](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/amazonas-5) |
| 61º West | Amazonas Nexus | *(blank)* | 2023 | [amazonas-nexus](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/amazonas-nexus) |
| 70º West | HispaSat 70W-1 | *(blank)* | *(blank)* | **No** fleet page |
| 74º West | HispaSat 74W-1 | - | 2014 | [hispasat-74w-1](https://www.hispasat.com/en/fleet-and-infrastructure/satellite-fleet/hispasat-74w-1) |

The **Satellite fleet** submenu lists only the eight birds that have pages: 30W-5, 30W-6, 36W-1, Amazonas 2 / 3 / 5 / Nexus, 74W-1. **55W-2 and 70W-1 appear on the coverage map and in the sun-outage calculator but not in that submenu.**

### Names and slots from the fleet pages (official)

| Slot | Hispasat name | Also named on the same official page | Slot quote |
|------|---------------|--------------------------------------|------------|
| 30º W | HispaSat 30W-5 | HispaSat 1E | “30º West Europe and the entire American continent” |
| 30º W | HispaSat 30W-6 | HispaSat 1F | “located at 30º W”; Ku for Europe/N. Africa and the Americas (Americas beam “not including Brazil”), plus C and Ka |
| 36º W | HispaSat 36W-1 | HispaSat AG1 | “36º West” |
| 61º W | Amazonas 2 | — | “61º West The entire American continent (from Alaska to Tierra de Fuego)” |
| 61º W | Amazonas 3 | — | “61º West”; first Ka in Latin America |
| 61º W | Amazonas 5 | — | body text “located at 61°W”; Ku Brazil + rest of LatAm, 34 Ka spots |
| 61º W | Amazonas Nexus | — | “in orbit at 61º West”; launched 7 February 2023 (Falcon 9); Ku over the Americas + Atlantic corridors + Greenland, Ka gateways |
| 74º W | HispaSat 74W-1 | photo still labelled Amazonas 4A | “74º West, South America”; launched 22 March 2014 |

### Official press on 55.5º W, 61º W Amazonas, 70º W, 74º W

- **61º W is the Amazonas neighbourhood.** 2016 designation release: satellites at 61º West **keep the name Amazonas**. Amazonas 4A was shortened to Amazonas 4, then moved. <https://www.hispasat.com/en/press-room/press-releases/archivo-2016/205/hispasat-renews-designations-of-its-satellite-fleet>
- **55.5º W / HispaSat 55W-2.** Same 2016 release: *Intelsat 34 → HispaSat 55W-2 (Intelsat 34)*, abbreviation H55W-2. 2014 release: Hispasat procured Brazilian-focused Ku on Intelsat 34 at **55.5ºW**. <https://www.hispasat.com/en/press-room/press-releases/archivo-2014/160/hispasat-and-intelsat-extend--collaboration-at-555-west>
- **70º W / HispaSat 70W-1.** Coverage map + calculator. 19 March 2019 release refers to “capacity from its **HispaSat 70W-1** satellite.” No transponder count, launch year, or fleet page on hispasat.com. <https://www.hispasat.com/en/press-room/press-releases/archivo-2019/359/hispasat-and-bansat-bring-the-internet-to-the-colombian-region-of-montes-de-maria-thanks-to-wifi-via-satellite>
- **74º W / HispaSat 74W-1.** 21 December 2017: Amazonas 4 transferred from 61º W to 74º W and renamed **HispaSat 74W-1 (H74W-1)** after HISPAMAR obtained Ku rights. <https://www.hispasat.com/en/press-room/press-releases/archivo-2017/302/hispasat-begins-to-provide-telecommunications-services-from-74-west>

Naming rule (2016, official): `{HispaSat}{slotW}-{arrival order}` except Amazonas at 61º W. Hosted capacity on another operator is written `HispaSat {slot} ({host})` when the host allows it.

---

## 4. Dashboard copy

**Owner tool:** Hispasat Solar interference calculator  
**Cite:** <https://www.hispasat.com/en/useful-information/solar-interference-calculator>  
**Fleet / slots:** <https://www.hispasat.com/en/fleet-and-infrastructure/coverage-map>

**Verdict language to match:** geometric estimate only. Do not imply RF-margin or pointing-error outage. Quote:

> estimates based exclusively on geometric angles, and does not consider parameters such as link RF margin, antenna un-pointing, performance.

**Highlighted Hispasat birds (calculator + coverage map):** 30W-5, 30W-6, 36W-1, 55W-2, Amazonas 2, Amazonas 3, Amazonas 5, Amazonas Nexus, 70W-1, 74W-1.

**Co-located slots (same geometry, several names):** 30º W (two), 61º W (four Amazonas). 55.5º W and 70º W are single Hispasat labels.

**Brazil:** country **BRASIL** is selectable; Macaé is not a listed city — use lat/lon. Antenna diameter is **metres**.

---

## 5. Caveats for the checker

- All four Amazonas names at 61º W share one calculator longitude (`61`). Sun-outage geometry is the slot, not the payload.
- 30W-5 and 30W-6 share `30`.
- 55W-2 is Hispasat-branded capacity on **Intelsat 34** (Hispasat’s own 2016 wording). Same 55.5º W slot as the Intelsat bird.
- 70W-1 is an official Hispasat label at 70º W with no fleet datasheet on hispasat.com. Do not print a host-satellite name from third-party directories as if Hispasat published it.
- 84º W is retired in the calculator HTML (`Hispasat 84W-2` commented out). 30W-4 is likewise commented out.
- Band and season radios have no HTML `checked`; the operator must pick both before a comparable run.
- Output clock is **UTC/GMT**, not local Brazil time.
