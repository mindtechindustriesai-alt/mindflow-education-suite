// ⚡ FIREBASE CONFIGURATION - MindFlow Education Suite
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
    
    // Utility Methods
    getCurrentUser: () => window.auth?.currentUser,
    isAuthenticated: () => !!window.auth?.currentUser,
    getUserId: () => window.auth?.currentUser?.uid,
    
    // Security Logging
    logSecurityEvent: async (eventType, details) => {
        try {
            const logEntry = {
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                eventType,
                userId: window.MindFlowFirebase.getUserId(),
                ...details,
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            await window.db.collection('security_logs').add(logEntry);
            console.log('🔒 Security event logged:', eventType);
        } catch (error) {
            console.error('❌ Security logging failed:', error);
        }
    }
};