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
      if (!opts.open && ['AUTH_EXPIRED', 'AUTH_REQUIRED', 'NOT_REGISTERED', 'NOT_CONFIGURED', 'CLIENT_MISMATCH'].indexOf(r.error) !== -1) window.Auth.lost(err);
      throw err;
    });
  }

  /* A small store of the last answers, so screens appear at once and refresh behind.
     Kept on the phone only for people on their own phone; on a borrowed phone it lives in memory and is gone when the app closes. */
  var mem = {}, PREFIX = 'ot.c.';
  function persistent() { return !(window.Auth && window.Auth.isShared()); }
  var store = {
    get: function (key) {
      if (mem[key] !== undefined) return mem[key];
      if (!persistent()) return null;
      try { var v = localStorage.getItem(PREFIX + key); return v ? (mem[key] = JSON.parse(v)) : null; } catch (e) { return null; }
    },
    set: function (key, val) {
      mem[key] = val;
      if (!persistent()) return;
      try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) { /* storage full: memory only */ }
    },
    clear: function () {
      mem = {};
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREFIX) === 0) localStorage.removeItem(k); }); } catch (e) { /* ignore */ }
    }
  };

  window.Api = { call: call, store: store, configured: function () { return /^https:\/\/|^\/|^http:\/\/localhost/.test(cfg.API_URL || ''); } };
})();
