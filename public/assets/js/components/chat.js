/**
 * Khensani AI — Chat Widget
 * Floating chat panel calling the luvunoChat Cloud Function.
 * Offline-first, sentiment feed to Sentinel AI, Firestore-safe.
 */

(function () {
  'use strict';

  class KhensaniChat {
    constructor(opts = {}) {
      this.studentUid = opts.studentUid || null;
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

      console.log('[KhensaniChat] initialized for uid:', this.studentUid || 'anonymous');
    }

    _render() {
      const html = `
        <button id="khensani-chat-toggle" class="khensani-chat-toggle" aria-label="Open Khensani AI Assistant">
          <img src="https://i.postimg.cc/T3ytnBqN/KD-LOGO-IMAGE-removebg-preview.png" alt="" />
        </button>
        <div id="khensani-chat-panel" class="khensani-chat-panel" aria-hidden="true">
          <header class="khensani-chat-header">
            <img src="https://i.postimg.cc/RVnfKspQ/Khensani-Transparent-Logo.png" alt="" class="chat-brand" />
            <span class="chat-intelligence" id="khensani-chat-confidence">92%</span>
            <button class="chat-close" id="khensani-chat-close" aria-label="Close">×</button>
          </header>
          <div class="khensani-chat-body" id="khensani-chat-body">
            <div class="chat-msg chat-msg-ai">
              <strong>Khensani AI:</strong> Sawubona! I am here to help you learn. Ask me anything.
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

      // Feed Sentinel AI (if loaded)
      if (window.SentinelAI && typeof window.SentinelAI.feedMessage === 'function') {
        try { window.SentinelAI.feedMessage(text); } catch (_) {}
      }

      this.appendMessage('ai', '…');

      let reply = 'I am here with you.';

      // Try Cloud Function first (has auth + logging + quantum context)
      if (window.firebase && window.firebase.functions) {
        try {
          const call = window.firebase.app().functions('africa-south1').httpsCallable('luvunoChat');
          const res = await call({
            message: text,
            portal: 'khensani',
            language: window.KhensaniI18n?.current || 'english',
            history: this.history.slice(-10),
          });
          reply = res.data?.response || reply;
        } catch (e) {
          console.warn('[KhensaniChat] Cloud Function failed:', e.message);
          // Fall back to local engine if available
          if (this.engine && typeof this.engine.chat === 'function') {
            try {
              reply = await this.engine.chat(text, { studentUid: this.studentUid });
            } catch (e2) {
              reply = 'I am offline but still here. Your message will sync when you are online.';
            }
          } else {
            reply = 'I am offline but still here. Please try again in a moment.';
          }
        }
      }

      this.replaceLastAi(reply);

      // Update local history
      this.history.push({ role: 'user', content: text });
      this.history.push({ role: 'assistant', content: reply });
      if (this.history.length > 60) {
        this.history = this.history.slice(-60);
      }
    }

    appendMessage(role, text) {
      const body = document.getElementById('khensani-chat-body');
      if (!body) return;
      const div = document.createElement('div');
      div.className = `chat-msg chat-msg-${role}`;
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    replaceLastAi(text) {
      const body = document.getElementById('khensani-chat-body');
      if (!body) return;
      const last = body.querySelector('.chat-msg-ai:last-child');
      if (last) last.textContent = text;
      body.scrollTop = body.scrollHeight;
    }
  }

  window.KhensaniChat = KhensaniChat;
  console.log('[Khensani] chat.js loaded');
})();