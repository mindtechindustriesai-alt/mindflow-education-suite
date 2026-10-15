// ⚙️ UTILITY FUNCTIONS - MindFlow Education Suite
class MindFlowUtils {
    constructor() {
        this.debounceTimers = new Map();
        this.cache = new Map();
        console.log('🔧 MindFlow Utilities initialized');
    }

    // ✅ DEBOUNCE FUNCTION
    debounce(func, wait, immediate = false) {
        const key = func.toString();
        
        return (...args) => {
            const later = () => {
                this.debounceTimers.delete(key);
                if (!immediate) func.apply(this, args);
            };
            
            const callNow = immediate && !this.debounceTimers.has(key);
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.set(key, setTimeout(later, wait));
            
            if (callNow) func.apply(this, args);
        };
    }

    // ✅ THROTTLE FUNCTION
    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ✅ CACHE MANAGEMENT
    setCache(key, value, ttl = 300000) { // 5 minutes default
        const item = {
            value,
            expiry: Date.now() + ttl
        };
        this.cache.set(key, item);
        return value;
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // ✅ DATE & TIME UTILITIES
    formatDate(date, format = 'medium') {
        const d = new Date(date);
        const formats = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            medium: { year: 'numeric', month: 'long', day: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' }
        };
        
        return d.toLocaleDateString('en-ZA', formats[format] || formats.medium);
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return this.formatDate(date, 'short');
    }

    // ✅ STRING UTILITIES
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    truncate(str, length = 100, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ✅ NUMBER UTILITIES
    formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('en-ZA', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    formatPercentage(value, total, decimals = 1) {
        if (total === 0) return '0%';
        const percentage = (value / total) * 100;
        return `${percentage.toFixed(decimals)}%`;
    }

    // ✅ ARRAY UTILITIES
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    // ✅ OBJECT UTILITIES
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    mergeObjects(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(target[key]) && this.isObject(source[key])) {
                    this.mergeObjects(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // ✅ VALIDATION UTILITIES
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // ✅ STORAGE UTILITIES
    setStorage(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(`mindflow_${key}`, serialized);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`mindflow_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    removeStorage(key) {
        try {
            localStorage.removeItem(`mindflow_${key}`);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    // ✅ DOM UTILITIES
    $(selector) {
        const elements = document.querySelectorAll(selector);
        return elements.length === 1 ? elements[0] : elements;
    }

    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    showElement(selector) {
        const element = this.$(selector);
        if (element) element.style.display = '';
    }

    hideElement(selector) {
        const element = this.$(selector);
        if (element) element.style.display = 'none';
    }

    // ✅ EVENT UTILITIES
    on(event, selector, handler) {
        document.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler(e);
            }
        });
    }

    once(event, handler) {
        const onceHandler = (e) => {
            handler(e);
            document.removeEventListener(event, onceHandler);
        };
        document.addEventListener(event, onceHandler);
    }

    // ✅ LOADING STATES
    showLoading(selector = 'body') {
        const element = this.$(selector);
        if (element) {
            element.classList.add('loading');
        }
    }

    hideLoading(selector = 'body') {
        const element = this.$(selector);
        if (element) {
            element.classList.remove('loading');
        }
    }

    // ✅ NOTIFICATION SYSTEM
    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createElement('div', {
            className: `notification notification-${type}`
        }, [message]);

        const style = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px',
            borderRadius: '8px',
            color: 'white',
            zIndex: '10000',
            maxWidth: '300px',
            animation: 'slideInRight 0.3s ease-out'
        };

        const backgroundColors = {
            info: 'var(--mindflow-blue)',
            success: 'var(--success)',
            warning: 'var(--warning)',
            error: 'var(--danger)'
        };

        Object.assign(notification.style, {
            ...style,
            background: backgroundColors[type]
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);

        return notification;
    }

    // ✅ API RESPONSE HANDLING
    handleApiResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    handleApiError(error) {
        console.error('API Error:', error);
        this.showNotification(
            error.message || 'An error occurred. Please try again.',
            'error'
        );
        throw error;
    }

    // ✅ PERFORMANCE UTILITIES
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`⏱️ ${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    async measureAsyncPerformance(name, asyncFn) {
        const start = performance.now();
        const result = await asyncFn();
        const end = performance.now();
        
        console.log(`⏱️ ${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // ✅ SECURITY UTILITIES
    sanitizeForLog(data) {
        if (typeof data !== 'object' || data === null) return data;
        
        const sanitized = { ...data };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
        
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        }
        
        return sanitized;
    }

    // ✅ EXPORT UTILITIES
    exportToCSV(data, filename = 'export.csv') {
        if (!data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = this.createElement('a', {
            href: url,
            download: filename
        });
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ✅ MISC UTILITIES
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize Utilities
document.addEventListener('DOMContentLoaded', () => {
    window.MindFlowUtils = new MindFlowUtils();
    console.log('🔧 MindFlow Utilities ready');
});

// Global shortcut
window.$utils = window.MindFlowUtils;