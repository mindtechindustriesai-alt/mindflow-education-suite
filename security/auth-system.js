// 🛡️ ENHANCED AUTHENTICATION SYSTEM - MIND FLOW SPECIFIC
class MindFlowAuthSystem {
    constructor() {
        this.failedAttempts = new Map();
        this.lockedAccounts = new Set();
        this.sessionTimeouts = new Map();
        this.multiFactorEnabled = new Set();
        this.rolePermissions = this.initializeRolePermissions();
        this.initFirebaseAuth();
    }

    // ✅ Initialize Firebase Authentication
    initFirebaseAuth() {
        // Use our existing Firebase config
        if (typeof firebase !== 'undefined') {
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.setupAuthListeners();
        }
    }

    // ✅ Enhanced role-based permissions for MindFlow portals
    initializeRolePermissions() {
        return {
            'student': ['view_courses', 'submit_assignments', 'view_grades', 'access_learning_hub'],
            'teacher': ['manage_classes', 'grade_assignments', 'view_student_progress', 'access_teacher_resources'],
            'parent': ['view_child_progress', 'communicate_teachers', 'view_attendance', 'access_parent_dashboard'],
            'principal': ['view_school_analytics', 'manage_staff', 'access_all_classes', 'view_security_reports'],
            'hod': ['manage_department', 'view_performance_analytics', 'allocate_resources', 'access_curriculum_planning'],
            'security': ['access_cameras', 'manage_incidents', 'view_patrols', 'access_emergency_protocols'],
            'corporate': ['view_corporate_analytics', 'manage_sponsorships', 'access_operations', 'view_strategic_reports'],
            'admin': ['full_system_access']
        };
    }

    // ✅ Enhanced authentication with Firebase integration
    async authenticateUser(email, password, userAgent, ipAddress) {
        // Input validation
        if (!this.validateEmail(email) || !this.validatePassword(password)) {
            await this.logSecurityEvent('INVALID_INPUT', { email, ipAddress, portal: this.detectPortal() });
            throw new SecurityError('Invalid credentials');
        }

        // Rate limiting check
        if (await this.isRateLimited(ipAddress)) {
            await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { ipAddress, email });
            throw new SecurityError('Too many attempts. Please try again later.');
        }

        // Account lock check
        if (this.lockedAccounts.has(email)) {
            await this.logSecurityEvent('LOCKED_ACCOUNT_ACCESS', { email, ipAddress });
            throw new SecurityError('Account temporarily locked. Contact administrator.');
        }

        try {
            // Firebase authentication
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get additional user data from Firestore
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            // Verify user has access to current portal
            if (!this.hasPortalAccess(userData.role, this.detectPortal())) {
                await this.auth.signOut();
                await this.logSecurityEvent('UNAUTHORIZED_PORTAL_ACCESS', { 
                    email, 
                    role: userData.role, 
                    attemptedPortal: this.detectPortal() 
                });
                throw new SecurityError('Access denied to this portal');
            }

            // Create secure session
            const session = await this.createSecureSession(user, userData, userAgent, ipAddress);
            
            // Reset failed attempts
            this.resetFailedAttempts(ipAddress, email);
            
            await this.logSecurityEvent('SUCCESSFUL_LOGIN', { 
                userId: user.uid, 
                email, 
                role: userData.role,
                portal: this.detectPortal(),
                ipAddress 
            });

            // Redirect to appropriate portal
            this.redirectToPortal(userData.role);

            return session;

        } catch (error) {
            await this.recordFailedAttempt(ipAddress, email);
            await this.logSecurityEvent('FIREBASE_AUTH_ERROR', { 
                email, 
                error: error.message,
                ipAddress 
            });
            throw new SecurityError(this.getUserFriendlyError(error));
        }
    }

    // ✅ Portal detection based on current URL
    detectPortal() {
        const path = window.location.pathname;
        if (path.includes('/student/')) return 'student';
        if (path.includes('/teacher/')) return 'teacher';
        if (path.includes('/parent/')) return 'parent';
        if (path.includes('/principal/')) return 'principal';
        if (path.includes('/hod/')) return 'hod';
        if (path.includes('/security/')) return 'security';
        if (path.includes('/corporate/')) return 'corporate';
        return 'unknown';
    }

    // ✅ Portal access control
    hasPortalAccess(userRole, portal) {
        const portalAccessMap = {
            'student': ['student'],
            'teacher': ['teacher'],
            'parent': ['parent'],
            'principal': ['principal', 'teacher'],
            'hod': ['hod', 'teacher'],
            'security': ['security'],
            'corporate': ['corporate'],
            'admin': ['student', 'teacher', 'parent', 'principal', 'hod', 'security', 'corporate']
        };
        
        return portalAccessMap[userRole]?.includes(portal) || false;
    }

    // ✅ Enhanced session management
    async createSecureSession(user, userData, userAgent, ipAddress) {
        const sessionId = this.generateSessionId();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        
        const session = {
            id: sessionId,
            userId: user.uid,
            userRole: userData.role,
            userAgent,
            ipAddress,
            portal: this.detectPortal(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(expiresAt).toISOString(),
            lastActivity: new Date().toISOString()
        };

        // Store session in Firestore
        await this.db.collection('sessions').doc(sessionId).set({
            ...session,
            active: true
        });

        // Set session timeout
        this.sessionTimeouts.set(sessionId, setTimeout(() => {
            this.destroySession(sessionId);
        }, 24 * 60 * 60 * 1000));

        await this.logSecurityEvent('SESSION_CREATED', { 
            userId: user.uid, 
            sessionId, 
            role: userData.role,
            portal: this.detectPortal(),
            ipAddress 
        });

        return session;
    }

    // ✅ Enhanced security logging with portal context
    async logSecurityEvent(eventType, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType,
            portal: this.detectPortal(),
            ...details,
            severity: this.getEventSeverity(eventType)
        };

        // Log to Firestore
        if (this.db) {
            await this.db.collection('security_logs').add(logEntry);
        }

        console.log('🔒 MIND FLOW SECURITY EVENT:', logEntry);
    }

    // ✅ Setup authentication state listeners
    setupAuthListeners() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                const userDoc = await this.db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                this.updateUIForAuthState(userData);
            } else {
                // User is signed out
                this.updateUIForAuthState(null);
            }
        });
    }

    // ✅ Update UI based on authentication state
    updateUIForAuthState(userData) {
        const currentPortal = this.detectPortal();
        
        if (userData && !this.hasPortalAccess(userData.role, currentPortal)) {
            // Redirect to appropriate portal or show access denied
            this.showAccessDenied();
        }
    }

    // ✅ Enhanced error handling
    getUserFriendlyError(error) {
        const errorMap = {
            'auth/invalid-email': 'Invalid email address',
            'auth/user-disabled': 'Account disabled',
            'auth/user-not-found': 'Account not found',
            'auth/wrong-password': 'Invalid password',
            'auth/too-many-requests': 'Too many attempts. Account temporarily locked.'
        };
        
        return errorMap[error.code] || 'Authentication failed. Please try again.';
    }

    // ... (keep other methods from original with enhancements)
}

// Export for MindFlow integration
window.MindFlowAuthSystem = MindFlowAuthSystem;