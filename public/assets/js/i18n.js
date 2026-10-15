// assets/js/i18n.js
window.KHENSANI_LOCALES = {
  en: { name: "English",    region: "Pan-African",              dir: "ltr", script: "Latin"    },
  fr: { name: "Français",   region: "West/Central/Sahel",       dir: "ltr", script: "Latin"    },
  ar: { name: "العربية",     region: "North Africa/Sahel",       dir: "rtl", script: "Arabic"   },
  sw: { name: "Kiswahili",  region: "East/Central Africa",      dir: "ltr", script: "Latin"    },
  pt: { name: "Português",  region: "Mozambique/Angola",        dir: "ltr", script: "Latin"    },
  zu: { name: "isiZulu",    region: "South Africa",             dir: "ltr", script: "Latin"    },
  st: { name: "Sesotho",    region: "South Africa/Lesotho",     dir: "ltr", script: "Latin"    },
  sn: { name: "Shona",      region: "Zimbabwe",                 dir: "ltr", script: "Latin"    },
  xh: { name: "isiXhosa",   region: "South Africa",             dir: "ltr", script: "Latin"    },
  ha: { name: "Hausa",      region: "West Africa/Sahel",        dir: "ltr", script: "Latin"    },
  am: { name: "አማርኛ",        region: "Ethiopia/Horn of Africa",  dir: "ltr", script: "Ethiopic" },
  yo: { name: "Yorùbá",     region: "West Africa",              dir: "ltr", script: "Latin"    },
  af: { name: "Afrikaans",  region: "South Africa/Namibia",     dir: "ltr", script: "Latin"    }
};

window.KhensaniI18n = {
  current: localStorage.getItem('khensani_lang') || 'en',
  strings: {},

  async load(lang) {
    if (!KHENSANI_LOCALES[lang]) lang = 'en';
    try {
      const res = await fetch(`/assets/i18n/${lang}.json`);
      this.strings = await res.json();
      this.current = lang;
      localStorage.setItem('khensani_lang', lang);
      this.applyDirection();
      this.applyFonts();
      this.render();
    } catch (e) {
      console.warn('[i18n] fallback to en', e);
      if (lang !== 'en') return this.load('en');
    }
  },

  applyDirection() {
    const meta = KHENSANI_LOCALES[this.current];
    document.documentElement.setAttribute('dir', meta.dir);
    document.documentElement.setAttribute('lang', this.current);
  },

  applyFonts() {
    const meta = KHENSANI_LOCALES[this.current];
    const fonts = {
      Ethiopic: "'Noto Sans Ethiopic', sans-serif",
      Arabic:   "'Noto Naskh Arabic', sans-serif",
      Latin:    "'Inter', sans-serif"
    };
    document.documentElement.style.fontFamily = fonts[meta.script] || fonts.Latin;
  },

  t(key) {
    return this.strings[key] || key;
  },

  render() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  }
};