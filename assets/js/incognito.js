// assets/js/incognito.js
// Patent SA 2026/05142 — Figure 1 Component ❾
// Privacy-preserving state · Emergency features always active

(function () {
  'use strict';

  const DEFAULT_DURATION_HOURS = 4;

  class IncognitoMode {
    constructor() {
      this.active = false;
      this.studentUid = null;
      this.autoDisableTimer = null;
    }

    async enable(studentUid) {
      if (!studentUid) return console.warn('[Incognito] no UID');
      this.studentUid = studentUid;

      const now = new Date();
      const autoDisable = new Date(now.getTime() + DEFAULT_DURATION_HOURS * 3600 * 1000);

      // Write state to Firestore
      const db = window.MindFlowFirebase?.db;
      if (db) {
        await db.collection('privacy_states').doc(studentUid).set({
          mode: 'incognito',
          startTime: now.toISOString(),
          autoDisableTime: autoDisable.toISOString()
        }, { merge: true });

        // Privacy-respecting parent update — last known location only
        const locSnap = await db.collection('locations_tracking')
          .where('studentId', '==', studentUid)
          .orderBy('timestamp', 'desc').limit(1).get();

        if (!locSnap.empty) {
          const loc = locSnap.docs[0].data();
          await db.collection('parent_notifications').add({
            studentId: studentUid,
            type: 'incognito_start',
            message: 'Detailed activity tracking paused. Emergency features remain active.',
            lastKnownLocation: loc.coordinates || null,
            battery: loc.battery || null,
            timestamp: now.toISOString(),
            priority: 'low'
          });
        }
      }

      this.active = true;
      this.autoDisableTimer = setTimeout(() => this.disable(), DEFAULT_DURATION_HOURS * 3600 * 1000);
      document.dispatchEvent(new CustomEvent('incognito:on'));
      console.log('[Incognito] Enabled — emergency features stay active');
    }

    async disable() {
      if (!this.active) return;
      clearTimeout(this.autoDisableTimer);
      this.autoDisableTimer = null;

      const db = window.MindFlowFirebase?.db;
      if (db && this.studentUid) {
        await db.collection('privacy_states').doc(this.studentUid).set({
          mode: 'normal',
          endedAt: new Date().toISOString()
        }, { merge: true });
      }

      this.active = false;
      document.dispatchEvent(new CustomEvent('incognito:off'));
      console.log('[Incognito] Disabled — normal tracking resumed');
    }

    toggle() {
      return this.active ? this.disable() : this.enable(this.studentUid);
    }

    // Emergency override — always allowed, even in incognito
    async forceLocate() {
      if (!this.studentUid) return;
      const payload = {
        studentId: this.studentUid,
        reason: 'parent_override',
        timestamp: new Date().toISOString()
      };
      if (window.firebase?.functions) {
        window.firebase.app().functions('africa-south1').httpsCallable('forceLocate')(payload);
      }
    }
  }

  window.KhensaniIncognito = new IncognitoMode();
})();