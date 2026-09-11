"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var Clock = require(path.join(__dirname, "..", "js", "clock.js"));

test("formatUtc shows ISO date, space separator, and milliseconds", function () {
  var d = new Date("2026-09-10T17:47:47.961Z");
  assert.equal(Clock.formatUtc(d), "2026-09-10 17:47:47.961Z");
  assert.equal(Clock.formatUtc(d.getTime()), "2026-09-10 17:47:47.961Z");
  assert.equal(Clock.formatUtc(new Date("nope")), "—");
});

test("formatUtcSeconds drops milliseconds for check stamps", function () {
  assert.equal(Clock.formatUtcSeconds(new Date("2026-09-10T12:51:00.123Z")), "2026-09-10 12:51:00Z");
  assert.equal(Clock.formatUtcSeconds("2026-09-10T12:51:00.000Z"), "2026-09-10 12:51:00Z");
});

test("startTicker paints immediately, repaints on tick, and stop clears", function () {
  var el = { textContent: "" };
  var scheduled = null;
  var cleared = null;
  var t = Date.parse("2026-09-10T17:47:47.961Z");
  var ticker = Clock.startTicker(el, {
    tickMs: 1000,
    now: function () {
      return t;
    },
    setInterval: function (fn, ms) {
      scheduled = { fn: fn, ms: ms };
      return 42;
    },
    clearInterval: function (h) {
      cleared = h;
    }
  });
  assert.equal(el.textContent, "2026-09-10 17:47:47.961Z");
  assert.equal(scheduled.ms, 1000);
  t += 1039;
  scheduled.fn();
  assert.equal(el.textContent, "2026-09-10 17:47:49.000Z");
  ticker.stop();
  assert.equal(cleared, 42);
});

test("startTicker default cadence is ~1 Hz and null element is a no-op", function () {
  assert.equal(Clock.DEFAULT_TICK_MS, 1000);
  var ticker = Clock.startTicker(null, {});
  assert.equal(typeof ticker.stop, "function");
  ticker.stop();
});
