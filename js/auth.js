/* Sign-in state: Google ID token, or a phone + PIN session. */
(function () {
  'use strict';
  var cfg = window.OT_CONFIG || {}, KEY = 'ot.auth';
  var waiting = null, googleReady = null, listeners = { signedIn: null, lost: null };

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function save(a) {
    clear(true);
    // "This is not my phone": kept only until the tab closes.
    try { (a.shared ? sessionStorage : localStorage).setItem(KEY, JSON.stringify(a)); } catch (e) { /* private mode */ }
    memory = a;
  }
  /** keepScreens: a renewed sign-in of the same person keeps the remembered screens; signing out removes them. */
  function clear(keepScreens) {
    memory = null;
    try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    if (!keepScreens && window.Api && window.Api.store) window.Api.store.clear();
  }
  var memory = load();

  function wire(a) {
    if (!a) return null;
    return a.type === 'google' ? { type: 'google', idToken: a.idToken } : { type: 'session', token: a.token };
  }
  function claims(jwt) {
    try {
      var b = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) { return {}; }
  }

  /* ---- Google ---- */
  function loadGoogle() {
    if (!cfg.GOOGLE_CLIENT_ID) return Promise.reject(new Error('no client id'));
    if (googleReady) return googleReady;
    googleReady = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () {
        google.accounts.id.initialize({ client_id: cfg.GOOGLE_CLIENT_ID, callback: onCredential,
          auto_select: true, cancel_on_tap_outside: false, use_fedcm_for_prompt: true });
        resolve();
      };
      s.onerror = function () { googleReady = null; reject(new Error('offline')); };
      document.head.appendChild(s);
    });
    return googleReady;
  }
  function onCredential(resp) {
    var c = claims(resp.credential);
    save({ type: 'google', idToken: resp.credential, exp: c.exp || 0, email: c.email || '' });
    if (waiting) { var w = waiting; waiting = null; w(wire(memory)); }
    else if (listeners.signedIn) listeners.signedIn();
  }
  /** Asks Google for a fresh token without bothering the user. Resolves null if that is not possible. */
  function renew() {
    if (!memory || memory.type !== 'google') return Promise.resolve(null);
    return loadGoogle().then(function () {
      return new Promise(function (resolve) {
        var done = false, finish = function (v) { if (!done) { done = true; waiting = null; resolve(v); } };
        waiting = finish;
        google.accounts.id.prompt();
        setTimeout(function () { finish(null); }, 12000);
      });
    }).catch(function () { return null; });
  }

  window.Auth = {
    on: function (name, fn) { listeners[name] = fn; },
    has: function () { return !!memory; },
    isShared: function () { return !!(memory && memory.shared); },
    sessionToken: function () { return memory && memory.type === 'session' ? memory.token : null; },
    googleAvailable: function () { return !!cfg.GOOGLE_CLIENT_ID; },
    /** The auth object for the next API call, renewing an expiring Google token first. */
    current: function () {
      if (!memory) return Promise.resolve(null);
      if (memory.type === 'google' && memory.exp * 1000 < Date.now() + 60000) {
        return renew().then(function (a) { return a || wire(memory); });   // server has the final say
      }
      return Promise.resolve(wire(memory));
    },
    renew: renew,
    renderGoogleButton: function (el) {
      return loadGoogle().then(function () {
        google.accounts.id.renderButton(el, { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'signin_with',
          width: Math.min(360, el.clientWidth || 320) });
      });
    },
    startSession: function (token, shared) { save({ type: 'session', token: token, shared: !!shared }); },
    signOut: function () {
      if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
      clear();
    },
    /** The server refused our sign-in: forget it and show the sign-in screen with the reason. */
    lost: function (err) {
      if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
      clear();
      if (listeners.lost) listeners.lost(err);
    }
  };
})();
