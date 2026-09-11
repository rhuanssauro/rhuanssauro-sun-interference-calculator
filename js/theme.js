/**
 * Dark / light / system theme selection. Applied as data-theme on <html>;
 * css/dashboard.css maps each value to a token set. Dark is the brand
 * default. Choice persists in localStorage. Pure helpers are Node-testable;
 * DOM/storage handles are injectable.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ThemeControl = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STORAGE_KEY = "rhuanssauro-sun-theme";
  var THEMES = ["dark", "light", "system"];
  var DEFAULT_THEME = "dark";

  function isTheme(value) {
    return THEMES.indexOf(value) !== -1;
  }

  /** Any unknown / legacy stored value falls back to the brand default. */
  function normalizeTheme(value) {
    return isTheme(value) ? value : DEFAULT_THEME;
  }

  function readStoredTheme(storage) {
    if (!storage || typeof storage.getItem !== "function") return null;
    try {
      var raw = storage.getItem(STORAGE_KEY);
      return isTheme(raw) ? raw : null;
    } catch (e) {
      return null;
    }
  }

  function persistTheme(theme, storage) {
    if (!storage || typeof storage.setItem !== "function") return false;
    try {
      storage.setItem(STORAGE_KEY, normalizeTheme(theme));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Set data-theme on the document element. Returns the applied theme. */
  function applyTheme(theme, doc) {
    var t = normalizeTheme(theme);
    var d = doc || (typeof document !== "undefined" ? document : null);
    if (d && d.documentElement && typeof d.documentElement.setAttribute === "function") {
      d.documentElement.setAttribute("data-theme", t);
    }
    return t;
  }

  /** Apply + persist in one step (button handler entry point). */
  function setTheme(theme, opts) {
    opts = opts || {};
    var storage =
      opts.storage !== undefined
        ? opts.storage
        : typeof localStorage !== "undefined"
          ? localStorage
          : null;
    var t = applyTheme(theme, opts.doc);
    persistTheme(t, storage);
    return t;
  }

  /** Restore the persisted theme (or default) on page load. */
  function initTheme(opts) {
    opts = opts || {};
    var storage =
      opts.storage !== undefined
        ? opts.storage
        : typeof localStorage !== "undefined"
          ? localStorage
          : null;
    var stored = readStoredTheme(storage);
    return applyTheme(stored || DEFAULT_THEME, opts.doc);
  }

  /**
   * Wire a group of buttons carrying data-theme-choice. Reflects the
   * current selection with aria-pressed so the control reads as a
   * segmented toggle to assistive tech.
   */
  function bindControl(container, opts) {
    if (!container || typeof container.querySelectorAll !== "function") return null;
    var buttons = container.querySelectorAll("[data-theme-choice]");
    function reflect(current) {
      var i;
      for (i = 0; i < buttons.length; i++) {
        var choice = buttons[i].getAttribute("data-theme-choice");
        buttons[i].setAttribute("aria-pressed", choice === current ? "true" : "false");
      }
    }
    var i;
    for (i = 0; i < buttons.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          reflect(setTheme(btn.getAttribute("data-theme-choice"), opts));
        });
      })(buttons[i]);
    }
    reflect(initTheme(opts));
    return { reflect: reflect };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    THEMES: THEMES,
    DEFAULT_THEME: DEFAULT_THEME,
    isTheme: isTheme,
    normalizeTheme: normalizeTheme,
    readStoredTheme: readStoredTheme,
    persistTheme: persistTheme,
    applyTheme: applyTheme,
    setTheme: setTheme,
    initTheme: initTheme,
    bindControl: bindControl
  };
});
