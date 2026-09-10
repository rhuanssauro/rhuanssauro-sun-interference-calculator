"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var ST = require(path.join(__dirname, "..", "js", "sun-transit.js"));

test("shipped API is present (not a parallel oracle)", function () {
  assert.equal(typeof ST.evaluateGeometry, "function");
  assert.equal(typeof ST.windowFromSamples, "function");
  assert.equal(typeof ST.lookAngles, "function");
  assert.equal(typeof ST.beamwidthDeg, "function");
  assert.equal(typeof ST.outageRadiusDeg, "function");
  assert.equal(typeof ST.checkInterference, "function");
  assert.equal(typeof ST.centralTransitDurationMin, "function");
});

test("(a) sun angular separation within outage angle → impacted with non-zero duration", function () {
  var satAz = 240;
  var satEl = 48;
  var geo = ST.evaluateGeometry({
    satAz: satAz,
    satEl: satEl,
    sunAz: satAz,
    sunEl: satEl,
    diameterM: 2.4,
    bandOrGhz: "Ku"
  });
  assert.equal(geo.status, "impacted");
  assert.equal(geo.impacted, true);
  assert.ok(geo.separationDeg < geo.outageRadiusDeg);

  var samples = [];
  var t0 = Date.UTC(2026, 2, 20, 15, 0, 0);
  var i;
  for (i = -40; i <= 40; i++) {
    var offset = i * 0.125;
    samples.push({
      tMs: t0 + i * 30000,
      satAz: satAz,
      satEl: satEl,
      sunAz: satAz + offset,
      sunEl: satEl
    });
  }
  var win = ST.windowFromSamples(samples, 2.4, "Ku");
  assert.equal(win.status, "impacted");
  assert.equal(win.impacted, true);
  assert.ok(win.durationMin > 0, "duration must be non-zero, got " + win.durationMin);
  assert.ok(win.startMs != null && win.endMs != null);
});

test("(b) well off-axis → not impacted", function () {
  var geo = ST.evaluateGeometry({
    satAz: 240,
    satEl: 48,
    sunAz: 250,
    sunEl: 48,
    diameterM: 2.4,
    bandOrGhz: "Ku"
  });
  assert.equal(geo.status, "not-impacted");
  assert.equal(geo.impacted, false);
  assert.ok(geo.separationDeg > geo.outageRadiusDeg);
  assert.ok(geo.separationDeg > 5);
});

test("(c) larger antenna diameter → strictly shorter duration at the same band", function () {
  var satAz = 200;
  var satEl = 55;
  function samplesFor() {
    var samples = [];
    var t0 = Date.UTC(2026, 8, 10, 16, 0, 0);
    var i;
    for (i = -80; i <= 80; i++) {
      var offset = i * (0.25 / 2);
      samples.push({
        tMs: t0 + i * 30000,
        satAz: satAz,
        satEl: satEl,
        sunAz: satAz + offset,
        sunEl: satEl
      });
    }
    return samples;
  }
  var small = ST.windowFromSamples(samplesFor(), 1.2, "Ku");
  var large = ST.windowFromSamples(samplesFor(), 3.7, "Ku");
  assert.equal(small.impacted, true);
  assert.equal(large.impacted, true);
  assert.ok(
    large.durationMin < small.durationMin,
    "3.7 m duration " + large.durationMin + " should be < 1.2 m " + small.durationMin
  );
  var dSmall = ST.centralTransitDurationMin(1.2, "Ku");
  var dLarge = ST.centralTransitDurationMin(3.7, "Ku");
  assert.ok(dLarge < dSmall);
});

test("(d) satellite below the local horizon → not in view", function () {
  var geo = ST.evaluateGeometry({
    satAz: 90,
    satEl: -12,
    sunAz: 90,
    sunEl: 40,
    diameterM: 2.4,
    bandOrGhz: "Ku"
  });
  assert.equal(geo.status, "not-in-view");
  assert.equal(geo.impacted, false);

  var macae = ST.MACAE;
  var look = ST.lookAngles(macae.lat, macae.lon, 140, 0);
  assert.ok(look.elevation <= 0, "140°E from Macaé should be below horizon, el=" + look.elevation);
  var check = ST.checkInterference({
    lat: macae.lat,
    lon: macae.lon,
    satLon: 140,
    diameterM: 2.4,
    bandOrGhz: "Ku",
    now: new Date("2026-09-10T15:00:00Z")
  });
  assert.equal(check.status, "not-in-view");
  assert.match(check.verdict, /not in view/i);
});

test("Macaé default coordinates and Amazonas 3 are in view", function () {
  var look = ST.lookAngles(ST.MACAE.lat, ST.MACAE.lon, -61, 0);
  assert.ok(look.elevation > 20, "Amazonas 3 elevation from Macaé " + look.elevation);
  assert.equal(ST.MACAE.lat, -22.37);
  assert.equal(ST.MACAE.lon, -41.79);
});

test("parseToGHz accepts GHz, MHz, and Hz", function () {
  assert.equal(ST.parseToGHz(11.95), 11.95);
  assert.equal(ST.parseToGHz("3700"), 3.7);
  assert.equal(ST.parseToGHz("11750000000"), 11.75);
  assert.equal(ST.parseToGHz(""), null);
  assert.equal(ST.parseCarrierHz("36"), 36e6);
  assert.equal(ST.parseCarrierHz("36000000"), 36e6);
  assert.match(ST.formatCarrier(36e6), /36 MHz/);
});

test("checkInterference returns a non-empty owner-style verdict string", function () {
  var r = ST.checkInterference({
    lat: ST.MACAE.lat,
    lon: ST.MACAE.lon,
    satLon: -61,
    diameterM: 2.4,
    bandOrGhz: "Ku",
    now: new Date("2026-09-10T18:00:00Z")
  });
  assert.equal(typeof r.verdict, "string");
  assert.ok(r.verdict.length > 10);
  assert.ok(
    /impacted|not impacted|not in view|out of season/i.test(r.verdict)
  );
  assert.ok(["impacted", "not-impacted", "not-in-view", "out-of-season"].indexOf(r.status) >= 0);
});
