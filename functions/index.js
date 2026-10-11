/**
 * Khensani AI — Cloud Functions
 * Region: africa-south1 (Johannesburg)
 * Patent: SA 2026/05142
 *
 * Exports:
 *   - mqosChsh   : Fetch live CHSH from MQOS TERERAI
 *   - luvunoChat : Proxy chat to Luvuno Backend (DeepSeek/OpenRouter)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

const REGION = 'africa-south1';


// ============================================================
// mqosChsh — Khensani → MQOS TERERAI
// ============================================================

exports.mqosChsh = functions
  .region(REGION)
  .runWith({
    secrets: ['MQOS_URL', 'MQOS_SHARED_SECRET'],
    timeoutSeconds: 120,
    memory: '256MiB',
  })
  .https.onCall(async (data, context) => {
    const fresh = data && data.fresh === true;
    const mqosUrl = process.env.MQOS_URL;
    const mqosKey = process.env.MQOS_SHARED_SECRET;

    if (!mqosUrl) {
      throw new functions.https.HttpsError('failed-precondition', 'MQOS_URL not configured');
    }

    const url = fresh
      ? `${mqosUrl}/api/v1/verify/chsh`
      : `${mqosUrl}/api/v1/verify/chsh/cached`;

    const fetchOpts = {
      method: fresh ? 'POST' : 'GET',
      headers: {},
    };
    if (mqosKey) fetchOpts.headers['X-MQOS-Key'] = mqosKey;
    if (fresh) {
      fetchOpts.headers['Content-Type'] = 'application/json';
      fetchOpts.body = JSON.stringify({ backend: 'qiskit_aer', shots: 1024, runs: 1 });
    }

    let res;
    try {
      res = await fetch(url, fetchOpts);
    } catch (err) {
      console.error('[mqosChsh] fetch failed:', err);
      throw new functions.https.HttpsError('internal', `MQOS fetch failed: ${err.message}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[mqosChsh] ${res.status} body:`, body.slice(0, 200));
      throw new functions.https.HttpsError('internal', `MQOS ${res.status}`);
    }

    const json = await res.json();

    try {
      await db.collection('quantum_verifications').add({
        ...json,
        source: 'mqos',
        fetchedBy: context.auth?.uid || 'anonymous',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[mqosChsh] Firestore log failed:', err.message);
    }

    return json;
  });


// ============================================================
// luvunoChat — Khensani → Luvuno Backend Proxy
// ============================================================

exports.luvunoChat = functions
  .region(REGION)
  .runWith({
    secrets: ['LUVUNO_URL', 'LUVUNO_SHARED_SECRET'],
    timeoutSeconds: 60,
    memory: '256MiB',
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    }

    const luvunoUrl = process.env.LUVUNO_URL;
    const luvunoKey = process.env.LUVUNO_SHARED_SECRET;

    if (!luvunoUrl) {
      throw new functions.https.HttpsError('failed-precondition', 'LUVUNO_URL not configured');
    }

    const message = (data && data.message) ? String(data.message) : '';
    if (!message) {
      throw new functions.https.HttpsError('invalid-argument', 'message required');
    }

    const payload = {
      message,
      portal: data.portal || 'khensani',
      language: data.language || 'english',
      session_id: context.auth.uid,
      conversation_history: Array.isArray(data.history) ? data.history : [],
      response_style: data.style || 'detailed',
    };

    let res;
    try {
      res = await fetch(`${luvunoUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(luvunoKey ? { 'X-Luvuno-Key': luvunoKey } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[luvunoChat] fetch failed:', err);
      throw new functions.https.HttpsError('internal', `Luvuno fetch failed: ${err.message}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[luvunoChat] ${res.status} body:`, body.slice(0, 200));
      throw new functions.https.HttpsError('internal', `Luvuno ${res.status}`);
    }

    const json = await res.json();

    try {
      await db.collection('ai_conversations').add({
        uid: context.auth.uid,
        message: payload.message,
        reply: json.response || '',
        source: 'luvuno',
        backend: json.backend || null,
        model: json.model_used || null,
        quantum_verified: json.quantum_verified || false,
        chsh_score: json.chsh_score || null,
        chsh_context: json.chsh_context || null,
        language: payload.language,
        portal: payload.portal,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[luvunoChat] Firestore log failed:', err.message);
    }

    return json;
  });