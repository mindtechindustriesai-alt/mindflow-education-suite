// 🛡️ QUANTUM INPUT VALIDATION - MindFlow Security
class MindFlowSecurityValidation {
    static sanitizeInput(input, options = {}) {
        if (input === null || input === undefined) return '';
        
        const str = String(input);
        const defaults = {
            maxLength: 1000,
            allowHTML: false,
            allowScript: false,
            trim: true
        };
        
        const config = { ...defaults, ...options };
        let sanitized = str;
        
        // Length validation
        if (sanitized.length > config.maxLength) {
            sanitized = sanitized.substring(0, config.maxLength);
        }
        
        // Trim if requested
        if (config.trim) {
            sanitized = sanitized.trim();
        }
        
        // HTML/script sanitization
        if (!config.allowHTML) {
            sanitized = this.sanitizeHTML(sanitized);
        }
        
        if (!config.allowScript) {
            sanitized = this.preventScriptInjection(sanitized);
        }
        
        return sanitized;
    }

    static sanitizeHTML(input) {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    static preventScriptInjection(input) {
        return input
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/expression\(/gi, '')
            .replace(/url\(/gi, '')
            .replace(/<\s*script/gi, '&lt;script')
            .replace(/<\s*\/\s*script/gi, '&lt;/script');
    }

    // ✅ EMAIL VALIDATION
    static validateEmail(email) {
        if (typeof email !== 'string') return false;
        
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    // ✅ PASSWORD VALIDATION (NIST SP 800-63B)
    static validatePassword(password) {
        if (typeof password !== 'string') return false;
        
        if (password.length < 8 || password.length > 128) {
            return false;
        }
        
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'welcome',
            'qwerty', 'letmein', 'monkey', 'sunshine', 'password1'
        ];
        
        if (commonPasswords.includes(password.toLowerCase())) {
            return false;
        }
        
        return true;
    }

    // ✅ SQL INJECTION PREVENTION
    static sanitizeSQL(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/'/g, "''")
            .replace(/--/g, '')
            .replace(/;/g, '')
            .replace(/\|\|/g, '')
            .replace(/&&/g, '')
            .replace(/\b(?:DROP|DELETE|UPDATE|INSERT|CREATE|ALTER)\b/gi, '');
    }

    // ✅ EDUCATIONAL CONTENT SANITIZATION
    static sanitizeEducationalContent(input, options = {}) {
        const defaults = {
            maxLength: 5000,
            allowBasicHTML: false,
            allowMathSymbols: true,
            allowCodeBlocks: false,
            trim: true
        };
        
        const config = { ...defaults, ...options };
        let sanitized = String(input || '');
        
        if (sanitized.length > config.maxLength) {
            sanitized = sanitized.substring(0, config.maxLength);
        }
        
        if (config.allowMathSymbols) {
            sanitized = sanitized.replace(/[≤≥≠≈∞∑∫∆∇√∛∜]/g, match => match);
        }
        
        if (config.allowCodeBlocks) {
            sanitized = sanitized.replace(/```[\s\S]*?```/g, match => 
                this.sanitizeCodeBlock(match)
            );
        }
        
        return this.sanitizeInput(sanitized, {
            allowHTML: config.allowBasicHTML,
            allowScript: false
        });
    }

    static sanitizeCodeBlock(code) {
        // Basic code block sanitization
        return code
            .replace(/<script/gi, '&lt;script')
            .replace(/<\/script/gi, '&lt;/script')
            .replace(/on\w+=/gi, '')
            .replace(/javascript:/gi, '');
    }

    // ✅ FILE UPLOAD VALIDATION
    static validateFileUpload(file, options = {}) {
        const defaults = {
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf']
        };
        
        const config = { ...defaults, ...options };
        
        if (file.size > config.maxSize) {
            throw new SecurityError('File size too large');
        }
        
        if (!config.allowedTypes.includes(file.type)) {
            throw new SecurityError('File type not allowed');
        }
        
        const fileName = file.name.toLowerCase();
        const hasValidExtension = config.allowedExtensions.some(ext => 
            fileName.endsWith(ext)
        );
        
        if (!hasValidExtension) {
            throw new SecurityError('File extension not allowed');
        }
        
        return true;
    }

    // ✅ URL VALIDATION
    static validateURL(url) {
        try {
            const parsed = new URL(url);
            
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return false;
            }
            
            const domain = parsed.hostname;
            if (!domain || domain.length > 253) {
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }

    // ✅ PHONE NUMBER VALIDATION (African formats)
    static validatePhoneNumber(phone) {
        if (typeof phone !== 'string') return false;
        
        const cleaned = phone.replace(/\D/g, '');
        
        // South Africa: +27...
        if (cleaned.startsWith('27') && cleaned.length === 11) {
            return true;
        }
        
        // Basic international format
        if (cleaned.length >= 10 && cleaned.length <= 15) {
            return true;
        }
        
        return false;
    }

    // ✅ STUDENT ID VALIDATION
    static validateStudentID(studentId) {
        if (typeof studentId !== 'string') return false;
        
        const saIdRegex = /^\d{13}$/;
        if (!saIdRegex.test(studentId.replace(/\s/g, ''))) {
            return false;
        }
        
        return this.validateLuhnChecksum(studentId);
    }

    static validateLuhnChecksum(id) {
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = id.length - 1; i >= 0; i--) {
            let digit = parseInt(id.charAt(i));
            
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return sum % 10 === 0;
    }

    // ✅ GRADE VALIDATION
    static validateGrade(grade, maxScore = 100) {
        if (typeof grade !== 'number' || isNaN(grade)) {
            return false;
        }
        
        if (grade < 0 || grade > maxScore) {
            return false;
        }
        
        return true;
    }

    // ✅ CAMERA CONFIG VALIDATION
    static validateCameraConfig(config) {
        const requiredFields = ['cameraId', 'streamUrl', 'location', 'accessLevel'];
        const allowedLocations = ['classroom', 'hallway', 'entrance', 'playground', 'library'];
        const allowedAccessLevels = ['security', 'principal', 'admin'];
        
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new SecurityError(`Missing required field: ${field}`);
            }
        }
        
        if (!allowedLocations.includes(config.location)) {
            throw new SecurityError(`Invalid camera location: ${config.location}`);
        }
        
        if (!allowedAccessLevels.includes(config.accessLevel)) {
            throw new SecurityError(`Invalid access level: ${config.accessLevel}`);
        }
        
        if (!this.validateStreamURL(config.streamUrl)) {
            throw new SecurityError('Invalid stream URL format');
        }
        
        return true;
    }

    static validateStreamURL(url) {
        try {
            const parsed = new URL(url);
            const allowedProtocols = ['rtsp:', 'rtmp:', 'http:', 'https:'];
            const allowedHosts = ['localhost', '192.168.', '10.', '172.'];
            
            if (!allowedProtocols.includes(parsed.protocol)) {
                return false;
            }
            
            const isLocal = allowedHosts.some(host => parsed.hostname.startsWith(host));
            if (!isLocal && !parsed.hostname.includes('.mindflow.')) {
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }

    // ✅ ASSIGNMENT SUBMISSION VALIDATION
    static validateAssignmentSubmission(submission) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png'
        ];
        
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!submission || !submission.file) {
            throw new SecurityError('No file provided');
        }
        
        if (submission.file.size > maxSize) {
            throw new SecurityError('File size exceeds limit');
        }
        
        if (!allowedTypes.includes(submission.file.type)) {
            throw new SecurityError('File type not allowed');
        }
        
        return true;
    }

    // ✅ BULK DATA VALIDATION
    static validateBulkData(data, schema) {
        if (!Array.isArray(data)) {
            throw new SecurityError('Data must be an array');
        }
        
        const validatedData = [];
        const errors = [];
        
        data.forEach((item, index) => {
            try {
                const validated = this.validateDataAgainstSchema(item, schema);
                validatedData.push(validated);
            } catch (error) {
                errors.push(`Item ${index}: ${error.message}`);
            }
        });
        
        if (errors.length > 0) {
            throw new SecurityError(`Validation errors: ${errors.join('; ')}`);
        }
        
        return validatedData;
    }

    static validateDataAgainstSchema(data, schema) {
        const validated = {};
        
        for (const [key, rules] of Object.entries(schema)) {
            if (rules.required && (data[key] === undefined || data[key] === null)) {
                throw new SecurityError(`Required field missing: ${key}`);
            }
            
            if (data[key] !== undefined && data[key] !== null) {
                validated[key] = this.applyValidationRules(data[key], rules);
            }
        }
        
        return validated;
    }

    static applyValidationRules(value, rules) {
        if (rules.type && typeof value !== rules.type) {
            throw new SecurityError(`Invalid type for value: ${value}`);
        }
        
        if (rules.minLength && value.length < rules.minLength) {
            throw new SecurityError(`Value too short: ${value}`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            throw new SecurityError(`Value too long: ${value}`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
            throw new SecurityError(`Value does not match pattern: ${value}`);
        }
        
        return this.sanitizeInput(value, rules.sanitizeOptions || {});
    }
}

// 🚨 SECURITY ERROR CLASS
class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
        this.timestamp = new Date().toISOString();
    }
}

// Export for global use
window.MindFlowSecurityValidation = MindFlowSecurityValidation;
window.SecurityError = SecurityError;