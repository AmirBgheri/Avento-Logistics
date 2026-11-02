/**
 * Premium motion behavior for Avento Logistics.
 * No frameworks, tracking, third-party APIs, animation libraries or large assets.
 * Respects reduced-motion preference and leaves content readable without JS.
 */
(() => {
  'use strict';

  const header = document.getElementById('siteHeader');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scheduled = false;

  // One passive scroll listener, batched to an animation frame.
  function updateHeader() {
    scheduled = false;
    if (!header) return;
    const y = window.scrollY || 0;
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    header.classList.toggle('scrolled', y > 35);
    header.style.setProperty('--page-progress', String(Math.min(y / max, 1)));
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateHeader);
    }
  }, {passive: true});
  updateHeader();

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const groups = [
      '.section-head', '.service-card', '.map-copy', '.map-frame',
      '.why-card', '.process-step', '.audience-item', '.cta-band',
      '.page-intro', '.feature-item', '.form-card', '.side-panel', '.contact-card'
    ];
    const elements = document.querySelectorAll(groups.join(','));
    // No content flashes: add the animation class only after laying out content.
    elements.forEach((element, index) => {
      if (element.getBoundingClientRect().top > window.innerHeight * .82) {
        element.classList.add('reveal');
        // Per-row stagger, capped to 270 ms to avoid slowing navigation.
        element.dataset.delay = String(index % 4);
      }
    });
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.08, rootMargin: '0px 0px -35px 0px'});
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }
})();
