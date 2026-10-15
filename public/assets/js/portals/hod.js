// assets/js/portals/hod.js
// HOD Dashboard — Figure 4 (7 components)

(async function () {
  'use strict';

  const session = await window.KhensaniAuth.requireRole('hod');
  if (!session) return;
  const uid = session.uid;
  const db = window.MindFlowFirebase.db;

  // Load HOD profile → get departmentId
  const profileSnap = await db.collection('hod_profiles').doc(uid).get();
  if (!profileSnap.exists) return console.warn('[HOD] No profile');
  const departmentId = profileSnap.data().departmentId;

  // Key department metrics (Figure 4 ❷)
  const [classesSnap, staffSnap, analyticsSnap, budgetSnap] = await Promise.all([
    db.collection('classes').where('departmentId', '==', departmentId).where('status', '==', 'active').get(),
    db.collection('teacher_profiles').where('departmentId', '==', departmentId).where('employmentStatus', '==', 'active').get(),
    db.collection('learning_analytics').where('departmentId', '==', departmentId).get(),
    db.collection('budget_allocations').where('departmentId', '==', departmentId).get()
  ]);

  let totalStudents = 0;
  classesSnap.forEach(d => totalStudents += (d.data().studentCount || 0));

  let totalPerf = 0, perfCount = 0;
  analyticsSnap.forEach(d => { totalPerf += (d.data().score || 0); perfCount++; });
  const avgPerf = perfCount ? Math.round(totalPerf / perfCount) : 0;

  let allocated = 0, utilised = 0;
  budgetSnap.forEach(d => {
    allocated += (d.data().allocatedAmount || 0);
    utilised += (d.data().utilisedAmount || 0);
  });
  const utilisation = allocated ? Math.round((utilised / allocated) * 100) : 0;

  document.querySelectorAll('[data-metric="student-count"]').forEach(el => el.textContent = totalStudents);
  document.querySelectorAll('[data-metric="teaching-staff"]').forEach(el => el.textContent = staffSnap.size);
  document.querySelectorAll('[data-metric="average-performance"]').forEach(el => el.textContent = `${avgPerf}%`);
  document.querySelectorAll('[data-metric="resource-utilisation"]').forEach(el => el.textContent = `${utilisation}%`);

  // Staff performance overview (Figure 4 ❹)
  const staffPerfFeed = document.getElementById('staff-performance-list');
  if (staffPerfFeed) {
    const evalsSnap = await db.collection('staff_evaluations')
      .where('departmentId', '==', departmentId)
      .orderBy('timestamp', 'desc').limit(50).get();
    const latestByUid = {};
    evalsSnap.forEach(d => {
      const e = d.data();
      if (!latestByUid[e.teacherUid]) latestByUid[e.teacherUid] = e;
    });
    staffPerfFeed.innerHTML = Object.entries(latestByUid).map(([tid, e]) => {
      const perf = Math.round(e.score || 0);
      const flag = perf < 80 ? '<span class="flag-needs-support">Needs support</span>' : '';
      return `<div class="staff-row">
        <span class="staff-name">${e.teacherName || tid}</span>
        <span class="staff-perf">${perf}%</span>
        ${flag}
      </div>`;
    }).join('');
  }

  // Subject performance chart (Figure 4 ❺)
  const chartCanvas = document.getElementById('subject-performance-chart');
  if (chartCanvas && typeof Chart !== 'undefined') {
    const bySubject = {};
    analyticsSnap.forEach(d => {
      const a = d.data();
      if (!a.subject) return;
      bySubject[a.subject] = bySubject[a.subject] || { current: [], prior: [] };
      if (a.period === 'current') bySubject[a.subject].current.push(a.score || 0);
      if (a.period === 'prior')   bySubject[a.subject].prior.push(a.score || 0);
    });
    const avg = arr => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0;
    new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: Object.keys(bySubject),
        datasets: [
          { label: 'This Semester', data: Object.values(bySubject).map(s => avg(s.current)), backgroundColor: '#2A7A5E' },
          { label: 'Prior Year',    data: Object.values(bySubject).map(s => avg(s.prior)),   backgroundColor: '#C8A450' }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
  }

  // Student enrollment by grade chart (Figure 4 ❻)
  const enrollCanvas = document.getElementById('enrollment-by-grade-chart');
  if (enrollCanvas && typeof Chart !== 'undefined') {
    const byGrade = {};
    classesSnap.forEach(d => {
      const c = d.data();
      byGrade[c.gradeLevel] = (byGrade[c.gradeLevel] || 0) + (c.studentCount || 0);
    });
    new Chart(enrollCanvas, {
      type: 'bar',
      data: {
        labels: Object.keys(byGrade),
        datasets: [{ label: 'Students', data: Object.values(byGrade), backgroundColor: '#1B4D3D' }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // Curriculum status (Figure 4 ❼)
  db.collection('curriculum_plans')
    .where('departmentId', '==', departmentId)
    .orderBy('lastUpdated', 'desc').limit(20)
    .onSnapshot(snap => {
      const container = document.getElementById('curriculum-list');
      if (!container) return;
      container.innerHTML = snap.docs.map(d => {
        const c = d.data();
        return `<div class="curriculum-row">
          <strong>${c.initiativeName || ''}</strong>
          <span class="status status-${(c.status || '').toLowerCase().replace(/\s+/g, '-')}">${c.status || ''}</span>
          <time>${c.dueDate ? new Date(c.dueDate).toLocaleDateString() : ''}</time>
        </div>`;
      }).join('');
    });

  console.log('[HOD Portal] Wired — dept:', departmentId);
})();