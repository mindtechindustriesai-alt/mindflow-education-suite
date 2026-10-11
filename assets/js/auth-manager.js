// assets/js/auth-manager.js
// Khensani AI — Unified Authentication
// Google primary · QR backup · Role selection · Demo mode
// 7-role portal routing · Firestore user sync

(function () {
  'use strict';

  const ROLE_PORTAL_MAP = {
    student:    '/student-portal/mindflow-portal.html',
    teacher:    '/teacher-portal/teacher-dashboard.html',
    parent:     '/parent/parent-dashboard.html',
    hod:        '/hod-portal/hod-dashboard.html',
    principal:  '/principal-portal/principal-school-analytics.html',
    security:   '/security-portal/security-command.html',
    corporate:  '/corporate-portal/corporate.html'
  };

  const DEMO_UIDS = {
    student:   'demo_student_001',
    teacher:   'demo_teacher_001',
    parent:    'demo_parent_001',
    hod:       'demo_hod_001',
    principal: 'demo_principal_001',
    security:  'demo_security_001',
    corporate: 'demo_corporate_001'
  };

  class KhensaniAuth {
    constructor() {
      this.auth = null;
      this.db = null;
      this.currentUser = null;
      this.currentRole = null;
      this._ready = false;
    }

    async init() {
      if (!window.MindFlowFirebase) {
        throw new Error('MindFlowFirebase not loaded — check script order');
      }
      this.auth = window.MindFlowFirebase.auth;
      this.db   = window.MindFlowFirebase.db;

      return new Promise((resolve) => {
        this.auth.onAuthStateChanged(async (user) => {
          this.currentUser = user;
          if (user) {
            await this.syncUserDoc(user);
            this.currentRole = await this.fetchRole(user.uid);
          } else {
            this.currentRole = null;
          }
          this._ready = true;
          document.dispatchEvent(new CustomEvent('khensani:auth:ready', {
            detail: { uid: user?.uid || null, role: this.currentRole }
          }));
          resolve();
        });
      });
    }

    // ============ GOOGLE LOGIN ============
    async signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await this.auth.signInWithPopup(provider);
      await this.syncUserDoc(result.user);
      const role = await this.fetchRole(result.user.uid);
      if (!role) {
        return { needsRole: true, user: result.user };
      }
      return { needsRole: false, role, user: result.user };
    }

    // ============ EMAIL / PASSWORD (fallback) ============
    async signInWithEmail(email, password) {
      const cred = await this.auth.signInWithEmailAndPassword(email, password);
      const role = await this.fetchRole(cred.user.uid);
      return { role, user: cred.user };
    }

    async signUpWithEmail(email, password, profile) {
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      await this.syncUserDoc(cred.user, profile);
      return cred.user;
    }

    async resetPassword(email) {
      return this.auth.sendPasswordResetEmail(email);
    }

    // ============ QR BACKUP LOGIN ============
    async signInWithQRToken(token) {
      if (!token) throw new Error('No token');
      const tokenRef = this.db.collection('auth_tokens').doc(token);
      const snap = await tokenRef.get();
      if (!snap.exists) throw new Error('Invalid QR token');
      const data = snap.data();
      if (data.used) throw new Error('QR token already used');
      if (new Date(data.expiresAt) < new Date()) throw new Error('QR token expired');

      // Anonymous auth + token binding
      const cred = await this.auth.signInAnonymously();
      const uid = cred.user.uid;

      await this.db.collection('users').doc(uid).set({
        uid,
        role: data.role,
        schoolId: data.schoolId,
        createdAt: new Date().toISOString(),
        viaQR: true
      });

      await tokenRef.update({
        used: true,
        usedAt: new Date().toISOString(),
        usedBy: uid
      });

      return { role: data.role, user: cred.user };
    }

    // ============ ROLE SELECTION (first-time) ============
    async setRole(role) {
      if (!this.currentUser) throw new Error('Not signed in');
      if (!ROLE_PORTAL_MAP[role]) throw new Error('Invalid role: ' + role);
      await this.db.collection('users').doc(this.currentUser.uid).set(
        { role, roleSetAt: new Date().toISOString() },
        { merge: true }
      );
      this.currentRole = role;
      return role;
    }

    // ============ DEMO MODE ============
    async enterDemo(role) {
      const demoUid = DEMO_UIDS[role];
      if (!demoUid) throw new Error('No demo for role: ' + role);
      sessionStorage.setItem('khensani_demo_role', role);
      sessionStorage.setItem('khensani_demo_uid', demoUid);
      window.location.href = ROLE_PORTAL_MAP[role];
    }

    // ============ HELPERS ============
    async syncUserDoc(user, extra = {}) {
      const ref = this.db.collection('users').doc(user.uid);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          uid: user.uid,
          email: user.email || null,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          createdAt: new Date().toISOString(),
          ...extra
        });
      } else {
        await ref.set({
          lastLogin: new Date().toISOString(),
          displayName: user.displayName || snap.data().displayName,
          photoURL: user.photoURL || snap.data().photoURL
        }, { merge: true });
      }
    }

    async fetchRole(uid) {
      const snap = await this.db.collection('users').doc(uid).get();
      return snap.exists ? (snap.data().role || null) : null;
    }

    // ============ PORTAL ROUTING ============
    redirectToPortal(role) {
      const path = ROLE_PORTAL_MAP[role];
      if (!path) throw new Error('Unknown role: ' + role);
      window.location.href = path;
    }

    // ============ GUARD (for portal pages) ============
    async requireRole(expectedRole) {
      await this.init();
      // Demo override
      const demoRole = sessionStorage.getItem('khensani_demo_role');
      if (demoRole === expectedRole) {
        return { uid: DEMO_UIDS[expectedRole], demo: true };
      }
      if (!this.currentUser) {
        window.location.href = '/student-portal/register-login.html';
        return null;
      }
      const role = await this.fetchRole(this.currentUser.uid);
      if (role !== expectedRole) {
        this.redirectToPortal(role);
        return null;
      }
      return { uid: this.currentUser.uid, role };
    }

    async signOut() {
      sessionStorage.removeItem('khensani_demo_role');
      sessionStorage.removeItem('khensani_demo_uid');
      return this.auth.signOut();
    }
  }

  window.KhensaniAuth = new KhensaniAuth();
})();