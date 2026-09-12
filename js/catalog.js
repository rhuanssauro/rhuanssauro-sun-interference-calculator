/**
 * GEO catalog: Celestrak OMM snapshot + optional live refresh.
 * Earth-fixed longitude = (RAAN + ArgP + M − GMST) at epoch.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.GeoCatalog = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var CELESTRAK_GEO =
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json";
  var CELESTRAK_INTELSAT =
    "https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=intelsat&FORMAT=json";
  var CELESTRAK_TELESAT =
    "https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=telesat&FORMAT=json";
  var LIVE_TTL_MS = 2 * 60 * 60 * 1000;

  var HIGHLIGHT_OPERATORS = {
    intelsat: true,
    hispasat: true,
    telesat: true
  };

  var CURATED = [
    {
      name: "HISPASAT 55W-2",
      lon: -55.5,
      operator: "hispasat",
      note: "Hispasat calculator slot at 55.5°W (capacity; Celestrak colocated with Intelsat 34).",
      calculator: true
    },
    {
      name: "HISPASAT 70W-1",
      lon: -70.0,
      operator: "hispasat",
      note: "Hispasat calculator slot at 70°W (Celestrak: Star One C4 neighbourhood).",
      calculator: true
    },
    {
      name: "HISPASAT 74W-1",
      lon: -74.0,
      operator: "hispasat",
      aliasOf: "AMAZONAS 4A",
      note: "Hispasat name for Amazonas 4A at 74°W.",
      calculator: true
    }
  ];

  function wrap180(deg) {
    return ((deg + 180) % 360 + 360) % 360 - 180;
  }

  function wrap360(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function parseEpoch(iso) {
    var s = String(iso);
    if (s.charAt(s.length - 1) !== "Z") s += "Z";
    return new Date(s);
  }

  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function gmstDeg(date) {
    var jd = julianDate(date);
    var T = (jd - 2451545.0) / 36525.0;
    var gmst =
      280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000;
    return wrap360(gmst);
  }

  function geoLongitudeFromOmm(omm) {
    var date = parseEpoch(omm.EPOCH);
    var theta = wrap360(
      Number(omm.RA_OF_ASC_NODE) +
        Number(omm.ARG_OF_PERICENTER) +
        Number(omm.MEAN_ANOMALY)
    );
    return wrap180(theta - gmstDeg(date));
  }

  function geoLatitudeApprox(omm) {
    var i = Number(omm.INCLINATION) * (Math.PI / 180);
    var u =
      (Number(omm.ARG_OF_PERICENTER) + Number(omm.MEAN_ANOMALY)) * (Math.PI / 180);
    return Math.asin(Math.sin(i) * Math.sin(u)) * (180 / Math.PI);
  }

  function tagOperator(name) {
    var u = String(name || "").toUpperCase();
    if (u.indexOf("HISPASAT") >= 0 || u.indexOf("AMAZONAS") >= 0) return "hispasat";
    if (u.indexOf("TELSTAR") >= 0 || u.indexOf("ANIK") >= 0 || u.indexOf("TELESAT") >= 0) {
      return "telesat";
    }
    if (
      u.indexOf("INTELSAT") >= 0 ||
      /\bIS-\d/.test(u) ||
      u.indexOf("GALAXY") >= 0 ||
      u.indexOf("HORIZONS") >= 0 ||
      /^NSS[-\s]/.test(u)
    ) {
      return "intelsat";
    }
    if (u.indexOf("STAR ONE") >= 0 || u.indexOf("SGDC") >= 0) return "embratel";
    if (u.indexOf("EUTELSAT") >= 0) return "eutelsat";
    if (u.indexOf("SES-") >= 0 || /^SES\s/.test(u) || u.indexOf("ASTRA") >= 0 || u.indexOf("AMC-") >= 0) {
      return "ses";
    }
    if (u.indexOf("SKYBRASIL") >= 0 || u.indexOf("DIRECTV") >= 0 || u.indexOf("ECHOSTAR") >= 0) {
      return "broadcast";
    }
    return "other";
  }

  function isDebris(name) {
    var u = String(name || "").toUpperCase();
    return /\bDEB\b/.test(u) || /\bR\/B\b/.test(u) || u.indexOf(" DEB") >= 0;
  }

  function isGeoMotion(omm) {
    var n = Number(omm.MEAN_MOTION);
    return n >= 0.98 && n <= 1.04;
  }

  function displayName(omm) {
    var n = omm.OBJECT_NAME;
    if (n === "AMAZONAS 4A") return "HISPASAT 74W-1 (Amazonas 4A)";
    return n;
  }

  function recordFromOmm(omm) {
    var name = omm.OBJECT_NAME;
    var op = tagOperator(name);
    var note;
    if (name === "AMAZONAS 2") {
      note =
        "Celestrak epoch ~72°W; Hispasat calculator still lists Amazonas 2 at 61°W.";
    }
    return {
      id: "norad-" + omm.NORAD_CAT_ID,
      norad: omm.NORAD_CAT_ID,
      objectId: omm.OBJECT_ID,
      name: name,
      displayName: displayName(omm),
      lon: geoLongitudeFromOmm(omm),
      lat: geoLatitudeApprox(omm),
      inclination: Number(omm.INCLINATION),
      meanMotion: Number(omm.MEAN_MOTION),
      epoch: omm.EPOCH,
      operator: op,
      highlightVendor: !!HIGHLIGHT_OPERATORS[op],
      debris: isDebris(name),
      source: "celestrak-geo",
      note: note
    };
  }

  function mergeCurated(sats) {
    var byName = {};
    var i;
    for (i = 0; i < sats.length; i++) byName[sats[i].name] = sats[i];
    for (i = 0; i < CURATED.length; i++) {
      var c = CURATED[i];
      if (c.aliasOf && byName[c.aliasOf]) {
        byName[c.aliasOf].aliases = (byName[c.aliasOf].aliases || []).concat([c.name]);
        byName[c.aliasOf].hispasatCalculator = true;
        continue;
      }
      var exists = false;
      var j;
      for (j = 0; j < sats.length; j++) {
        if (Math.abs(sats[j].lon - c.lon) < 0.4 && sats[j].operator === c.operator) {
          exists = true;
          sats[j].aliases = (sats[j].aliases || []).concat([c.name]);
          sats[j].hispasatCalculator = true;
          break;
        }
      }
      if (!exists) {
        sats.push({
          id: "curated-" + c.name.replace(/\s+/g, "-").toLowerCase(),
          norad: null,
          objectId: null,
          name: c.name,
          displayName: c.name,
          lon: c.lon,
          lat: 0,
          inclination: 0,
          meanMotion: 1.0027,
          epoch: null,
          operator: c.operator,
          highlightVendor: true,
          debris: false,
          source: "hispasat-calculator",
          note: c.note,
          hispasatCalculator: true
        });
      }
    }
    return sats;
  }

  function buildSnapshot(rawList, meta) {
    var sats = [];
    var i;
    for (i = 0; i < rawList.length; i++) {
      var omm = rawList[i];
      if (!isGeoMotion(omm)) continue;
      sats.push(recordFromOmm(omm));
    }
    sats = mergeCurated(sats);
    sats.sort(function (a, b) {
      return a.lon - b.lon;
    });
    return {
      fetchedAt: (meta && meta.fetchedAt) || new Date().toISOString(),
      source: {
        name: "Celestrak GP GROUP=geo",
        url: CELESTRAK_GEO,
        format: "OMM JSON",
        supplemental: [
          { name: "Intelsat SupGP", url: CELESTRAK_INTELSAT },
          { name: "Telesat SupGP", url: CELESTRAK_TELESAT }
        ]
      },
      method:
        "Earth-fixed GEO longitude = (RAAN + argument of perigee + mean anomaly − GMST) at OMM epoch. Sub-satellite latitude ≈ arcsin(sin i · sin(ω+M)).",
      count: sats.length,
      satellites: sats
    };
  }

  function inView(sat, lat, lon, minEl) {
    minEl = minEl == null ? 0 : minEl;
    if (typeof SunTransit === "undefined" || !SunTransit.lookAngles) {
      var dlon = Math.abs(wrap180(sat.lon - lon));
      return dlon < 75;
    }
    var look = SunTransit.lookAngles(lat, lon, sat.lon, sat.lat || 0);
    return look.elevation > minEl;
  }

  function filterForSite(snapshot, lat, lon, opts) {
    opts = opts || {};
    var hideDebris = opts.hideDebris !== false;
    var out = [];
    var list = snapshot.satellites || [];
    var i;
    for (i = 0; i < list.length; i++) {
      var s = list[i];
      if (hideDebris && s.debris) continue;
      if (!inView(s, lat, lon, opts.minEl == null ? 0 : opts.minEl)) continue;
      out.push(s);
    }
    return out;
  }

  function snapshotUrl() {
    return "data/geo-snapshot.json";
  }

  function canAttemptLive() {
    if (typeof location === "undefined") return true;
    return location.protocol !== "file:";
  }

  function fetchJson(url, timeoutMs) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer;
    var request = fetch(url, { cache: "no-cache", signal: controller ? controller.signal : undefined }).then(function (res) {
      if (!res.ok) throw new Error("Catalog HTTP " + res.status);
      return res.json();
    });
    var timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        reject(new Error("Catalog refresh timed out; the bundled snapshot is still available."));
        if (controller) controller.abort();
      }, timeoutMs || 8000);
    });
    return Promise.race([request, timeout]).finally(function () { clearTimeout(timer); });
  }

  function bundledSnapshot() {
    if (typeof window !== "undefined" && window.GEO_SNAPSHOT) return window.GEO_SNAPSHOT;
    if (typeof globalThis !== "undefined" && globalThis.GEO_SNAPSHOT) return globalThis.GEO_SNAPSHOT;
    return null;
  }

  function loadCatalog(opts) {
    opts = opts || {};
    var snapPath = opts.snapshotUrl || snapshotUrl();
    var bundled = bundledSnapshot();
    var start = bundled
      ? Promise.resolve(bundled)
      : fetchJson(snapPath);
    return start.then(function (snapshot) {
      var result = {
        catalog: snapshot,
        live: false,
        source: bundled ? "bundled-script" : "snapshot",
        error: null
      };
      if (!opts.attemptLive || !canAttemptLive()) return result;
      var cached = null;
      try {
        if (typeof sessionStorage !== "undefined") {
          var raw = sessionStorage.getItem("geo-live");
          if (raw) cached = JSON.parse(raw);
        }
      } catch (e) {
        cached = null;
      }
      if (cached && Date.now() - Date.parse(cached.fetchedAt) < LIVE_TTL_MS) {
        result.catalog = cached;
        result.live = true;
        result.source = "live-cache";
        return result;
      }
      return fetchJson(CELESTRAK_GEO, opts.timeoutMs)
        .then(function (raw) {
          if (!Array.isArray(raw) || !raw.length) throw new Error("The live catalog contained no satellites.");
          var live = buildSnapshot(raw, { fetchedAt: new Date().toISOString() });
          live.source.url = CELESTRAK_GEO;
          try {
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem("geo-live", JSON.stringify(live));
            }
          } catch (e2) {}
          return {
            catalog: live,
            live: true,
            source: "celestrak",
            error: null
          };
        })
        .catch(function (err) {
          result.error = String(err && err.message ? err.message : err);
          result.source = "snapshot-fallback";
          return result;
        });
    });
  }

  return {
    CELESTRAK_GEO: CELESTRAK_GEO,
    CELESTRAK_INTELSAT: CELESTRAK_INTELSAT,
    CELESTRAK_TELESAT: CELESTRAK_TELESAT,
    HIGHLIGHT_OPERATORS: HIGHLIGHT_OPERATORS,
    CURATED: CURATED,
    wrap180: wrap180,
    gmstDeg: gmstDeg,
    geoLongitudeFromOmm: geoLongitudeFromOmm,
    geoLatitudeApprox: geoLatitudeApprox,
    tagOperator: tagOperator,
    recordFromOmm: recordFromOmm,
    buildSnapshot: buildSnapshot,
    filterForSite: filterForSite,
    inView: inView,
    canAttemptLive: canAttemptLive,
    loadCatalog: loadCatalog,
    bundledSnapshot: bundledSnapshot
  };
});
