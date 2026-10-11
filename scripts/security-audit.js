// 🛡️ SECURITY AUDIT SCRIPT - MindFlow Education Suite
import { readFileSync, existsSync } from 'fs';

class SecurityAuditor {
    constructor() {
        this.auditResults = [];
        this.criticalIssues = 0;
        this.warnings = 0;
    }

    async runFullAudit() {
        console.log('🛡️ Starting Comprehensive Security Audit...\n');
        
        await this.auditFirebaseRules();
        await this.auditJavaScriptFiles();
        await this.auditConfigurationFiles();
        await this.auditDependencies();
        await this.auditContentSecurityPolicy();
        
        this.generateAuditReport();
    }

    async auditFirebaseRules() {
        console.log('🔍 Auditing Firebase Security Rules...');
        
        const rulesFiles = ['firestore.rules', 'storage.rules'];
        
        for (const file of rulesFiles) {
            if (existsSync(file)) {
                const content = readFileSync(file, 'utf8');
                const issues = this.analyzeFirebaseRules(content, file);
                
                this.auditResults.push({
                    component: 'Firebase Rules',
                    file,
                    issues,
                    status: issues.length === 0 ? 'secure' : 'needs_attention'
                });
            }
        }
    }

    analyzeFirebaseRules(content, filename) {
        const issues = [];
        
        // Check for overly permissive rules
        if (content.includes('allow read, write: if true;')) {
            issues.push({
                level: 'CRITICAL',
                message: 'Overly permissive rule found - allows public read/write access',
                recommendation: 'Implement proper authentication and authorization checks'
            });
            this.criticalIssues++;
        }
        
        // Check for missing authentication
        if (!content.includes('request.auth != null')) {
            issues.push({
                level: 'HIGH',
                message: 'Missing authentication checks in some rules',
                recommendation: 'Ensure all rules check request.auth != null'
            });
            this.criticalIssues++;
        }
        
        // Check for proper role-based access
        if (filename === 'firestore.rules' && !content.includes('get(/databases/$(database)/documents/users/$(request.auth.uid)')) {
            issues.push({
                level: 'MEDIUM',
                message: 'Role-based access control not fully implemented',
                recommendation: 'Implement RBAC using user document lookups'
            });
            this.warnings++;
        }
        
        return issues;
    }

    async auditJavaScriptFiles() {
        console.log('🔍 Auditing JavaScript Files...');
        
        const jsFiles = this.findJavaScriptFiles('assets/js');
        
        for (const file of jsFiles) {
            const content = readFileSync(file, 'utf8');
            const issues = this.analyzeJavaScriptSecurity(content, file);
            
            if (issues.length > 0) {
                this.auditResults.push({
                    component: 'JavaScript',
                    file,
                    issues,
                    status: 'needs_attention'
                });
            }
        }
    }

    analyzeJavaScriptSecurity(content, filename) {
        const issues = [];
        
        // Check for eval usage
        if (content.includes('eval(') && !content.includes('// ALLOWED')) {
            issues.push({
                level: 'CRITICAL',
                message: 'eval() function detected - potential code injection vulnerability',
                recommendation: 'Remove eval() and use safe alternatives'
            });
            this.criticalIssues++;
        }
        
        // Check for innerHTML without sanitization
        if (content.includes('.innerHTML =') && !content.includes('DOMPurify') && !content.includes('sanitize')) {
            issues.push({
                level: 'HIGH',
                message: 'innerHTML assignment without sanitization',
                recommendation: 'Use textContent or DOM purification library'
            });
            this.criticalIssues++;
        }
        
        // Check for hardcoded secrets
        const secretPatterns = [
            /apiKey\s*=\s*["'][^"']*["']/,
            /password\s*=\s*["'][^"']*["']/,
            /secret\s*=\s*["'][^"']*["']/
        ];
        
        secretPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                issues.push({
                    level: 'HIGH',
                    message: 'Potential hardcoded secret detected',
                    recommendation: 'Move secrets to environment variables'
                });
                this.criticalIssues++;
            }
        });
        
        return issues;
    }

    async auditContentSecurityPolicy() {
        console.log('🔍 Auditing Content Security Policy...');
        
        const firebaseConfig = JSON.parse(readFileSync('firebase.json', 'utf8'));
        const cspHeader = firebaseConfig.hosting.headers?.find(h => 
            h.headers?.find(header => header.key === 'Content-Security-Policy')
        );
        
        if (!cspHeader) {
            this.auditResults.push({
                component: 'CSP',
                file: 'firebase.json',
                issues: [{
                    level: 'CRITICAL',
                    message: 'Content Security Policy not configured',
                    recommendation: 'Implement CSP headers in firebase.json'
                }],
                status: 'insecure'
            });
            this.criticalIssues++;
            return;
        }
        
        const cspValue = cspHeader.headers.find(h => h.key === 'Content-Security-Policy').value;
        const issues = this.analyzeCSP(cspValue);
        
        this.auditResults.push({
            component: 'CSP',
            file: 'firebase.json',
            issues,
            status: issues.length === 0 ? 'secure' : 'needs_attention'
        });
    }

    analyzeCSP(csp) {
        const issues = [];
        
        // Check for unsafe directives
        if (csp.includes("'unsafe-inline'")) {
            issues.push({
                level: 'MEDIUM',
                message: 'CSP allows unsafe-inline for scripts',
                recommendation: 'Remove unsafe-inline and use nonces or hashes'
            });
            this.warnings++;
        }
        
        if (csp.includes("'unsafe-eval'")) {
            issues.push({
                level: 'HIGH',
                message: 'CSP allows unsafe-eval',
                recommendation: 'Remove unsafe-eval and refactor code'
            });
            this.criticalIssues++;
        }
        
        // Check for missing directives
        if (!csp.includes('default-src')) {
            issues.push({
                level: 'HIGH',
                message: 'Missing default-src directive',
                recommendation: 'Add default-src directive as fallback'
            });
            this.criticalIssues++;
        }
        
        return issues;
    }

    findJavaScriptFiles(dir) {
        // Simplified file finder - in real scenario would use fs.readdir recursively
        return [
            'assets/js/core/firebase-config.js',
            'assets/js/core/auth-manager.js',
            'assets/js/security/quantum-encryption.js',
            'assets/js/ai/khensani-ai.js'
        ].filter(existsSync);
    }

    generateAuditReport() {
        console.log('\n📊 SECURITY AUDIT REPORT');
        console.log('=' .repeat(50));
        
        this.auditResults.forEach(result => {
            console.log(`\n${result.component} (${result.file}): ${result.status.toUpperCase()}`);
            
            result.issues.forEach(issue => {
                const color = issue.level === 'CRITICAL' ? '\x1b[31m' : 
                             issue.level === 'HIGH' ? '\x1b[33m' : '\x1b[36m';
                console.log(`  ${color}${issue.level}\x1b[0m: ${issue.message}`);
                console.log(`      Recommendation: ${issue.recommendation}`);
            });
        });
        
        console.log('\n' + '=' .repeat(50));
        console.log(`CRITICAL ISSUES: ${this.criticalIssues}`);
        console.log(`WARNINGS: ${this.warnings}`);
        
        if (this.criticalIssues > 0) {
            console.log('\n❌ DEPLOYMENT BLOCKED: Critical security issues found');
            process.exit(1);
        } else if (this.warnings > 0) {
            console.log('\n⚠️  Deployment allowed with warnings');
        } else {
            console.log('\n✅ All security checks passed - Ready for deployment');
        }
    }
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const auditor = new SecurityAuditor();
    auditor.runFullAudit();
}

export default SecurityAuditor;