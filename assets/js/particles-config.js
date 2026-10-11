// assets/js/particles-config.js
// Single source of truth — every portal loads this exact config
(function () {
  'use strict';

  function bootParticles() {
    if (typeof particlesJS === 'undefined') return;
    if (!document.getElementById('particles-js')) {
      const el = document.createElement('div');
      el.id = 'particles-js';
      document.body.prepend(el);
    }

    particlesJS('particles-js', {
      particles: {
        number: { value: 55, density: { enable: true, value_area: 1000 } },
        color: { value: ["#1B4D3D", "#C8A450", "#2A7A5E", "#E8D5A3"] },
        shape: { type: "circle" },
        opacity: { value: 0.25, random: true },
        size: { value: 2.5, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#C8A450",
          opacity: 0.06,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.7,
          direction: "none",
          random: true
        }
      },
      interactivity: {
        events: {
          onhover: { enable: true, mode: "repulse" }
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootParticles);
  } else {
    bootParticles();
  }
})();