"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var Place = require("../js/place.js");
var app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("Google Maps embed pins the given coordinates without an API key in the URL", function () {
  var url = Place.mapsEmbedUrl(-22.37, -41.79);
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/embed\?/);
  assert.match(url, /origin=mfe/);
  assert.match(url, /-22\.37000,-41\.79000/);
  assert.equal(/key=/.test(url), false);
  assert.equal(/AIza/.test(url), false);
});

test("Google Maps open link uses the official search URL", function () {
  var url = Place.mapsOpenUrl(-22.37, -41.79);
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/search\/\?/);
  assert.match(url, /query=-22\.37000%2C-41\.79000/);
});

test("Open-Meteo weather and geocode URLs are keyless", function () {
  var w = Place.weatherUrl(-22.37, -41.79);
  assert.match(w, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
  assert.match(w, /latitude=-22\.37000/);
  assert.match(w, /longitude=-41\.79000/);
  assert.equal(/key=/.test(w), false);
  var g = Place.geocodeUrl("Macaé");
  assert.match(g, /^https:\/\/geocoding-api\.open-meteo\.com\/v1\/search\?/);
  assert.match(g, /name=/);
  assert.equal(Place.geocodeUrl(" "), "");
});

test("weather parser maps WMO codes and geocode parser builds a place name", function () {
  assert.equal(Place.weatherLabel(3), "Overcast");
  var wx = Place.parseWeather({
    timezone: "America/Sao_Paulo",
    current: {
      temperature_2m: 31.3,
      relative_humidity_2m: 55,
      weather_code: 3,
      cloud_cover: 95,
      wind_speed_10m: 16.3,
      wind_direction_10m: 340,
      precipitation: 0,
      time: "2026-09-10T14:15"
    }
  });
  assert.equal(wx.weather, "Overcast");
  assert.equal(wx.windDir, "N");
  assert.equal(wx.temperatureC, 31.3);
  var hit = Place.parseGeocode({
    results: [
      {
        name: "Macaé",
        latitude: -22.38484,
        longitude: -41.78324,
        admin1: "Rio de Janeiro",
        country: "Brazil"
      }
    ]
  });
  assert.equal(hit.name, "Macaé, Rio de Janeiro, Brazil");
  assert.equal(hit.lat, -22.38484);
});

test("dashboard wires the map iframe and does not ship a Maps API key", function () {
  assert.match(html, /id="site-map"/);
  assert.match(html, /id="gmaps-open"/);
  assert.match(html, /id="site-lookup"/);
  assert.match(html, /id="wx-facts"/);
  assert.match(html, /js\/place\.js/);
  assert.match(html, /developers\.google\.com\/maps/);
  assert.match(html, /open-meteo\.com/);
  assert.match(html, /public-apis\/public-apis/);
  assert.equal(/AIza[0-9A-Za-z_-]{20,}/.test(html + app), false);
  assert.match(app, /SitePlace\.mapsEmbedUrl/);
  assert.match(app, /SitePlace\.weatherUrl/);
});
