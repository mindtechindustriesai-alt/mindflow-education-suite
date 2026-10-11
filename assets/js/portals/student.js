// assets/js/portals/student.js
// Student Portal wiring — Figure 1 (9 components)

(async function () {
  'use strict';

  // 1. Auth guard
  const session = await window.KhensaniAuth.requireRole('student');
  if (!session) return;
  const uid = session.uid;

  // 2. Splash + particles already loaded by shell
  // 3. Sentinel AI init (auto-listens to auth:ready, but ensure)
  if (window.SentinelAI && !window.SentinelAI.running) {
    await window.SentinelAI.init(uid);
  }

  // 4. Chat UI
  if (window.KhensaniChat) {
    const chat = new window.KhensaniChat({ studentUid: uid });
    await chat.init();
  }

  // 5. Incognito toggle binding
  const incogToggle = document.getElementById('incognito-toggle');
  if (incogToggle) {
    incogToggle.addEventListener('change', async (e) => {
      if (e.target.checked) await window.KhensaniIncognito.enable(uid);
      else await window.KhensaniIncognito.disable();
    });
  }

  // 6. Panic button
  const panicBtn = document.getElementById('panic-button');
  if (panicBtn) {
    panicBtn.addEventListener('click', async () => {
      panicBtn.setAttribute('aria-pressed', 'true');
      await window.KhensaniEmergency.panic('student_initiated');
    });
  }

  // 7. Incognito badge
  document.addEventListener('incognito:on', () => {
    document.querySelector('.sentinel-incognito-badge')?.classList.add('active');
  });
  document.addEventListener('incognito:off', () => {
    document.querySelector('.sentinel-incognito-badge')?.classList.remove('active');
  });

  // 8. Learning progress metrics (Figure 1 ❻)
  const db = window.MindFlowFirebase.db;
  db.collection('student_profiles').doc(uid).onSnapshot(doc => {
    const data = doc.data();
    if (!data) return;
    document.querySelectorAll('[data-metric="academic-average"]').forEach(el => el.textContent = `${data.academicAverage || 0}%`);
    document.querySelectorAll('[data-metric="assignments"]').forEach(el => el.textContent = data.assignmentsCompleted || 0);
    document.querySelectorAll('[data-metric="attendance"]').forEach(el => el.textContent = `${data.attendance || 0}%`);
    document.querySelectorAll('[data-metric="study-time"]').forEach(el => el.textContent = `${data.studyHours || 0}h`);
  });

  // 9. Today's schedule (Figure 1 ❼)
  db.collection('daily_schedule').doc(uid).onSnapshot(doc => {
    const sched = doc.data();
    const container = document.getElementById('daily-schedule');
    if (!container || !sched?.sessions) return;
    container.innerHTML = sched.sessions.map(s => `
      <div class="schedule-card">
        <strong>${s.subject}</strong>
        <span>${s.start}–${s.end}</span>
      </div>
    `).join('');
  });

  // 10. Submit work (Figure 1 ❽)
  const uploadForm = document.getElementById('submit-work-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = uploadForm.querySelector('input[type="file"]').files[0];
      const subject = uploadForm.querySelector('[name="subject"]').value;
      if (!file || !subject) return;
      const path = `institutions/${session.schoolId || 'default'}/students/${uid}/subjects/${subject}/${Date.now()}_${file.name}`;
      const ref = window.MindFlowFirebase.storage.ref(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      window.KhensaniSync.enqueue({
        collection: 'assignment_submissions',
        docId: `${uid}_${Date.now()}`,
        data: { studentId: uid, subject, fileUrl: url, status: 'submitted', timestamp: new Date().toISOString() },
        op: 'set'
      });
      alert('Submitted. Your teacher will be notified.');
    });
  }

  // 11. AI intelligence indicator (Figure 1 ❷)
  db.collection('ai_user_profiles').doc(uid).onSnapshot(doc => {
    const data = doc.data();
    const el = document.getElementById('ai-confidence');
    if (el && data?.confidence) el.textContent = `${data.confidence}%`;
  });

  console.log('[Student Portal] Wired — uid:', uid);
})();