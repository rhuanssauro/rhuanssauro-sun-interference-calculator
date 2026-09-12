/**
 * Export the current prediction as CSV, a standalone branded HTML report,
 * or PDF via the browser print dialog on that report. Builders are pure
 * string functions (Node-testable, no DOM); only the download/print
 * helpers touch the browser, and both work on file:// with no build step.
 * Branding: Rhuanssauro Tech Inc.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SunExport = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var BRAND = "Rhuanssauro Tech Inc";
  var BRAND_LINE = "a datacenter in the jungle";

  var DISCLAIMER =
    "Geometric estimate only. Windows come from look angles, the receive " +
    "3 dB beamwidth, and the apparent solar disk. No RF link margin, antenna " +
    "mispointing, or equipment performance is modeled. Pad the window " +
    "(start ~10 min early, end ~10 min late) and re-run the satellite " +
    "operator's own calculator with current ephemeris before acting on a circuit.";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtLon(lon) {
    var n = Number(lon);
    if (!isFinite(n)) return "—";
    return Math.abs(n).toFixed(2) + "°" + (n < 0 ? "W" : n > 0 ? "E" : "");
  }

  function fmtLat(lat) {
    var n = Number(lat);
    if (!isFinite(n)) return "—";
    return Math.abs(n).toFixed(4) + "°" + (n < 0 ? "S" : n > 0 ? "N" : "");
  }

  function hms(iso) {
    if (!iso) return "—";
    return String(iso).slice(11, 19) + "Z";
  }

  /** "Macaé, Rio de Janeiro" → "macae-rio-de-janeiro" */
  function slugify(s) {
    var base = String(s == null ? "" : s);
    if (typeof base.normalize === "function") {
      base = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return (
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "report"
    );
  }

  function exportFilename(data, ext) {
    var day = (data.generatedUtc || "").slice(0, 10).replace(/-/g, "");
    return (
      "sun-interference_" +
      slugify(data.site && data.site.name ? data.site.name.split(",")[0] : "site") +
      "_" +
      slugify(data.satellite && data.satellite.name ? data.satellite.name : "sat") +
      (day ? "_" + day : "") +
      "." +
      ext
    );
  }

  /**
   * Normalize dashboard state + checkInterference result into one plain
   * object every exporter consumes. `input`:
   * { site:{name,lat,lon}, satellite:{displayName|name,lon,operator},
   *   band, diameterM, frequencyGHz, carrierHz, result }
   */
  function buildReportData(input) {
    input = input || {};
    var site = input.site || {};
    var sat = input.satellite || {};
    var r = input.result || {};
    var windows = (r.nearbyWindows || []).map(function (w) {
      return {
        date: w.date || "",
        startUtc: w.startUtc || null,
        endUtc: w.endUtc || null,
        durationMin: typeof w.durationMin === "number" ? w.durationMin : null
      };
    });
    return {
      brand: BRAND,
      generatedUtc: r.nowUtc || new Date().toISOString(),
      site: {
        name: site.name || "Remote site",
        lat: site.lat,
        lon: site.lon,
        hemisphere: typeof site.lat !== "number" || !isFinite(site.lat) || Math.abs(site.lat) > 90 ? "Unknown" : site.lat > 0 ? "Northern hemisphere" : site.lat < 0 ? "Southern hemisphere" : "Equator"
      },
      satellite: {
        name: sat.displayName || sat.name || "—",
        lon: sat.lon,
        operator: sat.operator || ""
      },
      params: {
        band: input.band || "",
        bandGHz: typeof r.bandGHz === "number" ? r.bandGHz : null,
        diameterM: input.diameterM,
        frequencyGHz: input.frequencyGHz != null ? input.frequencyGHz : null,
        carrierHz: input.carrierHz != null ? input.carrierHz : null
      },
      status: r.status || "",
      verdict: r.verdict || "",
      look: r.look ? { azimuth: r.look.azimuth, elevation: r.look.elevation } : null,
      beamwidthDeg: typeof r.beamwidthDeg === "number" ? r.beamwidthDeg : null,
      outageRadiusDeg: typeof r.outageRadiusDeg === "number" ? r.outageRadiusDeg : null,
      windows: windows,
      disclaimer: DISCLAIMER
    };
  }

  function csvEscape(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function paramLines(data) {
    var p = data.params || {};
    return [
      ["exported_by", data.brand],
      ["generated_utc", data.generatedUtc],
      ["site", data.site.name],
      ["latitude_deg", data.site.lat],
      ["longitude_deg_east", data.site.lon],
      ["hemisphere", data.site.hemisphere],
      ["satellite", data.satellite.name],
      ["satellite_longitude_deg_east", data.satellite.lon],
      ["operator", data.satellite.operator],
      ["band", p.band],
      ["band_ghz", p.bandGHz],
      ["antenna_diameter_m", p.diameterM],
      ["receive_frequency_ghz", p.frequencyGHz == null ? "" : p.frequencyGHz],
      ["carrier_hz", p.carrierHz == null ? "" : p.carrierHz],
      ["beamwidth_3db_deg", data.beamwidthDeg == null ? "" : data.beamwidthDeg.toFixed(3)],
      ["outage_radius_deg", data.outageRadiusDeg == null ? "" : data.outageRadiusDeg.toFixed(3)],
      ["status", data.status],
      ["verdict", data.verdict]
    ];
  }

  /**
   * CSV: `#`-prefixed comment header carries the parameters and verdict,
   * then one row per geometric window (UTC). CRLF for spreadsheet apps.
   */
  function toCsv(data) {
    var lines = paramLines(data).map(function (kv) {
      return "# " + kv[0] + ": " + String(kv[1] == null ? "" : kv[1]).replace(/[\r\n]+/g, " ");
    });
    lines.push("# disclaimer: " + data.disclaimer);
    lines.push("date,start_utc,end_utc,duration_min");
    (data.windows || []).forEach(function (w) {
      lines.push(
        [
          csvEscape(w.date),
          csvEscape(w.startUtc || ""),
          csvEscape(w.endUtc || ""),
          csvEscape(w.durationMin == null ? "" : w.durationMin.toFixed(1))
        ].join(",")
      );
    });
    if (!(data.windows || []).length) {
      lines.push("# no geometric windows in the scanned equinox neighbourhood");
    }
    return lines.join("\r\n") + "\r\n";
  }

  function windowRowsHtml(data) {
    var rows = data.windows || [];
    if (!rows.length) {
      return (
        '<p class="empty">No geometric windows in the scanned equinox ' +
        "neighbourhood for this satellite, site, and dish.</p>"
      );
    }
    return (
      '<div class="table-scroll" role="region" aria-label="Geometric windows" tabindex="0"><table><caption>Geometric sun-transit windows (UTC)</caption>' +
      "<thead><tr><th>Date</th><th>Start</th><th>End</th><th>Duration</th></tr></thead><tbody>" +
      rows
        .map(function (w) {
          return (
            "<tr><td>" +
            esc(w.date) +
            "</td><td>" +
            esc(hms(w.startUtc)) +
            "</td><td>" +
            esc(hms(w.endUtc)) +
            "</td><td>" +
            (w.durationMin == null ? "—" : w.durationMin.toFixed(1) + " min") +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div>"
    );
  }

  /**
   * Standalone printable report. Paper/ink palette with the brand amber,
   * print CSS included so the same document is the PDF path
   * (browser print-to-PDF). The inline claw and live wordmark keep branding
   * crisp and self-contained when detached from the app, including file://.
   */
  function toHtmlReport(data) {
    var p = data.params || {};
    var logo =
      '<div class="watermark"><span class="watermark-name"><svg viewBox="0 0 34 34" width="20" height="20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="currentColor">' +
      '<path d="M7 3 C 11 12, 11 23, 5 33 C 2 23, 3 12, 7 3 Z" transform="rotate(-13 6 18)"></path>' +
      '<path d="M17 2 C 21 12, 21 23, 16 33 C 12 23, 13 12, 17 2 Z"></path>' +
      '<path d="M27 3 C 31 12, 31 23, 25 33 C 22 23, 23 12, 27 3 Z" transform="rotate(13 26 18)"></path>' +
      '</g></svg><strong>' + esc(BRAND) + '</strong></span><small>' + esc(BRAND_LINE) + '</small></div>';
    var freq =
      p.frequencyGHz != null
        ? (p.frequencyGHz * 1e3).toFixed(1) + " MHz (" + p.frequencyGHz.toFixed(4) + " GHz)"
        : "band default";
    var carrier = p.carrierHz != null ? (p.carrierHz / 1e6).toFixed(3) + " MHz" : "—";
    return (
      "<!DOCTYPE html>\n" +
      '<html lang="en" data-report="sun-interference">\n<head>\n' +
      '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      "<title>Sun Interference report — " +
      esc(data.satellite.name) +
      " @ " +
      esc(data.site.name) +
      " — " +
      esc(BRAND) +
      "</title>\n<style>\n" +
      ":root { color-scheme: light; }\n" +
      "body { margin: 2rem auto; max-width: 52rem; padding: 0 1rem; background: #fff; color: #1c1917;\n" +
      '  font: 16px/1.55 "Segoe UI", system-ui, sans-serif; overflow-wrap: anywhere; }\n' +
      "header { border-bottom: 3px solid #b45309; padding-bottom: 0.75rem; margin-bottom: 1.25rem; }\n" +
      "h1 { font-size: 1.4rem; margin: 0 0 0.15rem; letter-spacing: -0.01em; }\n" +
      ".stamp, td, th, dd { font-variant-numeric: tabular-nums; }\n" +
      ".stamp { font-family: ui-monospace, Menlo, Consolas, monospace; color: #57534e; font-size: 0.85rem; }\n" +
      ".verdict { border: 1px solid #b45309; background: #f5f5f4; padding: 0.7rem 1rem;\n" +
      "  font-weight: 600; margin: 1rem 0; }\n" +
      'dl { display: grid; grid-template-columns: 14rem 1fr; gap: 0.3rem 1rem; margin: 1rem 0; }\n' +
      "dt { color: #57534e; } dd { margin: 0; font-family: ui-monospace, Menlo, Consolas, monospace; }\n" +
      "table { border-collapse: collapse; width: 100%; margin: 1rem 0;\n" +
      "  font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.9rem; }\n" +
      "caption { text-align: left; font-weight: 600; margin-bottom: 0.4rem;\n" +
      '  font-family: "Segoe UI", system-ui, sans-serif; }\n' +
      "th, td { text-align: left; border-bottom: 1px solid #d6d3d1; padding: 0.35rem 0.5rem; }\n" +
      "thead th { border-bottom: 2px solid #b45309; }\n" +
      ".empty { color: #57534e; }\n" +
      ".table-scroll { overflow-x: auto; } .table-scroll:focus-visible { outline: 2px solid #b45309; outline-offset: 3px; }\n" +
      "@media (max-width: 600px) { dl { grid-template-columns: 1fr; gap: 0.15rem; } dd { margin-bottom: 0.75rem; } table { min-width: 26rem; } }\n" +
      "footer { margin-top: 1.5rem; border-top: 1px solid #d6d3d1; padding-top: 0.75rem;\n" +
      "  color: #57534e; font-size: 0.85rem; }\n" +
      ".watermark { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.35rem 1rem; margin-top: 0.75rem; break-inside: avoid; }\n" +
      ".watermark-name { display: inline-flex; align-items: center; gap: 0.4rem; }\n" +
      ".watermark svg { flex: none; color: #2e6b3d; }\n" +
      ".watermark strong { color: #292524; font-size: 0.75rem; }\n" +
      ".watermark small { font-size: 0.625rem; letter-spacing: 0.08em; }\n" +
      "@media print { body { margin: 0.5in auto; } .verdict { break-inside: avoid; } .table-scroll { overflow: visible; }\n" +
      "  table { break-inside: avoid; } }\n" +
      "</style>\n</head>\n<body>\n" +
      "<header>\n" +
      "<h1>Sun Interference — geometric sun-transit report</h1>\n" +
      '<div class="stamp">Generated ' +
      esc((data.generatedUtc || "").replace("T", " ")) +
      " UTC</div>\n" +
      "</header>\n" +
      '<p class="verdict" data-status="' +
      esc(data.status) +
      '">' +
      esc(data.verdict) +
      "</p>\n" +
      "<dl>\n" +
      "<dt>Site</dt><dd>" +
      esc(data.site.name) +
      " · " +
      esc(fmtLat(data.site.lat)) +
      " " +
      esc(fmtLon(data.site.lon)) +
      "</dd>\n" +
      "<dt>Hemisphere</dt><dd>" + esc(data.site.hemisphere) + "</dd>\n" +
      "<dt>Satellite</dt><dd>" +
      esc(data.satellite.name) +
      " · " +
      esc(fmtLon(data.satellite.lon)) +
      (data.satellite.operator ? " · " + esc(data.satellite.operator) : "") +
      "</dd>\n" +
      "<dt>Band / RX centre</dt><dd>" +
      esc(p.band || "—") +
      (p.bandGHz != null ? " · " + p.bandGHz.toFixed(4) + " GHz" : "") +
      "</dd>\n" +
      "<dt>Antenna diameter</dt><dd>" +
      (p.diameterM != null ? Number(p.diameterM).toFixed(2) + " m" : "—") +
      "</dd>\n" +
      "<dt>Receive frequency</dt><dd>" +
      esc(freq) +
      "</dd>\n" +
      "<dt>Carrier size</dt><dd>" +
      esc(carrier) +
      "</dd>\n" +
      (data.look
        ? "<dt>Look angles</dt><dd>az " +
          data.look.azimuth.toFixed(1) +
          "° · el " +
          data.look.elevation.toFixed(1) +
          "°</dd>\n"
        : "") +
      (data.beamwidthDeg != null
        ? "<dt>3 dB beamwidth</dt><dd>" + data.beamwidthDeg.toFixed(2) + "°</dd>\n"
        : "") +
      (data.outageRadiusDeg != null
        ? "<dt>Outage radius</dt><dd>" +
          data.outageRadiusDeg.toFixed(2) +
          "° (½ beam + 0.25° solar radius)</dd>\n"
        : "") +
      "</dl>\n" +
      windowRowsHtml(data) +
      "\n<footer>\n<p>" +
      esc(data.disclaimer) +
      "</p>\n<p>" +
      "MIT-licensed geometric checker · not affiliated with any satellite operator.</p>\n" +
      logo +
      "\n</footer>\n</body>\n</html>\n"
    );
  }

  /** Blob + anchor download. Works on file:// with no server. */
  function downloadText(filename, text, mime, doc) {
    var d = doc || (typeof document !== "undefined" ? document : null);
    if (!d || typeof Blob === "undefined" || typeof URL === "undefined") return false;
    var blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = d.createElement("a");
    a.href = url;
    a.download = filename;
    (d.body || d.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 4000);
    return true;
  }

  /**
   * PDF path: open the branded report in a new window and hand it to the
   * browser print dialog (Save as PDF). document.write keeps it working
   * on file:// where blob-URL navigation can be blocked.
   */
  function openPrintableReport(html, win) {
    var w = win || (typeof window !== "undefined" ? window : null);
    if (!w || typeof w.open !== "function") return false;
    var popup = w.open("", "_blank");
    if (!popup) return false;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(function () {
      try {
        popup.print();
      } catch (e) {
        /* user can still print from the opened report */
      }
    }, 250);
    return true;
  }

  return {
    BRAND: BRAND,
    DISCLAIMER: DISCLAIMER,
    slugify: slugify,
    exportFilename: exportFilename,
    csvEscape: csvEscape,
    buildReportData: buildReportData,
    toCsv: toCsv,
    toHtmlReport: toHtmlReport,
    downloadText: downloadText,
    openPrintableReport: openPrintableReport
  };
});
