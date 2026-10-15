// assets/js/portals/principal.js
// Principal Dashboard — Figure 5 (10 components)

(async function () {
  'use strict';

  const session = await window.KhensaniAuth.requireRole('principal');
  if (!session) return;
  const uid = session.uid;
  const db = window.MindFlowFirebase.db;

  const profileSnap = await db.collection('principal_profiles').doc(uid).get();
  if (!profileSnap.exists) return console.warn('[Principal] No profile');
  const institutionId = profileSnap.data().institutionId;

  // Key institutional metrics (Figure 5 ❷)
  const [studentsSnap, teachersSnap, analyticsSnap, budgetSnap] = await Promise.all([
    db.collection('student_profiles').where('institutionId', '==', institutionId).where('status', '==', 'active').get(),
    db.collection('teacher_profiles').where('institutionId', '==', institutionId).where('employmentStatus', '==', 'active').get(),
    db.collection('learning_analytics').where('institutionId', '==', institutionId).get(),
    db.collection('budget_allocations').where('institutionId', '==', institutionId).get()
  ]);

  let totalPerf = 0, perfCount = 0;
  analyticsSnap.forEach(d => { totalPerf += (d.data().score || 0); perfCount++; });
  const avgPerf = perfCount ? Math.round(totalPerf / perfCount) : 0;

  let allocated = 0, utilised = 0;
  budgetSnap.forEach(d => {
    allocated += (d.data().allocatedAmount || 0);
    utilised += (d.data().utilisedAmount || 0);
  });
  const budgetUtil = allocated ? Math.round((utilised / allocated) * 100) : 0;

  document.querySelectorAll('[data-metric="total-students"]').forEach(el => el.textContent = studentsSnap.size);
  document.querySelectorAll('[data-metric="teaching-staff"]').forEach(el => el.textContent = teachersSnap.size);
  document.querySelectorAll('[data-metric="academic-performance"]').forEach(el => el.textContent = `${avgPerf}%`);
  document.querySelectorAll('[data-metric="budget-utilisation"]').forEach(el => el.textContent = `${budgetUtil}%`);

  // Academic performance by department chart (Figure 5 ❹)
  const perfCanvas = document.getElementById('performance-by-department-chart');
  if (perfCanvas && typeof Chart !== 'undefined') {
    const byDept = {};
    analyticsSnap.forEach(d => {
      const a = d.data();
      if (!a.departmentId) return;
      byDept[a.departmentId] = byDept[a.departmentId] || [];
      byDept[a.departmentId].push(a.score || 0);
    });
    const avg = arr => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0;
    new Chart(perfCanvas, {
      type: 'bar',
      data: {
        labels: Object.keys(byDept),
        datasets: [{ label: 'Avg Score', data: Object.values(byDept).map(avg), backgroundColor: '#2A7A5E' }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // Enrollment trends chart (Figure 5 ❺)
  const trendCanvas = document.getElementById('enrollment-trends-chart');
  if (trendCanvas && typeof Chart !== 'undefined') {
    const byYear = {};
    studentsSnap.forEach(d => {
      const s = d.data();
      const year = s.enrollmentYear || new Date(s.createdAt).getFullYear();
      byYear[year] = (byYear[year] || 0) + 1;
    });
    const years = Object.keys(byYear).sort();
    new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Enrollment',
          data: years.map(y => byYear[y]),
          borderColor: '#C8A450',
          backgroundColor: 'rgba(200,164,80,0.2)',
          tension: 0.35,
          fill: true
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // Department performance breakdown (Figure 5 ❻)
  db.collection('learning_analytics')
    .where('institutionId', '==', institutionId)
    .onSnapshot(snap => {
      const byDept = {};
      snap.forEach(d => {
        const a = d.data();
        if (!a.departmentId) return;
        byDept[a.departmentId] = byDept[a.departmentId] || [];
        byDept[a.departmentId].push(a.score || 0);
      });
      const container = document.getElementById('department-breakdown');
      if (!container) return;
      container.innerHTML = Object.entries(byDept).map(([dept, scores]) => {
        const avg = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0;
        const arrow = avg >= 75 ? 'Δ' : '∇';
        return `<div class="dept-row">
          <span>${dept}</span>
          <span>${Math.round(avg)}%</span>
          <span class="arrow">${arrow}</span>
        </div>`;
      }).join('');
    });

  // PRIORITY ALERTS (Figure 5 ❽ ❾ ❿) — the crown jewel
  const alertsContainer = document.getElementById('priority-alerts');
  db.collection('priority_alerts')
    .where('institutionId', '==', institutionId)
    .where('resolved', '==', false)
    .orderBy('timestamp', 'desc').limit(10)
    .onSnapshot(snap => {
      if (!alertsContainer) return;
      alertsContainer.innerHTML = snap.docs.map(d => {
        const a = d.data();
        return `<div class="priority-alert severity-${a.severity || 'medium'}">
          <strong>${a.title || ''}</strong>
          <p>${a.description || ''}</p>
          <time>${new Date(a.timestamp).toLocaleString()}</time>
          ${a.recommendedAction ? `<em>${a.recommendedAction}</em>` : ''}
        </div>`;
      }).join('');
    });

  console.log('[Principal Portal] Wired — institution:', institutionId);
})();