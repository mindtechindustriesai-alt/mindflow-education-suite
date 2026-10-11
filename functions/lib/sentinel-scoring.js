// functions/lib/sentinel-scoring.js
// Composite 40/30/20/10 — server-side mirror of client safety-score.js

const WEIGHTS = { location: 0.40, attendance: 0.30, alerts: 0.20, battery: 0.10 };

async function computeCompositeScore(studentUid, db) {
  if (!studentUid) return null;

  // Location (40%)
  const locSnap = await db.collection('locations_tracking')
    .where('studentId', '==', studentUid)
    .orderBy('timestamp', 'desc').limit(50).get();
  const zones = await loadSafeZones(db);
  let inZone = 0, locTotal = 0;
  locSnap.forEach(d => {
    const l = d.data();
    if (!l.coordinates) return;
    locTotal++;
    if (isInAnyZone(l.coordinates, zones)) inZone++;
  });
  const locationScore = locTotal ? (inZone / locTotal) * 100 : 100;

  // Attendance (30%)
  const attSnap = await db.collection('attendance_records')
    .where('studentId', '==', studentUid)
    .orderBy('date', 'desc').limit(30).get();
  let attended = 0, total = 0;
  attSnap.forEach(d => { total++; if (d.data().present) attended++; });
  const attendanceScore = total ? (attended / total) * 100 : 100;

  // Alerts (20%, inverted)
  const alertSnap = await db.collection('sentinel_alerts')
    .where('studentId', '==', studentUid)
    .orderBy('timestamp', 'desc').limit(20).get();
  let penalty = 0;
  alertSnap.forEach(d => {
    const t = d.data().tier || 0;
    if (t >= 4) penalty += 20;
    else if (t === 3) penalty += 10;
    else if (t === 2) penalty += 4;
    else if (t === 1) penalty += 1;
  });
  const alertsScore = Math.max(0, 100 - penalty);

  // Battery (10%)
  const battery = locSnap.docs[0]?.data()?.battery ?? 100;
  const batteryScore = Math.min(100, battery * 1.25);

  const composite =
    locationScore * WEIGHTS.location +
    attendanceScore * WEIGHTS.attendance +
    alertsScore * WEIGHTS.alerts +
    batteryScore * WEIGHTS.battery;

  return {
    composite: Math.round(composite * 10) / 10,
    breakdown: {
      location: Math.round(locationScore),
      attendance: Math.round(attendanceScore),
      alerts: Math.round(alertsScore),
      battery: Math.round(batteryScore)
    },
    label: labelFor(composite)
  };
}

function labelFor(s) {
  if (s >= 95) return 'Excellent';
  if (s >= 85) return 'Good';
  return 'Needs Attention';
}

async function loadSafeZones(db) {
  const snap = await db.collection('campus_zones').where('safeZone', '==', true).get();
  return snap.docs.map(d => d.data().geojson).filter(Boolean);
}

function isInAnyZone(coords, zones) {
  const lat = coords.latitude || coords.lat;
  const lng = coords.longitude || coords.lng;
  return zones.some(z => {
    const b = bbox(z);
    return b && lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
  });
}

function bbox(geojson) {
  try {
    const ring = geojson.coordinates?.[0]?.[0] || geojson.geometry?.coordinates?.[0]?.[0];
    if (!ring) return null;
    const lats = ring.map(p => p[1]);
    const lngs = ring.map(p => p[0]);
    return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
  } catch { return null; }
}

module.exports = { computeCompositeScore };