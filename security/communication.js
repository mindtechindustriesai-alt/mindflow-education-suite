// 🛡️ SECURE COMMUNICATION MANAGER - MindFlow
class SecureCommunication {
    constructor() {
        this.csrfTokens = new Map();
        this.requestQueue = new Map();
        this.setupSecurityHeaders();
        this.setupInterceptors();
        console.log('🔒 Secure Communication Manager initialized');
    }

    // ✅ SECURITY HEADERS SETUP
    setupSecurityHeaders() {
        const headers = {
            'Content-Security-Policy': this.getCSP(),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };

        this.applyHeaders(headers);
    }

    getCSP() {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://mindflow-ai-education.firebaseio.com https://mindflow-ai-education.firebasestorage.app",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');
    }

    // ✅ CSRF PROTECTION
    generateCSRFToken() {
        const token = crypto.getRandomValues(new Uint8Array(32))
            .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
        
        this.csrfTokens.set(token, {
            createdAt: Date.now(),
            expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
        });

        this.cleanupExpiredTokens();
        return token;
    }

    validateCSRFToken(token) {
        const tokenData = this.csrfTokens.get(token);
        
        if (!tokenData) {
            throw new SecurityError('Invalid CSRF token');
        }

        if (Date.now() > tokenData.expiresAt) {
            this.csrfTokens.delete(token);
            throw new SecurityError('CSRF token expired');
        }

        this.csrfTokens.delete(token);
        return true;
    }

    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [token, data] of this.csrfTokens.entries()) {
            if (now > data.expiresAt) {
                this.csrfTokens.delete(token);
            }
        }
    }

    // ✅ SECURE FETCH WRAPPER
    async secureFetch(url, options = {}) {
        const requestId = this.generateRequestId();
        
        const defaultOptions = {
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Request-ID': requestId
            }
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        if (mergedOptions.method && mergedOptions.method !== 'GET') {
            const csrfToken = this.generateCSRFToken();
            mergedOptions.headers['X-CSRF-Token'] = csrfToken;
        }

        try {
            this.logNetworkEvent('REQUEST_SENT', { url, method: mergedOptions.method, requestId });
            
            const response = await fetch(url, mergedOptions);
            
            this.validateResponseHeaders(response);
            this.logNetworkEvent('RESPONSE_RECEIVED', { 
                url, 
                status: response.status, 
                requestId 
            });
            
            return response;
            
        } catch (error) {
            this.logNetworkEvent('NETWORK_ERROR', { 
                url, 
                error: error.message,
                requestId 
            });
            throw error;
        }
    }

    // ✅ FIREBASE SECURE WRAPPERS
    async secureFirestoreOperation(operation, collection, data, options = {}) {
        const operationId = this.generateRequestId();
        
        try {
            this.logSecurityEvent('FIRESTORE_OPERATION_START', {
                operation,
                collection,
                operationId,
                userId: window.MindFlowAuth?.getUserId()
            });

            let result;
            switch (operation) {
                case 'add':
                    result = await window.db.collection(collection).add({
                        ...data,
                        _security: {
                            createdBy: window.MindFlowAuth?.getUserId(),
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            operationId
                        }
                    });
                    break;
                    
                case 'set':
                    result = await window.db.collection(collection).doc(options.docId).set({
                        ...data,
                        _security: {
                            updatedBy: window.MindFlowAuth?.getUserId(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            operationId
                        }
                    });
                    break;
                    
                case 'update':
                    result = await window.db.collection(collection).doc(options.docId).update({
                        ...data,
                        '_security.updatedBy': window.MindFlowAuth?.getUserId(),
                        '_security.updatedAt': firebase.firestore.FieldValue.serverTimestamp(),
                        '_security.operationId': operationId
                    });
                    break;
                    
                default:
                    throw new SecurityError(`Unsupported operation: ${operation}`);
            }

            this.logSecurityEvent('FIRESTORE_OPERATION_SUCCESS', {
                operation,
                collection,
                operationId
            });

            return result;
            
        } catch (error) {
            this.logSecurityEvent('FIRESTORE_OPERATION_FAILED', {
                operation,
                collection,
                operationId,
                error: error.message
            });
            throw error;
        }
    }

    // ✅ REQUEST INTERCEPTORS
    setupInterceptors() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Add security headers to all outgoing requests
            const secureOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Request-ID': this.generateRequestId(),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            return originalFetch(url, secureOptions);
        };
    }

    // ✅ RESPONSE VALIDATION
    validateResponseHeaders(response) {
        const securityHeaders = [
            'content-security-policy',
            'x-content-type-options',
            'x-frame-options'
        ];

        for (const header of securityHeaders) {
            if (!response.headers.get(header)) {
                console.warn(`Missing security header: ${header}`);
            }
        }
        
        // Validate content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
            console.warn(`Unexpected content type: ${contentType}`);
        }
    }

    // ✅ RATE LIMITING
    setupRateLimiting() {
        this.requestQueue = new Map();
        setInterval(() => this.cleanupRequestQueue(), 60000); // Clean every minute
    }

    isRateLimited(identifier, maxRequests = 100, windowMs = 60000) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!this.requestQueue.has(identifier)) {
            this.requestQueue.set(identifier, []);
        }
        
        const requests = this.requestQueue.get(identifier).filter(time => time > windowStart);
        this.requestQueue.set(identifier, requests);
        
        if (requests.length >= maxRequests) {
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { identifier });
            return true;
        }
        
        requests.push(now);
        return false;
    }

    cleanupRequestQueue() {
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window
        
        for (const [identifier, requests] of this.requestQueue.entries()) {
            const filtered = requests.filter(time => time > windowStart);
            if (filtered.length === 0) {
                this.requestQueue.delete(identifier);
            } else {
                this.requestQueue.set(identifier, filtered);
            }
        }
    }

    // ✅ SECURE MESSAGING
    async encryptMessage(message, recipientPublicKey) {
        if (window.quantumEngine) {
            return await window.quantumEngine.encryptQuantumMessage(message, recipientPublicKey);
        }
        
        // Fallback to basic encryption
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: this.generateIV() },
            await this.importKey(recipientPublicKey),
            data
        );
        
        return this.arrayToHex(new Uint8Array(encrypted));
    }

    async decryptMessage(encryptedMessage, privateKey) {
        if (window.quantumEngine) {
            return await window.quantumEngine.quantumDecrypt(encryptedMessage, privateKey);
        }
        
        // Fallback to basic decryption
        const encryptedData = this.hexToArray(encryptedMessage.ciphertext);
        const iv = this.hexToArray(encryptedMessage.iv);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            await this.importKey(privateKey),
            encryptedData
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    // ✅ UTILITY METHODS
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateIV() {
        return crypto.getRandomValues(new Uint8Array(12));
    }

    async importKey(keyMaterial) {
        return await crypto.subtle.importKey(
            'raw',
            keyMaterial,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    arrayToHex(array) {
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    hexToArray(hex) {
        const array = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            array[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return array;
    }

    applyHeaders(headers) {
        // This would be implemented on server-side
        // For client-side, we log recommended headers
        console.log('🔒 SECURITY HEADERS TO IMPLEMENT ON SERVER:');
        Object.entries(headers).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
    }

    // ✅ LOGGING & MONITORING
    async logSecurityEvent(eventType, details) {
        if (window.MindFlowFirebase?.logSecurityEvent) {
            await window.MindFlowFirebase.logSecurityEvent(eventType, details);
        } else {
            console.log('🔒 SECURITY EVENT:', { eventType, ...details });
        }
    }

    async logNetworkEvent(eventType, details) {
        await this.logSecurityEvent(`NETWORK_${eventType}`, details);
    }
}

// Initialize Secure Communication
document.addEventListener('DOMContentLoaded', () => {
    window.SecureComms = new SecureCommunication();
});