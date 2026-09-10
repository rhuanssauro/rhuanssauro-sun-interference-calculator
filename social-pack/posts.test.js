"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var dir = path.join(__dirname, "posts");
var linkedin = fs.readFileSync(path.join(dir, "linkedin.md"), "utf8");
var instagram = fs.readFileSync(path.join(dir, "instagram.md"), "utf8");
var all = linkedin + "\n" + instagram;

var REQUIRED = [
  "https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator",
  "https://my.intelsat.com/si/public/",
  "https://www.hispasat.com/en/useful-information/solar-interference-calculator",
  "https://app.telesat.com/sun-transit-calculator",
  "https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1525-1-200209-I!!PDF-E.pdf",
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json"
];

var SLOP = /\b(delve|leverage|utilize|game[- ]changer|paradigm shift|tapestry|testament|underscore|pivotal|cutting-edge|supercharge)\b/i;

function lastNonEmptyLine(text) {
  var lines = text.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
  return lines[lines.length - 1];
}

test("LinkedIn has PT-BR and EN-US sections", function () {
  assert.match(linkedin, /^## PT-BR\s*$/m);
  assert.match(linkedin, /^## EN-US\s*$/m);
  var pt = linkedin.indexOf("## PT-BR");
  var en = linkedin.indexOf("## EN-US");
  assert.ok(pt >= 0 && en > pt);
});

test("Instagram has PT-BR and EN-US sections", function () {
  assert.match(instagram, /^## PT-BR\s*$/m);
  assert.match(instagram, /^## EN-US\s*$/m);
});

test("official sources and GitHub URL are present", function () {
  REQUIRED.forEach(function (url) {
    assert.ok(linkedin.indexOf(url) !== -1, "linkedin missing " + url);
    assert.ok(instagram.indexOf(url) !== -1, "instagram missing " + url);
  });
});

test("GitHub repo URL is the last non-empty line of each post", function () {
  var repo = "https://github.com/rhuanssauro/rhuanssauro-sun-interference-calculator";
  assert.equal(lastNonEmptyLine(linkedin), repo);
  assert.equal(lastNonEmptyLine(instagram), repo);
});

test("no Speedcast, NotebookLM, personal email, or slop stack", function () {
  assert.equal(/speedcast/i.test(all), false);
  assert.equal(/notebooklm\.google\.com/i.test(all), false);
  assert.equal(/icloud\.com/i.test(all), false);
  assert.equal(SLOP.test(all), false);
  assert.equal(/[—–]/.test(all), false);
});
