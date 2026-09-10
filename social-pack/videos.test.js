"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var { spawnSync } = require("child_process");

var dir = path.join(__dirname, "videos");
var en = path.join(dir, "geometry-of-sun-outages-rhuanssauro.mp4");
var pt = path.join(dir, "interferencia-solar-geo-rhuanssauro.mp4");
var scratch = process.env.SOCIAL_SCRATCH || path.join(__dirname, ".last-frames");

function probeDuration(file) {
  var r = spawnSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1",
    file
  ], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  var d = Number(r.stdout.trim());
  assert.ok(d > 10, "duration too short: " + d);
  return d;
}

function extractLast(file, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  var r = spawnSync("ffmpeg", ["-y", "-sseof", "-1", "-i", file, "-frames:v", "1", dest], {
    encoding: "utf8"
  });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(dest) && fs.statSync(dest).size > 1000);
}

function centerIsNotWhiteGeminiCard(png) {
  var r = spawnSync("ffprobe", [
    "-v", "error",
    "-f", "lavfi",
    "-i", "movie=" + png + ",crop=400:80:440:320,signalstats",
    "-show_entries", "frame_tags=lavfi.signalstats.YAVG",
    "-of", "default=nw=1:nk=1"
  ], { encoding: "utf8" });
  var y = Number((r.stdout || "").trim().split("\n").pop());
  if (!isFinite(y)) {
    var ident = spawnSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", png], { encoding: "utf8" });
    assert.ok(ident.status === 0);
    var size = fs.statSync(png).size;
    assert.ok(size > 40000, "last frame too small/white-like: " + size);
    return;
  }
  assert.ok(y < 200, "last-frame center still looks like the white Gemini card, YAVG=" + y);
}

test("EN curated video has duration and last frame is not the Gemini Notebook card", function () {
  probeDuration(en);
  var dest = path.join(scratch, "test-en-last.png");
  extractLast(en, dest);
  centerIsNotWhiteGeminiCard(dest);
});

test("PT curated video has duration and last frame is not the Gemini Notebook card", function () {
  probeDuration(pt);
  var dest = path.join(scratch, "test-pt-last.png");
  extractLast(pt, dest);
  centerIsNotWhiteGeminiCard(dest);
});
