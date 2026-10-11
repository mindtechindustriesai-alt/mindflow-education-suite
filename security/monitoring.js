// 🛡️ SECURITY MONITORING & ANOMALY DETECTION - MindFlow
class SecurityMonitoring {
    constructor() {
        this.anomalyDetector = new AnomalyDetector();
        this.incidentManager = new IncidentManager();
        this.auditLogger = new AuditLogger();
        this.metricsCollector = new MetricsCollector();
        this.setupMonitoring();
        console.log('🔍 Security Monitoring initialized');
    }

    setupMonitoring() {
        this.setupUserBehaviorMonitoring();
        this.setupNetworkMonitoring();
        this.setupSystemMonitoring();
        this.startPeriodicScans();
    }

    // ✅ USER BEHAVIOR MONITORING
    setupUserBehaviorMonitoring() {
        // Monitor login patterns
        this.monitorLoginBehavior();
        
        // Monitor navigation patterns
        this.monitorNavigationBehavior();
        
        // Monitor data access patterns
        this.monitorDataAccess();
    }

    monitorLoginBehavior() {
        let loginAttempts = new Map();
        
        // Track login attempts
        const originalAuth = window.auth;
        if (originalAuth) {
            // Monitor authentication state changes
            originalAuth.onAuthStateChanged((user) => {
                if (user) {
                    this.recordUserLogin(user);
                } else {
                    this.recordUserLogout();
                }
            });
        }
    }

    async recordUserLogin(user) {
        const loginData = {
            userId: user.uid,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            ipAddress: await this.getClientIP(),
            location: await this.getApproximateLocation()
        };

        this.metricsCollector.recordMetric('user_login', loginData);
        this.anomalyDetector.analyzeLoginPattern(loginData);
    }

    // ✅ NETWORK MONITORING
    setupNetworkMonitoring() {
        // Monitor API requests
        this.monitorAPIRequests();
        
        // Monitor resource loading
        this.monitorResourceLoading();
        
        // Monitor WebSocket connections
        this.monitorWebSockets();
    }

    monitorAPIRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const startTime = Date.now();
            const [url, options] = args;
            
            const requestData = {
                url: typeof url === 'string' ? url : url.url,
                method: options?.method || 'GET',
                timestamp: startTime,
                userId: window.MindFlowAuth?.getUserId()
            };

            try {
                const response = await originalFetch.apply(this, args);
                
                requestData.duration = Date.now() - startTime;
                requestData.status = response.status;
                requestData.size = this.getResponseSize(response);
                
                this.metricsCollector.recordMetric('api_request', requestData);
                this.anomalyDetector.analyzeRequestPattern(requestData);
                
                return response;
                
            } catch (error) {
                requestData.error = error.message;
                requestData.duration = Date.now() - startTime;
                
                this.metricsCollector.recordMetric('api_request_failed', requestData);
                this.incidentManager.reportIncident('NETWORK_ERROR', requestData);
                
                throw error;
            }
        };
    }

    // ✅ SYSTEM MONITORING
    setupSystemMonitoring() {
        // Monitor memory usage
        this.monitorMemoryUsage();
        
        // Monitor performance
        this.monitorPerformance();
        
        // Monitor errors
        this.monitorErrors();
    }

    monitorErrors() {
        // Global error handler
        window.addEventListener('error', (event) => {
            const errorData = {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now(),
                userId: window.MindFlowAuth?.getUserId()
            };

            this.incidentManager.reportIncident('CLIENT_ERROR', errorData);
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            const errorData = {
                reason: event.reason?.message || event.reason,
                timestamp: Date.now(),
                userId: window.MindFlowAuth?.getUserId()
            };

            this.incidentManager.reportIncident('PROMISE_REJECTION', errorData);
        });
    }

    // ✅ PERIODIC SECURITY SCANS
    startPeriodicScans() {
        // Vulnerability scan every hour
        setInterval(() => {
            this.runVulnerabilityScan();
        }, 60 * 60 * 1000);

        // Security audit every 6 hours
        setInterval(() => {
            this.runSecurityAudit();
        }, 6 * 60 * 60 * 1000);

        // Anomaly detection every 30 minutes
        setInterval(() => {
            this.runAnomalyDetection();
        }, 30 * 60 * 1000);
    }

    async runVulnerabilityScan() {
        console.log('🔍 Running vulnerability scan...');
        
        const vulnerabilities = [];
        
        // Check for weak passwords
        vulnerabilities.push(...await this.checkPasswordStrength());
        
        // Check for insecure configurations
        vulnerabilities.push(...await this.checkSecurityConfig());
        
        // Check for data exposure
        vulnerabilities.push(...await this.checkDataExposure());
        
        if (vulnerabilities.length > 0) {
            this.incidentManager.reportIncident('VULNERABILITIES_FOUND', {
                count: vulnerabilities.length,
                vulnerabilities: vulnerabilities
            });
        }
        
        return vulnerabilities;
    }

    async runSecurityAudit() {
        const audit = {
            timestamp: Date.now(),
            userActivity: this.metricsCollector.getUserActivityMetrics(),
            systemHealth: this.metricsCollector.getSystemHealthMetrics(),
            securityScore: this.calculateSecurityScore(),
            recommendations: this.generateSecurityRecommendations()
        };

        this.auditLogger.logAudit('SECURITY_AUDIT', audit);
        return audit;
    }

    async runAnomalyDetection() {
        const anomalies = await this.anomalyDetector.detectAnomalies();
        
        if (anomalies.length > 0) {
            anomalies.forEach(anomaly => {
                this.incidentManager.reportIncident('ANOMALY_DETECTED', anomaly);
            });
        }
        
        return anomalies;
    }

    // ✅ INCIDENT RESPONSE
    async handleSecurityIncident(incident) {
        console.log(`🚨 Handling security incident: ${incident.type}`);
        
        // Log the incident
        await this.auditLogger.logIncident(incident);
        
        // Determine severity and take action
        switch(incident.severity) {
            case 'LOW':
                this.handleLowSeverityIncident(incident);
                break;
            case 'MEDIUM':
                this.handleMediumSeverityIncident(incident);
                break;
            case 'HIGH':
                this.handleHighSeverityIncident(incident);
                break;
            case 'CRITICAL':
                this.handleCriticalIncident(incident);
                break;
        }
        
        // Notify relevant parties
        await this.notifyStakeholders(incident);
    }

    handleCriticalIncident(incident) {
        // Immediate action required
        if (window.nuclearSecurity) {
            window.nuclearSecurity.initiateEmergencyLockdown('DELTA');
        }
        
        // Force logout all users
        if (window.MindFlowAuth) {
            window.MindFlowAuth.signOut();
        }
        
        // Redirect to security breach page
        setTimeout(() => {
            window.location.href = '/security-breach.html';
        }, 3000);
    }

    // ✅ UTILITY METHODS
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }

    async getApproximateLocation() {
        // This would use a geolocation service
        // For now, return mock data
        return {
            country: 'ZA',
            region: 'Gauteng',
            city: 'Johannesburg'
        };
    }

    getResponseSize(response) {
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength) : 0;
    }

    calculateSecurityScore() {
        const metrics = this.metricsCollector.getSecurityMetrics();
        let score = 100;
        
        // Deduct points for various security issues
        if (metrics.failedLogins > 10) score -= 10;
        if (metrics.suspiciousRequests > 5) score -= 15;
        if (metrics.errors > 20) score -= 5;
        if (metrics.vulnerabilities > 0) score -= (metrics.vulnerabilities * 10);
        
        return Math.max(0, score);
    }

    generateSecurityRecommendations() {
        const recommendations = [];
        const metrics = this.metricsCollector.getSecurityMetrics();
        
        if (metrics.failedLogins > 5) {
            recommendations.push('Consider implementing account lockout after multiple failed attempts');
        }
        
        if (metrics.suspiciousRequests > 3) {
            recommendations.push('Review and strengthen API rate limiting');
        }
        
        if (metrics.avgResponseTime > 1000) {
            recommendations.push('Investigate performance bottlenecks');
        }
        
        return recommendations;
    }

    async notifyStakeholders(incident) {
        // Notify security team for high severity incidents
        if (['HIGH', 'CRITICAL'].includes(incident.severity)) {
            await this.notifySecurityTeam(incident);
        }
        
        // Notify administrators for medium+ severity
        if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(incident.severity)) {
            await this.notifyAdministrators(incident);
        }
    }

    async notifySecurityTeam(incident) {
        // This would send notifications to the security team
        console.log(`🔔 Notifying security team: ${incident.type}`);
        
        // Could integrate with email, SMS, or chat systems
        if (window.MindFlowFirebase) {
            await window.MindFlowFirebase.logSecurityEvent('SECURITY_TEAM_NOTIFIED', {
                incidentId: incident.id,
                type: incident.type,
                severity: incident.severity
            });
        }
    }

    async notifyAdministrators(incident) {
        console.log(`🔔 Notifying administrators: ${incident.type}`);
        
        if (window.MindFlowFirebase) {
            await window.MindFlowFirebase.logSecurityEvent('ADMIN_NOTIFIED', {
                incidentId: incident.id,
                type: incident.type
            });
        }
    }
}

// 🎯 ANOMALY DETECTOR
class AnomalyDetector {
    constructor() {
        this.behaviorBaselines = new Map();
        this.anomalyThresholds = {
            loginFrequency: 5, // logins per minute
            requestRate: 100, // requests per minute
            errorRate: 10, // errors per minute
            dataAccess: 50 // data access operations per minute
        };
    }

    analyzeLoginPattern(loginData) {
        const userId = loginData.userId;
        if (!this.behaviorBaselines.has(userId)) {
            this.behaviorBaselines.set(userId, this.createUserBaseline());
        }
        
        const baseline = this.behaviorBaselines.get(userId);
        const anomalies = [];
        
        // Check login frequency
        if (this.isHighFrequencyLogin(loginData, baseline)) {
            anomalies.push({
                type: 'HIGH_FREQUENCY_LOGIN',
                userId: userId,
                details: loginData
            });
        }
        
        // Check unusual login location
        if (this.isUnusualLocation(loginData, baseline)) {
            anomalies.push({
                type: 'UNUSUAL_LOGIN_LOCATION',
                userId: userId,
                details: loginData
            });
        }
        
        return anomalies;
    }

    analyzeRequestPattern(requestData) {
        const anomalies = [];
        
        // Check for unusual request patterns
        if (requestData.duration > 10000) { // 10 seconds
            anomalies.push({
                type: 'SLOW_RESPONSE',
                details: requestData
            });
        }
        
        if (requestData.status >= 500) {
            anomalies.push({
                type: 'SERVER_ERROR',
                details: requestData
            });
        }
        
        return anomalies;
    }

    async detectAnomalies() {
        const anomalies = [];
        
        // Analyze user behavior
        anomalies.push(...await this.analyzeUserBehavior());
        
        // Analyze system metrics
        anomalies.push(...await this.analyzeSystemMetrics());
        
        // Analyze security events
        anomalies.push(...await this.analyzeSecurityEvents());
        
        return anomalies;
    }

    isHighFrequencyLogin(loginData, baseline) {
        const recentLogins = baseline.loginTimes.filter(
            time => Date.now() - time < 60000 // Last minute
        );
        
        return recentLogins.length >= this.anomalyThresholds.loginFrequency;
    }

    isUnusualLocation(loginData, baseline) {
        if (!baseline.commonLocations.includes(loginData.location.country)) {
            return true;
        }
        return false;
    }

    createUserBaseline() {
        return {
            loginTimes: [],
            commonLocations: ['ZA'], // South Africa
            typicalRequestPatterns: [],
            created: Date.now()
        };
    }
}

// 📊 INCIDENT MANAGER
class IncidentManager {
    constructor() {
        this.incidents = new Map();
        this.incidentHandlers = new Map();
        this.setupIncidentHandlers();
    }

    setupIncidentHandlers() {
        this.incidentHandlers.set('UNAUTHORIZED_ACCESS', this.handleUnauthorizedAccess.bind(this));
        this.incidentHandlers.set('DATA_BREACH', this.handleDataBreach.bind(this));
        this.incidentHandlers.set('SYSTEM_COMPROMISE', this.handleSystemCompromise.bind(this));
        this.incidentHandlers.set('MALWARE_DETECTION', this.handleMalwareDetection.bind(this));
    }

    async reportIncident(type, data) {
        const incident = {
            id: this.generateIncidentId(),
            type: type,
            timestamp: Date.now(),
            severity: this.determineSeverity(type, data),
            data: data,
            status: 'OPEN',
            assignedTo: null
        };

        this.incidents.set(incident.id, incident);
        
        // Log the incident
        await this.logIncident(incident);
        
        // Handle the incident
        await this.handleIncident(incident);
        
        return incident;
    }

    async handleIncident(incident) {
        const handler = this.incidentHandlers.get(incident.type);
        if (handler) {
            await handler(incident);
        }
        
        // Default handling
        await this.defaultIncidentHandler(incident);
    }

    async handleUnauthorizedAccess(incident) {
        console.log('🚨 Handling unauthorized access incident');
        
        // Block the user account
        if (incident.data.userId) {
            await this.blockUserAccount(incident.data.userId);
        }
        
        // Notify security team
        await this.escalateToSecurityTeam(incident);
    }

    async handleDataBreach(incident) {
        console.log('🚨 Handling data breach incident');
        
        // Initiate emergency protocols
        if (window.nuclearSecurity) {
            await window.nuclearSecurity.initiateZeroizeProtocol('DATA_BREACH');
        }
        
        // Notify all stakeholders
        await this.notifyAllStakeholders(incident);
    }

    determineSeverity(type, data) {
        const severityMap = {
            'UNAUTHORIZED_ACCESS': 'HIGH',
            'DATA_BREACH': 'CRITICAL',
            'SYSTEM_COMPROMISE': 'CRITICAL',
            'MALWARE_DETECTION': 'HIGH',
            'NETWORK_ERROR': 'LOW',
            'CLIENT_ERROR': 'LOW',
            'VULNERABILITIES_FOUND': 'MEDIUM',
            'ANOMALY_DETECTED': 'MEDIUM'
        };
        
        return severityMap[type] || 'LOW';
    }

    generateIncidentId() {
        return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async logIncident(incident) {
        if (window.MindFlowFirebase) {
            await window.MindFlowFirebase.logSecurityEvent('INCIDENT_REPORTED', incident);
        }
    }
}

// 📈 AUDIT LOGGER
class AuditLogger {
    async logAudit(eventType, data) {
        const auditEntry = {
            eventType,
            timestamp: Date.now(),
            userId: window.MindFlowAuth?.getUserId(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            data: data
        };

        if (window.MindFlowFirebase) {
            await window.db.collection('audit_logs').add(auditEntry);
        }
        
        console.log('📋 Audit logged:', eventType);
    }

    async logIncident(incident) {
        await this.logAudit('SECURITY_INCIDENT', incident);
    }
}

// 📊 METRICS COLLECTOR
class MetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.setupMetricsCollection();
    }

    setupMetricsCollection() {
        // Collect performance metrics
        this.collectPerformanceMetrics();
        
        // Collect user activity metrics
        this.collectUserActivityMetrics();
        
        // Collect system health metrics
        this.collectSystemHealthMetrics();
    }

    recordMetric(metricType, data) {
        if (!this.metrics.has(metricType)) {
            this.metrics.set(metricType, []);
        }
        
        const metricList = this.metrics.get(metricType);
        metricList.push({
            ...data,
            timestamp: Date.now()
        });
        
        // Keep only last 1000 entries for each metric type
        if (metricList.length > 1000) {
            metricList.shift();
        }
    }

    getSecurityMetrics() {
        const loginMetrics = this.metrics.get('user_login') || [];
        const requestMetrics = this.metrics.get('api_request') || [];
        const errorMetrics = this.metrics.get('api_request_failed') || [];
        
        return {
            totalLogins: loginMetrics.length,
            failedLogins: loginMetrics.filter(l => l.failed).length,
            totalRequests: requestMetrics.length,
            suspiciousRequests: requestMetrics.filter(r => r.status >= 400).length,
            errors: errorMetrics.length,
            vulnerabilities: 0, // This would come from vulnerability scans
            avgResponseTime: this.calculateAverageResponseTime(requestMetrics)
        };
    }

    calculateAverageResponseTime(requests) {
        if (requests.length === 0) return 0;
        
        const totalTime = requests.reduce((sum, req) => sum + (req.duration || 0), 0);
        return totalTime / requests.length;
    }
}

// Initialize Security Monitoring
document.addEventListener('DOMContentLoaded', () => {
    window.SecurityMonitor = new SecurityMonitoring();
});