/**
 * Dashboard UI: satellite select, RF fields, official citations.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SunDashboard = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var FAVORITES = [
    { key: "is37e-c", name: "INTELSAT 37E (IS-37E)", label: "Intelsat 37e (C-Band)", band: "C" },
    { key: "is37e-ku", name: "INTELSAT 37E (IS-37E)", label: "Intelsat 37e (Ku-Band)", band: "Ku" },
    { key: "t19", name: "TELSTAR 19V", label: "Telesat T-19 (Telstar 19V)" },
    { key: "h36w", name: "HISPASAT 36W-1", label: "Hispasat H36W" },
    { key: "is1002", name: "INTELSAT 10-02", label: "Intelsat 10-02" }
  ];

  var state = {
    catalog: null,
    loadMeta: null,
    site: {
      name: "Macaé, Rio de Janeiro, Brazil",
      lat: -22.37,
      lon: -41.79
    },
    diameterM: 2.4,
    band: "C",
    outboundGHz: null,
    inboundGHz: null,
    carrierHz: null,
    satellite: null,
    favoriteKey: FAVORITES[0].key,
    inView: [],
    result: null
  };

  var PRESETS = [
    { name: "Macaé, RJ", lat: -22.37, lon: -41.79 },
    { name: "Rio de Janeiro", lat: -22.9068, lon: -43.1729 },
    { name: "São Paulo", lat: -23.5505, lon: -46.6333 },
    { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
    { name: "Bogotá", lat: 4.711, lon: -74.0721 },
    { name: "Santiago", lat: -33.4489, lon: -70.6693 }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function fmtLon(lon) {
    var a = Math.abs(lon).toFixed(1);
    return a + "°" + (lon < 0 ? "W" : lon > 0 ? "E" : "");
  }

  function fmtEl(el) {
    return el.toFixed(1) + "°";
  }

  function operatorLabel(op) {
    if (op === "intelsat") return "Intelsat";
    if (op === "hispasat") return "Hispasat";
    if (op === "telesat") return "Telesat";
    return op;
  }

  function allSats() {
    return (state.catalog && state.catalog.satellites) || state.inView || [];
  }

  function findSatByName(name) {
    var list = allSats();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].name === name) return list[i];
    }
    return null;
  }

  function findSatById(id) {
    var list = allSats();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function favoriteFor(sat, band) {
    var i;
    for (i = 0; i < FAVORITES.length; i++) {
      var f = FAVORITES[i];
      if (f.name === sat.name && (!f.band || f.band === band)) return f;
    }
    return null;
  }

  function defaultSatellite(list) {
    var i;
    for (i = 0; i < FAVORITES.length; i++) {
      var hit = findSatByName(FAVORITES[i].name);
      if (hit) return hit;
    }
    var highlighted = (list || []).filter(function (s) {
      return s.highlightVendor;
    });
    return highlighted[0] || (list && list[0]) || null;
  }

  function makeChip(sat) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "sat-chip" +
      (sat.highlightVendor ? " sat-chip--vendor sat-chip--" + sat.operator : "") +
      (state.satellite && state.satellite.id === sat.id ? " is-selected" : "");
    btn.dataset.id = sat.id;
    var look =
      typeof SunTransit !== "undefined"
        ? SunTransit.lookAngles(state.site.lat, state.site.lon, sat.lon, sat.lat || 0)
        : { elevation: 0 };
    btn.innerHTML =
      '<span class="sat-chip__name">' +
      escapeHtml(sat.displayName) +
      "</span>" +
      '<span class="sat-chip__meta">' +
      fmtLon(sat.lon) +
      " · el " +
      fmtEl(look.elevation) +
      (sat.highlightVendor ? " · " + operatorLabel(sat.operator) : "") +
      "</span>";
    btn.addEventListener("click", function () {
      var fav = favoriteFor(sat, state.band);
      applySelection(sat, fav ? fav.key : sat.id, fav && fav.band);
    });
    return btn;
  }

  function renderBelt() {
    var host = $("belt-track");
    var rail = $("vendor-rail");
    var count = $("belt-count");
    if (!host) return;
    host.innerHTML = "";
    if (rail) rail.innerHTML = "";
    var list = state.inView.slice().sort(function (a, b) {
      return a.lon - b.lon;
    });
    var vendors = list.filter(function (s) {
      return s.highlightVendor;
    });
    vendors.sort(function (a, b) {
      var ea = SunTransit.lookAngles(state.site.lat, state.site.lon, a.lon, a.lat || 0).elevation;
      var eb = SunTransit.lookAngles(state.site.lat, state.site.lon, b.lon, b.lat || 0).elevation;
      return eb - ea;
    });
    if (count) {
      count.textContent =
        list.length +
        " in view from " +
        state.site.name.split(",")[0] +
        " · " +
        vendors.length +
        " Intelsat / Hispasat / Telesat";
    }
    vendors.forEach(function (sat) {
      if (rail) rail.appendChild(makeChip(sat));
    });
    list.forEach(function (sat) {
      host.appendChild(makeChip(sat));
    });
    [host, rail].forEach(function (el) {
      if (!el) return;
      var selected = el.querySelector(".is-selected");
      if (selected && selected.scrollIntoView) {
        selected.scrollIntoView({ inline: "center", block: "nearest" });
      }
    });
  }

  function fillSatSelect() {
    var sel = $("sat-select");
    if (!sel) return;
    var seen = {};
    var html = '<optgroup label="Favorites">';
    FAVORITES.forEach(function (f) {
      var sat = findSatByName(f.name);
      if (!sat) return;
      seen[sat.name] = true;
      html +=
        '<option value="' +
        escapeHtml(f.key) +
        '"' +
        (state.favoriteKey === f.key ? " selected" : "") +
        ">" +
        escapeHtml(f.label) +
        "</option>";
    });
    html += '</optgroup><optgroup label="In view">';
    state.inView
      .slice()
      .sort(function (a, b) {
        return a.lon - b.lon;
      })
      .forEach(function (sat) {
        if (seen[sat.name]) return;
        html +=
          '<option value="' +
          escapeHtml(sat.id) +
          '"' +
          (state.satellite && state.satellite.id === sat.id && !seen[sat.name] && state.favoriteKey === sat.id
            ? " selected"
            : "") +
          ">" +
          escapeHtml(sat.displayName) +
          " · " +
          fmtLon(sat.lon) +
          "</option>";
      });
    html += "</optgroup>";
    sel.innerHTML = html;
    if (state.favoriteKey) sel.value = state.favoriteKey;
  }

  function resolveSelectValue(value) {
    var i;
    for (i = 0; i < FAVORITES.length; i++) {
      if (FAVORITES[i].key === value) {
        return { sat: findSatByName(FAVORITES[i].name), key: value, band: FAVORITES[i].band };
      }
    }
    return { sat: findSatById(value), key: value, band: null };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applySelection(sat, key, band) {
    state.satellite = sat;
    state.favoriteKey = key || (sat && sat.id);
    if (band && $("band")) {
      $("band").value = band;
      state.band = band;
    }
    var nameEl = $("drop-sat-name");
    var metaEl = $("drop-sat-meta");
    var zone = $("drop-zone");
    if (nameEl) nameEl.textContent = sat ? sat.displayName : "Select a satellite";
    if (metaEl) {
      metaEl.textContent = sat
        ? fmtLon(sat.lon) +
          " · " +
          operatorLabel(sat.operator) +
          (sat.note ? " · " + sat.note : "")
        : "Choose a favorite or any in-view bird.";
    }
    if (zone) zone.classList.toggle("has-sat", !!sat);
    var sel = $("sat-select");
    if (sel && state.favoriteKey) sel.value = state.favoriteKey;
    renderBelt();
    runCheck();
  }

  function selectSatellite(sat) {
    var fav = sat ? favoriteFor(sat, state.band) : null;
    applySelection(sat, fav ? fav.key : sat && sat.id, fav && fav.band);
  }

  function readForm() {
    var lat = parseFloat($("site-lat") && $("site-lat").value);
    var lon = parseFloat($("site-lon") && $("site-lon").value);
    var d = parseFloat($("ant-d") && $("ant-d").value);
    var band = ($("band") && $("band").value) || "C";
    var name = ($("site-name") && $("site-name").value) || state.site.name;
    if (!isFinite(lat) || !isFinite(lon)) {
      throw new Error("Latitude and longitude must be numbers.");
    }
    if (!(d > 0)) throw new Error("Antenna diameter must be greater than 0 m.");
    state.site = { name: name, lat: lat, lon: lon };
    state.diameterM = d;
    state.band = band;
    state.outboundGHz = SunTransit.parseToGHz($("freq-out") && $("freq-out").value);
    state.inboundGHz = SunTransit.parseToGHz($("freq-in") && $("freq-in").value);
    state.carrierHz = SunTransit.parseCarrierHz($("carrier") && $("carrier").value);
  }

  function refreshInView() {
    if (!state.catalog) return;
    state.inView = GeoCatalog.filterForSite(state.catalog, state.site.lat, state.site.lon, {
      hideDebris: true,
      minEl: 0
    });
    fillSatSelect();
    renderBelt();
  }

  function runCheck() {
    var verdictEl = $("verdict");
    var detailEl = $("verdict-detail");
    var tableEl = $("window-table");
    try {
      readForm();
    } catch (err) {
      state.result = null;
      if (verdictEl) {
        verdictEl.textContent = "Cannot check: " + err.message;
        verdictEl.dataset.status = "error";
      }
      return;
    }
    refreshInView();
    if (!state.satellite) {
      if (verdictEl) {
        verdictEl.textContent = "Select a satellite from the list.";
        verdictEl.dataset.status = "empty";
      }
      if (detailEl) detailEl.textContent = "";
      return;
    }
    var freq = state.outboundGHz != null ? state.outboundGHz : state.band;
    var r = SunTransit.checkInterference({
      lat: state.site.lat,
      lon: state.site.lon,
      satLon: state.satellite.lon,
      satLat: state.satellite.lat || 0,
      diameterM: state.diameterM,
      bandOrGhz: freq,
      now: new Date()
    });
    state.result = r;
    if (verdictEl) {
      verdictEl.textContent = r.verdict;
      verdictEl.dataset.status = r.status;
    }
    if (detailEl) {
      detailEl.innerHTML =
        "<dl class='facts'>" +
        "<div><dt>Look</dt><dd>az " +
        r.look.azimuth.toFixed(1) +
        "° · el " +
        r.look.elevation.toFixed(1) +
        "°</dd></div>" +
        "<div><dt>3 dB beamwidth</dt><dd>" +
        r.beamwidthDeg.toFixed(2) +
        "°</dd></div>" +
        "<div><dt>Outage radius</dt><dd>" +
        r.outageRadiusDeg.toFixed(2) +
        "° (½ beam + 0.25° solar radius)</dd></div>" +
        "<div><dt>Sun now</dt><dd>az " +
        r.sun.azimuth.toFixed(1) +
        "° · el " +
        r.sun.elevation.toFixed(1) +
        "° · sep " +
        (r.nowGeometry.separationDeg != null ? r.nowGeometry.separationDeg.toFixed(2) + "°" : "—") +
        "</dd></div>" +
        "<div><dt>Band / RX</dt><dd>" +
        state.band +
        " · check freq " +
        r.bandGHz.toFixed(4) +
        " GHz · dish " +
        state.diameterM.toFixed(2) +
        " m</dd></div>" +
        "<div><dt>Outbound (RX)</dt><dd>" +
        SunTransit.formatRfGHz(state.outboundGHz) +
        "</dd></div>" +
        "<div><dt>Inbound (TX)</dt><dd>" +
        SunTransit.formatRfGHz(state.inboundGHz) +
        "</dd></div>" +
        "<div><dt>Carrier</dt><dd>" +
        SunTransit.formatCarrier(state.carrierHz) +
        "</dd></div>" +
        "<div><dt>Central-transit max</dt><dd>" +
        r.centralDurationMin.toFixed(1) +
        " min (ITU-style " +
        r.ituMaxDurationMin.toFixed(1) +
        " min)</dd></div>" +
        "</dl>" +
        "<p class='notes'>" +
        r.notes.map(escapeHtml).join(" ") +
        " Carrier size is recorded for the circuit; the geometric window does not use symbol rate.</p>";
    }
    if (tableEl) {
      var rows = r.nearbyWindows || [];
      if (!rows.length) {
        tableEl.innerHTML = "<p class='muted'>No additional geometric windows in the scanned equinox neighbourhood.</p>";
      } else {
        tableEl.innerHTML =
          "<table class='windows'><caption>Nearby geometric windows (UTC)</caption><thead><tr><th>Date</th><th>Start</th><th>End</th><th>Duration</th></tr></thead><tbody>" +
          rows
            .map(function (w) {
              return (
                "<tr><td>" +
                escapeHtml(w.date) +
                "</td><td>" +
                escapeHtml((w.startUtc || "").slice(11, 19)) +
                "Z</td><td>" +
                escapeHtml((w.endUtc || "").slice(11, 19)) +
                "Z</td><td>" +
                w.durationMin.toFixed(1) +
                " min</td></tr>"
              );
            })
            .join("") +
          "</tbody></table>";
      }
    }
    var clock = $("utc-clock");
    if (clock) clock.textContent = r.nowUtc.replace("T", " ").replace(".000Z", "Z");
  }

  function bindForm() {
    ["site-lat", "site-lon", "ant-d", "band", "site-name", "freq-out", "freq-in", "carrier"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("change", function () {
        try {
          readForm();
          refreshInView();
          runCheck();
        } catch (e) {
          runCheck();
        }
      });
    });
    var satSel = $("sat-select");
    if (satSel) {
      satSel.addEventListener("change", function () {
        var resolved = resolveSelectValue(satSel.value);
        if (resolved.sat) applySelection(resolved.sat, resolved.key, resolved.band);
      });
    }
    var preset = $("site-preset");
    if (preset) {
      preset.addEventListener("change", function () {
        var i = parseInt(preset.value, 10);
        if (!isFinite(i) || !PRESETS[i]) return;
        var p = PRESETS[i];
        $("site-name").value = p.name;
        $("site-lat").value = String(p.lat);
        $("site-lon").value = String(p.lon);
        try {
          readForm();
        } catch (e) {}
        refreshInView();
        runCheck();
      });
    }
    var check = $("run-check");
    if (check) check.addEventListener("click", runCheck);
  }

  function fillPresets() {
    var sel = $("site-preset");
    if (!sel) return;
    sel.innerHTML = PRESETS.map(function (p, i) {
      return "<option value='" + i + "'" + (i === 0 ? " selected" : "") + ">" + escapeHtml(p.name) + "</option>";
    }).join("");
  }

  function renderCatalogMeta() {
    var el = $("catalog-meta");
    if (!el || !state.catalog) return;
    var src = state.loadMeta && state.loadMeta.source ? state.loadMeta.source : "snapshot";
    var live = state.loadMeta && state.loadMeta.live;
    el.textContent =
      "Catalog " +
      state.catalog.fetchedAt +
      " · " +
      state.catalog.count +
      " GEO · " +
      src +
      (live ? " (live Celestrak)" : " (bundled snapshot)") +
      (state.loadMeta && state.loadMeta.error ? " · live refresh failed: " + state.loadMeta.error : "");
  }

  function dumpSources() {
    var el = $("source-block");
    if (!el) return;
    el.setAttribute("data-sources", "official");
  }

  function init() {
    if (typeof document === "undefined") return state;
    fillPresets();
    bindForm();
    dumpSources();
    if ($("site-lat")) $("site-lat").value = String(state.site.lat);
    if ($("site-lon")) $("site-lon").value = String(state.site.lon);
    if ($("ant-d")) $("ant-d").value = String(state.diameterM);
    if ($("site-name")) $("site-name").value = state.site.name;
    if ($("band")) $("band").value = state.band;

    var attemptLive = typeof GeoCatalog !== "undefined" && GeoCatalog.canAttemptLive();
    var loader =
      typeof GeoCatalog !== "undefined"
        ? GeoCatalog.loadCatalog({ attemptLive: attemptLive })
        : Promise.reject(new Error("catalog module missing"));

    return loader
      .then(function (meta) {
        state.catalog = meta.catalog;
        state.loadMeta = meta;
        renderCatalogMeta();
        refreshInView();
        var first = FAVORITES[0];
        var sat = findSatByName(first.name) || defaultSatellite(state.inView);
        applySelection(sat, first.key, first.band);
        return state;
      })
      .catch(function (err) {
        var v = $("verdict");
        if (v) {
          v.textContent = "Catalog failed to load: " + err.message;
          v.dataset.status = "error";
        }
        throw err;
      });
  }

  return {
    init: init,
    state: state,
    selectSatellite: selectSatellite,
    runCheck: runCheck,
    PRESETS: PRESETS,
    FAVORITES: FAVORITES,
    defaultSatellite: defaultSatellite
  };
});
