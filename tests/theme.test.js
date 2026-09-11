"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var Theme = require(path.join(__dirname, "..", "js", "theme.js"));

function fakeStorage(seed) {
  var store = seed || {};
  return {
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem: function (k, v) {
      store[k] = String(v);
    },
    dump: store
  };
}

function fakeDoc() {
  var attrs = {};
  return {
    documentElement: {
      setAttribute: function (k, v) {
        attrs[k] = v;
      },
      attrs: attrs
    }
  };
}

test("dark is the brand default; unknown values normalize to dark", function () {
  assert.equal(Theme.DEFAULT_THEME, "dark");
  assert.deepEqual(Theme.THEMES, ["dark", "light", "system"]);
  assert.equal(Theme.normalizeTheme("light"), "light");
  assert.equal(Theme.normalizeTheme("system"), "system");
  assert.equal(Theme.normalizeTheme("solarized"), "dark");
  assert.equal(Theme.normalizeTheme(null), "dark");
});

test("setTheme applies data-theme and persists to storage", function () {
  var doc = fakeDoc();
  var storage = fakeStorage();
  var applied = Theme.setTheme("light", { doc: doc, storage: storage });
  assert.equal(applied, "light");
  assert.equal(doc.documentElement.attrs["data-theme"], "light");
  assert.equal(storage.dump[Theme.STORAGE_KEY], "light");
});

test("initTheme restores a persisted choice", function () {
  var doc = fakeDoc();
  var storage = fakeStorage();
  storage.setItem(Theme.STORAGE_KEY, "light");
  assert.equal(Theme.initTheme({ doc: doc, storage: storage }), "light");
  assert.equal(doc.documentElement.attrs["data-theme"], "light");
});

test("initTheme falls back to dark on empty, garbage, or broken storage", function () {
  var doc = fakeDoc();
  assert.equal(Theme.initTheme({ doc: doc, storage: fakeStorage() }), "dark");
  var garbage = fakeStorage();
  garbage.setItem(Theme.STORAGE_KEY, "hotdog-stand");
  assert.equal(Theme.initTheme({ doc: doc, storage: garbage }), "dark");
  var throwing = {
    getItem: function () {
      throw new Error("private mode");
    },
    setItem: function () {
      throw new Error("private mode");
    }
  };
  assert.equal(Theme.initTheme({ doc: doc, storage: throwing }), "dark");
  assert.equal(Theme.persistTheme("light", throwing), false);
  assert.equal(Theme.initTheme({ doc: doc, storage: null }), "dark");
});

test("readStoredTheme only returns valid themes", function () {
  var s = fakeStorage();
  assert.equal(Theme.readStoredTheme(s), null);
  s.setItem(Theme.STORAGE_KEY, "system");
  assert.equal(Theme.readStoredTheme(s), "system");
  s.setItem(Theme.STORAGE_KEY, "blue");
  assert.equal(Theme.readStoredTheme(s), null);
});
