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
