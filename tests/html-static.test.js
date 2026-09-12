"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
var app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
var css = fs.readFileSync(path.join(__dirname, "..", "css", "dashboard.css"), "utf8");
var sources = fs.readFileSync(path.join(__dirname, "..", "data", "SOURCES.md"), "utf8");

test("HTML cites official owner calculators and Celestrak", function () {
  assert.match(html, /https:\/\/my\.intelsat\.com\/si\/public\//);
  assert.match(html, /https:\/\/www\.hispasat\.com\/en\/useful-information\/solar-interference-calculator/);
  assert.match(html, /https:\/\/app\.telesat\.com\/sun-transit-calculator/);
  assert.match(html, /Celestrak/);
  assert.match(sources, /my\.intelsat\.com\/si\/public/);
});

test("HTML defaults to Macaé and uses a satellite select, not drag-and-drop", function () {
  assert.match(html, /Macaé/);
  assert.match(html, /value="-22\.37"/);
  assert.match(html, /value="-41\.79"/);
  assert.match(html, /id="sat-select"/);
  assert.match(html, /id="freq"/);
  assert.equal(/id="freq-out"/.test(html), false);
  assert.equal(/id="freq-in"/.test(html), false);
  assert.match(html, />Frequency\s/);
  assert.match(html, /id="carrier"/);
  assert.match(html, /id="site-map"/);
  assert.match(html, /id="site-lookup"/);
  assert.equal(/notebooklm\.google\.com/.test(html), false);
  assert.match(html, /Rhuanssauro/);
  assert.match(html, /a datacenter in the jungle/);
  assert.match(html, /rhuanssauro-tech-watermark-no-background\.png/);
  assert.match(html, /claw-mark/);
  assert.equal(/claw-scratch/.test(html), false);
  assert.equal(/dragstart/.test(app), false);
  assert.match(app, /Intelsat 37e/);
  assert.match(app, /Telesat T-19/);
  assert.match(app, /Hispasat H36W/);
  assert.match(app, /INTELSAT 10-02/);
});

test("styles are OKLCH and not cream-SaaS", function () {
  assert.match(css, /oklch\(0\.1 0 0\)/);
  assert.equal(/oklch\(0\.9[0-9].*7[0-9]/.test(css), false);
});

test("brand and focused skip links keep 44px minimum targets", function () {
  var wordmark = css.match(/\.wordmark\s*\{([^}]+)\}/)[1];
  var skip = css.match(/\.skip:focus\s*\{([^}]+)\}/)[1];
  assert.match(wordmark, /min-height:\s*44px/);
  assert.match(skip, /min-height:\s*44px/);
  assert.match(skip, /display:\s*inline-flex/);
  assert.match(skip, /align-items:\s*center/);
});

test("header has a live UTC clock plus a separate last-check stamp", function () {
  assert.match(html, /id="utc-clock"/);
  assert.match(html, /UTC now/);
  assert.match(html, /id="last-check"/);
  assert.match(html, /id="catalog-meta"/);
  assert.match(html, /js\/clock\.js/);
  // catalog meta must stay the catalog fetch stamp, not the live clock
  assert.match(app, /renderCatalogMeta/);
  assert.equal(/catalog-meta[^]{0,200}UtcClock/.test(app), false);
});

test("theme switch is present, persisted, and themed via data-theme tokens", function () {
  assert.match(html, /data-theme-choice="dark"/);
  assert.match(html, /data-theme-choice="light"/);
  assert.match(html, /data-theme-choice="system"/);
  assert.match(html, /js\/theme\.js/);
  assert.match(css, /html\[data-theme="light"\]/);
  assert.match(css, /prefers-color-scheme: light/);
  var theme = fs.readFileSync(path.join(__dirname, "..", "js", "theme.js"), "utf8");
  assert.match(theme, /localStorage/);
});

test("export chips exist and the export module is wired", function () {
  assert.match(html, /id="export-csv"/);
  assert.match(html, /id="export-html"/);
  assert.match(html, /id="export-pdf"/);
  assert.match(html, /js\/export-report\.js/);
  assert.match(html, /assets\/watermark-data\.js/);
  assert.match(app, /SunExport\.toCsv/);
  assert.match(app, /SunExport\.toHtmlReport/);
  assert.match(app, /SunExport\.openPrintableReport/);
});
