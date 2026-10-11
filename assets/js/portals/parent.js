// assets/js/portals/parent.js
// Parent Portal — Figure 3 (6 components)

(async function () {
  'use strict';

  const session = await window.KhensaniAuth.requireRole('parent');
  if (!session) return;
  const parentUid = session.uid;
  const db = window.MindFlowFirebase.db;

  // 1. Load children
  const childrenSnap = await db.collection('family_connections')
    .where('parentUid', '==', parentUid).get();
  const childUids = childrenSnap.docs.map(d => d.data().childUid);

  // 2. Live child location map (Figure 3 ❷)
  const mapEl = document.getElementById('child-location-map');
  if (mapEl && window.KhensaniMap) {
    const map = new window.KhensaniMap('child-location-map', { zoom: 14 }).init();
    await map.loadZones(session.schoolId || 'default');
    map.watchPositions(childUids, {
      icon: 'child',
      onUpdate: (uid, loc) => {
        // Update last-update timestamp on child card
        document.querySelector(`[data-child="${uid}"] .last-update`)?.replaceChildren(
          document.createTextNode(new Date(loc.timestamp).toLocaleTimeString())
        );
      }
    });
    setTimeout(() => map.fitAll(), 1500);
  }

  // 3. Safety alerts feed (Figure 3 ❸)
  db.collection('parent_notifications')
    .where('parentUid', '==', parentUid)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .onSnapshot(snap => {
      const feed = document.getElementById('safety-alerts-feed');
      if (!feed) return;
      feed.innerHTML = snap.docs.map(d => {
        const n = d.data();
        return `<div class="alert-item alert-${n.priority || 'low'}">
          <strong>${n.type || 'Alert'}</strong>
          <p>${n.message || ''}</p>
          <time>${new Date(n.timestamp).toLocaleString()}</time>
        </div>`;
      }).join('');
    });

  // 4. Child status cards + AI insights (Figure 3 ❹ ❺ ❻)
  for (const childUid of childUids) {
    const card = document.querySelector(`[data-child="${childUid}"]`);
    if (!card) continue;

    // Profile
    db.collection('student_profiles').doc(childUid).onSnapshot(doc => {
      const s = doc.data() || {};
      card.querySelector('.child-name')?.replaceChildren(document.createTextNode(s.displayName || childUid));
      card.querySelector('.child-grade')?.replaceChildren(document.createTextNode(s.gradeLevel || ''));
    });

    // Composite safety score
    window.KhensaniSafetyScore.compute(childUid).then(result => {
      if (!result) return;
      card.querySelector('.safety-score')?.replaceChildren(document.createTextNode(`${result.composite}%`));
      card.querySelector('.safety-label')?.replaceChildren(document.createTextNode(result.label));
    });

    // AI insights
    db.collection('parent_insights').doc(childUid).onSnapshot(doc => {
      const insights = doc.data();
      if (!insights) return;
      card.querySelector('.insights-academic')?.replaceChildren(document.createTextNode(`${insights.academicProgress || 0}%`));
      card.querySelector('.insights-wellbeing')?.replaceChildren(document.createTextNode(insights.emotionalWellbeing || 'Stable'));
    });
  }

  console.log('[Parent Portal] Wired — children:', childUids.length);
})();