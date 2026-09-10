#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var catalog = require("../js/catalog.js");

var root = path.join(__dirname, "..");
var rawPath = path.join(root, "data", "celestrak-geo-raw.json");
var outPath = path.join(root, "data", "geo-snapshot.json");

if (!fs.existsSync(rawPath)) {
  console.error("Missing " + rawPath);
  process.exit(1);
}

var raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
if (!Array.isArray(raw)) {
  console.error("Raw catalog is not an array");
  process.exit(1);
}

var snap = catalog.buildSnapshot(raw, {
  fetchedAt: new Date().toISOString()
});

fs.writeFileSync(outPath, JSON.stringify(snap, null, 2) + "\n");
var jsPath = path.join(root, "data", "geo-snapshot.js");
fs.writeFileSync(
  jsPath,
  "window.GEO_SNAPSHOT = " + JSON.stringify(snap) + ";\n"
);

var ops = {};
snap.satellites.forEach(function (s) {
  ops[s.operator] = (ops[s.operator] || 0) + 1;
});
var highlighted = snap.satellites.filter(function (s) {
  return s.highlightVendor;
});

console.log(
  "snapshot " +
    snap.count +
    " GEO objects from " +
    raw.length +
    " OMM records"
);
console.log("operators", JSON.stringify(ops));
console.log("highlighted vendor birds", highlighted.length);
highlighted
  .filter(function (s) {
    return s.operator === "hispasat" || s.operator === "telesat";
  })
  .forEach(function (s) {
    console.log(
      "  " +
        s.displayName +
        "  " +
        s.lon.toFixed(2) +
        "°  " +
        s.operator
    );
  });
console.log("wrote", outPath);
