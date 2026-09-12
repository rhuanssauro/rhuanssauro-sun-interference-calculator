# Product

## Register

product

## Users

Teleport NOC operators, field VSAT engineers and people learning how satellite links are affected by the Sun. They need an understandable estimate for a receiving station, satellite and dish, with UTC windows and clear limits. Default example: Macaé, Rio de Janeiro, Brazil. Support both hemispheres and equatorial sites.

## Product Purpose

A file-openable HTML dashboard that predicts GSO Sun Interference (sun-transit / sun outage) for every Clarke-belt satellite in view of a remote earth station. Default site is Macaé. Intelsat, Hispasat, and Telesat birds that serve South America are highlighted in the full in-view set. The operator picks a satellite from the select (favorites first: Intelsat 37e C/Ku, Telesat T-19, Hispasat H36W, Intelsat 10-02), enters site, antenna diameter, receive frequency, and carrier size, and gets an owner-style geometric verdict. Branding: Rhuanssauro Tech Inc.

Success: a filled page that works on `file://`, cites official owner calculators, and never blanks while waiting for live ephemeris.

The status strip carries a live **UTC now** clock. A separate **Last check** stamp in the result records when the geometry was evaluated. The current prediction exports client-side as CSV, a standalone branded HTML report, or PDF via the browser print dialog on that report: parameters, verdict, geometric windows, and an angles-only disclaimer. A Dark / Light / System theme control persists per browser; dark remains the brand default, light is paper/ink (not cream) with the same amber/cyan.

## Brand Personality

Night-shift teleport. Precise, calm, slightly burnt. Three words: **orbital, amber, terse**.

Voice: task and evidence first. Short professional sentences, explicit units and UTC. Explain unfamiliar terms near the relevant control. No sales claims or invented certainty. Curated professional voice sources informed `.agents/VOICE.md`; no private correspondence ships.

## Anti-references

- Cream / sand / beige SaaS dashboards (Linear-clone, Notion-clone, “AI analytics”)
- Hero-metric cards (big number + tiny label + gradient)
- Identical icon+heading card grids
- Gradient text, glassmorphism, side-stripe callouts
- Cartoon sun / sketchy dish illustrations
- Light “warm paper” bodies with navy-and-gold “satellite” chrome

## Design Principles

- The task is the product: checker first, briefing second.
- Official attribution is visible, not a footer afterthought.
- Highlighted vendors (Intelsat, Hispasat, Telesat) must read as tagged rows in a full belt, not as the only satellites that exist.
- Preserve the underlying status categories while distinguishing a daily predicted window from current alignment. Never imply a confirmed circuit outage.
- Content is visible with motion off. Motion only reports state.

## Accessibility & Inclusion

WCAG 2.2 AA. Body text ≥ 7:1 on the surface. Status is never color-only (text + shape). `prefers-reduced-motion` disables motion. Native buttons, selects and disclosures are keyboard-operable; catalog chips preserve focus and form labels are associated. Default language English with Portuguese place names (Macaé) untranslated.

## Orbital workspace acceptance

Calculator precedes the full satellite catalog. Native disclosures keep RF detail and education available without interrupting the primary task. Hemisphere selection is Auto/Northern/Southern; signed latitude remains authoritative. Contradictions block calculation, never flip coordinates. Any edited or invalid input invalidates exports until recalculation. Presets and successful lookup reset hemisphere to Auto.

Original static assets use the requested ChatGPT Pro Images interface, Higgsfield and Blender. Captions distinguish illustrations from live site data or scale geometry. No new browser libraries or continuous decorative animation. First-party initial resources <=650 KB; each new image <=150 KB. The full plan and phase evidence are local in `.agents/` and summarized in STATE.md.
