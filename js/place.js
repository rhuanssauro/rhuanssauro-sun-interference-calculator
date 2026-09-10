/**
 * Site pin (Google Maps) and weather (Open-Meteo).
 * APIs from https://github.com/public-apis/public-apis — Geocoding / Weather.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SitePlace = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var WMO = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail"
  };

  function canFetch() {
    return typeof location === "undefined" || location.protocol !== "file:";
  }

  function fmtCoord(n, digits) {
    var x = Number(n);
    if (!isFinite(x)) return null;
    return x.toFixed(digits == null ? 5 : digits);
  }

  function mapsEmbedUrl(lat, lon) {
    var a = fmtCoord(lat, 5);
    var o = fmtCoord(lon, 5);
    if (!a || !o) return "";
    return "https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1s" + a + "," + o;
  }

  function mapsOpenUrl(lat, lon) {
    var a = fmtCoord(lat, 5);
    var o = fmtCoord(lon, 5);
    if (!a || !o) return "";
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(a + "," + o);
  }

  function weatherUrl(lat, lon) {
    var a = fmtCoord(lat, 5);
    var o = fmtCoord(lon, 5);
    if (!a || !o) return "";
    return (
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      a +
      "&longitude=" +
      o +
      "&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation" +
      "&timezone=auto"
    );
  }

  function geocodeUrl(name) {
    var q = String(name || "").trim();
    if (q.length < 2) return "";
    return (
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(q) +
      "&count=1&language=en&format=json"
    );
  }

  function weatherLabel(code) {
    var n = Number(code);
    if (!isFinite(n)) return "—";
    return WMO[n] || "WMO " + n;
  }

  function compass(deg) {
    var d = Number(deg);
    if (!isFinite(d)) return "—";
    var pts = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return pts[Math.round(((d % 360) + 360) % 360 / 45) % 8];
  }

  function parseWeather(json) {
    var c = json && json.current;
    if (!c) return null;
    return {
      temperatureC: c.temperature_2m,
      humidityPct: c.relative_humidity_2m,
      weatherCode: c.weather_code,
      weather: weatherLabel(c.weather_code),
      cloudPct: c.cloud_cover,
      windKmh: c.wind_speed_10m,
      windDir: compass(c.wind_direction_10m),
      precipMm: c.precipitation,
      timezone: json.timezone,
      observed: c.time
    };
  }

  function parseGeocode(json) {
    var hit = json && json.results && json.results[0];
    if (!hit) return null;
    var parts = [hit.name, hit.admin1, hit.country].filter(Boolean);
    return {
      name: parts.join(", "),
      lat: hit.latitude,
      lon: hit.longitude,
      timezone: hit.timezone || ""
    };
  }

  return {
    canFetch: canFetch,
    mapsEmbedUrl: mapsEmbedUrl,
    mapsOpenUrl: mapsOpenUrl,
    weatherUrl: weatherUrl,
    geocodeUrl: geocodeUrl,
    weatherLabel: weatherLabel,
    parseWeather: parseWeather,
    parseGeocode: parseGeocode
  };
});
