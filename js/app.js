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
    frequencyGHz: null,
    carrierHz: null,
    satellite: null,
    favoriteKey: FAVORITES[0].key,
    inView: [],
    result: null,
    weather: null
  };

  var wxAbort = null;
  var lastPinKey = "";
  var beltCatalog = null;
  var beltSiteKey = "";
  var pendingCatalog = null;
  var lookupAbort = null;
  var stationRevision = 0;
  var weatherRevision = 0;
  var FORM_FIELDS = ["site-lat", "site-lon", "ant-d", "band", "site-name", "freq", "carrier", "hemisphere"];

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
    btn.setAttribute("aria-pressed", String(!!state.satellite && state.satellite.id === sat.id));
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
    var siteKey = pinKey(state.site) + ":" + state.site.name;
    if (beltCatalog === state.catalog && beltSiteKey === siteKey) {
      [host, rail].forEach(function (el) {
        if (!el) return;
        Array.prototype.forEach.call(el.querySelectorAll(".sat-chip"), function (chip) {
          var selected = !!state.satellite && chip.dataset.id === state.satellite.id;
          chip.classList.toggle("is-selected", selected);
          chip.setAttribute("aria-pressed", String(selected));
        });
      });
      return;
    }
    var focused = document.activeElement;
    var focusHost = focused && (host.contains(focused) ? host : rail && rail.contains(focused) ? rail : null);
    var focusId = focusHost && focused.dataset.id;
    beltCatalog = state.catalog;
    beltSiteKey = siteKey;
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
    if (focusHost && focusId) {
      Array.prototype.some.call(focusHost.querySelectorAll(".sat-chip"), function (chip) {
        if (chip.dataset.id !== focusId) return false;
        chip.focus({ preventScroll: true });
        return true;
      });
    }
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
    if (state.satellite && !seen[state.satellite.name] && !state.inView.some(function (s) { return s.id === state.satellite.id; })) {
      html += '<optgroup label="Selected, below horizon"><option value="' + escapeHtml(state.satellite.id) + '">' +
        escapeHtml(state.satellite.displayName) + " · " + fmtLon(state.satellite.lon) + "</option></optgroup>";
    }
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
    renderSelection();
    renderBelt();
    runCheck();
  }

  function renderSelection() {
    var sat = state.satellite;
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
        : "Choose a favorite or any satellite in view.";
    }
    if (zone) zone.classList.toggle("has-sat", !!sat);
    var sel = $("sat-select");
    if (sel && state.favoriteKey) sel.value = state.favoriteKey;
  }

  function selectSatellite(sat) {
    var fav = sat ? favoriteFor(sat, state.band) : null;
    applySelection(sat, fav ? fav.key : sat && sat.id, fav && fav.band);
  }

  function fieldError(id, message) {
    var error = new Error(message);
    error.field = id;
    throw error;
  }

  function numberField(id, label, optional) {
    var raw = $(id) ? $(id).value.trim() : "";
    if (optional && !raw) return null;
    var n = Number(raw);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) || !isFinite(n)) {
      fieldError(id, label + " must be a finite number.");
    }
    return n;
  }

  function clearFormError() {
    if ($("form-error")) $("form-error").textContent = "";
    FORM_FIELDS.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.removeAttribute("aria-invalid");
      var ids = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (item) { return item && item !== "form-error"; });
      if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
      else el.removeAttribute("aria-describedby");
    });
  }

  function showFormError(err) {
    if ($("form-error")) $("form-error").textContent = err.message;
    var el = $(err.field);
    if (el) {
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", ((el.getAttribute("aria-describedby") || "") + " form-error").trim());
    }
  }

  function invalidateResult(message) {
    state.result = null;
    setExportEnabled(false);
    ["verdict-detail", "window-table", "result-summary"].forEach(function (id) {
      if ($(id)) $(id).innerHTML = "";
    });
    if ($("verdict")) {
      $("verdict").textContent = message || "Inputs changed. Calculate to update the estimate.";
      $("verdict").dataset.status = "empty";
    }
  }

  function readForm(commit) {
    clearFormError();
    if ($("hemisphere-status")) $("hemisphere-status").textContent = "Enter a valid latitude to identify the hemisphere.";
    var lat = numberField("site-lat", "Latitude");
    var lon = numberField("site-lon", "Longitude");
    var d = numberField("ant-d", "Antenna diameter");
    if (lat < -90 || lat > 90) fieldError("site-lat", "Latitude must be between -90 and 90 degrees.");
    if (lon < -180 || lon > 180) fieldError("site-lon", "Longitude must be between -180 and 180 degrees.");
    if (!(d > 0)) fieldError("ant-d", "Antenna diameter must be greater than 0 m.");
    var hemisphere = $("hemisphere") ? $("hemisphere").value : "auto";
    var actual = lat > 0 ? "Northern hemisphere" : lat < 0 ? "Southern hemisphere" : "Equator";
    if ($("hemisphere-status")) $("hemisphere-status").textContent = actual + " from latitude " + lat + "°.";
    if (hemisphere === "north" && !(lat > 0)) fieldError("hemisphere", "Northern hemisphere requires a positive latitude. Choose Auto or correct the latitude.");
    if (hemisphere === "south" && !(lat < 0)) fieldError("hemisphere", "Southern hemisphere requires a negative latitude. Choose Auto or correct the latitude.");
    var frequency = numberField("freq", "Receive frequency", true);
    var carrier = numberField("carrier", "Carrier size", true);
    if (frequency != null && !(frequency > 0)) fieldError("freq", "Receive frequency must be greater than zero, or left blank for the band default.");
    if (carrier != null && !(carrier > 0)) fieldError("carrier", "Carrier size must be greater than zero, or left blank.");
    var band = ($("band") && $("band").value) || "C";
    if (!SunTransit.BAND_GHZ[band]) fieldError("band", "Choose C, Ku or Ka band.");
    if (commit === false) return;
    var name = ($("site-name") && $("site-name").value.trim()) || "Ground station";
    state.site = { name: name, lat: lat, lon: lon };
    state.diameterM = d;
    state.band = band;
    state.frequencyGHz = SunTransit.parseToGHz(frequency);
    state.carrierHz = SunTransit.parseCarrierHz(carrier);
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
    cancelLookup();
    var verdictEl = $("verdict");
    var detailEl = $("verdict-detail");
    var tableEl = $("window-table");
    try {
      readForm();
    } catch (err) {
      invalidateResult("Check the highlighted input.");
      showFormError(err);
      if (verdictEl) {
        verdictEl.dataset.status = "error";
      }
      return;
    }
    if (pendingCatalog) {
      var updated = state.satellite && pendingCatalog.catalog.satellites.filter(function (sat) { return sat.id === state.satellite.id; })[0];
      if (!state.satellite || updated) {
        state.catalog = pendingCatalog.catalog;
        state.loadMeta = pendingCatalog;
        if (updated) state.satellite = updated;
        renderCatalogMeta();
      } else {
        renderCatalogMeta();
        if ($("catalog-meta")) $("catalog-meta").textContent += " · selected satellite absent from refresh; keeping this snapshot";
      }
      pendingCatalog = null;
    }
    renderSelection();
    refreshInView();
    if (!state.satellite) {
      updatePlace();
      invalidateResult("Select a satellite from the list.");
      return;
    }
    var freq = state.frequencyGHz != null ? state.frequencyGHz : state.band;
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
      verdictEl.textContent = {
        impacted: "Estimated interference window today",
        "not-impacted": "No estimated window today",
        "not-in-view": "Satellite below the local horizon",
        "out-of-season": "Outside the usual equinox season"
      }[r.status];
      verdictEl.dataset.status = r.status;
    }
    if ($("result-summary")) {
      var today = r.today;
      var windowText = today.impacted
        ? today.windows.map(function (window) {
          return window.startUtc.slice(11, 19) + "–" + window.endUtc.slice(11, 19) + " UTC · " + window.durationMin.toFixed(1) + " min";
        }).join("; ")
        : r.status === "not-in-view" ? "This satellite cannot be received from these coordinates." : "No geometric window predicted for this UTC day.";
      $("result-summary").innerHTML = "<p class='result-date'>" + escapeHtml(r.nowUtc.slice(0, 10)) +
        " · UTC day</p><p class='result-window'>" + escapeHtml(windowText) +
        "</p><p>At the last check: " + (r.status === "not-in-view" ? "satellite not in view." : r.nowGeometry.impacted ? "Sun inside the modeled receive beam." : "Sun outside the modeled receive beam.") +
        "</p><p class='notes'>Windows are limited to this UTC day. Geometric estimate, not a confirmed circuit outage. Check the operator's calculator before scheduling work.</p>";
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
        "<div><dt>Interference radius</dt><dd>" +
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
        " · " +
        r.bandGHz.toFixed(4) +
        " GHz · dish " +
        state.diameterM.toFixed(2) +
        " m</dd></div>" +
        "<div><dt>Frequency</dt><dd>" +
        SunTransit.formatRfGHz(state.frequencyGHz) +
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
    updatePlace();
    if (tableEl) {
      var rows = r.nearbyWindows || [];
      if (!rows.length) {
        tableEl.innerHTML = "<p class='muted'>No additional geometric windows in the scanned equinox period.</p>";
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
    // Geometry is evaluated at the instant the check runs (live "now"),
    // stamped here; the header #utc-clock is a separate live ticker.
    var lastCheck = $("last-check");
    if (lastCheck) {
      lastCheck.textContent =
        "Last check " +
        (typeof UtcClock !== "undefined"
          ? UtcClock.formatUtcSeconds(r.nowUtc)
          : r.nowUtc.replace("T", " "));
    }
    setExportEnabled(true);
  }

  function setExportEnabled(on) {
    ["export-csv", "export-html", "export-pdf"].forEach(function (id) {
      var btn = $(id);
      if (btn) btn.disabled = !on;
    });
  }

  function exportData() {
    if (!state.result || typeof SunExport === "undefined") return null;
    return SunExport.buildReportData({
      site: state.site,
      satellite: state.satellite,
      band: state.band,
      diameterM: state.diameterM,
      frequencyGHz: state.frequencyGHz,
      carrierHz: state.carrierHz,
      result: state.result
    });
  }

  function watermarkUri() {
    return typeof BrandAssets !== "undefined" ? BrandAssets.watermarkDataUri : null;
  }

  function bindExports() {
    var csvBtn = $("export-csv");
    var htmlBtn = $("export-html");
    var pdfBtn = $("export-pdf");
    if (csvBtn) {
      csvBtn.addEventListener("click", function () {
        var data = exportData();
        if (!data) return;
        SunExport.downloadText(SunExport.exportFilename(data, "csv"), SunExport.toCsv(data), "text/csv");
      });
    }
    if (htmlBtn) {
      htmlBtn.addEventListener("click", function () {
        var data = exportData();
        if (!data) return;
        var html = SunExport.toHtmlReport(data, { logoDataUri: watermarkUri() });
        SunExport.downloadText(SunExport.exportFilename(data, "html"), html, "text/html");
      });
    }
    if (pdfBtn) {
      pdfBtn.addEventListener("click", function () {
        var data = exportData();
        if (!data) return;
        var html = SunExport.toHtmlReport(data, { logoDataUri: watermarkUri() });
        SunExport.openPrintableReport(html);
      });
    }
  }

  function bindForm() {
    FORM_FIELDS.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("input", function () {
        if (id === "site-name" || id === "site-lat" || id === "site-lon" || id === "hemisphere") cancelLookup();
        if ((id === "site-name" || id === "site-lat" || id === "site-lon") && $("site-preset")) $("site-preset").value = "";
        invalidateResult();
        try { readForm(false); } catch (err) { showFormError(err); }
      });
      el.addEventListener("change", function () {
        if (id === "site-name" || id === "site-lat" || id === "site-lon" || id === "hemisphere") cancelLookup();
        runCheck();
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
        cancelLookup();
        var p = PRESETS[i];
        $("site-name").value = p.name;
        $("site-lat").value = String(p.lat);
        $("site-lon").value = String(p.lon);
        if ($("hemisphere")) $("hemisphere").value = "auto";
        runCheck();
      });
    }
    var check = $("run-check");
    if (check) check.addEventListener("click", runCheck);
    var lookup = $("site-lookup");
    if (lookup) lookup.addEventListener("click", lookupPlace);
    var nameEl = $("site-name");
    if (nameEl) {
      nameEl.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          lookupPlace();
        }
      });
    }
  }

  function cancelLookup() {
    stationRevision++;
    if (lookupAbort) lookupAbort.abort();
    if ($("site-lookup")) $("site-lookup").disabled = false;
    if ($("lookup-status")) $("lookup-status").textContent = "";
  }

  function pinKey(site) {
    return Number(site.lat).toFixed(5) + "," + Number(site.lon).toFixed(5);
  }

  function updatePlace() {
    if (typeof SitePlace === "undefined") return;
    var lat = state.site.lat;
    var lon = state.site.lon;
    var embed = SitePlace.mapsEmbedUrl(lat, lon);
    var open = SitePlace.mapsOpenUrl(lat, lon);
    var iframe = $("site-map");
    var link = $("gmaps-open");
    var label = $("place-label");
    var name = state.site.name || "Remote";
    if (iframe && embed && iframe.getAttribute("src") !== embed) {
      iframe.src = embed;
      iframe.title = "Google Map of " + name;
    }
    if (link && open) {
      link.href = open;
      link.textContent = "Open in Google Maps";
    }
    if (label) {
      label.textContent =
        name +
        " · " +
        Math.abs(lat).toFixed(4) +
        "°" +
        (lat < 0 ? "S" : lat > 0 ? "N" : " (Equator)") +
        "  " +
        Math.abs(lon).toFixed(4) +
        "°" +
        (lon < 0 ? "W" : lon > 0 ? "E" : "");
    }
    var key = pinKey(state.site);
    if (key !== lastPinKey) {
      lastPinKey = key;
      loadWeather(lat, lon);
    }
  }

  function renderWeather(wx, err) {
    var el = $("wx-facts");
    if (!el) return;
    if (err) {
      el.innerHTML = "<p class='muted'>" + escapeHtml(err) + "</p>";
      return;
    }
    if (!wx) {
      el.innerHTML = "<p class='muted'>Weather not loaded.</p>";
      return;
    }
    el.innerHTML =
      "<dl class='facts'>" +
      "<div><dt>Sky</dt><dd>" +
      escapeHtml(wx.weather) +
      "</dd></div>" +
      "<div><dt>Temperature</dt><dd>" +
      (wx.temperatureC != null ? wx.temperatureC.toFixed(1) + " °C" : "—") +
      "</dd></div>" +
      "<div><dt>Cloud cover</dt><dd>" +
      (wx.cloudPct != null ? wx.cloudPct + " %" : "—") +
      "</dd></div>" +
      "<div><dt>Wind</dt><dd>" +
      (wx.windKmh != null ? wx.windKmh.toFixed(1) + " km/h " + wx.windDir : "—") +
      "</dd></div>" +
      "<div><dt>Humidity</dt><dd>" +
      (wx.humidityPct != null ? wx.humidityPct + " %" : "—") +
      "</dd></div>" +
      "<div><dt>Precip</dt><dd>" +
      (wx.precipMm != null ? wx.precipMm.toFixed(1) + " mm" : "—") +
      "</dd></div>" +
      "<div><dt>Observed</dt><dd>" +
      escapeHtml(wx.observed || "—") +
      (wx.timezone ? " · " + escapeHtml(wx.timezone) : "") +
      "</dd></div>" +
      "</dl>";
  }

  function loadWeather(lat, lon) {
    var el = $("wx-facts");
    if (typeof SitePlace === "undefined") return;
    if (!SitePlace.canFetch()) {
      renderWeather(null, "Serve the page over http(s) to load Open-Meteo weather. The Google Map pin still uses the coordinates above.");
      return;
    }
    var url = SitePlace.weatherUrl(lat, lon);
    if (!url) return;
    if (el) el.innerHTML = "<p class='muted'>Loading weather…</p>";
    if (wxAbort && typeof wxAbort.abort === "function") wxAbort.abort();
    wxAbort = typeof AbortController === "function" ? new AbortController() : null;
    var revision = ++weatherRevision;
    state.weather = null;
    return fetchPlaceJson(url, wxAbort)
      .then(function (json) {
        if (revision !== weatherRevision) return;
        var wx = SitePlace.parseWeather(json);
        state.weather = wx;
        if (!wx) throw new Error("Open-Meteo returned no current observation.");
        renderWeather(wx, null);
      })
      .catch(function (err) {
        if (revision !== weatherRevision) return;
        state.weather = null;
        renderWeather(null, "Weather unavailable: " + (err && err.message ? err.message : String(err)));
      });
  }

  function fetchPlaceJson(url, controller) {
    var timer;
    var request = fetch(url, controller ? { signal: controller.signal } : {}).then(function (res) {
      if (!res.ok) throw new Error("Service returned HTTP " + res.status + ".");
      return res.json();
    });
    var timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        reject(new Error("Request timed out."));
        if (controller) controller.abort();
      }, 8000);
    });
    return Promise.race([request, timeout]).finally(function () { clearTimeout(timer); });
  }

  function lookupPlace() {
    if (typeof SitePlace === "undefined") return;
    cancelLookup();
    var nameEl = $("site-name");
    var q = nameEl && nameEl.value ? nameEl.value.trim() : "";
    var label = $("lookup-status");
    if (q.length < 2) {
      if (label) label.textContent = "Enter at least two characters, then Look up. You can also enter coordinates directly.";
      return;
    }
    if (!SitePlace.canFetch()) {
      if (label) label.textContent = "Place lookup needs http(s). Type latitude and longitude, or pick a preset.";
      return;
    }
    var url = SitePlace.geocodeUrl(q);
    var revision = stationRevision;
    lookupAbort = typeof AbortController === "function" ? new AbortController() : null;
    if (label) label.textContent = "Looking up " + q + "…";
    if ($("site-lookup")) $("site-lookup").disabled = true;
    invalidateResult("Looking up the station. The estimate will update after a confirmed match.");
    return fetchPlaceJson(url, lookupAbort)
      .then(function (json) {
        if (revision !== stationRevision) return;
        var hit = SitePlace.parseGeocode(json);
        if (!hit) throw new Error("No match for “" + q + "”.");
        if (!isFinite(hit.lat) || !isFinite(hit.lon) || Math.abs(hit.lat) > 90 || Math.abs(hit.lon) > 180) throw new Error("The service returned invalid coordinates.");
        if (nameEl) nameEl.value = hit.name;
        if ($("site-lat")) $("site-lat").value = String(hit.lat);
        if ($("site-lon")) $("site-lon").value = String(hit.lon);
        var preset = $("site-preset");
        if (preset) preset.value = "";
        if ($("hemisphere")) $("hemisphere").value = "auto";
        runCheck();
        if (label) label.textContent = "Found " + hit.name + ". Confirm the coordinates match your station.";
      })
      .catch(function (err) {
        if (revision !== stationRevision) return;
        invalidateResult("Lookup unavailable. Enter coordinates manually or choose a preset.");
        if (label) {
          label.textContent = "Lookup unavailable: " + (err && err.message ? err.message : String(err)) + " Enter coordinates manually or choose a preset.";
        }
      }).finally(function () {
        if (revision === stationRevision && $("site-lookup")) $("site-lookup").disabled = false;
      });
  }

  function fillPresets() {
    var sel = $("site-preset");
    if (!sel) return;
    sel.innerHTML = "<option value=''>Custom coordinates</option>" + PRESETS.map(function (p, i) {
      return "<option value='" + i + "'" + (i === 0 ? " selected" : "") + ">" + escapeHtml(p.name) + "</option>";
    }).join("");
  }

  function renderCatalogMeta() {
    var el = $("catalog-meta");
    if (!el || !state.catalog) return;
    var live = state.loadMeta && state.loadMeta.live;
    el.textContent =
      state.catalog.count +
      " GEO satellites · " +
      (live ? "live Celestrak" : "bundled snapshot") + " · " + state.catalog.fetchedAt.slice(0, 10) +
      (state.loadMeta && state.loadMeta.error ? " · live refresh unavailable" : "");
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
    bindExports();
    if (typeof UtcClock !== "undefined") {
      UtcClock.startTicker($("utc-clock"));
    }
    if (typeof ThemeControl !== "undefined") {
      ThemeControl.bindControl(document);
    }
    dumpSources();
    if ($("site-lat")) $("site-lat").value = String(state.site.lat);
    if ($("site-lon")) $("site-lon").value = String(state.site.lon);
    if ($("ant-d")) $("ant-d").value = String(state.diameterM);
    if ($("site-name")) $("site-name").value = state.site.name;
    if ($("band")) $("band").value = state.band;
    updatePlace();

    var attemptLive = typeof GeoCatalog !== "undefined" && GeoCatalog.canAttemptLive();
    var loader =
      typeof GeoCatalog !== "undefined"
        ? GeoCatalog.loadCatalog({ attemptLive: false })
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
        updatePlace();
        if (attemptLive) {
          GeoCatalog.loadCatalog({ attemptLive: true }).then(function (fresh) {
            if (fresh.live) {
              pendingCatalog = fresh;
              var metaEl = $("catalog-meta");
              if (metaEl) metaEl.textContent += " · refreshed catalog ready for the next calculation";
            } else {
              state.loadMeta = fresh;
              renderCatalogMeta();
            }
          }).catch(function () {
            var metaEl = $("catalog-meta");
            if (metaEl) metaEl.textContent += " · live refresh unavailable; using snapshot";
          });
        }
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
    defaultSatellite: defaultSatellite,
    updatePlace: updatePlace,
    lookupPlace: lookupPlace
  };
});
