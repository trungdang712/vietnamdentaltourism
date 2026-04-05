// ── VISITOR GEO-DETECTION ──
// Detects visitor country via Cloudflare /cdn-cgi/trace and maps to language preference.
// Populates window.visitorData for use by form submission handlers.
// Non-blocking: falls back to defaults if detection fails or times out.

(function () {
  var LANG_MAP = {
    VN: 'vi',
    JP: 'ja',
    KR: 'ko',
    CN: 'zh',
    TW: 'zh',
    HK: 'zh',
    TH: 'th',
    RU: 'ru',
  };

  // Set defaults immediately so forms always have something to read
  window.visitorData = {
    countryCode: null,
    country: null,
    preferredLanguage: 'en',
  };

  function resolveCountryName(code) {
    try {
      var displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return displayNames.of(code) || null;
    } catch (_) {
      return null;
    }
  }

  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 3000);

  fetch('/cdn-cgi/trace', { signal: ctrl.signal })
    .then(function (res) { return res.text(); })
    .then(function (text) {
      clearTimeout(timer);
      var match = text.match(/loc=([A-Z]{2})/);
      if (!match) return;

      var code = match[1];
      window.visitorData.countryCode = code;
      window.visitorData.country = resolveCountryName(code);
      window.visitorData.preferredLanguage = LANG_MAP[code] || 'en';
    })
    .catch(function () {
      clearTimeout(timer);
      // Defaults already set — nothing to do
    });
})();
