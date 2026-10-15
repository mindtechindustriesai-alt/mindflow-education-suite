// assets/js/utils/safety-score.js
// Patent SA 2026/05142 — Figure 3 Component ❻
// Composite: location 40% · attendance 30% · alerts 20% · battery 10%

(function () {
  'use strict';

  const WEIGHTS = { location: 0.40, attendance: 0.30, alerts: 0.20, battery: 0.10 };

  async function computeCompositeSafetyScore(studentUid) {
    const db = window.MindFlowFirebase?.db;
    if (!db) return null;

    // === Location consistency (40%) ===
    const locSnap = await db.collection('locations_tracking')
      .where('studentId', '==', studentUid)
      .orderBy('timestamp', 'desc').limit(50).get();
    const zones = await loadSafeZones();
    let inZoneCount = 0, locSamples = 0;
    locSnap.forEach(d => {
      const loc = d.data();
      if (!loc.coordinates) return;
      locSamples++;
      if (isInAnyZone(loc.coordinates, zones)) inZoneCount++;
    });
    const locationScore = locSamples ? (inZoneCount / locSamples) * 100 : 100;

    // === Attendance regularity (30%) ===
    const attSnap = await db.collection('attendance_records')
      .where('studentId', '==', studentUid)
      .orderBy('date', 'desc').limit(30).get();
    let attended = 0, total = 0;
    attSnap.forEach(d => { total++; if (d.data().present) attended++; });
    const attendanceScore = total ? (attended / total) * 100 : 100;

    // === Alert history (20%) — inverted (fewer alerts = higher score) ===
    const alertSnap = await db.collection('sentinel_alerts')
      .where('studentId', '==', studentUid)
      .orderBy('timestamp', 'desc').limit(20).get();
    let alertPenalty = 0;
    alertSnap.forEach(d => {
      const a = d.data();
      if (a.tier >= 4) alertPenalty += 20;
      else if (a.tier === 3) alertPenalty += 10;
      else if (a.tier === 2) alertPenalty += 4;
      else if (a.tier === 1) alertPenalty += 1;
    });
    const alertsScore = Math.max(0, 100 - alertPenalty);

    // === Device battery (10%) ===
    const lastLoc = locSnap.docs[0]?.data();
    const battery = lastLoc?.battery ?? 100;
    const batteryScore = Math.min(100, battery * 1.25);

    // === Composite ===
    const composite =
      locationScore   * WEIGHTS.location +
      attendanceScore * WEIGHTS.attendance +
      alertsScore     * WEIGHTS.alerts +
      batteryScore    * WEIGHTS.battery;

    return {
      composite: Math.round(composite * 10) / 10,
      breakdown: {
        location:   Math.round(locationScore),
        attendance: Math.round(attendanceScore),
        alerts:     Math.round(alertsScore),
        battery:    Math.round(batteryScore)
      },
      label: labelFor(composite),
      computedAt: new Date().toISOString()
    };
  }

  function labelFor(score) {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    return 'Needs Attention';
  }

  async function loadSafeZones() {
    const db = window.MindFlowFirebase?.db;
    if (!db) return [];
    const snap = await db.collection('campus_zones').where('safeZone', '==', true).get();
    return snap.docs.map(d => d.data().geojson).filter(Boolean);
  }

  function isInAnyZone(coords, zones) {
    // Simplified bounding-box check — production uses turf.js
    const lat = coords.latitude || coords.lat;
    const lng = coords.longitude || coords.lng;
    return zones.some(z => {
      const bbox = getBBox(z);
      return bbox && lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
    });
  }

  function getBBox(geojson) {
    try {
      const ring = geojson.coordinates?.[0]?.[0] || geojson.geometry?.coordinates?.[0]?.[0];
      if (!ring) return null;
      const lats = ring.map(p => p[1]);
      const lngs = ring.map(p => p[0]);
      return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
    } catch { return null; }
  }

  window.KhensaniSafetyScore = { compute: computeCompositeSafetyScore };
})();