"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var catalog = require(path.join(__dirname, "..", "js", "catalog.js"));
var ST = require(path.join(__dirname, "..", "js", "sun-transit.js"));

test("geo snapshot exists, is dated, and tags highlight vendors", function () {
  var p = path.join(__dirname, "..", "data", "geo-snapshot.json");
  assert.ok(fs.existsSync(p), "data/geo-snapshot.json must exist");
  var snap = JSON.parse(fs.readFileSync(p, "utf8"));
  assert.ok(snap.fetchedAt);
  assert.ok(snap.source && snap.source.url.indexOf("celestrak") >= 0);
  assert.ok(Array.isArray(snap.satellites) && snap.satellites.length > 50);
  var ops = { intelsat: 0, hispasat: 0, telesat: 0 };
  snap.satellites.forEach(function (s) {
    if (ops[s.operator] != null) ops[s.operator]++;
    if (s.highlightVendor) {
      assert.ok(s.operator === "intelsat" || s.operator === "hispasat" || s.operator === "telesat");
    }
  });
  assert.ok(ops.intelsat > 0, "need Intelsat birds");
  assert.ok(ops.hispasat > 0, "need Hispasat birds");
  assert.ok(ops.telesat > 0, "need Telesat birds");
});

test("Macaé in-view set includes highlighted Hispasat/Telesat/Intelsat", function () {
  var snap = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "geo-snapshot.json"), "utf8")
  );
  global.SunTransit = ST;
  var vis = catalog.filterForSite(snap, ST.MACAE.lat, ST.MACAE.lon, { hideDebris: true, minEl: 0 });
  assert.ok(vis.length > 10, "expected a populated in-view belt");
  var names = vis.map(function (s) {
    return s.name;
  }).join(" ");
  assert.ok(/AMAZONAS|HISPASAT/.test(names), "Hispasat/Amazonas in view from Macaé");
  assert.ok(/TELSTAR/.test(names), "Telesat Telstar in view from Macaé");
  assert.ok(/INTELSAT/.test(names), "Intelsat in view from Macaé");
});

test("tagOperator and longitude helper are the shipped catalog functions", function () {
  assert.equal(catalog.tagOperator("HISPASAT 30W-6"), "hispasat");
  assert.equal(catalog.tagOperator("TELSTAR 19V"), "telesat");
  assert.equal(catalog.tagOperator("INTELSAT 21 (IS-21)"), "intelsat");
});

test("known GEO longitudes from the bundled snapshot stay on official slots", function () {
  var snap = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "geo-snapshot.json"), "utf8")
  );
  function byName(name) {
    return snap.satellites.filter(function (s) {
      return s.name === name;
    })[0];
  }
  var h30 = byName("HISPASAT 30W-6");
  var am2 = byName("AMAZONAS 2");
  var t19 = byName("TELSTAR 19V");
  assert.ok(h30);
  assert.ok(Math.abs(h30.lon - -30) < 0.2, "30W-6 lon " + h30.lon);
  assert.ok(am2);
  assert.ok(Math.abs(am2.lon - -72.03) < 0.3, "Amazonas 2 catalog lon " + am2.lon);
  assert.ok(t19);
  assert.ok(Math.abs(t19.lon - -63) < 0.2, "Telstar 19V lon " + t19.lon);
});
