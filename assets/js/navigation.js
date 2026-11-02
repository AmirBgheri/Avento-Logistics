/**
 * Site-wide navigation and small UI helpers.
 * The page content lives in real HTML files; no frontend framework is used.
 */
(function () {
  'use strict';

  const menuButton = document.getElementById('menuBtn');
  const navigation = document.getElementById('mainNav');
  const year = document.getElementById('year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Highlight the selected homepage section when navigation uses a #hash link.
  function updateSectionNavigation() {
    if (!document.getElementById('services') || !document.getElementById('routes')) return;

    const section = ['#services', '#routes'].includes(window.location.hash)
      ? window.location.hash
      : null;

    navigation.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!['index.html', '#services', '#routes'].includes(href)) return;

      const active = section ? href === section : href === 'index.html';
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', section ? 'location' : 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  updateSectionNavigation();
  window.addEventListener('hashchange', updateSectionNavigation);

  if (!menuButton || !navigation) return;

  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute(
      'aria-label',
      isOpen ? 'بستن فهرست' : 'باز کردن فهرست'
    );
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });
})();
