// 🛡️ ROLE-BASED ACCESS CONTROL - MindFlow Education Suite
class MindFlowRBAC {
    constructor() {
        this.roles = new Map();
        this.permissions = new Map();
        this.userSessions = new Map();
        this.initializeRolesAndPermissions();
        console.log('🔐 RBAC System initialized');
    }

    // ✅ INITIALIZE ROLES & PERMISSIONS
    initializeRolesAndPermissions() {
        // Define all permissions
        this.initializePermissions();
        
        // Define roles with permissions
        this.initializeRoles();
        
        // Setup session cleanup
        this.setupSessionCleanup();
    }

    initializePermissions() {
        // Portal Access Permissions
        this.permissions.set('access_student_portal', ['student', 'teacher', 'principal', 'hod', 'admin']);
        this.permissions.set('access_teacher_portal', ['teacher', 'principal', 'hod', 'admin']);
        this.permissions.set('access_parent_portal', ['parent', 'admin']);
        this.permissions.set('access_principal_portal', ['principal', 'admin']);
        this.permissions.set('access_hod_portal', ['hod', 'admin']);
        this.permissions.set('access_security_portal', ['security', 'admin']);
        this.permissions.set('access_corporate_portal', ['corporate', 'admin']);

        // Data Access Permissions
        this.permissions.set('view_own_grades', ['student']);
        this.permissions.set('view_all_grades', ['teacher', 'principal', 'hod', 'admin']);
        this.permissions.set('modify_grades', ['teacher', 'principal', 'admin']);
        this.permissions.set('view_student_progress', ['teacher', 'principal', 'hod', 'parent', 'admin']);
        this.permissions.set('view_analytics', ['teacher', 'principal', 'hod', 'corporate', 'admin']);

        // System Management Permissions
        this.permissions.set('manage_users', ['principal', 'admin']);
        this.permissions.set('manage_courses', ['teacher', 'principal', 'hod', 'admin']);
        this.permissions.set('manage_assignments', ['teacher', 'principal', 'admin']);
        this.permissions.set('manage_system', ['admin']);

        // Security Permissions
        this.permissions.set('access_cameras', ['security', 'principal', 'admin']);
        this.permissions.set('view_security_logs', ['security', 'principal', 'admin']);
        this.permissions.set('manage_incidents', ['security', 'admin']);
        this.permissions.set('view_audit_trails', ['principal', 'admin']);

        // Corporate Permissions
        this.permissions.set('view_corporate_analytics', ['corporate', 'admin']);
        this.permissions.set('manage_sponsorships', ['corporate', 'admin']);
        this.permissions.set('access_financial_data', ['corporate', 'admin']);
    }

    initializeRoles() {
        // Student Role
        this.roles.set('student', {
            name: 'Student',
            permissions: [
                'access_student_portal',
                'view_own_grades',
                'view_student_progress'
            ],
            level: 1
        });

        // Teacher Role
        this.roles.set('teacher', {
            name: 'Teacher',
            permissions: [
                'access_student_portal',
                'access_teacher_portal',
                'view_all_grades',
                'modify_grades',
                'view_student_progress',
                'view_analytics',
                'manage_courses',
                'manage_assignments'
            ],
            level: 2
        });

        // Parent Role
        this.roles.set('parent', {
            name: 'Parent/Guardian',
            permissions: [
                'access_parent_portal',
                'view_student_progress'
            ],
            level: 1
        });

        // Principal Role
        this.roles.set('principal', {
            name: 'Principal',
            permissions: [
                'access_student_portal',
                'access_teacher_portal',
                'access_principal_portal',
                'view_all_grades',
                'modify_grades',
                'view_student_progress',
                'view_analytics',
                'manage_users',
                'manage_courses',
                'access_cameras',
                'view_security_logs',
                'view_audit_trails'
            ],
            level: 4
        });

        // HOD Role
        this.roles.set('hod', {
            name: 'Head of Department',
            permissions: [
                'access_student_portal',
                'access_teacher_portal',
                'access_hod_portal',
                'view_all_grades',
                'view_student_progress',
                'view_analytics',
                'manage_courses',
                'view_audit_trails'
            ],
            level: 3
        });

        // Security Role
        this.roles.set('security', {
            name: 'Security Officer',
            permissions: [
                'access_security_portal',
                'access_cameras',
                'view_security_logs',
                'manage_incidents'
            ],
            level: 3
        });

        // Corporate Role
        this.roles.set('corporate', {
            name: 'Corporate Partner',
            permissions: [
                'access_corporate_portal',
                'view_corporate_analytics',
                'manage_sponsorships',
                'access_financial_data'
            ],
            level: 3
        });

        // Admin Role (Full Access)
        this.roles.set('admin', {
            name: 'System Administrator',
            permissions: Array.from(this.permissions.keys()),
            level: 5
        });
    }

    // ✅ ACCESS CONTROL METHODS
    hasPermission(userRole, permission) {
        if (!this.permissions.has(permission)) {
            console.warn(`⚠️ Unknown permission: ${permission}`);
            return false;
        }

        const allowedRoles = this.permissions.get(permission);
        return allowedRoles.includes(userRole);
    }

    hasAnyPermission(userRole, permissions) {
        return permissions.some(permission => this.hasPermission(userRole, permission));
    }

    hasAllPermissions(userRole, permissions) {
        return permissions.every(permission => this.hasPermission(userRole, permission));
    }

    // ✅ PORTAL ACCESS CONTROL
    canAccessPortal(userRole, portal) {
        const portalPermissions = {
            'student': 'access_student_portal',
            'teacher': 'access_teacher_portal',
            'parent': 'access_parent_portal',
            'principal': 'access_principal_portal',
            'hod': 'access_hod_portal',
            'security': 'access_security_portal',
            'corporate': 'access_corporate_portal'
        };

        return this.hasPermission(userRole, portalPermissions[portal]);
    }

    getAccessiblePortals(userRole) {
        const portals = [];
        const portalMap = {
            'access_student_portal': 'student',
            'access_teacher_portal': 'teacher',
            'access_parent_portal': 'parent',
            'access_principal_portal': 'principal',
            'access_hod_portal': 'hod',
            'access_security_portal': 'security',
            'access_corporate_portal': 'corporate'
        };

        for (const [permission, portal] of Object.entries(portalMap)) {
            if (this.hasPermission(userRole, permission)) {
                portals.push(portal);
            }
        }

        return portals;
    }

    // ✅ DATA ACCESS CONTROL
    canViewData(userRole, dataType, dataOwner = null) {
        const userId = window.MindFlowAuth?.getUserId();
        
        switch(dataType) {
            case 'grades':
                if (dataOwner && dataOwner === userId) {
                    return this.hasPermission(userRole, 'view_own_grades');
                }
                return this.hasPermission(userRole, 'view_all_grades');
                
            case 'progress':
                return this.hasPermission(userRole, 'view_student_progress');
                
            case 'analytics':
                return this.hasPermission(userRole, 'view_analytics');
                
            case 'security_logs':
                return this.hasPermission(userRole, 'view_security_logs');
                
            case 'financial_data':
                return this.hasPermission(userRole, 'access_financial_data');
                
            default:
                return false;
        }
    }

    canModifyData(userRole, dataType) {
        switch(dataType) {
            case 'grades':
                return this.hasPermission(userRole, 'modify_grades');
            case 'users':
                return this.hasPermission(userRole, 'manage_users');
            case 'courses':
                return this.hasPermission(userRole, 'manage_courses');
            case 'assignments':
                return this.hasPermission(userRole, 'manage_assignments');
            case 'incidents':
                return this.hasPermission(userRole, 'manage_incidents');
            default:
                return false;
        }
    }

    // ✅ SESSION MANAGEMENT
    createUserSession(userId, userRole, sessionData = {}) {
        const session = {
            userId,
            userRole,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            permissions: this.roles.get(userRole)?.permissions || [],
            ...sessionData
        };

        this.userSessions.set(userId, session);
        this.logSecurityEvent('SESSION_CREATED', { userId, userRole });
        
        return session;
    }

    updateUserActivity(userId) {
        const session = this.userSessions.get(userId);
        if (session) {
            session.lastActivity = Date.now();
        }
    }

    invalidateUserSession(userId) {
        if (this.userSessions.has(userId)) {
            this.userSessions.delete(userId);
            this.logSecurityEvent('SESSION_INVALIDATED', { userId });
        }
    }

    getActiveSessions() {
        return Array.from(this.userSessions.values());
    }

    // ✅ ROLE MANAGEMENT
    getUserRoleLevel(userRole) {
        const role = this.roles.get(userRole);
        return role ? role.level : 0;
    }

    canElevatePrivileges(currentRole, targetRole) {
        const currentLevel = this.getUserRoleLevel(currentRole);
        const targetLevel = this.getUserRoleLevel(targetRole);
        
        return currentLevel >= targetLevel;
    }

    getRoleHierarchy() {
        const hierarchy = {};
        for (const [roleName, roleData] of this.roles) {
            hierarchy[roleName] = {
                name: roleData.name,
                level: roleData.level,
                permissions: roleData.permissions
            };
        }
        return hierarchy;
    }

    // ✅ PERMISSION CHECKING WITH CONTEXT
    checkPermissionWithContext(userRole, permission, context = {}) {
        if (!this.hasPermission(userRole, permission)) {
            return false;
        }

        // Context-based permission checks
        switch(permission) {
            case 'view_all_grades':
                // Teachers can only view grades for their classes
                if (userRole === 'teacher' && context.teacherId) {
                    return context.teacherId === window.MindFlowAuth?.getUserId();
                }
                break;
                
            case 'view_student_progress':
                // Parents can only view their children's progress
                if (userRole === 'parent' && context.studentId) {
                    return this.isUserParentOfStudent(context.studentId);
                }
                break;
                
            case 'access_cameras':
                // Principals can only access certain camera locations
                if (userRole === 'principal' && context.cameraLocation) {
                    const allowedLocations = ['entrance', 'hallway', 'playground'];
                    return allowedLocations.includes(context.cameraLocation);
                }
                break;
        }

        return true;
    }

    isUserParentOfStudent(studentId) {
        // This would check parent-child relationships in the database
        // For now, return true for demonstration
        return true;
    }

    // ✅ SECURITY MONITORING
    setupSessionCleanup() {
        // Clean up expired sessions every hour
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60 * 60 * 1000);
    }

    cleanupExpiredSessions() {
        const now = Date.now();
        const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [userId, session] of this.userSessions.entries()) {
            if (now - session.lastActivity > SESSION_TIMEOUT) {
                this.invalidateUserSession(userId);
                this.logSecurityEvent('SESSION_EXPIRED', { userId });
            }
        }
    }

    // ✅ AUDIT LOGGING
    async logSecurityEvent(eventType, details) {
        if (window.MindFlowFirebase?.logSecurityEvent) {
            await window.MindFlowFirebase.logSecurityEvent(`RBAC_${eventType}`, details);
        }
    }

    async logAccessAttempt(userId, resource, action, success, context = {}) {
        await this.logSecurityEvent('ACCESS_ATTEMPT', {
            userId,
            resource,
            action,
            success,
            ...context
        });
    }

    // ✅ PUBLIC API
    getUserPermissions(userRole) {
        const role = this.roles.get(userRole);
        return role ? role.permissions : [];
    }

    getAllRoles() {
        return Array.from(this.roles.keys());
    }

    getRoleInfo(roleName) {
        return this.roles.get(roleName);
    }

    validateUserAccess(userRole, requiredPermissions, context = {}) {
        const hasAccess = this.hasAllPermissions(userRole, requiredPermissions);
        
        if (hasAccess && context) {
            // Check context-based permissions
            for (const permission of requiredPermissions) {
                if (!this.checkPermissionWithContext(userRole, permission, context)) {
                    return false;
                }
            }
        }
        
        return hasAccess;
    }
}

// Initialize RBAC System
document.addEventListener('DOMContentLoaded', () => {
    window.MindFlowRBAC = new MindFlowRBAC();
    console.log('🔐 MindFlow RBAC System ready');
});