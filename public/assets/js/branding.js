// assets/js/branding.js
window.KHENSANI_BRANDING = {
  main_logo:      "https://i.postimg.cc/RVnfKspQ/Khensani-Transparent-Logo.png",
  footer_logo:    "https://i.postimg.cc/zXW78GNH/Mind-Tech-Transparent-Logo.png",
  rotating_logo:  "https://i.postimg.cc/T3ytnBqN/KD-LOGO-IMAGE-removebg-preview.png",
  tagline:        "Quantum-Powered Educational Ecosystem",
  copyright:      "© 2026 MindTech Industries · Quantum AI Division",
  patent:         "SA 2026/05142"
};

// Inject branding into every element tagged [data-brand]
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-brand]').forEach(el => {
    const key = el.getAttribute('data-brand');
    if (key === 'main_logo')     el.src = KHENSANI_BRANDING.main_logo;
    if (key === 'footer_logo')   el.src = KHENSANI_BRANDING.footer_logo;
    if (key === 'rotating_logo') el.src = KHENSANI_BRANDING.rotating_logo;
    if (key === 'tagline')       el.textContent = KHENSANI_BRANDING.tagline;
    if (key === 'copyright')     el.textContent = KHENSANI_BRANDING.copyright;
    if (key === 'patent')        el.textContent = KHENSANI_BRANDING.patent;
  });
});