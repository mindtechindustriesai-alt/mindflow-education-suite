// ⚡ FIREBASE CONFIGURATION - MindFlow Education Suite
// Region: africa-south1 (Johannesburg) · Khensani AI
console.log('🚀 Initializing MindFlow Firebase Configuration...');

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5OB59lG6bAsmQ7A97zXP_MfQ5AM3BYaw",
    authDomain: "mindflow-ai-education.firebaseapp.com",
    projectId: "mindflow-ai-education",
    storageBucket: "mindflow-ai-education.firebasestorage.app",
    messagingSenderId: "157615197603",
    appId: "1:157615197603:web:540d67781fc55d04c11e16",
    measurementId: "G-XXXXXXXXXX"
};

// Khensani region — all Cloud Functions are in africa-south1
const KHENSANI_REGION = 'africa-south1';

// Initialize Firebase
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');

        // Initialize services
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        window.storage = firebase.storage();

        // Enable offline persistence
        window.db.enablePersistence()
            .then(() => console.log('✅ Firestore offline persistence enabled'))
            .catch(err => {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ The current browser does not support persistence');
                }
            });
    } else {
        console.error('❌ Firebase SDK not loaded');
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Firebase Service Export
window.MindFlowFirebase = {
    config: firebaseConfig,
    auth: window.auth,
    db: window.db,
    storage: window.storage,
    region: KHENSANI_REGION,

    getCurrentUser: () => window.auth?.currentUser,
    isAuthenticated: () => !!window.auth?.currentUser,
    getUserId: () => window.auth?.currentUser?.uid,

    logSecurityEvent: async (eventType, details) => {
        try {
            const logEntry = {
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                eventType,
                details,
                userId: window.auth?.currentUser?.uid || 'anonymous'
            };
            await window.db.collection('security_logs').add(logEntry);
        } catch (err) {
            console.warn('Security log failed:', err.message);
        }
    }
};

console.log('✅ MindFlow Firebase ready · region:', KHENSANI_REGION);
