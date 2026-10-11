// functions/lib/notifications.js
// Parent notification dispatcher — Firestore + email ready

const admin = require('firebase-admin');

async function sendParentNotification({ parentUid, studentId, type, priority, message, timestamp }) {
  const db = admin.firestore();

  await db.collection('parent_notifications').add({
    parentUid,
    studentId,
    type,
    priority: priority || 'medium',
    message,
    read: false,
    timestamp: timestamp || new Date().toISOString()
  });

  // Optional: FCM push if token stored
  const parentSnap = await db.collection('parent_profiles').doc(parentUid).get();
  const fcmToken = parentSnap.data()?.fcmToken;
  if (fcmToken) {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: priority === 'critical' ? '🚨 URGENT' : 'Khensani AI',
          body: message
        },
        data: { studentId, type, priority: priority || 'medium' }
      });
    } catch (e) {
      console.warn('[sendParentNotification] FCM failed:', e.message);
    }
  }

  return { ok: true };
}

module.exports = { sendParentNotification };