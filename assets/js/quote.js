/**
 * Freight quote form: send to our own server, never to WhatsApp.
 * The server is responsible for validating and emailing the request.
 * IMPORTANT: api/quote.php must be configured on PHP hosting first.
 */
(function () {
  'use strict';

  const form = document.getElementById('quoteForm');
  if (!form) return;

  const submitButton = form.querySelector('[type="submit"]');
  const successMessage = document.getElementById('formSuccess');
  const errorMessage = document.getElementById('formError');

  // Cards on the home page can open this form with a preselected freight method.
  const modes = {air: 'هوایی / Air', sea: 'دریایی / Sea', road: 'زمینی / Road'};
  const selectedMode = new URLSearchParams(window.location.search).get('mode');
  if (modes[selectedMode]) {
    const methodField = form.querySelector('#method');
    if (methodField) methodField.value = modes[selectedMode];
  }

  function displayError(message) {
    successMessage?.classList.remove('visible');
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    successMessage?.classList.remove('visible');
    errorMessage?.classList.remove('visible');
    submitButton.disabled = true;
    const previousText = submitButton.textContent;
    submitButton.textContent = 'در حال ارسال درخواست...';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      let result;
      try {
        result = await response.json();
      } catch (_) {
        throw new Error('پاسخ سرور معتبر نیست. لطفاً تنظیمات هاست را بررسی کنید.');
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'ارسال درخواست انجام نشد. دوباره تلاش کنید.');
      }

      // Show success ONLY after the server confirms that it accepted the email.
      errorMessage?.classList.remove('visible');
      successMessage?.classList.add('visible');
      form.reset();
      successMessage?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      displayError(
        error?.message || 'ارتباط با سرور برقرار نشد. لطفاً بعداً تلاش کنید.'
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = previousText;
    }
  });
})();
