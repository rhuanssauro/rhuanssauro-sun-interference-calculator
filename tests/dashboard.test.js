"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var vm = require("node:vm");

function dashboard(fetcher, protocol) {
  var nodes = {};
  var doc = { activeElement: null };
  function element(id) {
    var attrs = {};
    var listeners = {};
    var classes = new Set();
    var el = {
      id: id, value: "", textContent: "", innerHTML: "", dataset: {}, children: [],
      disabled: false,
      classList: {
        toggle: function (name, on) { if (on) classes.add(name); else classes.delete(name); },
        contains: function (name) { return classes.has(name); }
      },
      getAttribute: function (name) { return attrs[name] || null; },
      setAttribute: function (name, value) { attrs[name] = String(value); },
      removeAttribute: function (name) { delete attrs[name]; },
      appendChild: function (child) { child.parentElement = el; el.children.push(child); },
      addEventListener: function (type, fn) { (listeners[type] || (listeners[type] = [])).push(fn); },
      emit: function (type) { (listeners[type] || []).forEach(function (fn) { fn({ target: el }); }); },
      querySelector: function () { return null; },
      querySelectorAll: function () { return el.children; },
      contains: function (child) { return el.children.indexOf(child) >= 0; },
      focus: function () { doc.activeElement = el; }
    };
    return el;
  }
  ["site-lat", "site-lon", "site-name", "site-preset", "site-lookup", "ant-d", "band", "freq", "carrier",
    "hemisphere", "hemisphere-status", "form-error", "lookup-status", "sat-select", "run-check", "verdict",
    "result-summary", "verdict-detail", "window-table", "export-csv", "export-html", "export-pdf", "last-check",
    "catalog-meta", "drop-zone", "drop-sat-name", "drop-sat-meta", "belt-count", "belt-track", "vendor-rail", "wx-facts"
  ].forEach(function (id) { nodes[id] = element(id); });
  nodes.hemisphere.value = "auto";
  doc.getElementById = function (id) { return nodes[id] || null; };
  doc.createElement = function () { return element(""); };
  var sandbox = {
    document: doc, location: { protocol: protocol || "file:" }, console: console,
    setTimeout: setTimeout, clearTimeout: clearTimeout, AbortController: AbortController,
    fetch: fetcher || function () { return Promise.reject(new Error("offline")); }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  ["data/geo-snapshot.js", "js/sun-transit.js", "js/catalog.js", "js/place.js", "js/export-report.js", "js/app.js"].forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), sandbox, { filename: file });
  });
  return { api: sandbox.SunDashboard, nodes: nodes, sandbox: sandbox, document: doc };
}

test("hemisphere mismatch blocks calculation and clears the previous export and details", async function () {
  var page = dashboard();
  await page.api.init();
  assert.equal(page.nodes["export-csv"].disabled, false);
  page.nodes.hemisphere.value = "north";
  page.nodes.hemisphere.emit("change");
  assert.equal(page.api.state.result, null);
  assert.equal(page.nodes["export-csv"].disabled, true);
  assert.equal(page.nodes["verdict-detail"].innerHTML, "");
  assert.equal(page.nodes["window-table"].innerHTML, "");
  assert.equal(page.nodes.hemisphere.getAttribute("aria-invalid"), "true");
  assert.match(page.nodes["form-error"].textContent, /Northern.*positive|positive.*Northern/i);
  assert.equal(page.nodes["site-lat"].value, "-22.37");
});

test("snapshot calculation is usable while live catalog is pending and refresh never changes the current report", async function () {
  var finishLive;
  var page = dashboard(function (url) {
    if (url.indexOf("celestrak") >= 0) return new Promise(function (resolve) { finishLive = resolve; });
    return Promise.reject(new Error("offline"));
  }, "http:");
  var timer;
  try {
    await Promise.race([page.api.init(), new Promise(function (_, reject) {
      timer = setTimeout(function () { reject(new Error("snapshot blocked by live fetch")); }, 1000);
    })]);
  } finally { clearTimeout(timer); }
  assert.ok(page.api.state.result);
  var currentResult = page.api.state.result;
  var currentSat = page.api.state.satellite;
  var currentCatalog = page.api.state.catalog;
  assert.equal(typeof finishLive, "function");
  finishLive({ ok: true, json: function () { return Promise.resolve([{
    OBJECT_NAME: currentSat.name, NORAD_CAT_ID: currentSat.norad, EPOCH: "2026-09-12T00:00:00", MEAN_MOTION: 1.0027,
    INCLINATION: 0, RA_OF_ASC_NODE: 30, ARG_OF_PERICENTER: 0, MEAN_ANOMALY: 0
  }]); } });
  await new Promise(setImmediate);
  assert.equal(page.api.state.result, currentResult);
  assert.equal(page.api.state.satellite, currentSat);
  assert.equal(page.api.state.catalog, currentCatalog);
  assert.match(page.nodes["catalog-meta"].textContent, /next calculation/i);
  page.nodes["site-lat"].value = "-23";
  page.nodes["site-lat"].emit("input");
  assert.equal(page.api.state.result, null);
  assert.equal(page.nodes["export-html"].disabled, true);
  page.api.runCheck();
  assert.equal(page.api.state.satellite.id, currentSat.id);
  assert.notEqual(page.api.state.catalog, currentCatalog);
});

test("place lookup cannot overwrite newer station inputs and a confirmed match resets hemisphere to Auto", async function () {
  var finishLookup;
  var page = dashboard(function (url) {
    if (url.indexOf("geocoding-api") >= 0) return new Promise(function (resolve) { finishLookup = resolve; });
    return Promise.reject(new Error("offline"));
  }, "http:");
  await page.api.init();
  page.nodes["site-name"].value = "Bogota";
  page.nodes["site-name"].emit("input");
  page.api.lookupPlace();
  assert.match(page.nodes["lookup-status"].textContent, /looking|searching/i);
  page.nodes["site-lat"].value = "-24";
  page.nodes["site-lat"].emit("input");
  var response = { ok: true, json: function () { return Promise.resolve({ results: [{ name: "Bogotá", latitude: 4.711, longitude: -74.0721, country: "Colombia" }] }); } };
  finishLookup(response);
  await new Promise(setImmediate);
  assert.equal(page.nodes["site-lat"].value, "-24");
  assert.equal(page.nodes["site-name"].value, "Bogota");
  assert.equal(page.nodes["export-csv"].disabled, true);
  page.nodes.hemisphere.value = "south";
  page.api.lookupPlace();
  finishLookup(response);
  await new Promise(setImmediate);
  assert.equal(page.nodes.hemisphere.value, "auto");
  assert.equal(page.api.state.site.lat, 4.711);
  assert.match(page.nodes["hemisphere-status"].textContent, /Northern/);
  assert.match(page.nodes["lookup-status"].textContent, /Found Bogotá.*Confirm/);
  assert.equal(page.nodes["site-lookup"].disabled, false);
});

test("failed place lookup replaces the loading verdict without restoring stale exports or overwriting newer results", async function () {
  var failLookup;
  var page = dashboard(function (url) {
    if (url.indexOf("geocoding-api") >= 0) return new Promise(function (_, reject) { failLookup = reject; });
    return Promise.reject(new Error("offline"));
  }, "http:");
  await page.api.init();
  assert.ok(page.api.state.result);
  page.nodes["site-name"].value = "Bogota";
  var pending = page.api.lookupPlace();
  assert.match(page.nodes.verdict.textContent, /looking up/i);
  failLookup(new Error("Failed to fetch"));
  await pending;
  assert.match(page.nodes.verdict.textContent, /lookup unavailable.*coordinates manually.*preset/i);
  assert.doesNotMatch(page.nodes.verdict.textContent, /looking up/i);
  assert.equal(page.api.state.result, null);
  ["export-csv", "export-html", "export-pdf"].forEach(function (id) {
    assert.equal(page.nodes[id].disabled, true);
  });
  ["verdict-detail", "window-table", "result-summary"].forEach(function (id) {
    assert.equal(page.nodes[id].innerHTML, "");
  });
  assert.equal(page.nodes["site-lat"].value, "-22.37");
  assert.equal(page.nodes["site-lookup"].disabled, false);

  pending = page.api.lookupPlace();
  page.nodes["site-lat"].value = "4.711";
  page.nodes["site-lat"].emit("input");
  page.nodes["site-lat"].emit("change");
  var currentResult = page.api.state.result;
  var currentVerdict = page.nodes.verdict.textContent;
  assert.ok(currentResult);
  failLookup(new Error("Late lookup failure"));
  await pending;
  assert.equal(page.api.state.result, currentResult);
  assert.equal(page.nodes.verdict.textContent, currentVerdict);
  assert.equal(page.nodes["lookup-status"].textContent, "");
  assert.equal(page.nodes["export-csv"].disabled, false);
});

test("Calculate, RF changes and satellite selection supersede a pending place lookup", async function () {
  var failLookup;
  var page = dashboard(function (url) {
    if (url.indexOf("geocoding-api") >= 0) return new Promise(function (_, reject) { failLookup = reject; });
    return Promise.reject(new Error("offline"));
  }, "http:");
  await page.api.init();
  var actions = [
    function () { page.nodes["run-check"].emit("click"); },
    function () { page.nodes["ant-d"].value = "2.4"; page.nodes["ant-d"].emit("change"); },
    function () { page.nodes["vendor-rail"].children[1].emit("click"); }
  ];
  for (var action of actions) {
    var pending = page.api.lookupPlace();
    action();
    var currentResult = page.api.state.result;
    var currentVerdict = page.nodes.verdict.textContent;
    assert.ok(currentResult);
    failLookup(new Error("Late lookup failure"));
    await pending;
    assert.equal(page.api.state.result, currentResult);
    assert.equal(page.nodes.verdict.textContent, currentVerdict);
    assert.equal(page.nodes["lookup-status"].textContent, "");
    assert.equal(page.nodes["site-lookup"].disabled, false);
    ["export-csv", "export-html", "export-pdf"].forEach(function (id) {
      assert.equal(page.nodes[id].disabled, false);
    });
  }
});

test("strict numeric input validation rejects malformed, unbounded and nonpositive RF values", async function () {
  var page = dashboard();
  await page.api.init();
  [
    ["site-lat", ""], ["site-lat", " "], ["site-lat", "12garbage"], ["site-lat", "91"], ["site-lat", "-91"],
    ["site-lon", "181"], ["site-lon", "-181"], ["site-lon", "Infinity"], ["site-lon", "0x20"],
    ["ant-d", "Infinity"], ["ant-d", "0"], ["ant-d", "-1"],
    ["freq", "NaN"], ["freq", "1e309"], ["freq", "-3"], ["freq", "0"], ["freq", "11 GHz"],
    ["carrier", "-36"], ["carrier", "0"], ["carrier", "Infinity"], ["carrier", "36MHz"]
  ].forEach(function (entry) {
    var el = page.nodes[entry[0]];
    var original = el.value;
    el.value = entry[1];
    el.emit("input");
    assert.equal(page.api.state.result, null, entry.join(":"));
    assert.equal(page.nodes["export-csv"].disabled, true);
    page.api.runCheck();
    assert.equal(el.getAttribute("aria-invalid"), "true", entry.join(":"));
    assert.match(el.getAttribute("aria-describedby"), /form-error/);
    el.value = original;
  });
  page.api.runCheck();
  assert.ok(page.api.state.result);
  assert.equal(page.nodes["form-error"].textContent, "");
});

test("Auto covers both hemispheres and Equator while explicit choices never flip coordinates", async function () {
  var page = dashboard();
  await page.api.init();
  assert.match(page.nodes["hemisphere-status"].textContent, /Southern/);
  page.nodes.hemisphere.value = "north";
  page.nodes["site-preset"].value = "4";
  page.nodes["site-preset"].emit("change");
  assert.equal(page.nodes.hemisphere.value, "auto");
  assert.equal(page.api.state.site.lat, 4.711);
  assert.match(page.nodes["hemisphere-status"].textContent, /Northern/);
  page.nodes.hemisphere.value = "south";
  page.nodes.hemisphere.emit("change");
  assert.equal(page.api.state.result, null);
  assert.equal(page.nodes["site-lat"].value, "4.711");
  assert.match(page.nodes["form-error"].textContent, /negative/);
  page.nodes["site-lat"].value = "-5";
  page.nodes["site-lat"].emit("change");
  assert.equal(page.nodes.hemisphere.value, "south");
  assert.ok(page.api.state.result);
  page.nodes.hemisphere.value = "auto";
  page.nodes["site-lat"].value = "0";
  page.api.runCheck();
  assert.match(page.nodes["hemisphere-status"].textContent, /Equator/);
  assert.ok(page.api.state.result);
});

test("selecting a catalog chip preserves its focus and marks selection without replacing the chip", async function () {
  var page = dashboard();
  await page.api.init();
  var chip = page.nodes["vendor-rail"].children[1];
  chip.focus();
  chip.emit("click");
  assert.equal(page.document.activeElement, chip);
  assert.equal(page.nodes["vendor-rail"].children[1], chip);
  assert.equal(chip.getAttribute("aria-pressed"), "true");
  assert.equal(page.api.state.satellite.id, chip.dataset.id);
  page.nodes["site-lat"].value = "";
  page.nodes["site-lat"].emit("input");
  var next = page.nodes["vendor-rail"].children[2];
  next.emit("click");
  assert.equal(next.getAttribute("aria-pressed"), "true");
  assert.equal(chip.getAttribute("aria-pressed"), "false");
  assert.equal(page.nodes["drop-sat-name"].textContent, page.api.state.satellite.displayName);
  assert.equal(page.api.state.result, null);
});

test("a live refresh missing the selected favorite retains the coherent snapshot context", async function () {
  var page = dashboard(function (url) {
    if (url.indexOf("celestrak") >= 0) return Promise.resolve({ ok: true, json: function () { return Promise.resolve([{
      OBJECT_NAME: "OTHER SATELLITE", NORAD_CAT_ID: 999, EPOCH: "2026-09-12T00:00:00", MEAN_MOTION: 1.0027,
      INCLINATION: 0, RA_OF_ASC_NODE: 30, ARG_OF_PERICENTER: 0, MEAN_ANOMALY: 0
    }]); } });
    return Promise.reject(new Error("offline"));
  }, "http:");
  await page.api.init();
  var catalog = page.api.state.catalog;
  var sat = page.api.state.satellite;
  await new Promise(setImmediate);
  page.api.runCheck();
  assert.ok(page.api.state.catalog === catalog, "retain catalog identity when selected satellite is missing from refresh");
  assert.equal(page.api.state.satellite, sat);
  assert.match(page.nodes["sat-select"].innerHTML, /value="is37e-c"/);
  assert.match(page.nodes["catalog-meta"].textContent, /selected satellite.*snapshot|snapshot.*selected satellite/i);
});

test("catalog and place requests time out without disabling manual calculation", async function () {
  var page = dashboard(function () { return new Promise(function () {}); }, "http:");
  page.sandbox.setTimeout = function (fn) { return setTimeout(fn, 10); };
  await page.api.init();
  page.nodes["site-name"].value = "Bogota";
  await page.api.lookupPlace();
  assert.match(page.nodes["lookup-status"].textContent, /timed out.*manually/i);
  assert.equal(page.nodes["site-lookup"].disabled, false);
  assert.match(page.nodes["wx-facts"].innerHTML, /timed out/i);
  assert.match(page.nodes["catalog-meta"].textContent, /live refresh unavailable/i);
  page.api.runCheck();
  assert.ok(page.api.state.result);
  assert.equal(page.nodes["export-pdf"].disabled, false);
});
