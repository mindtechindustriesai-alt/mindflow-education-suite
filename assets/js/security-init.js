// 🛡️ ENHANCED MIND FLOW SECURITY INITIALIZATION
class MindFlowSecurityInit {
    constructor() {
        this.initialized = false;
        this.securitySystems = {};
    }

    // ✅ Initialize all security systems
    async initialize() {
        try {
            console.log('🔒 Initializing MindFlow Security Systems...');
            
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Initialize core security systems
            await this.initializeSecuritySystems();
            
            // Apply portal-specific security
            await this.applyPortalSecurity();
            
            // Setup security event listeners
            this.setupSecurityEventListeners();
            
            this.initialized = true;
            console.log('✅ MindFlow Security Systems initialized successfully');
            
            await this.logSecurityEvent('SECURITY_SYSTEMS_INITIALIZED', {
                portal: this.detectPortal(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Security initialization failed:', error);
            await this.logSecurityEvent('SECURITY_INIT_FAILED', {
                error: error.message,
                portal: this.detectPortal(),
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    // ✅ Wait for Firebase to be ready
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // ✅ Initialize core security systems
    async initializeSecuritySystems() {
        // Authentication System
        if (typeof MindFlowAuthSystem !== 'undefined') {
            this.securitySystems.auth = new MindFlowAuthSystem();
            console.log('✅ Authentication system initialized');
        }

        // Camera Security System
        if (typeof MindFlowCameraSecurity !== 'undefined') {
            this.securitySystems.camera = new MindFlowCameraSecurity();
            console.log('✅ Camera security system initialized');
        }

        // Input Validation System
        if (typeof MindFlowSecurityValidation !== 'undefined') {
            this.securitySystems.validation = MindFlowSecurityValidation;
            console.log('✅ Input validation system initialized');
        }

        // Communication Security
        if (typeof SecureCommunication !== 'undefined') {
            this.securitySystems.communication = new SecureCommunication();
            console.log('✅ Communication security system initialized');
        }
    }

    // ✅ Apply portal-specific security configurations
    async applyPortalSecurity() {
        const portal = this.detectPortal();
        
        switch(portal) {
            case 'security':
                await this.initializeSecurityPortal();
                break;
            case 'teacher':
                await this.initializeTeacherPortal();
                break;
            case 'student':
                await this.initializeStudentPortal();
                break;
            case 'parent':
                await this.initializeParentPortal();
                break;
            case 'principal':
                await this.initializePrincipalPortal();
                break;
            case 'hod':
                await this.initializeHodPortal();
                break;
            case 'corporate':
                await this.initializeCorporatePortal();
                break;
            default:
                await this.initializeDefaultPortal();
        }
    }

    // ✅ Security Portal Initialization
    async initializeSecurityPortal() {
        console.log('🛡️ Initializing Security Portal enhancements...');
        
        // Enhanced camera monitoring
        if (this.securitySystems.camera) {
            await this.securitySystems.camera.setupRealTimeMonitoring();
        }
        
        // Incident management system
        this.setupIncidentManagement();
        
        // Patrol monitoring
        this.setupPatrolMonitoring();
        
        // Emergency protocols
        this.setupEmergencyProtocols();
    }

    // ✅ Teacher Portal Initialization
    async initializeTeacherPortal() {
        console.log('👨‍🏫 Initializing Teacher Portal security...');
        
        // Grade submission security
        this.setupGradeSubmissionSecurity();
        
        // Student data protection
        this.setupStudentDataProtection();
        
        // Communication security
        this.setupTeacherCommunicationSecurity();
    }

    // ✅ Student Portal Initialization
    async initializeStudentPortal() {
        console.log('🎓 Initializing Student Portal security...');
        
        // Assignment submission security
        this.setupAssignmentSubmissionSecurity();
        
        // Learning progress tracking
        this.setupLearningProgressSecurity();
        
        // Personal data protection
        this.setupStudentPersonalDataProtection();
    }

    // ✅ Parent Portal Initialization
    async initializeParentPortal() {
        console.log('👨‍👩‍👧‍👦 Initializing Parent Portal security...');
        
        // Child progress monitoring security
        this.setupChildProgressSecurity();
        
        // Communication security with teachers
        this.setupParentTeacherCommunicationSecurity();
        
        // Privacy controls
        this.setupParentPrivacyControls();
    }

    // ✅ Principal Portal Initialization
    async initializePrincipalPortal() {
        console.log('🏫 Initializing Principal Portal security...');
        
        // School-wide analytics security
        this.setupSchoolAnalyticsSecurity();
        
        // Staff management security
        this.setupStaffManagementSecurity();
        
        // Campus security overview
        this.setupCampusSecurityOverview();
    }

    // ✅ HOD Portal Initialization
    async initializeHodPortal() {
        console.log('📊 Initializing HOD Portal security...');
        
        // Department analytics security
        this.setupDepartmentAnalyticsSecurity();
        
        // Curriculum planning security
        this.setupCurriculumPlanningSecurity();
        
        // Resource allocation security
        this.setupResourceAllocationSecurity();
    }

    // ✅ Corporate Portal Initialization
    async initializeCorporatePortal() {
        console.log'💼 Initializing Corporate Portal security...');
        
        // Corporate analytics security
        this.setupCorporateAnalyticsSecurity();
        
        // Sponsorship management security
        this.setupSponsorshipSecurity();
        
        // Strategic data protection
        this.setupStrategicDataProtection();
    }

    // ✅ Default Portal Security
    async initializeDefaultPortal() {
        console.log('🔧 Applying default security configurations...');
        
        // Basic form security
        this.setupFormSecurity();
        
        // Input validation
        this.setupGlobalInputValidation();
    }

    // ✅ Setup security event listeners
    setupSecurityEventListeners() {
        // Form submission security
        this.setupFormSubmissionSecurity();
        
        // Navigation security
        this.setupNavigationSecurity();
        
        // API call security
        this.setupAPICallSecurity();
        
        // Error handling security
        this.setupErrorHandlingSecurity();
    }

    // ✅ Form submission security
    setupFormSubmissionSecurity() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                if (!await this.validateFormSecurity(form)) {
                    e.preventDefault();
                    this.showSecurityAlert('Security validation failed. Please check your input.');
                }
            });
        });
    }

    // ✅ Form security validation
    async validateFormSecurity(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        for (let input of inputs) {
            // Sanitize input
            const sanitized = this.securitySystems.validation.sanitizeInput(input.value);
            if (sanitized !== input.value) {
                console.warn('Input sanitization applied to:', input.name);
                input.value = sanitized;
            }
            
            // Type-specific validation
            if (!await this.validateInputByType(input)) {
                return false;
            }
        }
        
        return true;
    }

    // ✅ Input type validation
    async validateInputByType(input) {
        switch(input.type) {
            case 'email':
                return this.securitySystems.validation.validateEmail(input.value);
            case 'password':
                return this.securitySystems.validation.validatePassword(input.value);
            case 'url':
                return !input.value || this.securitySystems.validation.validateURL(input.value);
            case 'file':
                return await this.validateFileUpload(input);
            default:
                return true;
        }
    }

    // ✅ File upload validation
    async validateFileUpload(input) {
        if (!input.files || input.files.length === 0) return true;
        
        const file = input.files[0];
        try {
            return this.securitySystems.validation.validateFileUpload(file, {
                maxSize: 50 * 1024 * 1024, // 50MB
                allowedTypes: this.getAllowedFileTypes()
            });
        } catch (error) {
            this.showSecurityAlert(error.message);
            return false;
        }
    }

    // ✅ Get allowed file types by portal
    getAllowedFileTypes() {
        const portal = this.detectPortal();
        const typeMap = {
            'teacher': ['application/pdf', 'application/msword', 'image/jpeg', 'image/png'],
            'student': ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'],
            'security': ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'],
            'corporate': ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.ms-excel']
        };
        
        return typeMap[portal] || ['application/pdf', 'image/jpeg', 'image/png'];
    }

    // ✅ Navigation security
    setupNavigationSecurity() {
        // Monitor for unauthorized navigation attempts
        window.addEventListener('beforeunload', (e) => {
            // Log navigation away from secure areas
            if (this.isSecureArea()) {
                this.logSecurityEvent('NAVIGATION_AWAY_FROM_SECURE_AREA', {
                    from: window.location.href,
                    portal: this.detectPortal()
                });
            }
        });
    }

    // ✅ API call security
    setupAPICallSecurity() {
        // Override fetch for security monitoring
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options] = args;
            
            // Log API calls for monitoring
            await this.logSecurityEvent('API_CALL', {
                url: typeof url === 'string' ? url : url.url,
                method: options?.method || 'GET',
                portal: this.detectPortal()
            });
            
            try {
                const response = await originalFetch.apply(this, args);
                
                // Check for security headers
                this.validateResponseSecurity(response);
                
                return response;
            } catch (error) {
                await this.logSecurityEvent('API_CALL_FAILED', {
                    url: typeof url === 'string' ? url : url.url,
                    error: error.message,
                    portal: this.detectPortal()
                });
                throw error;
            }
        };
    }

    // ✅ Response security validation
    validateResponseSecurity(response) {
        const securityHeaders = [
            'content-security-policy',
            'x-content-type-options',
            'x-frame-options'
        ];

        for (const header of securityHeaders) {
            if (!response.headers.get(header)) {
                console.warn(`Missing security header in response: ${header}`);
            }
        }
    }

    // ✅ Error handling security
    setupErrorHandlingSecurity() {
        window.addEventListener('error', (e) => {
            this.logSecurityEvent('CLIENT_ERROR', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                portal: this.detectPortal()
            });
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.logSecurityEvent('UNHANDLED_PROMISE_REJECTION', {
                reason: e.reason?.message || e.reason,
                portal: this.detectPortal()
            });
        });
    }

    // ✅ Utility Methods
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

    isSecureArea() {
        const secureAreas = ['security-monitoring', 'incident-management', 'camera-control'];
        return secureAreas.some(area => window.location.pathname.includes(area));
    }

    showSecurityAlert(message) {
        // Create a secure alert system (could be a modal, notification, etc.)
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        alertDiv.textContent = `🔒 Security Alert: ${message}`;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 5000);
    }

    async logSecurityEvent(eventType, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType,
            portal: this.detectPortal(),
            ...details
        };

        console.log('🔒 SECURITY EVENT:', logEntry);

        // Log to Firestore if available
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                await firebase.firestore().collection('security_logs').add(logEntry);
            } catch (error) {
                console.warn('Could not log to Firestore:', error);
            }
        }
    }

    // ✅ Portal-specific setup methods (stubs - implement based on needs)
    setupIncidentManagement() { /* Security portal specific */ }
    setupPatrolMonitoring() { /* Security portal specific */ }
    setupEmergencyProtocols() { /* Security portal specific */ }
    setupGradeSubmissionSecurity() { /* Teacher portal specific */ }
    setupStudentDataProtection() { /* Teacher portal specific */ }
    setupTeacherCommunicationSecurity() { /* Teacher portal specific */ }
    setupAssignmentSubmissionSecurity() { /* Student portal specific */ }
    setupLearningProgressSecurity() { /* Student portal specific */ }
    setupStudentPersonalDataProtection() { /* Student portal specific */ }
    setupChildProgressSecurity() { /* Parent portal specific */ }
    setupParentTeacherCommunicationSecurity() { /* Parent portal specific */ }
    setupParentPrivacyControls() { /* Parent portal specific */ }
    setupSchoolAnalyticsSecurity() { /* Principal portal specific */ }
    setupStaffManagementSecurity() { /* Principal portal specific */ }
    setupCampusSecurityOverview() { /* Principal portal specific */ }
    setupDepartmentAnalyticsSecurity() { /* HOD portal specific */ }
    setupCurriculumPlanningSecurity() { /* HOD portal specific */ }
    setupResourceAllocationSecurity() { /* HOD portal specific */ }
    setupCorporateAnalyticsSecurity() { /* Corporate portal specific */ }
    setupSponsorshipSecurity() { /* Corporate portal specific */ }
    setupStrategicDataProtection() { /* Corporate portal specific */ }
    setupFormSecurity() { /* Default security */ }
    setupGlobalInputValidation() { /* Default security */ }
}

// ✅ Initialize security when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.mindFlowSecurity = new MindFlowSecurityInit();
    await window.mindFlowSecurity.initialize();
});

// ✅ Make available globally
window.MindFlowSecurityInit = MindFlowSecurityInit;