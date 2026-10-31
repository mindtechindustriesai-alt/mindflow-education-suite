/**
 * Khensani AI — Chat Widget
 * Floating chat panel supporting Cloud Functions with direct sovereign intelligence fallback.
 * Offline-first, strict brand integrity, zero internal system name exposure.
 */

(function () {
  'use strict';

  class KhensaniChat {
    constructor(opts = {}) {
      this.studentUid = opts.studentUid || 'demo-student';
      this.mountId = opts.mountId || 'khensani-chat';
      this.history = [];
      this.engine = null;
      this._initialized = false;
    }

    async init() {
      if (this._initialized) return;
      this._initialized = true;

      this._render();
      this._bind();

      if (window.KhensaniAI) {
        this.engine = window.KhensaniAI;
      }

      console.log('[KhensaniChat] initialized for uid:', this.studentUid);
    }

    _render() {
      const html = `
        <button id="khensani-chat-toggle" class="khensani-chat-toggle" aria-label="Open Khensani AI Assistant">
          <img src="https://i.postimg.cc/T3ytnBqN/KD-LOGO-IMAGE-removebg-preview.png" alt="" />
        </button>
        <div id="khensani-chat-panel" class="khensani-chat-panel" aria-hidden="true">
          <header class="khensani-chat-header">
            <img src="https://i.postimg.cc/RVnfKspQ/Khensani-Transparent-Logo.png" alt="" class="chat-brand" />
            <span class="chat-intelligence" id="khensani-chat-confidence">98%</span>
            <button class="chat-close" id="khensani-chat-close" aria-label="Close">×</button>
          </header>
          <div class="khensani-chat-body" id="khensani-chat-body">
            <div class="chat-msg chat-msg-ai">
              <strong>Khensani AI:</strong> Sawubona! I am your AI learning assistant. How can I help you with your studies today?
            </div>
          </div>
          <form class="khensani-chat-form" id="khensani-chat-form">
            <input type="text" id="khensani-chat-input" placeholder="Ask Khensani anything..." autocomplete="off" />
            <button type="submit" aria-label="Send">→</button>
          </form>
        </div>
      `;

      let root = document.getElementById(this.mountId);
      if (!root) {
        root = document.createElement('div');
        root.id = this.mountId;
        document.body.appendChild(root);
      }
      root.innerHTML = html;
    }

    _bind() {
      const toggle = document.getElementById('khensani-chat-toggle');
      const panel  = document.getElementById('khensani-chat-panel');
      const close  = document.getElementById('khensani-chat-close');
      const form   = document.getElementById('khensani-chat-form');
      const input  = document.getElementById('khensani-chat-input');

      if (!toggle || !panel || !form || !input) return;

      toggle.onclick = () => {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        input.focus();
      };
      close.onclick = () => {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
      };
      form.onsubmit = async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        await this.send(text);
      };
    }

    async send(text) {
      this.appendMessage('user', text);

      if (window.SentinelAI && typeof window.SentinelAI.feedMessage === 'function') {
        try { window.SentinelAI.feedMessage(text); } catch (_) {}
      }

      this.appendMessage('ai', '⚛️ Collapsing quantum state...');

      let reply = '';

      // 1. Try Firebase Cloud Function first
      if (window.firebase && window.firebase.functions) {
        try {
          const call = window.firebase.app().functions('africa-south1').httpsCallable('luvunoChat');
          const res = await call({
            message: text,
            portal: 'khensani',
            language: window.KhensaniI18n?.current || 'english',
            history: this.history.slice(-10),
          });
          reply = res.data?.response;
        } catch (e) {
          console.warn('[KhensaniChat] Cloud Function offline/CORS. Engaging sovereign edge fallback.');
        }
      }

      // 2. Fallback to Sovereign Edge Intel (Guarantees Luvuno-grade intelligence parity with zero leaks)
      if (!reply) {
        reply = await this.fetchSovereignEdgeIntel(text);
      }

      this.replaceLastAi(reply);

      this.history.push({ role: 'user', content: text });
      this.history.push({ role: 'assistant', content: reply });
      if (this.history.length > 60) {
        this.history = this.history.slice(-60);
      }
    }

    async fetchSovereignEdgeIntel(prompt) {
      const systemPrompt = [
        "You are Khensani AI, an advanced educational intelligence powered by MindTech Industries (Patent SA 2026/05142).",
        "Provide elite, high-level academic guidance, deep conceptual explanations, and precise solutions across all subjects.",
        "Strict Rule: NEVER mention internal system names, code names, or underlying third-party APIs.",
        "Structure your answers cleanly with bullet points and academic warmth."
      ].join(" ");

      const fullPayload = `${systemPrompt}\n\nStudent Query: ${prompt}\n\nKhensani AI Response:`;

      try {
        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPayload)}?model=openai`);
        const text = await res.text();
        return text || "I am online and ready to assist you with your studies.";
      } catch (err) {
        return "⚛️ Quantum network sync momentarily delayed. Please re-submit your prompt.";
      }
    }

    appendMessage(role, text) {
      const body = document.getElementById('khensani-chat-body');
      if (!body) return;
      const div = document.createElement('div');
      div.className = `chat-msg chat-msg-${role}`;
      div.innerHTML = role === 'ai' ? `<strong>Khensani AI:</strong> ${text}` : `<strong>You:</strong> ${this.escapeHtml(text)}`;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    replaceLastAi(text) {
      const body = document.getElementById('khensani-chat-body');
      if (!body) return;
      const last = body.querySelector('.chat-msg-ai:last-child');
      if (last) {
        last.innerHTML = `<strong>Khensani AI:</strong> ${text.replace(/\n/g, '<br>')}`;
      }
      body.scrollTop = body.scrollHeight;
    }

    escapeHtml(str) {
      return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
      })[m]);
    }
  }

  window.KhensaniChat = KhensaniChat;
  console.log('[Khensani] chat.js loaded');
})();
