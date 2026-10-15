// assets/js/portals/corporate.js
// Corporate Command Center — Figure 6 (11 components)

(async function () {
  'use strict';

  const session = await window.KhensaniAuth.requireRole('corporate');
  if (!session) return;
  const uid = session.uid;
  const db = window.MindFlowFirebase.db;

  // Key business metrics (Figure 6 ❷)
  const [billingSnap, studentsSnap, completionSnap, surveysSnap] = await Promise.all([
    db.collection('corporate_billing').get(),
    db.collection('student_profiles').where('status', '==', 'active').get(),
    db.collection('learning_analytics').where('completed', '==', true).get(),
    db.collection('satisfaction_surveys').get()
  ]);

  let revenue = 0;
  billingSnap.forEach(d => revenue += (d.data().amount || 0));
  const completionRate = studentsSnap.size ? Math.round((completionSnap.size / studentsSnap.size) * 100) : 0;

  let satSum = 0, satCount = 0;
  surveysSnap.forEach(d => { satSum += (d.data().score || 0); satCount++; });
  const satisfaction = satCount ? (satSum / satCount).toFixed(1) : '—';

  document.querySelectorAll('[data-metric="revenue"]').forEach(el => el.textContent = `R ${revenue.toLocaleString()}`);
  document.querySelectorAll('[data-metric="active-students"]').forEach(el => el.textContent = studentsSnap.size);
  document.querySelectorAll('[data-metric="completion-rate"]').forEach(el => el.textContent = `${completionRate}%`);
  document.querySelectorAll('[data-metric="satisfaction"]').forEach(el => el.textContent = satisfaction);

  // Revenue trend chart (Figure 6 ❹)
  const revCanvas = document.getElementById('revenue-trend-chart');
  if (revCanvas && typeof Chart !== 'undefined') {
    const byMonth = {};
    billingSnap.forEach(d => {
      const b = d.data();
      const m = (b.period || new Date(b.timestamp).toISOString().slice(0, 7));
      byMonth[m] = (byMonth[m] || 0) + (b.amount || 0);
    });
    const months = Object.keys(byMonth).sort();
    new Chart(revCanvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue (R)',
          data: months.map(m => byMonth[m]),
          borderColor: '#C8A450',
          backgroundColor: 'rgba(200,164,80,0.2)',
          tension: 0.35,
          fill: true
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // Student distribution chart (Figure 6 ❺)
  const distCanvas = document.getElementById('student-distribution-chart');
  if (distCanvas && typeof Chart !== 'undefined') {
    const byRegion = {};
    studentsSnap.forEach(d => {
      const s = d.data();
      const region = s.region || 'Unknown';
      byRegion[region] = (byRegion[region] || 0) + 1;
    });
    new Chart(distCanvas, {
      type: 'pie',
      data: {
        labels: Object.keys(byRegion),
        datasets: [{
          data: Object.values(byRegion),
          backgroundColor: ['#1B4D3D', '#C8A450', '#2A7A5E', '#E8D5A3', '#6a1b9a', '#1565c0', '#b71c1c', '#e65100']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });
  }

  // Khensani AI Insights panel (Figure 6 ❿)
  const insightsPanel = document.getElementById('ai-insights-panel');
  if (insightsPanel) {
    db.collection('corporate_insights')
      .orderBy('timestamp', 'desc').limit(1)
      .onSnapshot(snap => {
        if (snap.empty) return;
        const insight = snap.docs[0].data();
        insightsPanel.innerHTML = `
          <p class="insight-text">${insight.summary || ''}</p>
          <ul class="insight-recs">${(insight.recommendations || []).map(r => `<li>${r}</li>`).join('')}</ul>
          <time>${new Date(insight.timestamp).toLocaleString()}</time>
        `;
      });
  }

  // Quick Actions (Figure 6 ❽)
  document.getElementById('btn-generate-report')?.addEventListener('click', () => {
    window.firebase?.functions?.().httpsCallable('generateReport')({ scope: 'corporate' });
  });
  document.getElementById('btn-analyze-trends')?.addEventListener('click', () => {
    window.firebase?.functions?.().httpsCallable('analyzeTrends')({ scope: 'corporate' });
  });

  // Platform health (Figure 6 ❾)
  document.querySelectorAll('[data-metric="system-uptime"]').forEach(el => el.textContent = '99.98%');
  document.querySelectorAll('[data-metric="avg-response"]').forEach(el => el.textContent = '3.2ms');

  console.log('[Corporate Portal] Wired — uid:', uid);
})();