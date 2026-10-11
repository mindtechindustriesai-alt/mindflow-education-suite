// 🚀 MIND FLOW LOADER - Portal Initialization System
class MindFlowLoader {
    constructor() {
        this.initialized = false;
        this.loadingSteps = new Map();
        this.portalConfig = null;
    }

    async initialize() {
        console.log('🚀 Starting MindFlow Portal Loader...');
        
        try {
            // Step 1: Load Portal Configuration
            await this.loadPortalConfig();
            
            // Step 2: Initialize Security Systems
            await this.initializeSecurity();
            
            // Step 3: Setup UI Components
            await this.setupUI();
            
            // Step 4: Load Portal Data
            await this.loadPortalData();
            
            // Step 5: Finalize Initialization
            await this.finalize();
            
            this.initialized = true;
            console.log('✅ MindFlow Portal fully loaded');
            
        } catch (error) {
            console.error('❌ Portal initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    async loadPortalConfig() {
        this.startLoadingStep('portal_config');
        
        const portalType = this.detectPortalType();
        this.portalConfig = await this.fetchPortalConfig(portalType);
        
        // Apply portal-specific styles
        this.applyPortalStyles(portalType);
        
        this.completeLoadingStep('portal_config');
    }

    detectPortalType() {
        const path = window.location.pathname;
        const portalMap = {
            '/student/': 'student',
            '/teacher/': 'teacher', 
            '/parent/': 'parent',
            '/principal/': 'principal',
            '/hod/': 'hod',
            '/security/': 'security',
            '/corporate/': 'corporate'
        };
        
        for (const [pathSegment, portal] of Object.entries(portalMap)) {
            if (path.includes(pathSegment)) return portal;
        }
        
        return 'default';
    }

    async fetchPortalConfig(portalType) {
        // In a real app, this would fetch from Firebase
        const configs = {
            student: {
                theme: 'learning-green',
                features: ['courses', 'assignments', 'progress'],
                permissions: ['view_courses', 'submit_assignments'],
                analytics: ['progress_tracking', 'skill_development']
            },
            teacher: {
                theme: 'mindflow-blue', 
                features: ['class_management', 'grading', 'analytics'],
                permissions: ['manage_classes', 'grade_assignments'],
                analytics: ['class_performance', 'student_engagement']
            },
            // ... other portal configs
        };
        
        return configs[portalType] || configs.student;
    }

    applyPortalStyles(portalType) {
        document.body.classList.add(`portal-${portalType}`);
        
        // Update portal title
        const portalTitle = document.querySelector('.portal-title');
        if (portalTitle) {
            const titles = {
                student: 'Student Learning Portal',
                teacher: 'Teacher Command Center', 
                parent: 'Parent Monitoring Hub',
                principal: 'Principal Administration',
                hod: 'HOD Management Suite',
                security: 'Security Operations',
                corporate: 'Corporate Analytics'
            };
            portalTitle.textContent = titles[portalType] || 'MindFlow Portal';
        }
    }

    async initializeSecurity() {
        this.startLoadingStep('security_init');
        
        // Wait for auth manager
        await this.waitForAuthManager();
        
        // Validate portal access
        if (window.MindFlowAuth) {
            const hasAccess = window.MindFlowAuth.validatePortalAccess();
            if (!hasAccess) {
                throw new Error('Unauthorized portal access');
            }
        }
        
        // Initialize quantum security if available
        if (window.quantumEngine) {
            await window.quantumEngine.performQuantumSecurityAudit();
        }
        
        this.completeLoadingStep('security_init');
    }

    async waitForAuthManager() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (window.MindFlowAuth) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    async setupUI() {
        this.startLoadingStep('ui_setup');
        
        // Initialize particles if available
        if (typeof particlesJS !== 'undefined') {
            this.initializeParticles();
        }
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup real-time updates
        this.setupRealTimeUpdates();
        
        this.completeLoadingStep('ui_setup');
    }

    initializeParticles() {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: this.getPortalColor() },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: this.getPortalColor(),
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" }
                }
            }
        });
    }

    getPortalColor() {
        const portal = this.detectPortalType();
        const colors = {
            student: '#00FFAA',
            teacher: '#0066FF',
            parent: '#00D4AA', 
            principal: '#FFD700',
            hod: '#8A2BE2',
            security: '#FF3366',
            corporate: '#00ff88'
        };
        return colors[portal] || '#0066FF';
    }

    setupNavigation() {
        // Handle internal navigation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigateTo(link.href);
            }
        });
        
        // Setup back button
        const backButton = document.querySelector('.nav-back');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.back();
            });
        }
    }

    navigateTo(url) {
        this.showLoadingScreen();
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    }

    setupRealTimeUpdates() {
        // Setup Firebase real-time listeners based on portal type
        const portal = this.detectPortalType();
        
        switch(portal) {
            case 'student':
                this.setupStudentRealTime();
                break;
            case 'teacher':
                this.setupTeacherRealTime();
                break;
            case 'security':
                this.setupSecurityRealTime();
                break;
            // ... other portals
        }
    }

    setupStudentRealTime() {
        if (!window.MindFlowAuth?.getCurrentUser()) return;
        
        const userId = window.MindFlowAuth.getCurrentUser().uid;
        
        // Listen for assignment updates
        window.db.collection('assignments')
            .where('studentId', '==', userId)
            .where('status', 'in', ['assigned', 'graded'])
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        this.handleAssignmentUpdate(change.doc.data());
                    }
                });
            });
    }

    handleAssignmentUpdate(assignment) {
        // Show notification for new or updated assignments
        if (assignment.status === 'assigned') {
            this.showNotification('📝 New Assignment', `You have a new assignment: ${assignment.title}`);
        } else if (assignment.status === 'graded') {
            this.showNotification('🎯 Assignment Graded', `Your assignment "${assignment.title}" has been graded`);
        }
    }

    async loadPortalData() {
        this.startLoadingStep('data_loading');
        
        const portal = this.detectPortalType();
        
        try {
            switch(portal) {
                case 'student':
                    await this.loadStudentData();
                    break;
                case 'teacher':
                    await this.loadTeacherData();
                    break;
                case 'security':
                    await this.loadSecurityData();
                    break;
                default:
                    await this.loadDefaultData();
            }
            
            this.completeLoadingStep('data_loading');
            
        } catch (error) {
            console.error('❌ Data loading failed:', error);
            this.completeLoadingStep('data_loading', false);
        }
    }

    async loadStudentData() {
        if (!window.MindFlowAuth?.getCurrentUser()) return;
        
        const userId = window.MindFlowAuth.getCurrentUser().uid;
        
        // Load courses, assignments, progress, etc.
        const [coursesSnapshot, assignmentsSnapshot, progressSnapshot] = await Promise.all([
            window.db.collection('courses').where('students', 'array-contains', userId).get(),
            window.db.collection('assignments').where('studentId', '==', userId).get(),
            window.db.collection('progress').where('studentId', '==', userId).get()
        ]);
        
        window.portalData = {
            courses: coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            assignments: assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            progress: progressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };
    }

    async finalize() {
        this.startLoadingStep('finalization');
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Trigger portal entrance animation
        document.body.classList.add('portal-entrance');
        
        // Initialize charts if needed
        this.initializeCharts();
        
        // Start background processes
        this.startBackgroundProcesses();
        
        this.completeLoadingStep('finalization');
        console.log('🎉 MindFlow Portal ready!');
    }

    initializeCharts() {
        // Initialize any Chart.js instances
        if (typeof Chart !== 'undefined') {
            const chartElements = document.querySelectorAll('canvas[data-chart]');
            chartElements.forEach(canvas => {
                this.initializeChart(canvas);
            });
        }
    }

    initializeChart(canvas) {
        const chartType = canvas.getAttribute('data-chart-type') || 'line';
        const chartData = JSON.parse(canvas.getAttribute('data-chart-data') || '{}');
        
        new Chart(canvas.getContext('2d'), {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e0e0ff' }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#a0a0cc' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#a0a0cc' }
                    }
                }
            }
        });
    }

    startBackgroundProcesses() {
        // Start periodic data sync
        setInterval(() => {
            this.syncData();
        }, 30000); // Every 30 seconds
        
        // Start security monitoring
        this.startSecurityMonitoring();
    }

    async syncData() {
        try {
            await this.loadPortalData();
            console.log('✅ Background data sync completed');
        } catch (error) {
            console.warn('⚠️ Background sync failed:', error);
        }
    }

    startSecurityMonitoring() {
        // Monitor for unusual activities
        setInterval(() => {
            this.checkSecurityStatus();
        }, 60000); // Every minute
    }

    async checkSecurityStatus() {
        if (window.quantumEngine) {
            const audit = await window.quantumEngine.performQuantumSecurityAudit();
            if (audit.quantumReadiness.securityScore < 8) {
                console.warn('⚠️ Security score below threshold:', audit.quantumReadiness.securityScore);
            }
        }
    }

    // 🎯 LOADING MANAGEMENT
    startLoadingStep(step) {
        this.loadingSteps.set(step, { started: Date.now(), completed: false });
        console.log(`🔄 Starting: ${step}`);
    }

    completeLoadingStep(step, success = true) {
        const stepData = this.loadingSteps.get(step);
        if (stepData) {
            stepData.completed = true;
            stepData.success = success;
            stepData.duration = Date.now() - stepData.started;
            console.log(`✅ Completed: ${step} (${stepData.duration}ms)`);
        }
    }

    showLoadingScreen() {
        let loader = document.getElementById('mindflow-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'mindflow-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-logo">🚀</div>
                    <div class="loader-text">MindFlow AI</div>
                    <div class="loader-progress"></div>
                    <div class="loader-message">Initializing Portal...</div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }

    hideLoadingScreen() {
        const loader = document.getElementById('mindflow-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showNotification(title, message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    handleInitializationError(error) {
        console.error('💥 Portal initialization failed:', error);
        
        this.showNotification(
            'Initialization Error', 
            'Failed to load portal. Please refresh the page.',
            'error'
        );
        
        // Log error to analytics
        if (window.MindFlowFirebase?.logSecurityEvent) {
            window.MindFlowFirebase.logSecurityEvent('PORTAL_INIT_FAILED', {
                error: error.message,
                portal: this.detectPortalType(),
                url: window.location.href
            });
        }
    }

    // 🎯 PUBLIC API
    getPortalConfig() {
        return this.portalConfig;
    }

    getLoadingStatus() {
        return {
            initialized: this.initialized,
            steps: Object.fromEntries(this.loadingSteps)
        };
    }

    reloadPortalData() {
        return this.loadPortalData();
    }
}

// Auto-initialize loader
document.addEventListener('DOMContentLoaded', () => {
    window.MindFlowLoader = new MindFlowLoader();
    window.MindFlowLoader.initialize();
});