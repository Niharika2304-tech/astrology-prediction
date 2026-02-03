(function () {
  const form = document.getElementById('astrologyForm');
  const responsePopup = document.getElementById('responsePopup');
  const popupContent = document.getElementById('popupContent');
  const closePopupBtn = document.getElementById('closePopup');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const webhookUrl = form.action;

  if (!form || !responsePopup || !popupContent) return;

  function showLoading(show) {
    loadingOverlay.setAttribute('aria-hidden', !show);
    loadingOverlay.classList.toggle('is-visible', show);
  }

  function showResponsePopup(content) {
    popupContent.innerHTML = content;
    responsePopup.setAttribute('aria-hidden', 'false');
    responsePopup.classList.add('is-visible');
    closePopupBtn.focus();
  }

  function hideResponsePopup() {
    responsePopup.setAttribute('aria-hidden', 'true');
    responsePopup.classList.remove('is-visible');
  }

  function formatResponse(data) {
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      // If n8n returns { prediction: "..." } or similar, show that
      if (data.prediction) return data.prediction;
      if (data.message) return data.message;
      if (data.text) return data.text;
      if (data.result) return typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
      return '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    }
    return String(data);
  }

  closePopupBtn.addEventListener('click', hideResponsePopup);
  responsePopup.addEventListener('click', function (e) {
    if (e.target === responsePopup) hideResponsePopup();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && responsePopup.classList.contains('is-visible')) hideResponsePopup();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    showLoading(true);

    fetch(webhookUrl, {
      method: 'POST',
      body: formData
    })
      .then(function (res) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json().then(formatResponse);
        }
        return res.text();
      })
      .then(function (data) {
        showLoading(false);
        var display = typeof data === 'string' ? data : formatResponse(data);
        if (typeof display !== 'string') display = '<pre>' + JSON.stringify(display, null, 2) + '</pre>';
        showResponsePopup(display);
      })
      .catch(function (err) {
        showLoading(false);
        showResponsePopup('<p class="popup-error">Sorry, we couldn\'t get your prediction. Please try again.</p><p class="popup-error-detail">' + (err.message || 'Network error') + '</p>');
      });
  });
})();
