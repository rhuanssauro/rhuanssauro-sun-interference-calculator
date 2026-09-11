/**
 * Live UTC header clock. Formatting is pure (Node-testable); the ticker
 * only runs when a DOM element is handed to it. ~1 Hz by default —
 * a steady digit change, no animation, so prefers-reduced-motion is
 * honored without special-casing (the time itself must keep moving).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.UtcClock = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DEFAULT_TICK_MS = 1000;

  /** "2026-09-10 17:47:47.961Z" — ISO date + space + time with ms. */
  function formatUtc(date) {
    var d = date instanceof Date ? date : new Date(date == null ? Date.now() : date);
    if (isNaN(d.getTime())) return "—";
    return d.toISOString().replace("T", " ");
  }

  /** "2026-09-10 17:47:47Z" — check stamps do not need milliseconds. */
  function formatUtcSeconds(date) {
    var s = formatUtc(date);
    if (s === "—") return s;
    return s.replace(/\.\d{3}Z$/, "Z");
  }

  /**
   * Start driving `el.textContent` with the live UTC time.
   * opts.tickMs (default 1000) and opts.now (default Date.now) are
   * injectable for tests. Returns { stop } — stop() clears the interval.
   */
  function startTicker(el, opts) {
    opts = opts || {};
    var tickMs = opts.tickMs > 0 ? opts.tickMs : DEFAULT_TICK_MS;
    var now = typeof opts.now === "function" ? opts.now : Date.now;
    var setI = opts.setInterval || (typeof setInterval === "function" ? setInterval : null);
    var clearI = opts.clearInterval || (typeof clearInterval === "function" ? clearInterval : null);
    if (!el || !setI) return { stop: function () {} };

    function paint() {
      el.textContent = formatUtc(now());
    }
    paint();
    var handle = setI(paint, tickMs);
    return {
      stop: function () {
        if (clearI && handle != null) clearI(handle);
        handle = null;
      }
    };
  }

  return {
    DEFAULT_TICK_MS: DEFAULT_TICK_MS,
    formatUtc: formatUtc,
    formatUtcSeconds: formatUtcSeconds,
    startTicker: startTicker
  };
});
