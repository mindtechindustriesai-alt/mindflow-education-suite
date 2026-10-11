// assets/js/portals/security.js
// Security Command Center — Figure 7 (9 components)

(async function () {
  'use strict';

  const session = await window.KhensaniAuth.requireRole('security');
  if (!session) return;
  const uid = session.uid;
  const db = window.MindFlowFirebase.db;

  const profileSnap = await db.collection('security_profiles').doc(uid).get();
  const schoolId = profileSnap.data()?.schoolId || 'default';

  // Key metrics + emergency buttons (Figure 7 ❷)
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [incidentsSnap, officersSnap] = await Promise.all([
    db.collection('security_incidents').where('schoolId', '==', schoolId).where('reportedTimestamp', '>=', weekAgo).get(),
    db.collection('officer_locations').where('schoolId', '==', schoolId).get()
  ]);

  document.querySelectorAll('[data-metric="incidents-week"]').forEach(el => el.textContent = incidentsSnap.size);
  document.querySelectorAll('[data-metric="patrol-units"]').forEach(el => el.textContent = officersSnap.size);

  // Emergency action buttons
  document.getElementById('btn-lockdown')?.addEventListener('click', async () => {
    if (confirm('Initiate CAMPUS LOCKDOWN?')) {
      await window.KhensaniEmergency.campusLockdown('manual');
      alert('Lockdown initiated.');
    }
  });
  document.getElementById('btn-evacuate')?.addEventListener('click', async () => {
    if (confirm('Initiate EMERGENCY EVACUATION?')) {
      await window.KhensaniEmergency.emergencyEvacuation('manual');
      alert('Evacuation initiated.');
    }
  });
  document.getElementById('btn-request-backup')?.addEventListener('click', async () => {
    await window.KhensaniEmergency.requestBackup('manual');
    alert('Backup requested.');
  });

  // Live campus map (Figure 7 ❸)
  const mapEl = document.getElementById('campus-map');
  if (mapEl && window.KhensaniMap) {
    const map = new window.KhensaniMap('campus-map', { zoom: 16 }).init();
    await map.loadZones(schoolId);

    // Officer positions
    const officerUids = officersSnap.docs.map(d => d.id);
    map.watchPositions(officerUids, { icon: 'officer' });

    // Camera markers
    const camsSnap = await db.collection('security_cameras').where('schoolId', '==', schoolId).get();
    camsSnap.forEach(d => {
      const c = d.data();
      if (!c.coordinates) return;
      map.setMarker('cam_' + d.id, [c.coordinates.latitude, c.coordinates.longitude], {
        label: c.name || 'Camera',
        status: c.status || 'online',
        icon: 'camera'
      });
    });

    setTimeout(() => map.fitAll(), 1500);
  }

  // System status panel (Figure 7 ❺)
  const [camsOnlineSnap, accessSnap, alarmsSnap] = await Promise.all([
    db.collection('security_cameras').where('schoolId', '==', schoolId).where('status', '==', 'online').get(),
    db.collection('access_control').where('schoolId', '==', schoolId).where('status', '==', 'online').get(),
    db.collection('alarm_systems').where('schoolId', '==', schoolId).where('status', '==', 'normal').get()
  ]);

  document.querySelectorAll('[data-status="cameras"]').forEach(el => el.textContent = `${camsOnlineSnap.size} Online`);
  document.querySelectorAll('[data-status="access"]').forEach(el  => el.textContent = `${accessSnap.size} Online`);
  document.querySelectorAll('[data-status="alarms"]').forEach(el  => el.textContent = `${alarmsSnap.size} Normal`);
  document.querySelectorAll('[data-status="patrols"]').forEach(el => el.textContent = `${officersSnap.size} Active`);

  // Officer status cards (Figure 7 ❼)
  const officerCards = document.getElementById('officer-status-cards');
  if (officerCards) {
    officerCards.innerHTML = officersSnap.docs.map(d => {
      const o = d.data();
      return `<div class="officer-card">
        <strong>${o.name || d.id}</strong>
        <span>${o.currentAssignment || 'Patrolling'}</span>
        <span>${o.kmWalked || 0} km</span>
        <span>${o.incidentsHandled || 0} incidents</span>
      </div>`;
    }).join('');
  }

  // Recent incidents feed (Figure 7 ❽)
  db.collection('security_incidents')
    .where('schoolId', '==', schoolId)
    .orderBy('reportedTimestamp', 'desc').limit(20)
    .onSnapshot(snap => {
      const feed = document.getElementById('recent-incidents');
      if (!feed) return;
      feed.innerHTML = snap.docs.map(d => {
        const i = d.data();
        return `<div class="incident-item priority-${i.priority || 'low'}">
          <strong>${i.incidentType || ''}</strong>
          <p>${i.description || ''}</p>
          <time>${new Date(i.reportedTimestamp).toLocaleString()}</time>
        </div>`;
      }).join('');
    });

  console.log('[Security Portal] Wired — school:', schoolId);
})();