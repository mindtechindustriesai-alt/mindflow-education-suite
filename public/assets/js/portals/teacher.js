// assets/js/portals/teacher.js
// Teacher Dashboard — Figure 2 (5 components)

(async function () {
  'use strict';

  const session = await window.KhensaniAuth.requireRole('teacher');
  if (!session) return;
  const uid = session.uid;
  const db = window.MindFlowFirebase.db;

  // Key metrics (Figure 2 ❸)
  const [classesSnap, submissionsSnap, messagesSnap] = await Promise.all([
    db.collection('teacher_class_assignments').where('teacherUid', '==', uid).where('status', '==', 'active').get(),
    db.collection('assignment_submissions').where('teacherUid', '==', uid).where('status', '==', 'submitted').get(),
    db.collection('messages').where('toUid', '==', uid).where('read', '==', false).get()
  ]);

  document.querySelectorAll('[data-metric="active-classes"]').forEach(el => el.textContent = classesSnap.size);
  document.querySelectorAll('[data-metric="pending-grading"]').forEach(el => el.textContent = submissionsSnap.size);
  document.querySelectorAll('[data-metric="unread-messages"]').forEach(el => el.textContent = messagesSnap.size);

  // Total students
  let totalStudents = 0;
  for (const cls of classesSnap.docs) {
    totalStudents += (cls.data().studentCount || 0);
  }
  document.querySelectorAll('[data-metric="total-students"]').forEach(el => el.textContent = totalStudents);

  // Recent activity feed (Figure 2 ❺)
  db.collection('activity_log')
    .where('teacherUid', '==', uid)
    .orderBy('timestamp', 'desc').limit(20)
    .onSnapshot(snap => {
      const feed = document.getElementById('recent-activity');
      if (!feed) return;
      feed.innerHTML = snap.docs.map(d => {
        const a = d.data();
        return `<div class="activity-item">
          <strong>${a.eventType}</strong>
          <p>${a.description || ''}</p>
          <time>${new Date(a.timestamp).toLocaleString()}</time>
        </div>`;
      }).join('');
    });

  // Notifications badge (Figure 2 ❷)
  db.collection('notifications')
    .where('toUid', '==', uid).where('status', '==', 'unread')
    .onSnapshot(snap => {
      document.querySelectorAll('[data-notification-count]').forEach(el => el.textContent = snap.size);
    });

  console.log('[Teacher Portal] Wired — uid:', uid);
})();