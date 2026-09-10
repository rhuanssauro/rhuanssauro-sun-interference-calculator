"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.join(__dirname, "..");
var files = [
  { file: "js/sun-transit.js", global: "SunTransit" },
  { file: "js/catalog.js", global: "GeoCatalog" },
  { file: "js/place.js", global: "SitePlace" },
  { file: "js/app.js", global: "SunDashboard" }
];

function loadInWindow(rel) {
  var code = fs.readFileSync(path.join(root, rel), "utf8");
  var window = {};
  var sandbox = {
    window: window,
    globalThis: window,
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    Error: Error,
    parseInt: parseInt,
    isFinite: isFinite,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: rel });
  return sandbox;
}

test("browser scripts execute without Node globals and install entry points", function () {
  files.forEach(function (spec) {
    var abs = path.join(root, spec.file);
    if (!fs.existsSync(abs)) {
      throw new Error("missing " + spec.file);
    }
    var src = fs.readFileSync(abs, "utf8");
    assert.equal(
      /module\.exports\s*=/.test(src) && !/typeof module/.test(src),
      false,
      spec.file + " must not unguarded-export module.exports"
    );
    var sandbox = loadInWindow(spec.file);
    assert.equal(typeof sandbox.module, "undefined");
    assert.equal(typeof sandbox.require, "undefined");
    assert.equal(
      typeof sandbox[spec.global],
      "object",
      spec.file + " should install window." + spec.global
    );
  });
});

test("SunTransit checker entry points exist after window load", function () {
  var sandbox = loadInWindow("js/sun-transit.js");
  assert.equal(typeof sandbox.SunTransit.checkInterference, "function");
  assert.equal(typeof sandbox.SunTransit.evaluateGeometry, "function");
  assert.equal(typeof sandbox.SunTransit.lookAngles, "function");
  assert.ok(sandbox.SunTransit.MACAE);
});
