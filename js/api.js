/* Talks to the Apps Script web app. Every call carries the user's sign-in. */
(function () {
  'use strict';
  var cfg = window.OT_CONFIG || {};

  function ApiError(code, message) { this.code = code; this.message = message; }

  function post(body) {
    // text/plain keeps this a "simple" request: Apps Script cannot answer a CORS preflight.
    return fetch(cfg.API_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body), redirect: 'follow', credentials: 'omit', cache: 'no-store'
    }).then(function (res) { return res.json(); })
      .catch(function () { throw new ApiError('OFFLINE', 'No connection to the server. Check your internet and try again.'); });
  }

  /** call('listUsers') → data. opts.open = true for the sign-in actions that need no token. */
  function call(action, payload, opts) {
    opts = opts || {};
    var first = opts.open ? Promise.resolve(null) : window.Auth.current();
    return first.then(function (auth) {
      if (!opts.open && !auth) throw new ApiError('AUTH_REQUIRED', 'Please sign in.');
      return post({ action: action, auth: auth, payload: payload || {} }).then(function (r) {
        if (r.ok || opts.open || r.error !== 'AUTH_EXPIRED') return r;
        // Google tokens last an hour: get a fresh one quietly and try once more.
        return window.Auth.renew().then(function (fresh) {
          return fresh ? post({ action: action, auth: fresh, payload: payload || {} }) : r;
        });
      });
    }).then(function (r) {
      if (r.ok) return r.data;
      var err = new ApiError(r.error, r.message || 'Something went wrong.');
      if (!opts.open && ['AUTH_EXPIRED', 'AUTH_REQUIRED', 'NOT_REGISTERED'].indexOf(r.error) !== -1) window.Auth.lost(err);
      throw err;
    });
  }

  window.Api = { call: call, configured: function () { return /^https:\/\/|^\/|^http:\/\/localhost/.test(cfg.API_URL || ''); } };
})();
