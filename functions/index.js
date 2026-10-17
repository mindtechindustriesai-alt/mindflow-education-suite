/**
 * Khensani AI — Cloud Functions (v2 API, firebase-functions v7)
 * Region: africa-south1 (Johannesburg)
 * Patent: SA 2026/05142 · CHSH S=2.76 (Aer: 2.8284)
 *
 * Exports:
 *   - mqosChsh   : Fetch live CHSH from MQOS TERERAI
 *   - luvunoChat : Proxy chat to Luvuno Backend (DeepSeek/OpenRouter)
 *
 * Compatible with:
 *   - firebase-functions@7.x
 *   - firebase-admin@14.x (modular imports)
 *   - Node.js 22 runtime
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

initializeApp();
const db = getFirestore();

setGlobalOptions({
  region: 'africa-south1',
  maxInstances: 10,
});

// CORS configuration for callable functions
const corsOptions = {
  cors: [
    'https://mindflow-ai-education.web.app',
    'https://mindflow-ai-education.firebaseapp.com',
    'https://mindflow-ai-education.app',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5000'
  ]
};


// Declare secrets (read from Firebase Secret Manager at runtime)
const MQOS_URL = defineSecret('MQOS_URL');
const MQOS_SHARED_SECRET = defineSecret('MQOS_SHARED_SECRET');
const LUVUNO_URL = defineSecret('LUVUNO_URL');
const LUVUNO_SHARED_SECRET = defineSecret('LUVUNO_SHARED_SECRET');


// ============================================================
// mqosChsh — Khensani → MQOS TERERAI
// ============================================================

exports.mqosChsh = onCall(
  {
    ...corsOptions,
    secrets: [MQOS_URL, MQOS_SHARED_SECRET],
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async (request) => {
    const fresh = request.data && request.data.fresh === true;
    const mqosUrl = MQOS_URL.value();
    const mqosKey = (MQOS_SHARED_SECRET.value() || '').replace(/^\uFEFF/, '').trim(); // Sanitize secret

    if (!mqosUrl) {
      throw new HttpsError('failed-precondition', 'MQOS_URL not configured');
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
      throw new HttpsError('internal', `MQOS fetch failed: ${err.message}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[mqosChsh] ${res.status} body:`, body.slice(0, 200));
      throw new HttpsError('internal', `MQOS ${res.status}`);
    }

    const json = await res.json();

    try {
      await db.collection('quantum_verifications').add({
        ...json,
        source: 'mqos',
        fetchedBy: request.auth?.uid || 'anonymous',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[mqosChsh] Firestore log failed:', err.message);
    }

    return json;
  }
);


// ============================================================
// luvunoChat — Khensani → Luvuno Backend Proxy
// ============================================================

exports.luvunoChat = onCall(
  {
    ...corsOptions,
    secrets: [LUVUNO_URL, LUVUNO_SHARED_SECRET],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Auth required');
    }

    const luvunoUrl = LUVUNO_URL.value();
    const luvunoKey = (LUVUNO_SHARED_SECRET.value() || '').replace(/^\uFEFF/, '').trim(); // Sanitize secret

    if (!luvunoUrl) {
      throw new HttpsError('failed-precondition', 'LUVUNO_URL not configured');
    }

    const message = (request.data && request.data.message) ? String(request.data.message) : '';
    if (!message) {
      throw new HttpsError('invalid-argument', 'message required');
    }

    const payload = {
      message,
      portal: request.data.portal || 'khensani',
      language: request.data.language || 'english',
      session_id: request.auth.uid,
      conversation_history: Array.isArray(request.data.history) ? request.data.history : [],
      response_style: request.data.style || 'detailed',
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
      await db.collection("student_videos").doc(videoId).update({ quantum_screen: "review", quantum_score: 50, quantum_reason: "Luvuno network error. Queued for manual review." });
      return { status: "review", score: 50, reason: "Luvuno network error" };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[luvunoChat] ${res.status} body:`, body.slice(0, 200));
      await db.collection("student_videos").doc(videoId).update({ quantum_screen: "review", quantum_score: 50, quantum_reason: "Luvuno offline. Queued for manual review." });
      return { status: "review", score: 50, reason: "Luvuno offline" };
    }

    const json = await res.json();

    try {
      await db.collection('ai_conversations').add({
        uid: request.auth.uid,
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
  }
);
// ============================================================
// KHENSANI CREATORS — Cloud Functions
// ============================================================

// 1. screenStudentVideo — Quantum screening via Luvuno
exports.screenStudentVideo = onCall(
  {
    ...corsOptions,
    secrets: [LUVUNO_URL, LUVUNO_SHARED_SECRET],
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    const { videoId, title, subject, curriculum_code, creative_category, transcript } = request.data || {};
    if (!videoId || !title || !transcript) {
      throw new HttpsError('invalid-argument', 'Missing required video fields');
    }

    const luvunoUrl = LUVUNO_URL.value();
    const luvunoKey = (LUVUNO_SHARED_SECRET.value() || '').replace(/^\uFEFF/, '').trim();
    if (!luvunoUrl) throw new HttpsError('failed-precondition', 'LUVUNO_URL not configured');

    // Build screening prompt
    const prompt = `You are a strict curriculum and safety screening AI for a South African school.
Evaluate the following student video submission.

Title: ${title}
Subject: ${subject}
Curriculum Code: ${curriculum_code}
Creative Category: ${creative_category}
Transcript: "${transcript}"

Determine if this is safe and educational for a school platform.
Respond strictly in JSON format:
{
  "pass": true/false,
  "score": 0-100 (100 being perfectly safe and educational),
  "reason": "brief explanation",
  "flags": ["safety", "profanity", "off-topic", "none"]
}
Do not include any other text outside the JSON.`;

    let res;
    try {
      res = await fetch(`${luvunoUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(luvunoKey ? { 'X-Luvuno-Key': luvunoKey } : {}),
        },
        body: JSON.stringify({
          message: prompt,
          portal: 'khensani',
          response_style: 'json',
          session_id: request.auth?.uid || 'anonymous'
        }),
      });
    } catch (err) {
      await db.collection("student_videos").doc(videoId).update({ quantum_screen: "review", quantum_score: 50, quantum_reason: "Luvuno network error. Queued for manual review." });
      return { status: "review", score: 50, reason: "Luvuno network error" };
    }

    if (!res.ok) 
      // Fallback: Route to manual review if Luvuno fails
      await db.collection('student_videos').doc(videoId).update({ 
        quantum_screen: 'review', 
        quantum_score: 50, 
        quantum_reason: 'Luvuno AI unavailable. Queued for manual review.' 
      });
      return { status: 'review', score: 50, reason: 'Luvuno error' };
    
    const json = await res.json();
    let screenResult = { pass: false, score: 0, reason: "Parse error", flags: ["system"] };
    
    try {
      // Clean potential markdown blocks from LLM response
      const rawReply = json.response || '{}';
      const cleanJson = rawReply.replace(/```json/g, '').replace(/```/g, '').trim();
      screenResult = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse Luvuno response as JSON:', json.response);
    }

    // Determine DB status based on score
    const approved = screenResult.pass === true && screenResult.score >= 80;
    const status = approved ? 'approved' : (screenResult.score >= 50 ? 'review' : 'blocked');

    // Write to quantum_screenings audit trail
    await db.collection('quantum_screenings').add({
      videoId,
      videoType: 'student',
      screenResult: status,
      screenScore: screenResult.score,
      reasons: screenResult.flags || [],
      screenedAt: new Date().toISOString(),
      rawLLM: json.response
    });

    // Update the student video document
    await db.collection('student_videos').doc(videoId).update({
      quantum_screen: status,
      quantum_score: screenResult.score,
      quantum_reason: screenResult.reason,
      approved: approved,
      reviewedAt: new Date().toISOString(),
    });

    return { status, score: screenResult.score, reason: screenResult.reason };
  }
);

// 2. recordVideoLike
exports.recordVideoLike = onCall(
  { ...corsOptions },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in to like');
    const { videoId, videoType } = request.data || {};
    if (!videoId || !['teacher', 'student'].includes(videoType)) {
      throw new HttpsError('invalid-argument', 'Invalid videoId or videoType');
    }

    const likeId = `${request.auth.uid}_${videoId}`;
    const likeRef = db.collection('video_likes').doc(likeId);
    const videoRef = db.collection(`${videoType}_videos`).doc(videoId);

    try {
      await db.runTransaction(async (t) => {
        const likeDoc = await t.get(likeRef);
        if (likeDoc.exists) {
          throw new HttpsError('already-exists', 'Already liked');
        }
        t.set(likeRef, {
          videoId,
          videoType,
          userUid: request.auth.uid,
          createdAt: new Date().toISOString(),
        });
        t.update(videoRef, {
          likeCount: firestore.FieldValue.increment(1)
        });
      });
      return { success: true };
    } catch (err) {
      if (err.code === 'already-exists') throw err;
      throw new HttpsError('internal', err.message);
    }
  }
);

// 3. postVideoComment
exports.postVideoComment = onCall(
  {
    ...corsOptions,
    secrets: [LUVUNO_URL, LUVUNO_SHARED_SECRET],
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');
    const { videoId, videoType, text } = request.data || {};
    if (!videoId || !text) throw new HttpsError('invalid-argument', 'Missing fields');

    // Basic text screening via Luvuno (optional but recommended)
    let qScreen = 'pass';
    try {
      const luvunoUrl = LUVUNO_URL.value();
      const luvunoKey = (LUVUNO_SHARED_SECRET.value() || '').replace(/^\uFEFF/, '').trim();
      if (luvunoUrl) {
        const res = await fetch(`${luvunoUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(luvunoKey ? { 'X-Luvuno-Key': luvunoKey } : {}) },
          body: JSON.stringify({ message: `Is this comment safe for a school platform? Reply exactly "SAFE" or "UNSAFE". Comment: "${text}"`, portal: 'khensani' }),
        });
        const data = await res.json();
        if (data.response && data.response.includes('UNSAFE')) qScreen = 'fail';
      }
    } catch (e) { console.warn('Comment screening failed:', e.message); }

    if (qScreen === 'fail') throw new HttpsError('permission-denied', 'Comment flagged as inappropriate');

    const commentRef = await db.collection('video_comments').add({
      videoId,
      videoType,
      commenterUid: request.auth.uid,
      commenterName: request.auth.token.name || 'Student',
      text,
      quantum_screen: qScreen,
      likes: 0,
      createdAt: new Date().toISOString(),
    });

    await db.collection(`${videoType}_videos`).doc(videoId).update({
      commentCount: firestore.FieldValue.increment(1)
    });

    return { commentId: commentRef.id, status: qScreen };
  }
);

// 4. submitChessMove
exports.submitChessMove = onCall(
  { ...corsOptions },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');
    const { competitionId, matchId, move } = request.data || {};
    if (!competitionId || !matchId || !move) throw new HttpsError('invalid-argument', 'Missing fields');

    const matchRef = db.collection('chess_matches').doc(matchId);
    
    await db.runTransaction(async (t) => {
      const matchDoc = await t.get(matchRef);
      if (!matchDoc.exists) throw new HttpsError('not-found', 'Match not found');
      
      const data = matchDoc.data();
      if (data.result !== 'ongoing') throw new HttpsError('failed-precondition', 'Match is over');

      // Validate it's their turn (simplified)
      const isWhite = data.whiteUid === request.auth.uid;
      const isBlack = data.blackUid === request.auth.uid;
      if (!isWhite && !isBlack) throw new HttpsError('permission-denied', 'Not your match');

      t.update(matchRef, {
        moves: firestore.FieldValue.arrayUnion({
          move,
          uid: request.auth.uid,
          timestamp: new Date().toISOString()
        })
      });
    });

    return { success: true };
  }
);

// 5. flagSponsorInterest
exports.flagSponsorInterest = onCall(
  { ...corsOptions },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be a sponsor');
    const { videoId, studentUid, action } = request.data || {};
    if (!videoId || !studentUid || !action) throw new HttpsError('invalid-argument', 'Missing fields');

    await db.collection('sponsor_interest').add({
      sponsorUid: request.auth.uid,
      sponsorName: request.auth.token.name || 'Corporate Sponsor',
      videoId,
      studentUid,
      action, // 'view' | 'contact' | 'offer'
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }
);

