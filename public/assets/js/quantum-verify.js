/**
 * Khensani AI — Quantum Verify Badge
 * Calls the mqosChsh Cloud Function and renders the quantum badge.
 * Patent: SA 2026/05142 · CHSH S=2.76 (Aer: 2.8284)
 */

(function () {
  'use strict';

  class QuantumVerify {
    constructor() {
      this.lastResult = null;
      this._inFlight = false;
    }

    /**
     * Verify quantum state — calls mqosChsh Cloud Function.
     * @param {boolean} forceFresh - Force a fresh CHSH run (POST) vs cached (GET)
     * @returns {Promise<Object|null>}
     */
    async verify(forceFresh = false) {
      if (this._inFlight) {
        return this.lastResult;
      }
      if (!window.firebase || !window.firebase.functions) {
        console.warn('[QuantumVerify] Firebase Functions not loaded');
        return null;
      }

      this._inFlight = true;
      try {
        const call = window.firebase.functions().httpsCallable('mqosChsh');
        const res = await call({ fresh: forceFresh });
        const d = res.data || {};

        this.lastResult = {
          S: d.S || d.chsh_s || null,
          correlation: d.correlation || null,
          backend: d.backend || null,
          hardware_verified: d.hardware_verified === true,
          badge: this._computeBadge(d),
          timestamp: d.timestamp || new Date().toISOString(),
          raw: d,
        };
        return this.lastResult;
      } catch (e) {
        console.warn('[QuantumVerify] failed:', e.message);
        this.lastResult = null;
        return null;
      } finally {
        this._inFlight = false;
      }
    }

    _computeBadge(d) {
      if (d.hardware_verified === true) return 'hardware';
      if (d.backend === 'qiskit_aer_exact' || d.backend === 'qiskit_aer') return 'live';
      if (d.backend === 'unavailable') return 'unavailable';
      return 'cached';
    }

    badgeLabel() {
      if (!this.lastResult) return 'Quantum Layer Standby';
      switch (this.lastResult.badge) {
        case 'hardware':    return `🔵 Hardware-Verified (${this.lastResult.backend})`;
        case 'live':        return '🟢 Quantum-Verified (Exact)';
        case 'cached':      return '⚪ Cached · Re-verifying';
        case 'unavailable': return '⚠️ Quantum Layer Unavailable';
        default:            return 'Quantum Layer Standby';
      }
    }

    renderBadge(containerId) {
      const el = document.getElementById(containerId);
      if (!el) return;
      if (!this.lastResult) {
        el.textContent = 'Quantum Layer Standby';
        el.className = 'quantum-badge standby';
        el.setAttribute('title', 'Waiting for quantum verification');
        return;
      }
      el.textContent = `${this.badgeLabel()} · S=${this.lastResult.S}`;
      el.className = `quantum-badge ${this.lastResult.badge}`;
      el.setAttribute('title', `Patent SA 2026/05142 · Backend: ${this.lastResult.backend}`);
    }

    /** Optional: auto-refresh every N seconds */
    startAutoRefresh(containerId, intervalMs = 300000) {
      this.renderBadge(containerId);
      setInterval(async () => {
        await this.verify(false);
        this.renderBadge(containerId);
      }, intervalMs);
    }
  }

  window.KhensaniQuantum = new QuantumVerify();
  console.log('[Khensani] quantum-verify.js loaded');
})();