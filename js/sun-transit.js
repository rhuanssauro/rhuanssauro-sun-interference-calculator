/**
 * Geometric GSO sun-transit (Sun Interference) prediction.
 * Owner-style method: outage while the solar disk is inside the receive
 * 3 dB beamwidth (half beamwidth + ~0.25° solar radius).
 * ITU-R S.1525-1 beamwidth θ3dB = 70 λ / D. No DOM.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SunTransit = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DEG = Math.PI / 180;
  var RAD = 180 / Math.PI;
  var C_MPS = 299792458;
  var WGS84_A = 6378.137;
  var WGS84_F = 1 / 298.257223563;
  var WGS84_E2 = WGS84_F * (2 - WGS84_F);
  var GEO_R_KM = 42164.169;
  var SOLAR_DIAMETER_DEG = 0.5;
  var SOLAR_RADIUS_DEG = 0.25;
  var ITU_SOLAR_DIAMETER_DEG = 0.48;
  var SUN_HOUR_ANGLE_DEG_PER_MIN = 0.25;
  var BEAMWIDTH_FACTOR = 70;

  var BAND_GHZ = {
    C: 3.95,
    Ku: 11.95,
    Ka: 20.2
  };

  var MACAE = {
    name: "Macaé, Rio de Janeiro, Brazil",
    lat: -22.37,
    lon: -41.79
  };

  function clamp(x, a, b) {
    return Math.min(b, Math.max(a, x));
  }

  function wrap180(deg) {
    var x = ((deg + 180) % 360 + 360) % 360 - 180;
    return x;
  }

  function wrap360(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function wavelengthM(freqGHz) {
    return C_MPS / (freqGHz * 1e9);
  }

  function resolveFreqGHz(bandOrGhz) {
    if (typeof bandOrGhz === "number" && isFinite(bandOrGhz) && bandOrGhz > 0) {
      return bandOrGhz;
    }
    var key = String(bandOrGhz || "Ku");
    if (BAND_GHZ[key] != null) return BAND_GHZ[key];
    throw new Error("Unknown band: " + bandOrGhz);
  }

  function parseToGHz(raw) {
    if (raw == null || raw === "") return null;
    var n = Number(raw);
    if (!isFinite(n) || n <= 0) return null;
    if (n < 100) return n;
    if (n < 1e6) return n / 1e3;
    return n / 1e9;
  }

  function parseCarrierHz(raw) {
    if (raw == null || raw === "") return null;
    var n = Number(raw);
    if (!isFinite(n) || n <= 0) return null;
    if (n <= 1e5) return n * 1e6;
    return n;
  }

  function formatCarrier(hz) {
    if (hz == null) return "—";
    if (hz >= 1e6) {
      var mhz = hz / 1e6;
      return (mhz >= 10 ? mhz.toFixed(0) : mhz.toFixed(3)) + " MHz";
    }
    if (hz >= 1e3) return (hz / 1e3).toFixed(1) + " kHz";
    return hz + " Hz";
  }

  function formatRfGHz(ghz) {
    if (ghz == null) return "—";
    return (ghz * 1e3).toFixed(ghz >= 10 ? 0 : 1) + " MHz (" + ghz.toFixed(4) + " GHz)";
  }

  function beamwidthDeg(diameterM, bandOrGhz) {
    var D = Number(diameterM);
    if (!(D > 0)) throw new Error("antenna diameter must be > 0 m");
    var f = resolveFreqGHz(bandOrGhz);
    return (BEAMWIDTH_FACTOR * wavelengthM(f)) / D;
  }

  function outageRadiusDeg(diameterM, bandOrGhz) {
    return beamwidthDeg(diameterM, bandOrGhz) / 2 + SOLAR_RADIUS_DEG;
  }

  function centralTransitDurationMin(diameterM, bandOrGhz) {
    var theta = beamwidthDeg(diameterM, bandOrGhz);
    return (theta + SOLAR_DIAMETER_DEG) / SUN_HOUR_ANGLE_DEG_PER_MIN;
  }

  function ituMaxDurationMin(diameterM, bandOrGhz) {
    var theta = beamwidthDeg(diameterM, bandOrGhz);
    return (theta + ITU_SOLAR_DIAMETER_DEG) / SUN_HOUR_ANGLE_DEG_PER_MIN;
  }

  function siteEcefKm(latDeg, lonDeg, hKm) {
    hKm = hKm || 0;
    var lat = latDeg * DEG;
    var lon = lonDeg * DEG;
    var sl = Math.sin(lat);
    var cl = Math.cos(lat);
    var N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sl * sl);
    return {
      x: (N + hKm) * cl * Math.cos(lon),
      y: (N + hKm) * cl * Math.sin(lon),
      z: (N * (1 - WGS84_E2) + hKm) * sl
    };
  }

  function satEcefKm(satLonDeg, satLatDeg) {
    var lat = (satLatDeg || 0) * DEG;
    var lon = satLonDeg * DEG;
    var cl = Math.cos(lat);
    return {
      x: GEO_R_KM * cl * Math.cos(lon),
      y: GEO_R_KM * cl * Math.sin(lon),
      z: GEO_R_KM * Math.sin(lat)
    };
  }

  function lookAngles(latDeg, lonDeg, satLonDeg, satLatDeg) {
    var s = siteEcefKm(latDeg, lonDeg, 0);
    var t = satEcefKm(satLonDeg, satLatDeg);
    var dx = t.x - s.x;
    var dy = t.y - s.y;
    var dz = t.z - s.z;
    var range = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var lat = latDeg * DEG;
    var lon = lonDeg * DEG;
    var sl = Math.sin(lat);
    var cl = Math.cos(lat);
    var so = Math.sin(lon);
    var co = Math.cos(lon);
    var east = -so * dx + co * dy;
    var north = -sl * co * dx - sl * so * dy + cl * dz;
    var up = cl * co * dx + cl * so * dy + sl * dz;
    var el = Math.asin(clamp(up / range, -1, 1)) * RAD;
    var az = wrap360(Math.atan2(east, north) * RAD);
    return { azimuth: az, elevation: el, rangeKm: range };
  }

  function angularSeparation(az1, el1, az2, el2) {
    var a1 = az1 * DEG;
    var e1 = el1 * DEG;
    var a2 = az2 * DEG;
    var e2 = el2 * DEG;
    var c1 = Math.cos(e1);
    var c2 = Math.cos(e2);
    var x1 = c1 * Math.cos(a1);
    var y1 = c1 * Math.sin(a1);
    var z1 = Math.sin(e1);
    var x2 = c2 * Math.cos(a2);
    var y2 = c2 * Math.sin(a2);
    var z2 = Math.sin(e2);
    var dot = clamp(x1 * x2 + y1 * y2 + z1 * z2, -1, 1);
    return Math.acos(dot) * RAD;
  }

  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function sunRaDec(date) {
    var jd = julianDate(date);
    var n = jd - 2451545.0;
    var L = wrap360(280.46 + 0.9856474 * n);
    var g = wrap360(357.528 + 0.9856003 * n);
    var gRad = g * DEG;
    var lambda = L + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad);
    var eps = 23.439 - 0.0000004 * n;
    var lam = lambda * DEG;
    var e = eps * DEG;
    var alpha = Math.atan2(Math.cos(e) * Math.sin(lam), Math.cos(lam)) * RAD;
    var delta = Math.asin(clamp(Math.sin(e) * Math.sin(lam), -1, 1)) * RAD;
    return { ra: wrap360(alpha), dec: delta, eclipticLon: wrap360(lambda) };
  }

  function gmstDeg(date) {
    var jd = julianDate(date);
    var T = (jd - 2451545.0) / 36525.0;
    var gmst =
      280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000;
    return wrap360(gmst);
  }

  function sunPosition(date, latDeg, lonDeg) {
    var rd = sunRaDec(date);
    var lst = wrap360(gmstDeg(date) + lonDeg);
    var ha = wrap180(lst - rd.ra) * DEG;
    var dec = rd.dec * DEG;
    var lat = latDeg * DEG;
    var sinEl =
      Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
    var el = Math.asin(clamp(sinEl, -1, 1)) * RAD;
    var y = Math.sin(ha);
    var x = Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat);
    var az = wrap360(Math.atan2(y, x) * RAD + 180);
    return { azimuth: az, elevation: el, ra: rd.ra, dec: rd.dec };
  }

  function dayOfYearUtc(date) {
    var y = date.getUTCFullYear();
    var start = Date.UTC(y, 0, 1);
    return Math.floor((date.getTime() - start) / 86400000) + 1;
  }

  function equinoxWindows(year) {
    return {
      march: { start: Date.UTC(year, 2, 1), end: Date.UTC(year, 3, 20) },
      september: { start: Date.UTC(year, 7, 20), end: Date.UTC(year, 9, 20) }
    };
  }

  function inEquinoxSeason(date) {
    var w = equinoxWindows(date.getUTCFullYear());
    var t = date.getTime();
    return (t >= w.march.start && t <= w.march.end) || (t >= w.september.start && t <= w.september.end);
  }

  function hemisphereNote(latDeg) {
    if (latDeg >= 0) {
      return "Northern hemisphere: several days just prior to the March equinox and just after the September equinox (Intelsat).";
    }
    return "Southern hemisphere: reversed — several days after the March equinox and just prior to the September equinox (Intelsat).";
  }

  function localTimeHint(siteLon, satLon) {
    if (siteLon < satLon) {
      return "Site is west of the satellite — windows tend to fall in the morning (Intelsat).";
    }
    if (siteLon > satLon) {
      return "Site is east of the satellite — windows tend to fall in the afternoon (Intelsat).";
    }
    return "Site is near the sub-satellite longitude — windows tend to fall near local noon.";
  }

  function evaluateGeometry(input) {
    var diameterM = input.diameterM;
    var bandOrGhz = input.bandOrGhz;
    var satEl = input.satEl;
    var sunEl = input.sunEl;
    var bw = beamwidthDeg(diameterM, bandOrGhz);
    var radius = outageRadiusDeg(diameterM, bandOrGhz);
    if (!(satEl > 0)) {
      return {
        status: "not-in-view",
        impacted: false,
        separationDeg: null,
        beamwidthDeg: bw,
        outageRadiusDeg: radius,
        satEl: satEl,
        sunEl: sunEl
      };
    }
    var sep = angularSeparation(input.satAz, satEl, input.sunAz, sunEl);
    var sunUp = sunEl > -SOLAR_RADIUS_DEG;
    var impacted = sunUp && sep <= radius;
    return {
      status: impacted ? "impacted" : "not-impacted",
      impacted: impacted,
      separationDeg: sep,
      beamwidthDeg: bw,
      outageRadiusDeg: radius,
      satEl: satEl,
      sunEl: sunEl
    };
  }

  function windowFromSamples(samples, diameterM, bandOrGhz) {
    var start = null;
    var end = null;
    var minSep = Infinity;
    var anyInView = false;
    var i;
    for (i = 0; i < samples.length; i++) {
      var s = samples[i];
      var e = evaluateGeometry({
        satAz: s.satAz,
        satEl: s.satEl,
        sunAz: s.sunAz,
        sunEl: s.sunEl,
        diameterM: diameterM,
        bandOrGhz: bandOrGhz
      });
      if (s.satEl > 0) anyInView = true;
      if (e.separationDeg != null && e.separationDeg < minSep) minSep = e.separationDeg;
      if (e.impacted) {
        if (start == null) start = s.tMs;
        end = s.tMs;
      } else if (start != null && end != null && s.tMs - end > 120000) {
        break;
      }
    }
    if (!anyInView) {
      return {
        status: "not-in-view",
        impacted: false,
        durationMin: 0,
        startMs: null,
        endMs: null,
        minSeparationDeg: null
      };
    }
    if (start == null) {
      return {
        status: "not-impacted",
        impacted: false,
        durationMin: 0,
        startMs: null,
        endMs: null,
        minSeparationDeg: minSep === Infinity ? null : minSep
      };
    }
    return {
      status: "impacted",
      impacted: true,
      durationMin: (end - start) / 60000,
      startMs: start,
      endMs: end,
      minSeparationDeg: minSep === Infinity ? null : minSep
    };
  }

  function estimatedTransitUtcMs(date, satLonDeg) {
    var y = date.getUTCFullYear();
    var m = date.getUTCMonth();
    var d = date.getUTCDate();
    var hour = 12 - satLonDeg / 15;
    while (hour < 0) hour += 24;
    while (hour >= 24) hour -= 24;
    var whole = Math.floor(hour);
    var frac = hour - whole;
    return Date.UTC(y, m, d, whole, Math.round(frac * 60), 0);
  }

  function predictForDate(opts) {
    var lat = opts.lat;
    var lon = opts.lon;
    var satLon = opts.satLon;
    var satLat = opts.satLat || 0;
    var diameterM = opts.diameterM;
    var bandOrGhz = opts.bandOrGhz;
    var date = opts.date instanceof Date ? opts.date : new Date(opts.date);
    var stepMs = opts.stepMs || 30000;
    var look = lookAngles(lat, lon, satLon, satLat);
    if (!(look.elevation > 0)) {
      return {
        status: "not-in-view",
        impacted: false,
        look: look,
        beamwidthDeg: beamwidthDeg(diameterM, bandOrGhz),
        outageRadiusDeg: outageRadiusDeg(diameterM, bandOrGhz),
        startUtc: null,
        endUtc: null,
        durationMin: 0,
        minSeparationDeg: null
      };
    }
    var center = estimatedTransitUtcMs(date, satLon);
    var from = center - 4 * 3600 * 1000;
    var to = center + 4 * 3600 * 1000;
    var samples = [];
    var t;
    for (t = from; t <= to; t += stepMs) {
      var when = new Date(t);
      var sun = sunPosition(when, lat, lon);
      samples.push({
        tMs: t,
        satAz: look.azimuth,
        satEl: look.elevation,
        sunAz: sun.azimuth,
        sunEl: sun.elevation
      });
    }
    var win = windowFromSamples(samples, diameterM, bandOrGhz);
    return {
      status: win.status,
      impacted: win.impacted,
      look: look,
      beamwidthDeg: beamwidthDeg(diameterM, bandOrGhz),
      outageRadiusDeg: outageRadiusDeg(diameterM, bandOrGhz),
      startUtc: win.startMs != null ? new Date(win.startMs).toISOString() : null,
      endUtc: win.endMs != null ? new Date(win.endMs).toISOString() : null,
      durationMin: win.durationMin,
      minSeparationDeg: win.minSeparationDeg,
      scanCenterUtc: new Date(center).toISOString()
    };
  }

  function formatHms(iso) {
    if (!iso) return "—";
    return iso.slice(11, 19) + "Z";
  }

  function checkInterference(opts) {
    var lat = opts.lat;
    var lon = opts.lon;
    var satLon = opts.satLon;
    var satLat = opts.satLat || 0;
    var diameterM = opts.diameterM;
    var bandOrGhz = opts.bandOrGhz || "Ku";
    var now = opts.now instanceof Date ? opts.now : new Date(opts.now || Date.now());
    var look = lookAngles(lat, lon, satLon, satLat);
    var bw = beamwidthDeg(diameterM, bandOrGhz);
    var radius = outageRadiusDeg(diameterM, bandOrGhz);
    var sun = sunPosition(now, lat, lon);
    var geo = evaluateGeometry({
      satAz: look.azimuth,
      satEl: look.elevation,
      sunAz: sun.azimuth,
      sunEl: sun.elevation,
      diameterM: diameterM,
      bandOrGhz: bandOrGhz
    });

    var today = predictForDate({
      lat: lat,
      lon: lon,
      satLon: satLon,
      satLat: satLat,
      diameterM: diameterM,
      bandOrGhz: bandOrGhz,
      date: now,
      stepMs: opts.stepMs || 30000
    });

    var season = inEquinoxSeason(now);
    var status;
    if (!(look.elevation > 0)) {
      status = "not-in-view";
    } else if (today.impacted) {
      status = "impacted";
    } else if (!season) {
      status = "out-of-season";
    } else {
      status = "not-impacted";
    }

    var nearby = [];
    if (look.elevation > 0 && (season || status === "out-of-season")) {
      var day;
      for (day = -10; day <= 14; day++) {
        var dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, 12, 0, 0));
        if (!inEquinoxSeason(dt) && status !== "out-of-season") continue;
        var p = predictForDate({
          lat: lat,
          lon: lon,
          satLon: satLon,
          satLat: satLat,
          diameterM: diameterM,
          bandOrGhz: bandOrGhz,
          date: dt,
          stepMs: opts.stepMs || 15000
        });
        if (p.impacted) {
          nearby.push({
            date: dt.toISOString().slice(0, 10),
            startUtc: p.startUtc,
            endUtc: p.endUtc,
            durationMin: p.durationMin,
            minSeparationDeg: p.minSeparationDeg
          });
        }
      }
    }

    if (status === "out-of-season" && nearby.length > 0) {
      status = "not-impacted";
    }

    var verdict;
    if (status === "not-in-view") {
      verdict =
        "Not in view. Satellite elevation " +
        look.elevation.toFixed(1) +
        "° — below the local horizon from this site.";
    } else if (status === "out-of-season") {
      verdict =
        "Out of season. No geometric sun-transit window on " +
        now.toISOString().slice(0, 10) +
        " UTC (outside the equinox windows).";
    } else if (status === "impacted") {
      verdict =
        "Impacted. Geometric sun-transit " +
        formatHms(today.startUtc) +
        "–" +
        formatHms(today.endUtc) +
        " (" +
        today.durationMin.toFixed(1) +
        " min) as per 3 dB beamwidth + solar radius.";
    } else if (nearby.length) {
      verdict =
        "Not impacted at this epoch. Next geometric window " +
        nearby[0].date +
        " " +
        formatHms(nearby[0].startUtc) +
        "–" +
        formatHms(nearby[0].endUtc) +
        " (" +
        nearby[0].durationMin.toFixed(1) +
        " min).";
    } else {
      verdict =
        "Not impacted. Sun–satellite separation " +
        (geo.separationDeg != null ? geo.separationDeg.toFixed(2) + "°" : "n/a") +
        " vs outage radius " +
        radius.toFixed(2) +
        "°.";
    }

    return {
      status: status,
      impacted: status === "impacted",
      verdict: verdict,
      nowUtc: now.toISOString(),
      look: look,
      sun: sun,
      nowGeometry: geo,
      today: today,
      nearbyWindows: nearby,
      beamwidthDeg: bw,
      outageRadiusDeg: radius,
      centralDurationMin: centralTransitDurationMin(diameterM, bandOrGhz),
      ituMaxDurationMin: ituMaxDurationMin(diameterM, bandOrGhz),
      bandGHz: resolveFreqGHz(bandOrGhz),
      notes: [
        hemisphereNote(lat),
        localTimeHint(lon, satLon),
        "Hispasat: estimates based exclusively on geometric angles (no RF margin, un-pointing, or performance).",
        "Intelsat: calculator determines interference duration from receive antenna beamwidth. Geometric window only; Intelsat recommends a ±10 min operational pad."
      ]
    };
  }

  return {
    BAND_GHZ: BAND_GHZ,
    MACAE: MACAE,
    SOLAR_DIAMETER_DEG: SOLAR_DIAMETER_DEG,
    SOLAR_RADIUS_DEG: SOLAR_RADIUS_DEG,
    ITU_SOLAR_DIAMETER_DEG: ITU_SOLAR_DIAMETER_DEG,
    wrap180: wrap180,
    wrap360: wrap360,
    wavelengthM: wavelengthM,
    parseToGHz: parseToGHz,
    parseCarrierHz: parseCarrierHz,
    formatCarrier: formatCarrier,
    formatRfGHz: formatRfGHz,
    resolveFreqGHz: resolveFreqGHz,
    beamwidthDeg: beamwidthDeg,
    outageRadiusDeg: outageRadiusDeg,
    centralTransitDurationMin: centralTransitDurationMin,
    ituMaxDurationMin: ituMaxDurationMin,
    lookAngles: lookAngles,
    angularSeparation: angularSeparation,
    julianDate: julianDate,
    gmstDeg: gmstDeg,
    sunRaDec: sunRaDec,
    sunPosition: sunPosition,
    evaluateGeometry: evaluateGeometry,
    windowFromSamples: windowFromSamples,
    predictForDate: predictForDate,
    checkInterference: checkInterference,
    inEquinoxSeason: inEquinoxSeason,
    equinoxWindows: equinoxWindows,
    estimatedTransitUtcMs: estimatedTransitUtcMs
  };
});
