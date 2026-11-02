/**
 * Interactive illustrated shipping routes.
 * The SVG and route cards are semantic HTML in the #routes section of index.html.
 */
(function () {
  'use strict';

  const routeButtons = document.querySelectorAll('[data-route-map]');
  const mapPoints = document.querySelectorAll('.map-origin');
  const routeLines = document.querySelectorAll('.map-path');
  const routeLive = document.getElementById('routeLive');
  const routeNames = {cn:'چین به ایران',ae:'امارات / دبی به ایران',eu:'اروپا به ایران',in:'هند به ایران',tr:'ترکیه به ایران'};

  if (routeButtons.length === 0) return;

  function activateRoute(routeId) {
    routeButtons.forEach((button) => {
      const active = button.dataset.routeMap === routeId;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });

    mapPoints.forEach((point) => {
      point.classList.toggle('active', point.dataset.place === routeId);
    });

    routeLines.forEach((line) => {
      line.classList.toggle('active', line.id === `line-${routeId}`);
    });
    if (routeLive) routeLive.textContent = `مسیر انتخابی: ${routeNames[routeId]}`;
  }

  routeButtons.forEach((button) => {
    button.addEventListener('click', () => activateRoute(button.dataset.routeMap));
  });

  mapPoints.forEach((point) => {
    point.addEventListener('click', () => activateRoute(point.dataset.place));
    point.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateRoute(point.dataset.place);
      }
    });
  });

  activateRoute('cn');
})();
