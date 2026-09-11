"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var SunExport = require(path.join(__dirname, "..", "js", "export-report.js"));
var ST = require(path.join(__dirname, "..", "js", "sun-transit.js"));
var Brand = require(path.join(__dirname, "..", "assets", "watermark-data.js"));

function fixtureInput() {
  return {
    site: { name: "Macaé, Rio de Janeiro, Brazil", lat: -22.37, lon: -41.79 },
    satellite: { displayName: "Intelsat 37e (IS-37E)", lon: -18, operator: "intelsat" },
    band: "C",
    diameterM: 2.4,
    frequencyGHz: 3.95,
    carrierHz: 36e6,
    result: {
      nowUtc: "2026-09-10T12:53:00.000Z",
      status: "impacted",
      verdict: "Impacted. Geometric sun-transit 12:51:00Z–12:57:00Z (6.0 min).",
      bandGHz: 3.95,
      look: { azimuth: 65.4, elevation: 55.2 },
      beamwidthDeg: 2.21,
      outageRadiusDeg: 1.36,
      nearbyWindows: [
        { date: "2026-09-10", startUtc: "2026-09-10T12:51:00.000Z", endUtc: "2026-09-10T12:57:00.000Z", durationMin: 6.0 },
        { date: "2026-09-11", startUtc: "2026-09-11T12:50:30.000Z", endUtc: "2026-09-11T12:56:30.000Z", durationMin: 6.0 }
      ]
    }
  };
}

test("buildReportData normalizes state + result into one export object", function () {
  var data = SunExport.buildReportData(fixtureInput());
  assert.equal(data.brand, "Rhuanssauro Tech Inc");
  assert.equal(data.generatedUtc, "2026-09-10T12:53:00.000Z");
  assert.equal(data.site.name, "Macaé, Rio de Janeiro, Brazil");
  assert.equal(data.satellite.name, "Intelsat 37e (IS-37E)");
  assert.equal(data.params.band, "C");
  assert.equal(data.params.diameterM, 2.4);
  assert.equal(data.params.frequencyGHz, 3.95);
  assert.equal(data.params.carrierHz, 36e6);
  assert.equal(data.windows.length, 2);
  assert.match(data.disclaimer, /[Gg]eometric/);
  assert.match(data.disclaimer, /operator/);
});

test("buildReportData accepts a real checkInterference result", function () {
  var r = ST.checkInterference({
    lat: ST.MACAE.lat,
    lon: ST.MACAE.lon,
    satLon: -18,
    diameterM: 2.4,
    bandOrGhz: "C",
    now: new Date("2026-09-10T12:53:00Z")
  });
  var data = SunExport.buildReportData({
    site: { name: ST.MACAE.name, lat: ST.MACAE.lat, lon: ST.MACAE.lon },
    satellite: { displayName: "INTELSAT 37E", lon: -18, operator: "intelsat" },
    band: "C",
    diameterM: 2.4,
    result: r
  });
  assert.equal(typeof data.verdict, "string");
  assert.ok(data.verdict.length > 10);
  assert.ok(Array.isArray(data.windows));
  var csv = SunExport.toCsv(data);
  assert.match(csv, /date,start_utc,end_utc,duration_min/);
});

test("CSV carries params as # comments, a header row, and window rows", function () {
  var data = SunExport.buildReportData(fixtureInput());
  var csv = SunExport.toCsv(data);
  var lines = csv.trim().split("\r\n");
  assert.match(csv, /# exported_by: Rhuanssauro Tech Inc/);
  assert.match(csv, /# site: Macaé, Rio de Janeiro, Brazil/);
  assert.match(csv, /# satellite: Intelsat 37e \(IS-37E\)/);
  assert.match(csv, /# antenna_diameter_m: 2\.4/);
  assert.match(csv, /# receive_frequency_ghz: 3\.95/);
  assert.match(csv, /# status: impacted/);
  assert.match(csv, /# disclaimer: Geometric estimate only\./);
  var headerIdx = lines.indexOf("date,start_utc,end_utc,duration_min");
  assert.ok(headerIdx > 0, "header row present after comments");
  assert.equal(lines[headerIdx + 1], "2026-09-10,2026-09-10T12:51:00.000Z,2026-09-10T12:57:00.000Z,6.0");
  assert.equal(lines.length, headerIdx + 3);
});

test("CSV escapes commas and quotes in fields", function () {
  assert.equal(SunExport.csvEscape("plain"), "plain");
  assert.equal(SunExport.csvEscape("a,b"), '"a,b"');
  assert.equal(SunExport.csvEscape('say "hi"'), '"say ""hi"""');
  assert.equal(SunExport.csvEscape(null), "");
});

test("CSV without windows still exports params and a note", function () {
  var input = fixtureInput();
  input.result.nearbyWindows = [];
  input.result.status = "out-of-season";
  var csv = SunExport.toCsv(SunExport.buildReportData(input));
  assert.match(csv, /date,start_utc,end_utc,duration_min/);
  assert.match(csv, /# no geometric windows/);
});

test("HTML report is standalone, branded, escaped, and printable", function () {
  var data = SunExport.buildReportData(fixtureInput());
  var html = SunExport.toHtmlReport(data, { logoDataUri: Brand.watermarkDataUri });
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /Rhuanssauro Tech Inc/);
  assert.match(html, /a datacenter in the jungle/);
  assert.match(html, /Macaé, Rio de Janeiro, Brazil/);
  assert.match(html, /Intelsat 37e \(IS-37E\)/);
  assert.match(html, /12:51:00Z/);
  assert.match(html, /12:57:00Z/);
  assert.match(html, /6\.0 min/);
  assert.match(html, /Geometric estimate only\./);
  assert.match(html, /@media print/);
  assert.match(html, /data:image\/png;base64,/);
  assert.equal(/<script/i.test(html), false, "report must carry no scripts");
  // No operator branding in ours: cited method names are fine, logos are not.
  assert.equal(/myintelsat|ses\.com|intelsat\.com/i.test(html), false);
});

test("HTML report escapes hostile site names", function () {
  var input = fixtureInput();
  input.site.name = '<img src=x onerror=alert(1)> "Macaé"';
  var html = SunExport.toHtmlReport(SunExport.buildReportData(input));
  assert.equal(/<img src=x/.test(html), false);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test("HTML report without windows shows the empty message", function () {
  var input = fixtureInput();
  input.result.nearbyWindows = [];
  var html = SunExport.toHtmlReport(SunExport.buildReportData(input));
  assert.match(html, /No geometric windows/);
});

test("export filenames are slugged and dated per format", function () {
  var data = SunExport.buildReportData(fixtureInput());
  assert.equal(SunExport.exportFilename(data, "csv"), "sun-interference_macae_intelsat-37e-is-37e_20260910.csv");
  assert.equal(SunExport.exportFilename(data, "html"), "sun-interference_macae_intelsat-37e-is-37e_20260910.html");
  assert.equal(SunExport.slugify("São João da Barra!"), "sao-joao-da-barra");
  assert.equal(SunExport.slugify(""), "report");
});

test("bundled watermark is a PNG data URI for detached reports", function () {
  assert.equal(typeof Brand.watermarkDataUri, "string");
  assert.match(Brand.watermarkDataUri, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
});
