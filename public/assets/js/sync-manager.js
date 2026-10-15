// assets/js/sync-manager.js
// Offline/online Firestore sync · IndexedDB queue · Service-worker bridge

(function () {
  'use strict';

  const SYNC_QUEUE_KEY = 'khensani_sync_queue';
  const SYNC_INTERVAL_MS = 15000;

  class SyncManager {
    constructor() {
      this.queue = this.loadQueue();
      this.online = navigator.onLine;
      this.bindEvents();
      this.startLoop();
    }

    bindEvents() {
      window.addEventListener('online',  () => this.flush());
      window.addEventListener('offline', () => { this.online = false; });
    }

    loadQueue() {
      try { return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]'); }
      catch { return []; }
    }

    persistQueue() {
      try { localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue)); }
      catch (e) { console.warn('[Sync] queue persist failed', e); }
    }

    enqueue({ collection, docId, data, op = 'set' }) {
      this.queue.push({
        collection, docId, data, op,
        queuedAt: new Date().toISOString()
      });
      this.persistQueue();
      if (this.online) this.flush();
    }

    async flush() {
      if (!this.online) return;
      if (!window.MindFlowFirebase?.db) return;

      const db = window.MindFlowFirebase.db;
      const remaining = [];

      for (const item of this.queue) {
        try {
          const ref = db.collection(item.collection).doc(item.docId);
          if (item.op === 'set')    await ref.set(item.data, { merge: true });
          if (item.op === 'update') await ref.update(item.data);
          if (item.op === 'delete') await ref.delete();
        } catch (e) {
          console.warn('[Sync] failed item, keeping for retry', e);
          remaining.push(item);
        }
      }

      this.queue = remaining;
      this.persistQueue();

      if (remaining.length === 0) {
        document.dispatchEvent(new CustomEvent('khensani:sync:complete'));
      }
    }

    startLoop() {
      setInterval(() => {
        this.online = navigator.onLine;
        if (this.online && this.queue.length) this.flush();
      }, SYNC_INTERVAL_MS);
    }

    get status() {
      return {
        online: this.online,
        pending: this.queue.length,
        lastFlush: new Date().toISOString()
      };
    }
  }

  window.KhensaniSync = new SyncManager();
})();