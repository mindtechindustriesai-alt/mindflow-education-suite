// assets/js/emergency.js
// Patent SA 2026/05142 — Figure 7 Component ❷
// Emergency actions — always available, even in incognito

(function () {
  'use strict';

  class Emergency {
    constructor() {
      this.studentUid = null;
    }

    setStudent(uid) { this.studentUid = uid; }

    // === Student panic button ===
    async panic(reason = 'student_initiated') {
      const location = await this.getLocation();
      const payload = {
        studentId: this.studentUid,
        reason,
        location,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      };

      // Write directly to panic_events (student write is allowed by rules)
      const db = window.MindFlowFirebase?.db;
      if (db && this.studentUid) {
        await db.collection('panic_events').add(payload);
      }

      // Notify via Cloud Function
      if (window.firebase?.functions) {
        window.firebase.functions().httpsCallable('panicAlert')(payload);
      }

      console.log('[Emergency] PANIC dispatched', payload);
      return payload;
    }

    // === Security staff only ===
    async campusLockdown(reason) {
      return this.dispatchCommand('lockdown', reason);
    }

    async emergencyEvacuation(reason) {
      return this.dispatchCommand('evacuation', reason);
    }

    async requestBackup(reason) {
      return this.dispatchCommand('backup', reason);
    }

    async dispatchCommand(type, reason) {
      const payload = {
        commandType: type,
        reason,
        issuedBy: window.MindFlowAuth?.currentUser?.uid,
        timestamp: new Date().toISOString()
      };

      const db = window.MindFlowFirebase?.db;
      if (db) {
        await db.collection('security_commands').add(payload);
      }

      if (window.firebase?.functions) {
        window.firebase.functions().httpsCallable('securityCommand')(payload);
      }

      console.log('[Emergency] Command dispatched:', type);
      return payload;
    }

    async getLocation() {
      return new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
          () => resolve(null),
          { timeout: 4000, enableHighAccuracy: true }
        );
      });
    }
  }

  window.KhensaniEmergency = new Emergency();
})();