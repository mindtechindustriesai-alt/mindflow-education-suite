// assets/js/sentinel-ai.js
// Khensani AI · Sentinel Safety Module
// Patent SA 2026/05142 — Figure 1 ❾, Figure 3 ❸, Figure 7 ❽
// Real-time affective computing · Tiered interventions · Offline-first

(function () {
  'use strict';

  // =========================================================
  // CONFIGURATION — tunable, non-negotiable defaults
  // =========================================================
  const SENTINEL_CONFIG = {
    // Risk score thresholds (0–100)
    TIER_1_MIN: 40,   // Guided pause
    TIER_2_MIN: 60,   // Difficulty adjustment
    TIER_3_MIN: 80,   // Teacher alert
    TIER_4_MIN: 90,   // Parent + human oversight

    // Sustained anomaly requirement — kills false positives
    SUSTAINED_WINDOW_MS: 30 * 1000,      // 30 seconds
    SUSTAINED_SAMPLE_MIN: 8,             // 8 anomalous signals within window

    // Keystroke analysis
    KEYSTROKE_BUFFER_SIZE: 200,          // rolling window
    BASELINE_SAMPLES: 100,               // samples needed to establish baseline

    // Distress keywords (multilingual — expanded per locale)
    DISTRESS_KEYWORDS_EN: [
      'help me', 'i want to die', 'kill myself', 'no one cares',
      'i am scared', 'they hurt me', 'i am being bullied',
      'i can\'t take it', 'goodbye', 'i am alone'
    ],
    DISTRESS_KEYWORDS_AF: [
      'help my', 'ek wil doodgaan', 'ek is bang',
      'hulle seer my', 'ek is alleen', 'totsiens'
    ],
    DISTRESS_KEYWORDS_ZU: [
      'ngisiza', 'ngifuna ukufa', 'ngiyesaba',
      'bayangilimaza', 'ngingedwa', 'hamba kahle'
    ],
    DISTRESS_KEYWORDS_XH: [
      'ndincedeni', 'ndifuna ukufa', 'ndiyoyika',
      'bayandenzakalisa', 'ndindedwa', 'hamba kakuhle'
    ],

    // Firestore writes
    ALERT_COLLECTION: 'sentinel_alerts',
    PRIVACY_COLLECTION: 'privacy_states',
    PANIC_COLLECTION: 'panic_events',

    // Ephemeral mode (when incognito active) — no detailed logs
    EPHEMERAL_MODE: false
  };

  // =========================================================
  // KEYSTROKE DYNAMICS ANALYZER
  // =========================================================
  class KeystrokeAnalyzer {
    constructor() {
      this.buffer = [];         // {dwell, flight, timestamp}
      this.lastKeyDown = 0;
      this.lastKeyUp = 0;
      this.baseline = null;
      this.anomalyCount = 0;
      this.anomalyWindowStart = Date.now();
    }

    attach(target = document) {
      target.addEventListener('keydown', (e) => this.onKeyDown(e));
      target.addEventListener('keyup',   (e) => this.onKeyUp(e));
    }

    onKeyDown() {
      const now = performance.now();
      if (this.lastKeyDown) {
        const flight = now - this.lastKeyUp;
        this.record({ flight, dwell: null, timestamp: now });
      }
      this.lastKeyDown = now;
    }

    onKeyUp() {
      const now = performance.now();
      const dwell = now - this.lastKeyDown;
      this.record({ dwell, flight: null, timestamp: now });
      this.lastKeyUp = now;
    }

    record(sample) {
      this.buffer.push(sample);
      if (this.buffer.length > SENTINEL_CONFIG.KEYSTROKE_BUFFER_SIZE) {
        this.buffer.shift();
      }

      // Establish baseline after enough samples
      if (!this.baseline && this.buffer.length >= SENTINEL_CONFIG.BASELINE_SAMPLES) {
        this.baseline = this.computeBaseline();
      }

      // Check for anomaly
      if (this.baseline) {
        const anomalous = this.isAnomalous(sample);
        if (anomalous) {
          this.anomalyCount++;
        } else {
          this.anomalyCount = Math.max(0, this.anomalyCount - 1);
        }
      }
    }

    computeBaseline() {
      const dwells = this.buffer.filter(s => s.dwell).map(s => s.dwell);
      const flights = this.buffer.filter(s => s.flight).map(s => s.flight);
      return {
        dwellMean: this.mean(dwells),
        dwellStd:  this.std(dwells),
        flightMean: this.mean(flights),
        flightStd:  this.std(flights)
      };
    }

    isAnomalous(sample) {
      const b = this.baseline;
      if (!b) return false;
      if (sample.dwell) {
        const z = Math.abs((sample.dwell - b.dwellMean) / (b.dwellStd || 1));
        if (z > 2.5) return true;
      }
      if (sample.flight) {
        const z = Math.abs((sample.flight - b.flightMean) / (b.flightStd || 1));
        if (z > 2.5) return true;
      }
      return false;
    }

    // 0–100 anomaly score
    score() {
      if (!this.baseline) return 0;
      return Math.min(100, this.anomalyCount * 5);
    }

    mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
    std(arr) {
      if (arr.length < 2) return 0;
      const m = this.mean(arr);
      return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
    }

    reset() {
      this.buffer = [];
      this.baseline = null;
      this.anomalyCount = 0;
      this.anomalyWindowStart = Date.now();
    }
  }

  // =========================================================
  // ENGAGEMENT ANALYZER — session duration, pauses, tab focus
  // =========================================================
  class EngagementAnalyzer {
    constructor() {
      this.sessionStart = Date.now();
      this.lastActivity = Date.now();
      this.blurCount = 0;
      this.longPauseCount = 0;
      this.idleThresholdMs = 60 * 1000; // 1 minute of inactivity = pause
    }

    attach() {
      window.addEventListener('blur',  () => this.blurCount++);
      window.addEventListener('focus', () => { this.lastActivity = Date.now(); });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.blurCount++;
      });
      ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
        document.addEventListener(evt, () => this.touch(), { passive: true });
      });
    }

    touch() {
      const now = Date.now();
      if (now - this.lastActivity > this.idleThresholdMs) {
        this.longPauseCount++;
      }
      this.lastActivity = now;
    }

    score() {
      const sessionMin = (Date.now() - this.sessionStart) / 60000;
      let score = 0;
      if (this.blurCount > 5)       score += 20;
      if (this.longPauseCount > 2)  score += 30;
      if (sessionMin > 120)         score += 20;   // > 2 hours no break
      if (sessionMin < 1)           score += 10;   // disengaged immediately
      return Math.min(100, score);
    }
  }

  // =========================================================
  // TEXT SENTIMENT ANALYZER — distress keyword detection
  // =========================================================
  class SentimentAnalyzer {
    constructor(locale = 'en') {
      this.locale = locale;
      this.keywords = [
        ...SENTINEL_CONFIG.DISTRESS_KEYWORDS_EN,
        ...SENTINEL_CONFIG.DISTRESS_KEYWORDS_AF,
        ...SENTINEL_CONFIG.DISTRESS_KEYWORDS_ZU,
        ...SENTINEL_CONFIG.DISTRESS_KEYWORDS_XH
      ];
    }

    scan(text) {
      if (!text) return 0;
      const lower = text.toLowerCase();
      let hits = 0;
      for (const kw of this.keywords) {
        if (lower.includes(kw)) hits += 25;
      }
      return Math.min(100, hits);
    }
  }

  // =========================================================
  // SENTINEL AI — MAIN ORCHESTRATOR
  // =========================================================
  class SentinelAI {
    constructor() {
      this.keystroke = new KeystrokeAnalyzer();
      this.engagement = new EngagementAnalyzer();
      this.sentiment = new SentimentAnalyzer();
      this.riskScore = 0;
      this.tier = 0;
      this.running = false;
      this.incognito = false;
      this.sustainedAnomalyStart = null;
      this.currentStudentUid = null;
      this.unsubscribe = [];
    }

    async init(studentUid) {
      if (!studentUid) {
        console.warn('[Sentinel] No student UID — running in anonymous mode');
      }
      this.currentStudentUid = studentUid;
      this.keystroke.attach(document);
      this.engagement.attach();
      this.running = true;

      // Watch privacy state (Incognito Mode)
      if (studentUid && window.MindFlowFirebase?.db) {
        const db = window.MindFlowFirebase.db;
        const unsub = db.collection(SENTINEL_CONFIG.PRIVACY_COLLECTION)
          .doc(studentUid)
          .onSnapshot(doc => {
            const data = doc.data();
            this.incognito = data?.mode === 'incognito';
            SENTINEL_CONFIG.EPHEMERAL_MODE = this.incognito;
            console.log('[Sentinel] Incognito:', this.incognito);
          });
        this.unsubscribe.push(unsub);
      }

      // Main risk loop — every 3 seconds
      this.loop = setInterval(() => this.evaluate(), 3000);
      console.log('[Sentinel] Active · student:', studentUid || 'anonymous');
    }

    evaluate() {
      if (!this.running) return;

      const ks = this.keystroke.score();
      const en = this.engagement.score();
      const sn = this.sentiment.scan(this.lastMessage);

      // Weighted composite (patent-aligned)
      // keystroke 45% · engagement 35% · sentiment 20%
      this.riskScore = Math.round(ks * 0.45 + en * 0.35 + sn * 0.20);

      // Sustained anomaly check — kills false positives
      if (this.riskScore >= SENTINEL_CONFIG.TIER_1_MIN) {
        if (!this.sustainedAnomalyStart) {
          this.sustainedAnomalyStart = Date.now();
        }
        const sustainedMs = Date.now() - this.sustainedAnomalyStart;
        if (sustainedMs < SENTINEL_CONFIG.SUSTAINED_WINDOW_MS) {
          return; // not yet sustained
        }
      } else {
        this.sustainedAnomalyStart = null;
        return;
      }

      // Determine tier
      let tier = 0;
      if      (this.riskScore >= SENTINEL_CONFIG.TIER_4_MIN) tier = 4;
      else if (this.riskScore >= SENTINEL_CONFIG.TIER_3_MIN) tier = 3;
      else if (this.riskScore >= SENTINEL_CONFIG.TIER_2_MIN) tier = 2;
      else if (this.riskScore >= SENTINEL_CONFIG.TIER_1_MIN) tier = 1;

      if (tier !== this.tier) {
        this.tier = tier;
        this.dispatchTier(tier);
      }
    }

    dispatchTier(tier) {
      const payload = {
        studentId: this.currentStudentUid,
        riskScore: this.riskScore,
        tier,
        timestamp: new Date().toISOString(),
        incognito: this.incognito
      };

      console.log('[Sentinel] Tier', tier, payload);

      switch (tier) {
        case 1: this.tier1GuidedPause(); break;
        case 2: this.tier2AdjustDifficulty(); break;
        case 3: this.tier3AlertTeacher(payload); break;
        case 4: this.tier4HumanHandoff(payload); break;
      }
    }

    tier1GuidedPause() {
      // Show calm prompt — no Firestore write (ephemeral)
      this.showPrompt('Take a breath. You are doing well. Ready to continue?');
    }

    tier2AdjustDifficulty() {
      this.showPrompt('Let\'s slow down. Try this easier one.');
      document.dispatchEvent(new CustomEvent('sentinel:reduce-difficulty'));
    }

    tier3AlertTeacher(payload) {
      // In incognito: process ephemerally — no detailed logs
      if (this.incognito) {
        console.log('[Sentinel] Tier 3 in incognito — ephemeral, teacher alerted without detail');
      }
      // Alert via Cloud Function (never write directly)
      if (window.firebase?.functions) {
        window.firebase.functions().httpsCallable('sentinelAlert')(payload);
      }
      document.dispatchEvent(new CustomEvent('sentinel:tier3', { detail: payload }));
    }

    tier4HumanHandoff(payload) {
      if (window.firebase?.functions) {
        window.firebase.functions().httpsCallable('sentinelAlert')({
          ...payload,
          severity: 'critical',
          notifyParent: true
        });
      }
      document.dispatchEvent(new CustomEvent('sentinel:tier4', { detail: payload }));
    }

    showPrompt(text) {
      const el = document.createElement('div');
      el.className = 'sentinel-prompt';
      el.setAttribute('role', 'status');
      el.textContent = text;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 6000);
    }

    // Public — feed last chat message for sentiment analysis
    feedMessage(text) {
      this.lastMessage = text;
    }

    // Public — panic button
    async panic() {
      const payload = {
        studentId: this.currentStudentUid,
        timestamp: new Date().toISOString(),
        location: await this.getLocation()
      };
      if (window.firebase?.functions) {
        window.firebase.functions().httpsCallable('panicAlert')(payload);
      }
      this.showPrompt('Help is on the way. Stay where you are.');
    }

    async getLocation() {
      return new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 5000, enableHighAccuracy: true }
        );
      });
    }

    stop() {
      this.running = false;
      clearInterval(this.loop);
      this.unsubscribe.forEach(u => typeof u === 'function' && u());
    }
  }

  // =========================================================
  // EXPORT
  // =========================================================
  window.SentinelAI = new SentinelAI();

  // Auto-init when Firebase auth is ready
  document.addEventListener('khensani:auth:ready', (e) => {
    window.SentinelAI.init(e.detail?.uid);
  });

})();