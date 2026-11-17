/* Outreach Tracker — screens. Phase 2: sign-in, people, centers. Phase 3: meetings, attendance, participants.
   Phase 4: dashboard, follow-up, statistics, message templates, a child's history.
   Phase 5: notifications, reminders. Phase 6: jobs handed over (delegation), decision kinds, the combined report,
   one start-up request, remembered screens, the LivingSeed look.
   Phase 7: works without internet (downloaded list, saves wait and are sent later), message all children, CSV download. */
(function () {
  'use strict';
  var Api = window.Api, Auth = window.Auth;
  var root = document.getElementById('app');
  var me = null;            // answer of the `me` call: user, scope, programs, centers, permissions
  var users = [];

  var ROLE = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', COORDINATOR: 'Coordinator', LEADER: 'Center Leader', ASSISTANT: 'Assistant', VIEWER: 'Viewer' };
  var ICON = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 010 6.4M18.5 14.8c1.7.8 2.7 2.5 3 5.2"/></svg>',
    centers: '<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    meetings: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4"/></svg>',
    followup: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
    participants: '<svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5c.8-4 3.6-6 7-6s6.2 2 7 6"/></svg>',
    reports: '<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
    job_report: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M8.5 13.5l2.5 2.5 4.5-5"/></svg>',
    job_followup: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>',
    job_children: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5M18 8v6M15 11h6"/></svg>',
    msg: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
    account: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4-6.5 8-6.5s7 2.3 8 6.5"/></svg>',
    tasks: '<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/></svg>',
    reminders: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M4 4l3 2.5M20 4l-3 2.5"/></svg>',
    sync: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 01-14 5.3M4 12a8 8 0 0114-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
    templates: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/></svg>',
    excel: '<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 12l4 5M14 12l-4 5"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2"/><path d="M12 17h.01"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
    google: '<svg viewBox="0 0 24 24"><path d="M20.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h4.8a4.1 4.1 0 01-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" fill="#4285F4" stroke="none"/><path d="M12 21c2.4 0 4.5-.8 5.9-2.2l-2.9-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H4v2.3A9 9 0 0012 21z" fill="#34A853" stroke="none"/><path d="M7 13.8a5.4 5.4 0 010-3.5V8H4a9 9 0 000 8.1z" fill="#FBBC05" stroke="none"/><path d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 004 8l3 2.3c.7-2.1 2.7-3.7 5-3.7z" fill="#EA4335" stroke="none"/></svg>'
  };

  /* ---------- small helpers ---------- */
  function h(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  var toastTimer;
  function toast(msg, bad) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = ''; }, bad ? 5000 : 2800);
  }
  function busy(on) {
    var b = $('.busy');
    if (on && !b) { b = document.createElement('div'); b.className = 'busy'; b.innerHTML = '<div class="spinner"></div>'; document.body.appendChild(b); }
    if (!on && b) b.remove();
  }
  function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join(''); }
  function centerName(id) { var c = me.centers.filter(function (x) { return x.center_id === id; })[0]; return c ? c.name : ''; }
  function programName(id) { var p = me.programs.filter(function (x) { return x.program_id === id; })[0]; return p ? p.name : ''; }
  function centerLabel(c) { return me.programs.length > 1 ? programName(c.program_id) + ' — ' + c.name : c.name; }
  function waNumber(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) return d.slice(2);
    if (d.charAt(0) === '0') return me.country_code + d.slice(1);
    return d.length <= 9 ? me.country_code + d : d;
  }

  /** Bottom sheet with a form. onSubmit(values, dialog) returns a promise; errors show inside the sheet. */
  function sheet(title, bodyHtml, submitLabel, onSubmit) {
    var d = document.createElement('dialog');
    d.innerHTML = '<form method="dialog" novalidate><h2>' + h(title) + '</h2>' + bodyHtml + '<div class="error" role="alert"></div>' +
      '<div class="actions"><button type="button" class="btn quiet" data-close>' + (onSubmit ? 'Cancel' : 'Close') + '</button>' +
      (onSubmit ? '<button type="submit" class="btn">' + h(submitLabel) + '</button>' : '') + '</div></form>';
    document.body.appendChild(d);
    var form = $('form', d), err = $('.error', d);
    $('[data-close]', d).onclick = function () { d.close(); };
    d.addEventListener('close', function () { d.remove(); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!onSubmit) { d.close(); return; }
      var btn = $('button[type=submit]', d); btn.disabled = true; err.textContent = '';
      Promise.resolve().then(function () { return onSubmit(form, d); })
        .then(function (keepOpen) { if (!keepOpen) d.close(); })
        .catch(function (e) { err.textContent = e.message || 'Something went wrong.'; })
        .then(function () { btn.disabled = false; });
    });
    d.showModal();
    return d;
  }

  /* ---------- sign-in ---------- */
  var HOW_KEY = 'ot.how';   // which way this phone signed in last time (google | phone); nothing personal
  function showLogin(message) {
    me = null;
    var t = document.getElementById('toast'); if (t) t.className = '';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);   // next sign-in opens on Home
    var last = ''; try { last = localStorage.getItem(HOW_KEY) || ''; } catch (e) { /* private mode */ }
    root.innerHTML =
      '<div class="login"><div class="login-head"><img src="img/logo-256.png" alt="LivingSeed" width="120" height="120"><h1>Outreach Tracker</h1><p id="login-sub">Sign in to continue</p></div>' +
      '<div class="login-body"><div class="error" id="login-msg" role="alert">' + h(message || '') + '</div><div id="login-step"></div><div id="install-box"></div></div></div>';
    var step = !Auth.googleAvailable() ? 'phone' : last === 'google' ? 'google' : last === 'phone' ? 'phone' : 'choose';
    loginStep(step);
    drawInstallBox();
  }
  function loginStep(step) {
    var box = $('#login-step'); if (!box) return;
    var back = Auth.googleAvailable() ? '<button type="button" class="linkbtn back" id="how-back">‹ Choose another way to sign in</button>' : '';
    if (step === 'choose') {
      $('#login-sub').textContent = 'Sign in to continue';
      box.innerHTML = '<h2>How do you sign in?</h2><p class="small muted">Your coordinator chose one of these when he added you.</p>' +
        '<div class="choices">' +
          '<button type="button" class="choice" id="how-google"><span class="ci">' + ICON.google + '</span><span class="grow"><strong>With my Google email</strong><br><span class="small muted">Gmail or another Google account</span></span><span aria-hidden="true">›</span></button>' +
          '<button type="button" class="choice" id="how-phone"><span class="ci">' + ICON.phone + '</span><span class="grow"><strong>With my phone number</strong><br><span class="small muted">A 6-digit PIN, no email needed</span></span><span aria-hidden="true">›</span></button>' +
        '</div>';
      $('#how-google').onclick = function () { loginStep('google'); };
      $('#how-phone').onclick = function () { loginStep('phone'); };
      return;
    }
    if (step === 'google') {
      $('#login-sub').textContent = 'Sign in with Google';
      box.innerHTML = back + '<h2>Sign in with your Google email</h2>' +
        '<ol class="steps"><li>Tap the button below.</li><li>Choose the Google account (email) your coordinator added.</li>' +
          '<li>The first time, Google asks to share your name and email with Outreach Tracker. Tap <strong>Continue</strong>.</li></ol>' +
        '<div id="gbtn"></div>' +
        '<p class="small muted center" style="margin-top:12px">"Access not granted"? Your email is not added yet, or it is a different one. Ask your coordinator.</p>';
      var b = $('#how-back'); if (b) b.onclick = function () { loginStep('choose'); };
      Auth.renderGoogleButton($('#gbtn')).catch(function () {
        $('#gbtn').innerHTML = '<p class="small muted center">Google Sign-In could not load. Check your internet.</p>';
      });
      try { localStorage.setItem(HOW_KEY, 'google'); } catch (e) { /* ignore */ }
      return;
    }
    // Phone number + PIN, with a clear first-time path: setup code first, then the PIN.
    $('#login-sub').textContent = 'Sign in with your phone number';
    box.innerHTML = back + '<form id="pin-form" novalidate>' +
      '<h2 id="pin-title">Sign in with your phone number</h2>' +
      '<label class="field">Your phone number<span class="hint">The number your coordinator added</span><input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="0770 000 000" required></label>' +
      '<div id="ph-ask"><p class="q">Have you chosen your PIN before?</p><div class="stack">' +
        '<button type="button" class="btn block" id="pin-have">Yes, I have my PIN</button>' +
        '<button type="button" class="btn ghost block" id="pin-first">No, this is my first time</button></div>' +
        '<p class="small muted center" style="margin-top:8px">Also choose "first time" if your coordinator sent you a new setup code.</p></div>' +
      '<div id="ph-code" hidden><p class="stepno">Step 1 of 2</p><h3>Enter your setup code</h3>' +
        '<label class="field">Setup code<span class="hint">6 digits your coordinator sent you by WhatsApp or SMS. It works once, for 7 days.</span>' +
        '<input type="text" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label>' +
        '<button type="button" class="btn block" id="code-next">Next</button></div>' +
      '<div id="ph-pin" hidden><p class="stepno" id="pin-stepno"></p>' +
        '<label class="field"><span id="pin-label">Your PIN</span><span class="hint" id="pin-hint">Your 6-digit PIN</span><input type="password" name="pin" inputmode="numeric" maxlength="6" autocomplete="off"></label>' +
        '<div id="confirm-field" hidden><label class="field">Type the same PIN again<input type="password" name="pin2" inputmode="numeric" maxlength="6" autocomplete="off"></label></div>' +
        '<label class="check"><input type="checkbox" name="shared"><span><strong>This is not my phone</strong><br><span class="small muted">You will be signed out when the app closes, and nothing is kept on this phone.</span></span></label>' +
        '<button class="btn block" type="submit" id="pin-go" style="margin-top:8px">Sign in</button>' +
        '<p class="center"><button type="button" class="linkbtn" id="pin-other"></button></p></div>' +
      '<div class="error" id="pin-err" role="alert"></div></form>';
    var b2 = $('#how-back'); if (b2) b2.onclick = function () { loginStep('choose'); };
    try { localStorage.setItem(HOW_KEY, 'phone'); } catch (e) { /* ignore */ }
    var form = $('#pin-form'), f = form.elements, err = $('#pin-err'), mode = '';
    function phoneOk() {
      if (f.phone.value.replace(/\D/g, '').length < 7) { err.textContent = 'Enter your phone number first.'; f.phone.focus(); return false; }
      return true;
    }
    function show(m) {
      mode = m; err.textContent = '';
      $('#ph-ask').hidden = m !== 'ask'; $('#ph-code').hidden = m !== 'code'; $('#ph-pin').hidden = m !== 'pin' && m !== 'choose';
      $('#confirm-field').hidden = m !== 'choose';
      $('#pin-title').textContent = m === 'ask' || m === 'pin' ? 'Sign in with your phone number' : 'First time: set up your PIN';
      $('#pin-stepno').textContent = m === 'choose' ? 'Step 2 of 2' : '';
      $('#pin-stepno').hidden = m !== 'choose';
      $('#pin-label').textContent = m === 'choose' ? 'Choose your PIN' : 'Your PIN';
      $('#pin-hint').textContent = m === 'choose' ? '6 digits you will remember. Not 123456 or 111111. Do not tell anyone.' : 'The 6 digits you chose';
      $('#pin-go').textContent = m === 'choose' ? 'Save my PIN and sign in' : 'Sign in';
      $('#pin-other').textContent = m === 'choose' ? '‹ Change the setup code' : 'Forgot your PIN? Ask your coordinator for a new code, then tap here';
      if (m === 'code') f.code.focus(); else if (m === 'pin' || m === 'choose') f.pin.focus();
    }
    $('#pin-have').onclick = function () { if (phoneOk()) show('pin'); };
    $('#pin-first').onclick = function () { if (phoneOk()) show('code'); };
    $('#code-next').onclick = function () {
      if (!/^\d{6}$/.test(f.code.value.trim())) { err.textContent = 'The setup code is 6 digits.'; return; }
      show('choose');
    };
    $('#pin-other').onclick = function () { f.pin.value = ''; f.pin2.value = ''; show('code'); };
    f.code.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('#code-next').click(); } });
    show('ask');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (mode === 'ask') { $('#pin-have').click(); return; }
      if (mode === 'code') { $('#code-next').click(); return; }
      err.textContent = '';
      var setup = mode === 'choose';
      var payload = { phone: f.phone.value.trim(), pin: f.pin.value.trim(), shared: f.shared.checked };
      if (!phoneOk()) return;
      if (!/^\d{6}$/.test(payload.pin)) { err.textContent = 'The PIN is 6 digits.'; return; }
      if (setup) {
        payload.code = f.code.value.trim();
        if (f.pin2.value.trim() !== payload.pin) { err.textContent = 'The two PINs are not the same. Type them again.'; f.pin2.value = ''; return; }
      }
      var btn = $('#pin-go'); btn.disabled = true;
      Api.call(setup ? 'pinSetup' : 'pinLogin', payload, { open: true }).then(function (s) {
        Auth.startSession(s.token, s.shared);
        return start();
      }).catch(function (e) {
        btn.disabled = false;
        if (setup && e.code === 'BAD_CODE') { show('code'); f.code.select(); }
        err.textContent = e.message;
      });
    });
  }
  /** Install the app: the phone's own install prompt when it offers one; on iPhone, the Safari steps. */
  function installHtml(compact) {
    if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) return '';
    if (window.navigator.standalone) return '';
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!window.__installPrompt && !ios) return '';
    return '<div class="install' + (compact ? ' compact' : '') + '"><img src="icons/icon-192.png" alt="" width="44" height="44"><div class="grow"><strong>Install the app</strong><br>' +
      '<span class="small muted">' + (window.__installPrompt ? 'Opens from your home screen and works with no signal.' : 'In Safari tap Share, then "Add to Home Screen".') + '</span></div>' +
      (window.__installPrompt ? '<button type="button" class="btn mini" data-install>Install</button>' : '') + '</div>';
  }
  function wireInstall(el) {
    var b = $('[data-install]', el);
    if (b) b.onclick = function () {
      var p = window.__installPrompt; if (!p) return; window.__installPrompt = null;
      p.prompt(); p.userChoice.then(function () { drawInstallBox(); if (me) render(); });
    };
  }
  function drawInstallBox() { var box = $('#install-box'); if (box) { box.innerHTML = installHtml(); wireInstall(box); } }
  window.addEventListener('beforeinstallprompt', function () { setTimeout(function () { drawInstallBox(); if (me && route().page === 'more') render(); }, 0); });

  function showSetupNeeded() {
    root.innerHTML = '<div class="login"><div class="login-head"><img src="img/logo-256.png" alt="LivingSeed" width="112" height="112"><h1>Outreach Tracker</h1><p>Almost ready</p></div>' +
      '<div class="login-body"><div class="card"><h2>The app is not connected yet</h2>' +
      '<p>Open <code>config.js</code> and paste your Apps Script web app URL into <code>API_URL</code>. The deployment guide has the steps.</p></div></div></div>';
  }

  /* ---------- shell ---------- */
  /** Jobs handed to me (delegation tasks), by kind. */
  function jobsOf(kind) { return (me.jobs || []).filter(function (j) { return j.kind === kind; }); }
  /** Centers where I may do this job: my own (if my role records) plus those handed to me. */
  function jobCenters(kind) {
    var out = me.can.record ? me.centers.filter(function (c) { return c.status === 'active'; }).slice() : [];
    jobsOf(kind).forEach(function (j) {
      if (!out.some(function (c) { return c.center_id === j.center_id; })) out.push({ center_id: j.center_id, name: j.center, program_id: j.program_id, status: 'active', handed: true });
    });
    return out;
  }
  function tabsFor() {
    var t = [['home', 'Home'], ['meetings', 'Meetings']];
    if (me.can.record || jobsOf('followup').length) t.push(['followup', 'Follow-up']);
    if (me.can.record || jobsOf('children').length) t.push(['participants', 'Children']);
    if (!me.can.record && me.can.reports) t.push(['reports', 'Reports']);
    if (t.length < 5 && !me.can.record) t.push(['stats', 'Statistics']);
    t.push(['more', 'More']);
    return t.slice(0, 6);
  }
  /** Pages that exist without a tab of their own, and the tab that lights up for them. */
  /** On a laptop the sidebar lists every menu, so More is only needed for the account and settings. */
  function sideItems(tabs) {
    var has = {}; tabs.forEach(function (t) { has[t[0]] = true; });
    return [
      ['tasks', 'Tasks', true],
      ['reports', 'Combined report', me.can.reports],
      ['stats', 'Statistics', true],
      ['reminders', 'Reminders', me.can.remind],
      ['sync', 'Sync and download file', true],
      ['people', 'Team', me.can.manage_users || me.user.role === 'ASSISTANT'],
      ['templates', 'Message templates', me.can.record || jobsOf('followup').length > 0],
      ['centers', 'Centers', me.can.manage_centers]
    ].filter(function (x) { return x[2] && !has[x[0]]; });
  }
  var EXTRA = { centers: 'more', take: 'meetings', people: 'more', stats: 'more', templates: 'more', tasks: 'more', reminders: 'more', notifications: 'home', reports: 'more', sync: 'more' };
  var VIEWS = {};
  var leaveGuard = null;          // set by a screen with unsaved changes; returns true if it is fine to leave
  var currentHash = '';
  function route() {
    var parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
    var tabs = tabsFor(), page = parts[0];
    var allowed = tabs.some(function (t) { return t[0] === page; }) ||
      (page === 'centers' && me.can.manage_centers) || (page === 'take' && (me.can.record || jobsOf('report').length)) ||
      (page === 'people' && (me.can.manage_users || me.user.role === 'ASSISTANT')) ||
      page === 'stats' || (page === 'reports' && me.can.reports) || page === 'sync' || (page === 'templates' && (me.can.record || jobsOf('followup').length)) || page === 'tasks' || page === 'notifications' ||
      (page === 'reminders' && me.can.remind);
    if (!allowed) { page = 'home'; parts = ['home']; }
    var tab = tabs.some(function (t) { return t[0] === page; }) ? page : (EXTRA[page] || page);
    return { page: page, args: parts.slice(1), tab: tab, tabs: tabs };
  }
  function render() {
    var r = route();
    leaveGuard = null;
    currentHash = location.hash;
    root.innerHTML =
      '<header class="top"><a class="brand" href="#/home" aria-label="Outreach Tracker, home"><img src="img/logo-96.png" alt="" width="34" height="34"><strong>Outreach Tracker</strong></a>' +
      '<a class="sync-pill" href="#/sync" hidden></a><span class="chip">' + h(ROLE[me.user.role]) + '</span>' +
      '<button type="button" class="help-btn" aria-label="Help for this screen">' + ICON.help + '</button>' +
      '<a class="bell" href="#/notifications" aria-label="Notifications' + (me.unread ? ', ' + me.unread + ' new' : '') + '">' + ICON.bell +
      (me.unread ? '<span class="dotn">' + (me.unread > 9 ? '9+' : me.unread) + '</span>' : '') + '</a></header>' +
      '<main id="view"></main>' +
      '<nav class="tabs" aria-label="Main">' + r.tabs.filter(function (t) { return t[0] !== 'more'; }).map(function (t) {
        return '<a class="tab" href="#/' + t[0] + '"' + (t[0] === r.tab ? ' aria-current="page"' : '') + '>' + ICON[t[0]] + '<span>' + t[1] + '</span></a>';
      }).join('') +
      sideItems(r.tabs).map(function (t, i) {
        return (i === 0 ? '<span class="side-sep side-only" aria-hidden="true"></span>' : '') +
          '<a class="tab side-only' + (r.tab === 'more' && r.page === t[0] ? ' cur-side' : '') + '" href="#/' + t[0] + '">' + ICON[t[0]] + '<span>' + t[1] + '</span></a>';
      }).join('') +
      '<a class="tab tab-more' + (r.tab === 'more' ? ' cur-phone' : '') + (r.page === 'more' ? ' cur-side' : '') + '" href="#/more">' +
        '<span class="phone-only">' + ICON.more + '</span><span class="side-only">' + ICON.account + '</span>' +
        '<span class="phone-only">More</span><span class="side-only">Account</span></a>' +
      '</nav>';
    document.title = 'Outreach Tracker';
    syncPill();
    $('.help-btn').onclick = function () { showHelp(r.page); };
    VIEWS[r.page]($('#view'), r.args);
    window.scrollTo(0, 0);
    maybeTour(r.page);
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function fail(e) { busy(false); if (me) toast(e.message, true); }

  /* ---------- remembered screens ---------- */
  function skeleton(n) { var x = '<div class="skel"><i class="s"></i>'; for (var i = 0; i < (n || 4); i++) x += '<i></i>'; return x + '</div>'; }
  function ckey(name) { return (me ? me.user.user_id : '') + '|' + name; }
  /**
   * Draws a screen from its last remembered answer at once (if any), then from the server's fresh answer
   * when it differs. draw(data) must rebuild the screen completely.
   */
  function paint(el, name, fetch, draw) {
    var key = ckey(name), old = Api.store.get(key), seen = old ? JSON.stringify(old) : '';
    if (old) { try { draw(old, true); } catch (e) { old = null; } }
    if (!old) el.innerHTML = skeleton();
    return fetch().then(function (fresh) {
      Api.store.set(key, fresh);
      if (!el.isConnected || JSON.stringify(fresh) === seen) return;
      draw(fresh, false);
    }).catch(function (e) {
      if (old) { if (e.code !== 'OFFLINE') toast(e.message, true); return; }
      el.innerHTML = '<div class="card"><p class="error">' + h(e.message) + '</p><button class="btn ghost block" type="button" data-retry>Try again</button></div>';
      $('[data-retry]', el).onclick = function () { paint(el, name, fetch, draw); };
    });
  }
  /** One request for who I am and everything Home shows. */
  var homeData = null;
  function boot() {
    return Api.call('boot', { app_url: location.origin + location.pathname }).then(function (d) {
      me = d.me; homeData = d.home; Api.store.set('boot', d); Sync.setUser(me.user.user_id);
      setTimeout(function () { Sync.flush().then(function () { downloadPack(false); }); }, 300);
      return d;
    });
  }

  /* ---------- working without internet ---------- */
  function onOwnPhone() { return !Auth.isShared(); }
  function canWorkOffline() { return me && (me.can.record || (me.jobs || []).length); }
  /**
   * Downloads the children of my centers, the open meetings with their reports so far and the follow-up list,
   * so attendance and follow-up work with no signal. Only on the person's own phone; at most every 10 minutes unless asked.
   */
  var packing = null;
  function downloadPack(force) {
    if (!me || !onOwnPhone() || !canWorkOffline() || !navigator.onLine) return Promise.resolve(null);
    var old = Api.store.get(ckey('pack'));
    if (!force && old && Date.now() - new Date(old.at).getTime() < 600000) return Promise.resolve(old);
    if (packing) return packing;
    packing = Api.call('offlinePack').then(function (pk) {
      Api.store.set(ckey('pack'), pk);
      Object.keys(pk.participants).forEach(function (cid) { Api.store.set(ckey('participants|' + cid), { participants: pk.participants[cid] }); });
      if (pk.meetings && pk.meetings.length) Api.store.set(ckey('meetings'), { meetings: pk.meetings });
      if (pk.followups) {
        Api.store.set(ckey('followups|'), [pk.followups, pk.templates]);
        jobCenters('followup').forEach(function (c) {
          Api.store.set(ckey('followups|' + c.center_id), [{ items: pk.followups.items.filter(function (x) { return x.center_id === c.center_id; }),
            birthdays: pk.followups.birthdays.filter(function (x) { return x.center_id === c.center_id; }), inactivity_meetings: pk.followups.inactivity_meetings }, pk.templates]);
        });
        if (pk.templates) templatesCache = pk.templates;
      }
      packing = null; syncPill(); return pk;
    }).catch(function () { packing = null; return null; });
    return packing;
  }
  function syncPill() {
    var pill = $('.sync-pill'); if (!pill) return;
    var waiting = Sync.waiting(), failed = Sync.failed(), off = !navigator.onLine;
    pill.hidden = !(off || waiting || failed);
    pill.className = 'sync-pill' + (failed ? ' bad' : off ? ' off' : '');
    pill.textContent = failed ? failed + ' not sent' : waiting ? (off ? 'Offline · ' : '') + waiting + ' to send' : 'Offline';
  }
  Sync.on(function (info) {
    syncPill();
    if (info && info.sent) {
      toast(info.sent === 1 ? '1 save sent' : info.sent + ' saves sent');
      boot().then(function () { downloadPack(true); if (route().page === 'home' || route().page === 'sync') render(); }).catch(function () {});
    }
    if (route && me && route().page === 'sync') VIEWS.sync($('#view'));
  });
  window.addEventListener('online', syncPill);
  window.addEventListener('offline', syncPill);

  /** The attendance screen built from the downloaded list, when the server cannot be reached. */
  function offlineSession(meetingId, centerId) {
    var pk = Api.store.get(ckey('pack')), x = pk && pk.sessions[meetingId + '|' + centerId];
    if (!x) return null;
    var marked = {}; (x.marked || []).forEach(function (id) { marked[id] = true; });
    var d = JSON.parse(JSON.stringify(x));
    d.participants = (pk.participants[centerId] || []).filter(function (r) { return marked[r.participant_id] || r.status === 'active'; })
      .map(function (r) { var o = JSON.parse(JSON.stringify(r)); o.joined_after = !marked[r.participant_id] && !!r.join_date && r.join_date > x.meeting.date; return o; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
    d.offline = true;
    return d;
  }
  /** A save of this report still waiting on the phone: show it on top of what the server last knew. */
  function withPending(d) {
    var q = Sync.find('session|' + d.meeting.meeting_id + '|' + d.center.center_id);
    if (!q) return d;
    var p = q.payload;
    d = JSON.parse(JSON.stringify(d));
    d.pending = p;
    d.attendance = p.attendance.map(function (a) { return { participant_id: a.participant_id, present: a.present, first_timer: false }; });
    d.decisions = p.decisions.filter(function (x) { return String(x.participant_id).indexOf('new') !== 0; });
    d.custom_decisions = p.custom_decisions;
    d.session = Object.assign({}, d.session || {}, { facilitators: p.facilitators, start_time: p.start_time, punctuality: p.punctuality,
      observations: p.observations, recommendations: p.recommendations, status: p.submit ? 'submitted' : ((d.session || {}).status || 'draft') });
    return d;
  }
  function refreshMe() { return boot(); }

  /* ---------- home ---------- */
  function tile(n, label, sub) {
    return '<div class="tile"><span class="n">' + h(n) + '</span><span class="l">' + h(label) + '</span>' + (sub ? '<span class="s">' + h(sub) + '</span>' : '') + '</div>';
  }
  var JOB_VERB = { report: 'Take attendance and submit', followup: 'Open the follow-up list', children: 'Open the children list' };
  function jobCard(j) {
    return '<div class="card job' + (j.overdue ? ' late' : '') + '"><span class="ic">' + ICON['job_' + j.kind] + '</span><div class="grow">' +
      '<h2>' + h(j.title) + '</h2><p class="small muted">From ' + h(j.from) + (j.due_date ? ', by ' + h(fmtDate(j.due_date)) : '') + '</p>' +
      (j.overdue ? '<span class="badge bad">Overdue</span>' : '') + (j.note ? '<p class="small" style="margin-top:6px">' + h(j.note) + '</p>' : '') +
      '<button type="button" class="btn block" data-job="' + h(j.task_id) + '">' + JOB_VERB[j.kind] + '</button></div></div>';
  }
  function openJob(j) {
    if (j.kind === 'report') return go('#/take/' + j.meeting_id + '/' + j.center_id);
    if (j.kind === 'followup') { fState.center = j.center_id; return go('#/followup'); }
    pState.center = j.center_id; pState.show = 'active'; go('#/participants');
  }
  function wireJobs(el) {
    $all('[data-job]', el).forEach(function (b) {
      b.onclick = function () { openJob((me.jobs || []).filter(function (j) { return j.task_id === b.dataset.job; })[0]); };
    });
  }
  /** A small statistic card; tappable when it leads somewhere. */
  function statCard(n, label, sub, href, tone) {
    var tag = href ? 'a' : 'div';
    return '<' + tag + ' class="stat' + (tone ? ' ' + tone : '') + '"' + (href ? ' href="' + href + '"' : '') + '><b>' + h(n) + '</b><span class="l">' + h(label) + '</span>' +
      (sub ? '<span class="s">' + h(sub) + '</span>' : '') + '</' + tag + '>';
  }
  function homeCards(H, today) {
    var tm = H.stats && H.stats.this_month, cards = [];
    if (tm) {
      var diff = tm.present - (tm.last_month_present || 0);
      cards.push(statCard(tm.present, 'Present this month', tm.last_month_present === undefined ? '' :
        diff > 0 ? diff + ' more than last month' : diff < 0 ? -diff + ' fewer than last month' : 'Same as last month', '#/stats', diff < 0 ? 'down' : diff > 0 ? 'up' : ''));
      cards.push(statCard(tm.first_timers, 'First-timers', 'This month', '#/stats'));
      cards.push(statCard(tm.decisions, 'Decisions', 'This month', '#/stats'));
      cards.push(statCard(tm.absentees, 'Absent', 'At least once this month', me.can.record || jobsOf('followup').length ? '#/followup' : '', tm.absentees ? 'warn' : ''));
    }
    if (H.stats && H.stats.active_children !== undefined) cards.push(statCard(H.stats.active_children, 'Active children', 'In ' + (me.centers.length === 1 ? 'your center' : plural(me.centers.filter(function (c) { return c.status === 'active'; }).length, 'center')), me.can.record ? '#/participants' : '#/stats'));
    if (H.stats && H.stats.retention) cards.push(statCard(H.stats.retention.pct + '%', 'Came back', H.stats.retention.returned + ' of ' + H.stats.retention.first_timers + ' first-timers, 6 months', '#/stats'));
    if (H.followups) cards.push(statCard(H.followups.count, 'Need a follow-up', H.followups.birthdays ? plural(H.followups.birthdays, 'birthday') + ' coming' : 'Calls and visits to make', '#/followup', H.followups.count ? 'warn' : ''));
    var m = (H.meetings || []).filter(function (x) { return x.date <= today; })[0];
    if (m && m.centers.length > 1) {
      var done = m.centers.filter(function (c) { return c.state === 'submitted'; }).length;
      cards.push(statCard(done + ' of ' + m.centers.length, 'Centers reported', fmtDate(m.date), '#/meetings', done < m.centers.length ? 'warn' : ''));
    }
    return cards.length ? '<div class="stats-cards">' + cards.join('') + '</div>' : '';
  }
  function viewHome(el) {
    var first = me.user.name.split(' ')[0], H = homeData || {}, today = me.today || new Date().toISOString().slice(0, 10);
    var tm = H.stats && H.stats.this_month;
    var monthName = new Date(today.slice(0, 7) + '-15T12:00:00Z').toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
    var html =
      '<section class="band"><h1>Hello, ' + h(first) + '</h1><p class="sub">' + h(ROLE[me.user.role]) + (me.scope.all ? ', all programs' : '') + '</p>' +
      (tm ? '<p class="month">' + h(monthName) + ' so far, ' + plural(tm.reports, 'report') + '</p>' : '') + '</section>' +
      homeCards(H, today);
    if (Auth.isShared()) html += '<div class="card alert-card"><span class="grow"><strong>Borrowed phone</strong><br><span class="small">You will be signed out when you close the app. Tap More, then Sign out, when you finish.</span></span></div>';
    if ((me.jobs || []).length) html += '<h3>Handed to you</h3>' + me.jobs.map(jobCard).join('');
    if (!H.stats && H.followups && (H.followups.count || H.followups.birthdays)) {
      var n = H.followups.count, b = H.followups.birthdays;
      html += '<a class="card alert-card" href="#/followup"><span class="grow"><strong>' + (n ? n + (n === 1 ? ' child needs' : ' children need') + ' a follow-up' : 'Follow-up') + '</strong>' +
        (b ? '<br><span class="small">' + b + (b === 1 ? ' birthday' : ' birthdays') + ' coming up</span>' : '') + '</span><span aria-hidden="true">›</span></a>';
    }
    var others = (H.tasks || []).filter(function (t) { return !t.kind; });
    if (others.length) html += '<div class="head"><h3>Other tasks</h3><a class="small" href="#/tasks">All tasks</a></div><div class="list">' + others.slice(0, 4).map(taskRow).join('') + '</div>';
    html += '<div id="home-meeting"></div>';
    var last = H.stats ? H.stats.trend : [];
    if (last && last.length) html += '<section class="card"><h2>Attendance, last ' + last.length + (last.length === 1 ? ' meeting' : ' meetings') + '</h2>' +
      barChart({ id: 'home-trend', labels: last.map(function (b) { return shortDate(b.date); }), full: last.map(function (b) { return fmtDate(b.date); }),
        series: [{ name: 'Returning', color: 'var(--s1)', values: last.map(function (b) { return b.returning; }) },
                 { name: 'First-timers', color: 'var(--s2)', values: last.map(function (b) { return b.first_timers; }) }] }) +
      '<a class="btn ghost block" href="#/stats" style="margin-top:12px">All statistics</a></section>';
    el.innerHTML = html;
    wireJobs(el); wireTaskRows(el); wireCharts(el);
    var box = $('#home-meeting', el), meetings = H.meetings || [];
    if (!me.programs.length) { box.innerHTML = (me.jobs || []).length ? '' : '<div class="card"><p class="muted">No program or center is assigned to you yet. Ask your coordinator.</p></div>'; return; }
    var open = meetings.filter(function (m) { return m.status !== 'closed'; });
    var m = open.filter(function (x) { return x.date <= today; })[0] || open[open.length - 1] || meetings[0];
    if (!m) {
      box.innerHTML = '<div class="card"><h2>No meetings yet</h2><p class="muted">' + (me.can.manage_meetings ? 'Create the next meeting so the centers can report on it.' : 'Your coordinator has not created a meeting yet.') + '</p>' +
        (me.can.manage_meetings ? '<a class="btn block" href="#/meetings">Go to Meetings</a>' : '') + '</div>';
      return;
    }
    var missing = m.centers.filter(function (c) { return c.state !== 'submitted'; });
    box.innerHTML = '<h3>' + (m.date > today ? 'Next meeting' : 'Latest meeting') + '</h3>' + meetingCard(m, true) +
      (m.centers.length > 1 ? '<p class="small muted" style="margin-top:8px">' + (missing.length ? missing.length + ' of ' + m.centers.length + ' centers have not submitted yet: ' +
        missing.map(function (c) { return h(c.name); }).join(', ') + '.' : 'Every center has submitted.') + '</p>' : '') +
      '<div class="stack" style="margin-top:10px">' + (missing.length && me.can.remind && m.date <= today ? '<a class="btn ghost block" href="#/reminders/' + h(m.meeting_id) + '">Remind the centers that have not submitted</a>' : '') +
      (me.can.reports && m.date <= today && m.centers.some(function (c) { return c.state === 'submitted'; }) ? '<a class="btn quiet block" href="#/reports/' + h(m.meeting_id) + '">Combined report</a>' : '') + '</div>';
    wireMeetingCards(box, meetings);
  }
  /** Home appears at once from what was remembered, then refreshes. */
  function homeFresh() {
    return boot().then(function () {
      if (route().page === 'home' && !document.querySelector('dialog[open]')) render();
    }).catch(function (e) { if (e.code === 'OFFLINE') toast('No connection. Showing what was saved on this phone.', true); });
  }

  /* ---------- people ---------- */
  function viewPeople(el) {
    paint(el, 'users', function () { return Api.call('listUsers'); }, function (list) {
      users = list.sort(function (a, b) { return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name); });
      el.innerHTML = '<a href="#/more" class="small">‹ More</a><div class="head"><h1>Team</h1></div>' +
        '<p class="muted small">' + (me.can.manage_users ? 'Tap a name to see the person. You can change only the people you manage; others at your level are shown read-only.' : 'Your center\'s team, and others at your level. Tap a name to call or WhatsApp.') + '</p>' +
        '<div class="list">' + (users.length ? users.map(userRow).join('') : '<div class="empty">Nobody here yet.</div>') + '</div>' +
        (me.can.manage_users ? '<button class="btn fab" id="add-user">+ Add person</button>' : '');
      $all('.row[data-id]', el).forEach(function (r) {
        r.onclick = function () { userActions(users.filter(function (u) { return u.user_id === r.dataset.id; })[0]); };
      });
      if (me.can.manage_users) $('#add-user').onclick = function () { userForm(null); };
    });
  }
  var ROLE_ORDER = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'LEADER', 'ASSISTANT', 'VIEWER'];
  function userScopeText(u) {
    var parts = u.center_ids.map(function (c, i) { return centerName(c) || (u.center_names || [])[i] || ''; }).filter(String);
    if (u.role === 'COORDINATOR' || u.role === 'VIEWER') parts = u.program_ids.map(function (p, i) {
      var n = programName(p) || (u.program_names || [])[i]; return n ? 'All of ' + n : '';
    }).filter(String).concat(parts);
    if (u.role === 'SUPER_ADMIN') parts = ['Everything'];
    if (u.role === 'ADMIN') parts = ['All programs'];
    return parts.join(', ');
  }
  function userRow(u) {
    var isMe = u.user_id === me.user.user_id, tappable = true;   // peers open read-only
    return '<' + (tappable ? 'button type="button"' : 'div') + ' class="row' + (tappable ? '' : ' static') + '"' + (tappable ? ' data-id="' + h(u.user_id) + '"' : '') + '>' +
      '<span class="avatar">' + h(initials(u.name)) + '</span><span class="grow"><span class="name">' + h(u.name) + (isMe ? ' (you)' : '') + '</span>' +
      '<span class="sub"><br>' + h(ROLE[u.role]) + (userScopeText(u) ? ' · ' + h(userScopeText(u)) : '') + '</span><br>' +
      (u.status !== 'active' ? '<span class="badge off">Access off</span>' : '') +
      (u.pin_locked ? '<span class="badge bad">PIN locked</span>' : '') +
      (u.allow_pin && !u.pin_set ? '<span class="badge warn">' + (u.code_pending ? 'Waiting for first sign-in' : 'Needs a setup code') + '</span>' : '') +
      (u.allow_pin && u.pin_set && !u.pin_locked ? '<span class="badge">Phone + PIN</span>' : '') +
      '</span></' + (tappable ? 'button' : 'div') + '>';
  }

  function userActions(u) {
    if (u.user_id === me.user.user_id) { myDetailsForm(); return; }
    if (!u.can_manage) {
      var ph = waNumber(u.phone);
      sheet(u.name, '<p class="muted">' + h(ROLE[u.role]) + (userScopeText(u) ? ' · ' + h(userScopeText(u)) : '') + '</p>' +
        (u.phone ? '<p class="small muted">' + h(u.phone) + '</p><div class="actions" style="margin-top:12px"><a class="btn quiet" href="tel:' + h(u.phone.replace(/[^\d+]/g, '')) + '">Call</a>' +
          (ph ? '<a class="btn quiet" href="https://wa.me/' + ph + '" target="_blank" rel="noopener">WhatsApp</a>' : '') + '</div>' : '') +
        '<p class="small muted" style="margin-top:14px">' + (u.role === me.user.role ? 'Same level as you: you can see, not change, this person. ' : '') +
        'Only ' + (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'a Super Admin' : u.role === 'COORDINATOR' ? 'an Admin or Super Admin' : 'their manager') + ' can change these details.</p>');
      return;
    }
    var d = sheet(u.name, '<p class="muted">' + h(ROLE[u.role]) + (userScopeText(u) ? ' · ' + h(userScopeText(u)) : '') + '</p>' +
      (u.phone ? '<p class="small muted">' + h(u.phone) + '</p>' : '') + (u.email ? '<p class="small muted">' + h(u.email) + '</p>' : '') +
      '<div class="stack" style="margin-top:16px">' +
      '<button type="button" class="btn quiet block" data-a="edit">Edit details</button>' +
      (me.pin_login && u.phone ? '<button type="button" class="btn quiet block" data-a="code">' + (u.pin_set || u.pin_locked ? 'Reset PIN (new setup code)' : 'New setup code') + '</button>' : '') +
      (u.status === 'active' ? '<button type="button" class="btn danger block" data-a="off">Switch access off</button>'
        : '<button type="button" class="btn ghost block" data-a="on">Switch access on</button>') + '</div>');
    $all('[data-a]', d).forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a; d.close();
        if (a === 'edit') return userForm(u);
        if (a === 'code') {
          if ((u.pin_set) && !confirm('Reset the PIN for ' + u.name + '? Their current PIN stops working and they are signed out.')) return;
          busy(true);
          return Api.call('issueSetupCode', { user_id: u.user_id }).then(function (r) { busy(false); showCode(u, r.setup_code, r.setup_code_days); render(); }).catch(fail);
        }
        if (a === 'off' && !confirm('Switch off access for ' + u.name + '? They are blocked immediately.')) return;
        busy(true);
        Api.call('setUserStatus', { user_id: u.user_id, status: a === 'on' ? 'active' : 'inactive' })
          .then(function () { busy(false); toast(a === 'on' ? 'Access switched on' : 'Access switched off'); render(); }).catch(fail);
      };
    });
  }

  function showCode(u, code, days) {
    var link = location.origin + location.pathname;
    var msg = 'Hello ' + u.name.split(' ')[0] + ', you have been added to ' + me.org_name + '.\n\n1. Open ' + link +
      '\n2. Tap "First time, or have a new setup code?"\n3. Enter your phone number and this setup code: ' + code +
      '\n4. Choose your own 6-digit PIN.\n\nThe code works once and expires in ' + days + ' days. Do not share your PIN with anyone.';
    var d = sheet('Setup code for ' + u.name,
      '<div class="code">' + h(code) + '</div><p>Give this code to ' + h(u.name.split(' ')[0]) + '. It works once, expires in ' + days +
      ' days, and <strong>is not shown again</strong>.</p><div class="stack" style="margin-top:14px">' +
      '<a class="btn block" target="_blank" rel="noopener" href="https://wa.me/' + h(waNumber(u.phone)) + '?text=' + encodeURIComponent(msg) + '">Send by WhatsApp</a>' +
      '<button type="button" class="btn ghost block" data-copy>Copy the message</button></div>');
    $('[data-copy]', d).onclick = function () {
      (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(function () { toast('Copied'); }, function () { toast('Could not copy. Write the code down.', true); });
    };
  }

  function userForm(u) {
    var roles = me.assignable_roles, centers = me.centers.filter(function (c) { return c.status === 'active' || (u && u.center_ids.indexOf(c.center_id) !== -1); });
    var fullPrograms = me.programs.filter(function (p) { return me.scope.full_program_ids.indexOf(p.program_id) !== -1; });
    var v = u || { name: '', email: '', phone: '', role: roles.indexOf('LEADER') !== -1 ? 'LEADER' : roles[0], center_ids: [], program_ids: [], allow_pin: false };
    var body =
      '<label class="field">Full name<input type="text" name="name" value="' + h(v.name) + '" autocomplete="off" required></label>' +
      '<label class="field">Role<select name="role">' + roles.map(function (r) { return '<option value="' + r + '"' + (r === v.role ? ' selected' : '') + '>' + ROLE[r] + '</option>'; }).join('') + '</select></label>' +
      '<div id="scope-one"><label class="field">Center<select name="center"><option value="">Choose a center</option>' +
        centers.map(function (c) { return '<option value="' + h(c.center_id) + '"' + (v.center_ids[0] === c.center_id ? ' selected' : '') + '>' + h(centerLabel(c)) + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="scope-many"><label class="field">What they can see<span class="hint">A whole program includes centers added to it later.</span></label>' +
        fullPrograms.map(function (p) { return '<label class="check"><input type="checkbox" name="program" value="' + h(p.program_id) + '"' + (v.program_ids.indexOf(p.program_id) !== -1 ? ' checked' : '') + '><span><strong>All of ' + h(p.name) + '</strong></span></label>'; }).join('') +
        centers.map(function (c) { return '<label class="check"><input type="checkbox" name="centers" value="' + h(c.center_id) + '"' + (v.center_ids.indexOf(c.center_id) !== -1 ? ' checked' : '') + '><span>' + h(centerLabel(c)) + ' only</span></label>'; }).join('') + '</div>' +
      '<label class="field">Phone number<input type="tel" name="phone" value="' + h(v.phone) + '" inputmode="tel" placeholder="0770 000 000"></label>' +
      '<label class="field">Google email<span class="hint">Leave empty if they will only use phone + PIN.</span><input type="email" name="email" value="' + h(v.email) + '" autocomplete="off" autocapitalize="none"></label>' +
      (me.pin_login ? '<label class="check"><input type="checkbox" name="allow_pin"' + (v.allow_pin ? ' checked' : '') + '><span><strong>Can sign in with phone number + PIN</strong><br><span class="small muted">For people without Google, or who use a borrowed phone. You get a setup code to give them.</span></span></label>' : '');
    var d = sheet(u ? 'Edit ' + u.name : 'Add a person', body, u ? 'Save' : 'Add person', function (form) {
      var f = form.elements, role = f.role.value, one = role === 'LEADER' || role === 'ASSISTANT', many = role === 'COORDINATOR' || role === 'VIEWER';
      var payload = { user_id: u ? u.user_id : undefined, name: f.name.value, phone: f.phone.value, email: f.email.value, role: role,
        allow_pin: !!(f.allow_pin && f.allow_pin.checked),
        center_ids: one ? (f.center.value ? [f.center.value] : []) : many ? $all('[name=centers]:checked', form).map(function (x) { return x.value; }) : [],
        program_ids: many ? $all('[name=program]:checked', form).map(function (x) { return x.value; }) : [] };
      return Api.call('saveUser', payload).then(function (r) {
        toast(u ? 'Saved' : r.user.name + ' added');
        render();
        if (r.setup_code) setTimeout(function () { showCode(r.user, r.setup_code, r.setup_code_days); }, 50);
      });
    });
    function sync() {
      var role = d.querySelector('[name=role]').value;
      $('#scope-one', d).hidden = !(role === 'LEADER' || role === 'ASSISTANT');
      $('#scope-many', d).hidden = !(role === 'COORDINATOR' || role === 'VIEWER');
    }
    d.querySelector('[name=role]').onchange = sync; sync();
  }

  function myDetailsForm() {
    sheet('My details',
      '<label class="field">Full name<input type="text" name="name" value="' + h(me.user.name) + '" required></label>' +
      '<label class="field">Phone number<input type="tel" name="phone" value="' + h(me.user.phone) + '" inputmode="tel"></label>' +
      (me.user.email ? '<p class="small muted" style="margin-top:12px">Google account: ' + h(me.user.email) + '</p>' : ''),
      'Save', function (form) {
        return Api.call('saveUser', { user_id: me.user.user_id, name: form.elements.name.value, phone: form.elements.phone.value })
          .then(refreshMe).then(function () { toast('Saved'); render(); });
      });
  }

  /* ---------- centers ---------- */
  function viewCenters(el) {
    el.innerHTML = '<a href="#/more" class="small">‹ More</a><div class="head"><h1>Programs and centers</h1>' + (me.can.manage_programs ? '<button class="btn ghost mini" id="add-program">+ Program</button>' : '') + '</div>' +
      (me.programs.length ? me.programs.map(function (p) {
        var cs = me.centers.filter(function (c) { return c.program_id === p.program_id; });
        var full = me.scope.full_program_ids.indexOf(p.program_id) !== -1;
        return '<section><div class="head" style="margin:8px 0"><div><h2>' + h(p.name) + '</h2>' + (p.status !== 'active' ? '<span class="badge off">Switched off</span>' : '') + '</div><div>' +
          (me.can.manage_programs ? '<button class="btn quiet mini" data-edit-program="' + h(p.program_id) + '">Edit</button> ' : '') +
          (full ? '<button class="btn ghost mini" data-add-center="' + h(p.program_id) + '">+ Center</button>' : '') + '</div></div>' +
          '<div class="list">' + (cs.length ? cs.map(function (c) {
            return '<button type="button" class="row" data-center="' + h(c.center_id) + '"><span class="avatar">' + h(initials(c.name)) + '</span><span class="grow"><span class="name">' + h(c.name) + '</span>' +
              (c.location ? '<br><span class="sub">' + h(c.location) + '</span>' : '') + (c.status !== 'active' ? '<br><span class="badge off">Switched off</span>' : '') + '</span></button>';
          }).join('') : '<div class="empty">No centers yet.</div>') + '</div></section>';
      }).join('') : '<div class="card"><p class="muted">No programs yet.' + (me.can.manage_programs ? ' Tap “+ Program” to add the first one.' : '') + '</p></div>');
    if (me.can.manage_programs) $('#add-program').onclick = function () { programForm(null); };
    $all('[data-edit-program]', el).forEach(function (b) { b.onclick = function () { programForm(me.programs.filter(function (p) { return p.program_id === b.dataset.editProgram; })[0]); }; });
    $all('[data-add-center]', el).forEach(function (b) { b.onclick = function () { centerForm(null, b.dataset.addCenter); }; });
    $all('[data-center]', el).forEach(function (b) { b.onclick = function () { centerForm(me.centers.filter(function (c) { return c.center_id === b.dataset.center; })[0]); }; });
  }
  function statusButton(kind, item, id, label) {
    var on = item.status === 'active';
    return '<p style="margin-top:16px"><button type="button" class="btn ' + (on ? 'danger' : 'ghost') + ' block" data-status>' + (on ? 'Switch this ' + label + ' off' : 'Switch this ' + label + ' on') + '</button></p>' +
      '<p class="small muted">' + (on ? 'Nothing is deleted. Its history stays in reports.' : '') + '</p>';
  }
  function wireStatus(d, kind, item, id, label) {
    var b = $('[data-status]', d); if (!b) return;
    b.onclick = function () {
      var on = item.status === 'active';
      if (on && !confirm('Switch off ' + item.name + '?')) return;
      d.close(); busy(true);
      Api.call('setOrgStatus', { kind: kind, id: id, status: on ? 'inactive' : 'active' }).then(refreshMe)
        .then(function () { busy(false); toast(on ? 'Switched off' : 'Switched on'); render(); }).catch(fail);
    };
  }
  function programForm(p) {
    var d = sheet(p ? 'Edit program' : 'New program',
      '<label class="field">Program name<span class="hint">The kind of meeting, e.g. Young Maidens\' Outreach.</span><input type="text" name="name" value="' + h(p ? p.name : '') + '" required></label>' +
      '<label class="field">Short description<input type="text" name="description" value="' + h(p ? p.description : '') + '"></label>' +
      '<label class="field">How often it meets<select name="frequency">' + ['monthly', 'weekly', 'other'].map(function (f) { return '<option' + (p && p.frequency === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select></label>' +
      (p ? statusButton('program', p, p.program_id, 'program') : ''),
      p ? 'Save' : 'Add program', function (form) {
        var f = form.elements;
        return Api.call('saveProgram', { program_id: p ? p.program_id : undefined, name: f.name.value, description: f.description.value, frequency: f.frequency.value })
          .then(refreshMe).then(function () { toast('Saved'); render(); });
      });
    if (p) wireStatus(d, 'program', p, p.program_id, 'program');
  }
  function centerForm(c, programId) {
    var d = sheet(c ? 'Edit center' : 'New center in ' + programName(programId),
      '<label class="field">Center name<input type="text" name="name" value="' + h(c ? c.name : '') + '" required></label>' +
      '<label class="field">Location<input type="text" name="location" value="' + h(c ? c.location : '') + '"></label>' +
      (c ? statusButton('center', c, c.center_id, 'center') : ''),
      c ? 'Save' : 'Add center', function (form) {
        var f = form.elements;
        return Api.call('saveCenter', { center_id: c ? c.center_id : undefined, program_id: programId, name: f.name.value, location: f.location.value })
          .then(refreshMe).then(function () { toast('Saved'); render(); });
      });
    if (c) wireStatus(d, 'center', c, c.center_id, 'center');
  }

  /* ---------- meetings ---------- */
  var STATE = { none: ['Not started', 'off'], draft: ['Draft', 'warn'], submitted: ['Submitted', ''] };
  function fmtDate(d) {
    if (!d) return '';
    var x = new Date(d + 'T12:00:00Z');
    return isNaN(x) ? d : x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function meetingCard(m, compact) {
    var canTake = me.can.record && (m.status !== 'closed' || ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].indexOf(me.user.role) !== -1);
    return '<div class="card meeting" data-meeting="' + h(m.meeting_id) + '">' +
      '<div class="head"><div><p class="small muted">' + h(fmtDate(m.date)) + (me.programs.length > 1 ? ' · ' + h(programName(m.program_id)) : '') + '</p>' +
      '<h2>' + h(m.theme) + '</h2>' + (m.scripture ? '<p class="small muted">' + h(m.scripture) + '</p>' : '') + '</div>' +
      (m.status === 'closed' ? '<span class="badge off">Closed</span>' : '') +
      (m.can_manage && !compact ? '<button type="button" class="btn quiet mini" data-manage>Manage</button>' : '') + '</div>' +
      (m.centers.length ? '<div class="list">' + m.centers.map(function (c) {
        var handed = jobsOf('report').some(function (j) { return j.meeting_id === m.meeting_id && j.center_id === c.center_id; });
        var st = STATE[c.state] || STATE.none, tap = me.can.record || handed;
        var label = c.state === 'none' ? (canTake || handed ? 'Take attendance' : st[0]) : st[0];
        return '<' + (tap ? 'button type="button"' : 'div') + ' class="row' + (tap ? '' : ' static') + '" data-take="' + h(c.center_id) + '">' +
          '<span class="grow"><span class="name">' + h(c.name) + '</span>' +
          (c.state !== 'none' ? '<br><span class="sub">' + c.total_present + ' present' + (c.total_first_timers ? ' · ' + c.total_first_timers + ' new' : '') + '</span>' : '') + '</span>' +
          '<span class="badge ' + st[1] + '">' + h(label) + '</span></' + (tap ? 'button' : 'div') + '>';
      }).join('') + '</div>' : '<p class="muted small">No centers of yours take part in this meeting.</p>') +
      (!compact && me.can.reports && m.date <= (me.today || '9') && m.centers.some(function (c) { return c.state === 'submitted'; }) ?
        '<a class="btn quiet block" href="#/reports/' + h(m.meeting_id) + '" style="margin-top:12px">Combined report</a>' : '') +
      '</div>';
  }
  function wireMeetingCards(el, meetings) {
    $all('.meeting', el).forEach(function (card) {
      var m = meetings.filter(function (x) { return x.meeting_id === card.dataset.meeting; })[0];
      $all('button[data-take]', card).forEach(function (b) { b.onclick = function () { go('#/take/' + m.meeting_id + '/' + b.dataset.take); }; });
      var mg = $('[data-manage]', card); if (mg) mg.onclick = function () { meetingActions(m); };
    });
  }
  function viewMeetings(el) {
    paint(el, 'meetings', function () { return Api.call('listMeetings'); }, function (r) {
      el.innerHTML = '<div class="head"><h1>Meetings</h1></div>' +
        '<p class="muted small">' + (me.can.record ? 'Tap a center to take or correct its attendance.' : 'Which centers have reported.') + '</p>' +
        (r.meetings.length ? r.meetings.map(function (m) { return meetingCard(m, false); }).join('')
          : '<div class="card empty">No meetings yet.' + (me.can.manage_meetings ? ' Tap “+ New meeting”.' : '') + '</div>') +
        (me.can.manage_meetings ? '<button class="btn fab" id="add-meeting">+ New meeting</button>' : '');
      wireMeetingCards(el, r.meetings);
      if (me.can.manage_meetings) $('#add-meeting').onclick = function () { meetingForm(null); };
    });
  }
  function meetingForm(m) {
    var progs = me.programs.filter(function (p) { return p.status === 'active' && (me.scope.all || me.scope.full_program_ids.indexOf(p.program_id) !== -1); });
    if (!m && !progs.length) { toast('No program of yours can take a meeting.', true); return; }
    sheet(m ? 'Edit meeting' : 'New meeting',
      (!m && progs.length > 1 ? '<label class="field">Program<select name="program">' + progs.map(function (p) { return '<option value="' + h(p.program_id) + '">' + h(p.name) + '</option>'; }).join('') + '</select></label>' : '') +
      '<label class="field">Date<span class="hint">All centers meet on this date.</span><input type="date" name="date" value="' + h(m ? m.date : '') + '" required></label>' +
      '<label class="field">Theme<input type="text" name="theme" value="' + h(m ? m.theme : '') + '" required></label>' +
      '<label class="field">Scripture<input type="text" name="scripture" value="' + h(m ? m.scripture : '') + '" placeholder="e.g. Daniel 1:8"></label>',
      m ? 'Save' : 'Create meeting', function (form) {
        var f = form.elements;
        return Api.call('saveMeeting', { meeting_id: m ? m.meeting_id : undefined, program_id: m ? m.program_id : (f.program ? f.program.value : progs[0].program_id),
          date: f.date.value, theme: f.theme.value, scripture: f.scripture.value }).then(function () { toast(m ? 'Meeting saved' : 'Meeting created'); render(); });
      });
  }
  function meetingActions(m) {
    var started = m.centers.some(function (c) { return c.state !== 'none'; });
    var d = sheet(m.theme, '<p class="muted">' + h(fmtDate(m.date)) + '</p><div class="stack" style="margin-top:16px">' +
      '<button type="button" class="btn quiet block" data-a="edit">Edit date, theme or scripture</button>' +
      (me.can.remind && m.centers.some(function (c) { return c.state !== 'submitted'; }) ? '<button type="button" class="btn ghost block" data-a="remind">Remind centers that have not submitted</button>' : '') +
      (m.status === 'closed' ? '<button type="button" class="btn ghost block" data-a="open">Reopen for corrections</button>'
        : '<button type="button" class="btn quiet block" data-a="close">Close the meeting</button><p class="small muted">Leaders and assistants can correct their report until you close it.</p>') +
      (!started ? '<button type="button" class="btn danger block" data-a="del">Delete this meeting</button>' : '') + '</div>');
    $all('[data-a]', d).forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a; d.close();
        if (a === 'edit') return meetingForm(m);
        if (a === 'remind') return go('#/reminders/' + m.meeting_id);
        if (a === 'del' && !confirm('Delete the meeting of ' + fmtDate(m.date) + '?')) return;
        if (a === 'close' && !confirm('Close this meeting? Leaders can no longer change their reports.')) return;
        busy(true);
        (a === 'del' ? Api.call('deleteMeeting', { meeting_id: m.meeting_id }) : Api.call('setMeetingStatus', { meeting_id: m.meeting_id, status: a === 'close' ? 'closed' : 'open' }))
          .then(function () { busy(false); toast(a === 'del' ? 'Meeting deleted' : a === 'close' ? 'Meeting closed' : 'Meeting reopened'); render(); }).catch(fail);
      };
    });
  }

  /* ---------- take attendance ---------- */
  var DECISION = { salvation: 'Salvation', rededication: 'Rededication', commitment_to_grow: 'Commitment to grow' };
  function viewTake(el, args) {
    var meetingId = args[0], centerId = args[1];
    el.innerHTML = skeleton();
    var fromPhone = function (e) {
      var d = offlineSession(meetingId, centerId);
      if (d) return takeScreen(el, withPending(d));
      el.innerHTML = '<div class="card"><p class="error">' + h(e ? e.message : 'No connection.') + '</p>' +
        (e && e.code === 'OFFLINE' ? '<p class="small muted">This report was not downloaded to this phone. Open the app once with internet to download it.</p>' : '') +
        '<a class="btn ghost block" href="#/meetings">Back to meetings</a></div>';
    };
    if (!navigator.onLine) return fromPhone({ code: 'OFFLINE', message: 'No connection.' });
    Api.call('getSession', { meeting_id: meetingId, center_id: centerId }).then(function (d) { takeScreen(el, withPending(d)); }).catch(function (e) {
      if (e.code === 'OFFLINE') return fromPhone(e);
      el.innerHTML = '<div class="card"><p class="error">' + h(e.message) + '</p><a class="btn ghost block" href="#/meetings">Back to meetings</a></div>';
    });
  }
  function takeScreen(el, d) {
    var s = d.session || {}, ro = !d.editable, dirty = false, newId = 0, filter = '';
    var present = {}, firsts = {}, decisions = {}, newcomers = [];
    d.attendance.forEach(function (a) { if (a.present) present[a.participant_id] = true; if (a.first_timer) firsts[a.participant_id] = true; });
    // A decision is kept as its kind: a standard one ('salvation') or one added for this report ('other:Baptism class').
    var kinds = (d.custom_decisions || []).slice();
    d.decisions.forEach(function (x) { decisions[x.participant_id] = x.type === 'other' ? 'other:' + x.label : x.type; });
    function decName(k) { return k.indexOf('other:') === 0 ? k.slice(6) : DECISION[k]; }
    var marked = {};
    d.attendance.forEach(function (a) { marked[a.participant_id] = true; });
    var people = d.participants.filter(function (p) { return (p.status === 'active' || marked[p.participant_id]) && !p.joined_after; });
    var later = ro ? [] : d.participants.filter(function (p) { return p.status === 'active' && p.joined_after; });
    if (d.pending) {
      // First-timers added on the phone and not sent yet.
      (d.pending.new_participants || []).forEach(function (n) {
        newcomers.push(Object.assign({}, n, { participant_id: n.temp_id, _new: true, status: 'active' })); present[n.temp_id] = true;
        newId = Math.max(newId, Number(String(n.temp_id).replace(/\D/g, '')) || 0);
      });
      (d.pending.decisions || []).forEach(function (x) { if (String(x.participant_id).indexOf('new') === 0) decisions[x.participant_id] = x.type === 'other' ? 'other:' + x.label : x.type; });
    }

    function mark() { dirty = true; }
    leaveGuard = function () { return !dirty || confirm('You have changes that are not saved. Leave without saving?'); };
    window.onbeforeunload = function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } };

    el.innerHTML =
      '<a href="#/meetings" class="small">‹ Meetings</a>' +
      '<div><p class="small muted">' + h(fmtDate(d.meeting.date)) + ' · ' + h(d.center.name) + '</p><h1>' + h(d.meeting.theme) + '</h1>' +
      (d.meeting.scripture ? '<p class="muted">' + h(d.meeting.scripture) + '</p>' : '') +
      '<p style="margin-top:6px">' + (s.status === 'submitted' ? '<span class="badge">Submitted</span>' : s.status === 'draft' ? '<span class="badge warn">Draft — not sent yet</span>' : '') +
      (ro ? '<span class="badge off">Closed — read only</span>' : '') + '</p></div>' +
      (d.pending ? '<div class="card alert-card"><span class="grow"><strong>Saved on this phone, not sent yet</strong><br><span class="small">It is sent by itself when the phone is online. You can keep correcting it.</span></span></div>'
        : d.offline ? '<div class="card alert-card"><span class="grow"><strong>No connection</strong><br><span class="small">Working from the list downloaded to this phone. Your save waits here and is sent when you are online.</span></span></div>' : '') +

      '<section class="card"><div class="head"><h2>Attendance</h2><span class="count" id="count"></span></div>' +
      (people.length > 8 ? '<input type="search" id="find" placeholder="Find a name" autocomplete="off">' : '') +
      '<div class="list att" id="att"></div>' +
      (d.deleted_present ? '<p class="small muted">' + d.deleted_present + ' more present who has since been deleted (still counted).</p>' : '') +
      (later.length ? '<p class="small muted" id="later-note">' + later.length + (later.length === 1 ? ' child joined' : ' children joined') + ' after this date and ' +
        (later.length === 1 ? 'is' : 'are') + ' not listed. <button type="button" class="linkbtn" id="show-later">Show ' + (later.length === 1 ? 'him' : 'them') + '</button></p>' : '') +
      (!ro ? '<button type="button" class="btn ghost block" id="add-new">+ Add a first-timer</button>' : '') + '</section>' +

      '<section class="card"><h2>Meeting details</h2>' +
      '<label class="field">Facilitators<input type="text" name="facilitators" value="' + h(s.facilitators) + '" placeholder="Who led the meeting"' + (ro ? ' disabled' : '') + '></label>' +
      '<label class="field">Start time<input type="time" name="start_time" value="' + h(s.start_time) + '"' + (ro ? ' disabled' : '') + '></label>' +
      '<div class="field" style="font-weight:600;font-size:.9rem">Started<div class="seg" role="radiogroup">' +
        ['on_time', 'late'].map(function (v) { return '<label><input type="radio" name="punctuality" value="' + v + '"' + (s.punctuality === v ? ' checked' : '') + (ro ? ' disabled' : '') + '><span>' + (v === 'late' ? 'Late' : 'On time') + '</span></label>'; }).join('') + '</div></div>' +
      '<label class="field">Observations<textarea name="observations" rows="3"' + (ro ? ' disabled' : '') + '>' + h(s.observations) + '</textarea></label>' +
      '<label class="field">Recommendations<textarea name="recommendations" rows="3"' + (ro ? ' disabled' : '') + '>' + h(s.recommendations) + '</textarea></label></section>' +

      '<div class="error" id="take-err" role="alert"></div>' +
      (!ro ? '<div class="savebar"><button type="button" class="btn quiet" id="draft">Save draft</button>' +
        '<button type="button" class="btn" id="submit">' + (s.status === 'submitted' ? 'Save changes' : 'Submit report') + '</button></div>' : '');

    function row(p) {
      var id = p.participant_id, on = !!present[id], dec = decisions[id], isNew = p._new || firsts[id];
      return '<div class="att-row' + (on ? ' on' : '') + '" data-id="' + h(id) + '">' +
        '<button type="button" class="tick" aria-pressed="' + on + '"' + (ro ? ' disabled' : '') + '><span class="box" aria-hidden="true"></span>' +
        '<span class="grow"><span class="name">' + h(p.name) + '</span>' +
        (isNew ? ' <span class="badge warn">New</span>' : '') + (p.status === 'inactive' ? ' <span class="badge off">Inactive</span>' : '') +
        (dec ? '<br><span class="badge dec">' + h(decName(dec)) + '</span>' : '') + '</span>' +
        '<span class="state">' + (on ? 'Present' : 'Absent') + '</span></button>' +
        (on && !ro ? '<button type="button" class="btn quiet mini dec-btn" aria-label="Decision for ' + h(p.name) + '">' + (dec ? 'Change' : 'Decision') + '</button>' : '') +
        '</div>';
    }
    function draw() {
      var all = newcomers.concat(people), q = filter.toLowerCase();
      var shown = q ? all.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; }) : all;
      $('#att', el).innerHTML = shown.length ? shown.map(row).join('') : '<div class="empty">' + (q ? 'No name matches.' : 'No children in this center yet. Add first-timers below, or add children under Children.') + '</div>';
      var n = Object.keys(present).length + (d.deleted_present || 0);
      $('#count', el).textContent = n + ' present of ' + (all.length + (d.deleted_present || 0));
      $all('.att-row', el).forEach(function (r) {
        var id = r.dataset.id;
        $('.tick', r).onclick = function () {
          if (present[id]) { delete present[id]; delete decisions[id]; } else present[id] = true;
          mark(); draw();
        };
        var db = $('.dec-btn', r); if (db) db.onclick = function () { decisionPicker(id); };
      });
    }
    function decisionPicker(id) {
      var p = newcomers.concat(people).filter(function (x) { return x.participant_id === id; })[0];
      var all = Object.keys(DECISION).concat(kinds.map(function (k) { return 'other:' + k; }));
      var dlg = sheet('Decision for ' + p.name, '<div class="stack">' + all.map(function (k) {
        return '<button type="button" class="btn ' + (decisions[id] === k ? '' : 'quiet') + ' block" data-k="' + h(k) + '">' + h(decName(k)) + '</button>';
      }).join('') + (decisions[id] ? '<button type="button" class="btn danger block" data-k="">Remove the decision</button>' : '') + '</div>' +
        '<h3 style="margin-top:18px">Another kind of decision</h3><p class="small muted">For this report only. Once added, it can be chosen for any child present today.</p>' +
        '<div class="addkind"><input type="text" name="newkind" maxlength="40" placeholder="e.g. Baptism class" autocomplete="off"><button type="button" class="btn ghost" data-add>Add</button></div>');
      $all('[data-k]', dlg).forEach(function (b) {
        b.onclick = function () { if (b.dataset.k) decisions[id] = b.dataset.k; else delete decisions[id]; mark(); dlg.close(); draw(); };
      });
      $('[data-add]', dlg).onclick = function () {
        var v = dlg.querySelector('[name=newkind]').value.trim().replace(/\s+/g, ' '), err = $('.error', dlg);
        if (v.length < 2) { err.textContent = 'Write the kind of decision (2 to 40 letters).'; return; }
        var known = Object.keys(DECISION).map(function (k) { return DECISION[k].toLowerCase(); }).concat(kinds.map(function (k) { return k.toLowerCase(); }));
        if (known.indexOf(v.toLowerCase()) === -1) {
          if (kinds.length >= 10) { err.textContent = 'At most 10 extra kinds in one report.'; return; }
          kinds.push(v);
        } else v = kinds.filter(function (k) { return k.toLowerCase() === v.toLowerCase(); })[0] || v;
        var std = Object.keys(DECISION).filter(function (k) { return DECISION[k].toLowerCase() === v.toLowerCase(); })[0];
        decisions[id] = std || 'other:' + v; mark(); dlg.close(); draw();
        toast('"' + v + '" added for this report');
      };
    }
    var sl = $('#show-later', el);
    if (sl) sl.onclick = function () { people = people.concat(later).sort(function (a, b) { return a.name.localeCompare(b.name); }); later = []; $('#later-note', el).remove(); draw(); };
    var find = $('#find', el); if (find) find.oninput = function () { filter = find.value.trim(); draw(); };
    $all('input, textarea', el).forEach(function (i) { if (i.id !== 'find') i.addEventListener('input', mark); });
    $all('[name=punctuality]', el).forEach(function (i) { i.addEventListener('change', mark); });

    var addBtn = $('#add-new', el);
    if (addBtn) addBtn.onclick = function () {
      participantForm(null, d.center.center_id, function (vals) {
        var key = vals.name.toLowerCase().replace(/\s+/g, ' ');
        if (newcomers.concat(people).some(function (p) { return p.name.toLowerCase().replace(/\s+/g, ' ') === key; })) {
          throw new Error(vals.name + ' is already on the list. Mark him present instead.');
        }
        var tmp = 'new' + (++newId);
        vals.participant_id = tmp; vals.temp_id = tmp; vals._new = true; vals.status = 'active';
        newcomers.unshift(vals); present[tmp] = true; mark(); draw();
        toast(vals.name + ' added and marked present');
      }, true);
    };

    function save(submit) {
      var err = $('#take-err', el); err.textContent = '';
      var g = function (n) { var x = el.querySelector('[name=' + n + ']'); return x ? x.value : ''; };
      var punct = el.querySelector('[name=punctuality]:checked');
      var payload = {
        meeting_id: d.meeting.meeting_id, center_id: d.center.center_id, submit: submit || !!(d.pending && d.pending.submit),
        facilitators: g('facilitators'), start_time: g('start_time'), punctuality: punct ? punct.value : '',
        observations: g('observations'), recommendations: g('recommendations'),
        attendance: people.map(function (p) { return { participant_id: p.participant_id, present: !!present[p.participant_id] }; }),
        new_participants: newcomers.map(function (p) {
          return { temp_id: p.temp_id, name: p.name, age: p.age, birth_date: p.birth_date, phone: p.phone, guardian_name: p.guardian_name,
            guardian_phone: p.guardian_phone, school: p.school, guardian_consent: p.guardian_consent };
        }),
        custom_decisions: kinds.filter(function (k) { return Object.keys(decisions).some(function (id) { return decisions[id] === 'other:' + k; }); }),
        decisions: Object.keys(decisions).map(function (id) {
          var k = decisions[id];
          return k.indexOf('other:') === 0 ? { participant_id: id, type: 'other', label: k.slice(6) } : { participant_id: id, type: k };
        })
      };
      if (submit) {   // the same checks the server makes, so a report saved offline is not refused later
        if (!payload.facilitators.trim()) { err.textContent = 'Enter who facilitated the meeting.'; return; }
        if (!payload.start_time) { err.textContent = 'Enter the time the meeting started.'; return; }
        if (!payload.punctuality) { err.textContent = 'Say whether the meeting started on time or late.'; return; }
      }
      var key = 'session|' + d.meeting.meeting_id + '|' + d.center.center_id;
      var keepOnPhone = function () {
        if (!onOwnPhone() && !confirm('You are on a borrowed phone. The report waits on this phone until it is online; do not close the app before it is sent. Keep it?')) return;
        Sync.add('saveSession', payload, d.center.name + ' report, ' + fmtDate(d.meeting.date) + (payload.submit ? '' : ' (draft)'), key);
        dirty = false;
        toast('Saved on this phone. It is sent when you are online.');
        var again = JSON.parse(JSON.stringify(d)); again.pending = payload; delete again.offline;
        takeScreen(el, withPending(again)); window.scrollTo(0, 0);
      };
      if (!navigator.onLine) return keepOnPhone();
      $all('.savebar .btn', el).forEach(function (b) { b.disabled = true; });
      busy(true);
      if (d.pending) Sync.remove(Sync.find(key).id);   // this save replaces the one waiting
      return Api.call('saveSession', payload).then(function (fresh) {
        busy(false); dirty = false;
        toast(submit && s.status !== 'submitted' ? 'Report submitted' : 'Saved');
        takeScreen(el, fresh);
        window.scrollTo(0, 0);
      }).catch(function (e) {
        busy(false);
        $all('.savebar .btn', el).forEach(function (b) { b.disabled = false; });
        if (e.code === 'OFFLINE') return keepOnPhone();
        err.textContent = e.message; err.scrollIntoView({ block: 'center' });
      });
    }
    if (!ro) {
      $('#draft', el).onclick = function () { save(false); };
      $('#submit', el).onclick = function () {
        if (s.status !== 'submitted' && !confirm('Submit the ' + d.center.name + ' report with ' + Object.keys(present).length + ' present?')) return;
        save(true);
      };
    }
    draw();
  }

  /* ---------- participants ---------- */
  var pState = { center: '', q: '', show: 'active' };
  function recordCenters(kind) { return jobCenters(kind || 'children'); }
  function viewParticipants(el) {
    var centers = recordCenters('children');
    if (!pState.center || !centers.some(function (c) { return c.center_id === pState.center; })) pState.center = centers.length ? centers[0].center_id : '';
    if (!centers.length) { el.innerHTML = '<h1>Children</h1><div class="card empty">No active center is assigned to you.</div>'; return; }
    paint(el, 'participants|' + pState.center, function () { return Api.call('listParticipants', { center_id: pState.center }); }, function (r) {
      var list = r.participants.sort(function (a, b) { return a.name.localeCompare(b.name); });
      var counts = { active: 0, inactive: 0, incomplete: 0 };
      list.forEach(function (p) { counts[p.status]++; if (p.incomplete || !p.guardian_consent) counts.incomplete++; });
      el.innerHTML = '<div class="head"><h1>Children</h1><div><button class="btn mini" id="msg-all">' + ICON.msg + ' Message all</button> ' +
        '<button class="btn ghost mini" id="import">Import CSV</button></div></div>' +
        (centers.length > 1 ? '<label class="field" style="margin-top:0">Center<select id="pc">' + centers.map(function (c) {
          return '<option value="' + h(c.center_id) + '"' + (c.center_id === pState.center ? ' selected' : '') + '>' + h(centerLabel(c)) + '</option>'; }).join('') + '</select></label>' : '') +
        '<div class="seg small-seg">' + [['active', 'Active ' + counts.active], ['inactive', 'Inactive ' + counts.inactive], ['incomplete', 'To complete ' + counts.incomplete]].map(function (x) {
          return '<label><input type="radio" name="show" value="' + x[0] + '"' + (pState.show === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>'; }).join('') + '</div>' +
        '<input type="search" id="pq" placeholder="Find a name" value="' + h(pState.q) + '" autocomplete="off">' +
        '<div class="list" id="plist"></div>' +
        '<button class="btn fab" id="add-p">+ Add child</button>';
      function draw() {
        var q = pState.q.toLowerCase();
        var shown = list.filter(function (p) {
          if (pState.show === 'incomplete' ? !(p.incomplete || !p.guardian_consent) : p.status !== pState.show) return false;
          return !q || p.name.toLowerCase().indexOf(q) !== -1;
        });
        $('#plist', el).innerHTML = shown.length ? shown.map(function (p) {
          return '<button type="button" class="row" data-id="' + h(p.participant_id) + '"><span class="avatar">' + h(initials(p.name)) + '</span>' +
            '<span class="grow"><span class="name">' + h(p.name) + '</span><br><span class="sub">' + (p.age ? h(p.age) + ' yrs' : 'Age missing') +
            (p.guardian_name ? ' · ' + h(p.guardian_name) : '') + '</span><br>' +
            (p.status === 'inactive' ? '<span class="badge off">Inactive</span>' : '') +
            (p.incomplete ? '<span class="badge warn">Details missing</span>' : '') +
            (!p.guardian_consent ? '<span class="badge bad">No guardian consent</span>' : '') + '</span></button>';
        }).join('') : '<div class="empty">' + (list.length ? 'Nobody in this list.' : 'No children yet. Tap “+ Add child” or import a CSV file.') + '</div>';
        $all('#plist .row', el).forEach(function (b) {
          b.onclick = function () { participantActions(list.filter(function (p) { return p.participant_id === b.dataset.id; })[0]); };
        });
      }
      var pc = $('#pc', el); if (pc) pc.onchange = function () { pState.center = pc.value; viewParticipants(el); };
      $all('[name=show]', el).forEach(function (i) { i.onchange = function () { pState.show = i.value; draw(); }; });
      $('#pq', el).oninput = function () { pState.q = this.value.trim(); draw(); };
      $('#add-p', el).onclick = function () {
        participantForm(null, pState.center, function (vals) {
          return Api.call('saveParticipant', vals).then(function (r) { toast(r.participant.name + ' added'); render(); });
        });
      };
      $('#import', el).onclick = function () { importDialog(pState.center); };
      $('#msg-all', el).onclick = function () { messageAll(pState.center, list.filter(function (p) { return p.status === 'active'; })); };
      if (!jobCenters('followup').some(function (c) { return c.center_id === pState.center; })) $('#msg-all', el).hidden = true;
      draw();
    });
  }

  /**
   * Add/edit form with every detail and the guardian consent tick.
   * onSave(values) may return a promise; throw or reject to show the message in the form.
   */
  function participantForm(p, centerId, onSave, firstTimer) {
    var v = p || { name: '', age: '', birth_date: '', phone: '', guardian_name: '', guardian_phone: '', school: '', guardian_consent: false };
    sheet(p ? 'Edit ' + p.name : firstTimer ? 'Add a first-timer' : 'Add a child',
      '<label class="field">Full name<input type="text" name="name" value="' + h(v.name) + '" autocomplete="off" required></label>' +
      '<div class="two"><label class="field">Age<input type="text" name="age" inputmode="numeric" maxlength="2" value="' + h(v.age) + '" required></label>' +
      '<label class="field">Date of birth<span class="hint">Optional</span><input type="date" name="birth_date" value="' + h(v.birth_date) + '"></label></div>' +
      '<label class="field">Guardian\'s name<span class="hint">Optional</span><input type="text" name="guardian_name" value="' + h(v.guardian_name) + '" autocomplete="off"></label>' +
      '<label class="field">Guardian\'s phone<span class="hint">Optional</span><input type="tel" name="guardian_phone" inputmode="tel" value="' + h(v.guardian_phone) + '" placeholder="0770 000 000"></label>' +
      '<label class="field">Child\'s own phone<span class="hint">Optional</span><input type="tel" name="phone" inputmode="tel" value="' + h(v.phone) + '"></label>' +
      '<label class="field">School<span class="hint">Optional</span><input type="text" name="school" value="' + h(v.school) + '"></label>' +
      '<label class="check consent"><input type="checkbox" name="consent"' + (v.guardian_consent ? ' checked' : '') + '><span><strong>The guardian agrees</strong> that we keep these details to follow up with the child.' +
        (firstTimer ? '<br><span class="small muted">Needed before a first-timer can be added.</span>' : '') + '</span></label>',
      p ? 'Save' : firstTimer ? 'Add and mark present' : 'Add child', function (form) {
        var f = form.elements;
        var vals = { participant_id: p ? p.participant_id : undefined, center_id: centerId, name: f.name.value.trim().replace(/\s+/g, ' '), age: f.age.value.trim(),
          birth_date: f.birth_date.value, guardian_name: f.guardian_name.value.trim(), guardian_phone: f.guardian_phone.value.trim(),
          phone: f.phone.value.trim(), school: f.school.value.trim(), guardian_consent: f.consent.checked };
        if (vals.name.length < 2) throw new Error('Enter the full name.');
        if (!/^\d{1,2}$/.test(vals.age)) throw new Error('Enter the age as a number, e.g. 12.');
        var gd = vals.guardian_phone.replace(/\D/g, '').length;
        if (gd && gd < 7) throw new Error('The guardian\'s phone number looks too short. Correct it or leave it empty.');
        if (firstTimer && !vals.guardian_consent) throw new Error('Tick the guardian consent to add a first-timer.');
        return onSave(vals);
      });
  }

  function participantActions(p) {
    var d = sheet(p.name, '<p class="muted">' + (p.age ? h(p.age) + ' yrs · ' : '') + 'joined ' + h(fmtDate(p.join_date)) + '</p>' +
      (p.guardian_name ? '<p class="small">Guardian: ' + h(p.guardian_name) + (p.guardian_phone ? ' · ' + h(p.guardian_phone) : '') + '</p>' : '') +
      (p.school ? '<p class="small muted">' + h(p.school) + '</p>' : '') +
      '<p class="small">' + (p.guardian_consent ? 'Guardian consent given ' + h(fmtDate(p.consent_date)) : '<span class="badge bad">No guardian consent recorded</span>') + '</p>' +
      '<div class="stack" style="margin-top:16px">' +
      '<button type="button" class="btn block" data-a="hist">Attendance and follow-up history</button>' +
      '<button type="button" class="btn quiet block" data-a="edit">Edit details</button>' +
      (p.status === 'active' ? '<button type="button" class="btn quiet block" data-a="off">Mark inactive</button><p class="small muted">Inactive children are kept but no longer listed for attendance.</p>'
        : '<button type="button" class="btn ghost block" data-a="on">Mark active again</button>') +
      '<button type="button" class="btn danger block" data-a="del">Delete this child\'s details</button></div>');
    $all('[data-a]', d).forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a; d.close();
        if (a === 'hist') return historySheet(p);
        if (a === 'edit') return participantForm(p, p.center_id, function (vals) {
          return Api.call('saveParticipant', vals).then(function () { toast('Saved'); render(); });
        });
        if (a === 'del') {
          var typed = prompt('This permanently erases ' + p.name + '\'s name, phone, guardian and school. ' +
            'Past attendance totals stay the same but no longer show his name. There is no undo.\n\nType DELETE to confirm.');
          if (typed !== 'DELETE') { if (typed !== null) toast('Nothing was deleted. Type DELETE in capitals.', true); return; }
        }
        busy(true);
        (a === 'del' ? Api.call('deleteParticipant', { participant_id: p.participant_id })
          : Api.call('setParticipantStatus', { participant_id: p.participant_id, status: a === 'on' ? 'active' : 'inactive' }))
          .then(function () { busy(false); toast(a === 'del' ? 'Details deleted' : a === 'on' ? 'Marked active' : 'Marked inactive'); render(); }).catch(fail);
      };
    });
  }

  /* ---------- CSV import ---------- */
  /** Reads CSV text (commas or semicolons, quoted fields, Excel's BOM) into rows of cells. */
  function parseCsv(text) {
    text = String(text).replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '', sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }
  var CSV_FIELDS = {
    name: /^(full ?)?name$|^child('?s)? name$|^participant$/,
    age: /^age$/, birth_date: /^(birth ?date|date of birth|dob|birthday)$/,
    phone: /^(phone|child('?s)? phone|mobile)$/, guardian_name: /^(guardian|guardian('?s)? name|parent('?s)? name|parent)$/,
    guardian_phone: /^(guardian('?s)? phone|parent('?s)? phone|guardian ?contact)$/, school: /^school$/,
    join_date: /^(join ?date|joined|date joined)$/, guardian_consent: /^(guardian ?consent|consent)$/
  };
  function csvToObjects(rows) {
    var head = rows[0].map(function (x) { return String(x).trim().toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' '); });
    var map = head.map(function (hd) { for (var k in CSV_FIELDS) if (CSV_FIELDS[k].test(hd)) return k; return null; });
    if (map.indexOf('name') === -1) throw new Error('The first row must have a column called "name". Download the template to see the columns.');
    return { columns: map.filter(Boolean), unknown: head.filter(function (x, i) { return !map[i]; }),
      rows: rows.slice(1).map(function (r) { var o = {}; map.forEach(function (k, i) { if (k) o[k] = String(r[i] === undefined ? '' : r[i]).trim(); }); return o; }) };
  }
  function importDialog(centerId) {
    var parsed = null;
    var d = sheet('Import children from a CSV file',
      '<p class="small muted">Save your list as CSV (in Excel or Google Sheets: File → Download → CSV). The first row must hold the column names.</p>' +
      '<p><a href="participants-template.csv" download class="small">Download the template</a></p>' +
      '<p class="small">Into: <strong>' + h(centerLabel(me.centers.filter(function (c) { return c.center_id === centerId; })[0])) + '</strong></p>' +
      '<label class="field">CSV file<input type="file" name="file" accept=".csv,text/csv"></label>' +
      '<div id="preview" class="small" style="margin-top:12px"></div>',
      'Import', function () {
        if (!parsed || !parsed.rows.length) throw new Error('Choose a CSV file with at least one child.');
        return Api.call('importParticipants', { center_id: centerId, rows: parsed.rows }).then(function (r) {
          render();
          sheet('Import finished', '<p><strong>' + r.added + '</strong> ' + (r.added === 1 ? 'child was' : 'children were') + ' added.</p>' +
            (r.skipped.length ? '<p style="margin-top:10px">' + r.skipped.length + ' row(s) skipped:</p><ul class="small">' +
              r.skipped.slice(0, 30).map(function (x) { return '<li>Row ' + x.row + ': ' + h(x.reason) + '</li>'; }).join('') + '</ul>' : '') +
            (r.added ? '<p class="small muted" style="margin-top:10px">Imported children without guardian consent or full details show under “To complete”.</p>' : ''));
        });
      });
    $('[name=file]', d).onchange = function () {
      var file = this.files[0], box = $('#preview', d); parsed = null; box.textContent = '';
      if (!file) return;
      if (file.size > 500000) { box.innerHTML = '<span class="error">That file is too large.</span>'; return; }
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var rows = parseCsv(rd.result);
          if (rows.length < 2) throw new Error('The file has no children under the header row.');
          parsed = csvToObjects(rows);
          if (parsed.rows.length > 300) throw new Error('Import at most 300 children at a time. Split the file.');
          box.innerHTML = '<p><strong>' + parsed.rows.length + '</strong> row(s) found. Columns used: ' + h(parsed.columns.join(', ')) + '.</p>' +
            (parsed.unknown.length ? '<p class="muted">Ignored columns: ' + h(parsed.unknown.join(', ')) + '</p>' : '') +
            '<p class="muted">First: ' + h(parsed.rows[0].name || '(no name)') + '</p>';
        } catch (e) { parsed = null; box.innerHTML = '<span class="error">' + h(e.message) + '</span>'; }
      };
      rd.readAsText(file);
    };
  }

  /* ---------- charts ---------- */
  /** Short axis label: "14 Nov". */
  function shortDate(d) {
    var x = new Date(d + 'T12:00:00Z');
    return isNaN(x) ? d : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  /**
   * Stacked bar chart as inline SVG. o = { id, labels, full (tooltip labels), series: [{name, color, values}] }.
   * Legend above, value tooltip on tap or hover, and a table view for anyone who cannot read the colours.
   */
  function barChart(o) {
    var n = o.labels.length, W = 340, H = 170, L = 30, R = 6, T = 10, B = 24;
    var totals = o.labels.map(function (_, i) { return o.series.reduce(function (a, s) { return a + (s.values[i] || 0); }, 0); });
    var max = Math.max.apply(null, totals.concat([1]));
    var step = Math.pow(10, Math.floor(Math.log10(max))), nice = Math.ceil(max / step) * step;
    if (nice / step <= 2) step = step / 2;
    step = Math.max(1, step);                      // counts of people: whole numbers only
    nice = Math.max(Math.ceil(max / step) * step, 1);
    var plotW = W - L - R, plotH = H - T - B, slot = plotW / n, bw = Math.max(4, Math.min(28, slot * 0.6));
    var y = function (v) { return T + plotH - (v / nice) * plotH; };
    var grid = '', ticks = [];
    for (var v = 0; v <= nice + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
    ticks.forEach(function (t) {
      grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="grid"/>' +
        '<text x="' + (L - 6) + '" y="' + (y(t) + 4) + '" class="axis" text-anchor="end">' + t + '</text>';
    });
    var every = Math.ceil(n / 7), bars = '';
    o.labels.forEach(function (lab, i) {
      var cx = L + slot * i + slot / 2, base = y(0), segs = [];
      o.series.forEach(function (s) { if (s.values[i] > 0) segs.push({ s: s, v: s.values[i] }); });
      segs.forEach(function (sg, k) {
        var h0 = (sg.v / nice) * plotH, top = base - h0, gap = k ? 2 : 0, hh = Math.max(0, h0 - gap);
        var last = k === segs.length - 1, r = last ? Math.min(4, hh / 2, bw / 2) : 0, x0 = cx - bw / 2, x1 = cx + bw / 2, yb = base - gap;
        bars += '<path fill="' + sg.s.color + '" d="M' + x0 + ' ' + yb + 'V' + (top + r) + (r ? 'Q' + x0 + ' ' + top + ' ' + (x0 + r) + ' ' + top + 'H' + (x1 - r) + 'Q' + x1 + ' ' + top + ' ' + x1 + ' ' + (top + r) : 'H' + x1) + 'V' + yb + 'Z"/>';
        base = top;
      });
      if (i % every === 0 || i === n - 1) bars += '<text x="' + cx + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + h(lab) + '</text>';
      bars += '<rect class="hit" data-i="' + i + '" x="' + (L + slot * i) + '" y="' + T + '" width="' + slot + '" height="' + (plotH + B) + '" fill="transparent"/>';
    });
    var legend = o.series.length > 1 ? '<div class="legend">' + o.series.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + h(s.name) + '</span>'; }).join('') + '</div>' : '';
    var table = '<table class="data" hidden><thead><tr><th>Date</th>' + o.series.map(function (s) { return '<th>' + h(s.name) + '</th>'; }).join('') +
      (o.series.length > 1 ? '<th>Total</th>' : '') + '</tr></thead><tbody>' + o.labels.map(function (lab, i) {
        return '<tr><td>' + h((o.full || o.labels)[i]) + '</td>' + o.series.map(function (s) { return '<td>' + (s.values[i] || 0) + '</td>'; }).join('') +
          (o.series.length > 1 ? '<td><strong>' + totals[i] + '</strong></td>' : '') + '</tr>'; }).join('') + '</tbody></table>';
    window._charts = window._charts || {};
    window._charts[o.id] = { o: o, totals: totals };
    return '<div class="chart" data-chart="' + h(o.id) + '">' + legend +
      '<div class="plot"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + h(o.series.map(function (s) { return s.name; }).join(' and ')) + ' per meeting">' +
      grid + '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" class="base"/>' + bars + '</svg><div class="tip" hidden></div></div>' +
      '<button type="button" class="linkbtn small" data-table>Show as table</button>' + table + '</div>';
  }
  function wireCharts(el) {
    $all('.chart', el).forEach(function (c) {
      var info = (window._charts || {})[c.dataset.chart]; if (!info) return;
      var tip = $('.tip', c), plot = $('.plot', c), svg = $('svg', c);
      var show = function (i, rect) {
        var o = info.o;
        tip.innerHTML = '<strong>' + h((o.full || o.labels)[i]) + '</strong>' + o.series.map(function (s) {
          return '<span><i style="background:' + s.color + '"></i>' + h(s.name) + ': <b>' + (s.values[i] || 0) + '</b></span>'; }).join('') +
          (o.series.length > 1 ? '<span>Total: <b>' + info.totals[i] + '</b></span>' : '');
        tip.hidden = false;
        var pr = plot.getBoundingClientRect(), rr = rect.getBoundingClientRect();
        var left = rr.left - pr.left + rr.width / 2 - tip.offsetWidth / 2;
        tip.style.left = Math.max(0, Math.min(pr.width - tip.offsetWidth, left)) + 'px';
        $all('.hit', svg).forEach(function (r) { r.classList.toggle('on', r === rect); });
      };
      $all('.hit', svg).forEach(function (r) {
        r.addEventListener('pointerenter', function () { show(+r.dataset.i, r); });
        r.addEventListener('click', function () { show(+r.dataset.i, r); });
      });
      plot.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { tip.hidden = true; $all('.hit', svg).forEach(function (r) { r.classList.remove('on'); }); } });
      $('[data-table]', c).onclick = function () {
        var t = $('table', c), open = t.hidden; t.hidden = !open; this.textContent = open ? 'Hide table' : 'Show as table';
      };
    });
  }
  /** Horizontal bars for a few named values (centers, programs). */
  function hbars(rows, label, value, fmt) {
    var max = Math.max.apply(null, rows.map(value).concat([1]));
    return '<div class="hbars">' + rows.map(function (r) {
      var v = value(r);
      return '<div class="hb"><span class="hb-l">' + h(label(r)) + '</span><span class="hb-t"><span class="hb-b" style="width:' + Math.max(v ? 2 : 0, v * 100 / max) + '%"></span></span>' +
        '<span class="hb-v">' + h(fmt ? fmt(v) : v) + '</span></div>';
    }).join('') + '</div>';
  }

  /* ---------- follow-up ---------- */
  var REASON = { absent: ['Absent', 'warn'], inactive: ['Missed in a row', 'bad'], first_timer: ['First-timer', ''], decision: ['Decision', 'dec'], due: ['Next action due', 'warn'] };
  var PURPOSE_FOR = { absent: 'absentee', inactive: 'inactivity', first_timer: 'first_timer', decision: 'decision', due: 'absentee', birthday: 'birthday' };
  var METHOD = { call: 'Call', whatsapp: 'WhatsApp', sms: 'SMS', visit: 'Visit' };
  var fState = { center: '', reason: 'all' };
  var templatesCache = null;
  function loadTemplates() {
    if (templatesCache) return Promise.resolve(templatesCache);
    return Api.call('listTemplates').then(function (t) { templatesCache = t; return t; }).catch(function (e) {
      var pk = Api.store.get(ckey('pack'));
      if (e.code === 'OFFLINE' && pk && pk.templates) { templatesCache = pk.templates; return pk.templates; }
      throw e;
    });
  }
  function fillTemplate(text, ctx) {
    return String(text || '').replace(/\{(\w+)\}/g, function (m, k) { return ctx[k] !== undefined && ctx[k] !== '' ? ctx[k] : m; });
  }
  function telNumber(phone) { var n = waNumber(phone); return n ? '+' + n : ''; }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0]; }

  function viewFollowUp(el) {
    var centers = recordCenters('followup');
    if (fState.center && !centers.some(function (c) { return c.center_id === fState.center; })) fState.center = '';
    paint(el, 'followups|' + fState.center, function () { return Promise.all([Api.call('followUps', fState.center ? { center_id: fState.center } : {}), loadTemplates()]); }, function (res) {
      // Contacts logged on this phone and not sent yet are already off the list.
      var waitingLogs = Sync.items().filter(function (q) { return q.action === 'logFollowUp'; }).map(function (q) { return q.payload; });
      var f = res[0], items = f.items.filter(function (x) {
        return !waitingLogs.some(function (w) { return w.participant_id === x.participant_id && (w.session_id === x.session_id || w.reason === x.reasons[0]); });
      }), counts = { all: items.length };
      f = Object.assign({}, f, { birthdays: f.birthdays.filter(function (b) { return !waitingLogs.some(function (w) { return w.participant_id === b.participant_id && w.reason === 'birthday'; }); }) });
      items.forEach(function (x) { x.reasons.forEach(function (r) { counts[r] = (counts[r] || 0) + 1; }); });
      if (fState.reason !== 'all' && !counts[fState.reason]) fState.reason = 'all';
      el.innerHTML = '<h1>Follow-up</h1>' +
        '<p class="muted small">Children to call or message after the latest meeting of each center. Log what happened and they leave the list.</p>' +
        (centers.length > 1 ? '<label class="field" style="margin-top:0">Center<select id="fc"><option value="">All my centers</option>' + centers.map(function (c) {
          return '<option value="' + h(c.center_id) + '"' + (c.center_id === fState.center ? ' selected' : '') + '>' + h(centerLabel(c)) + '</option>'; }).join('') + '</select></label>' : '') +
        (f.birthdays.length ? '<section class="card"><h2>Birthdays coming up</h2><div class="list">' + f.birthdays.map(function (b) {
          return '<button type="button" class="row" data-bday="' + h(b.participant_id) + '"><span class="avatar">' + h(initials(b.name)) + '</span><span class="grow"><span class="name">' + h(b.name) + '</span><br>' +
            '<span class="sub">' + (b.in_days === 0 ? 'Today' : b.in_days === 1 ? 'Tomorrow' : 'In ' + b.in_days + ' days, ' + h(shortDate(b.birthday))) + ' · turns ' + b.turning + (centers.length > 1 ? ' · ' + h(b.center) : '') + '</span></span></button>';
        }).join('') + '</div></section>' : '') +
        (items.length ? '<div class="chips">' + ['all', 'inactive', 'absent', 'first_timer', 'decision', 'due'].filter(function (k) { return k === 'all' || counts[k]; }).map(function (k) {
          return '<button type="button" class="chip-btn' + (fState.reason === k ? ' on' : '') + '" data-r="' + k + '">' + (k === 'all' ? 'All' : REASON[k][0]) + ' <b>' + counts[k] + '</b></button>'; }).join('') + '</div>' : '') +
        '<div class="list" id="flist"></div>';
      function draw() {
        var shown = items.filter(function (x) { return fState.reason === 'all' || x.reasons.indexOf(fState.reason) !== -1; });
        $('#flist', el).innerHTML = shown.length ? shown.map(function (x) {
          return '<button type="button" class="row" data-id="' + h(x.participant_id) + '"><span class="avatar">' + h(initials(x.name)) + '</span><span class="grow"><span class="name">' + h(x.name) + '</span><br>' +
            x.reasons.map(function (r) { return '<span class="badge ' + REASON[r][1] + '">' + (r === 'inactive' ? 'Missed ' + x.streak + ' in a row' : REASON[r][0]) + '</span>'; }).join('') +
            '<br><span class="sub">' + (centers.length > 1 ? h(x.center) + ' · ' : '') + (x.reasons[0] === 'due' ? h(x.due_action) + ' (due ' + h(shortDate(x.due_date)) + ')' : 'Meeting of ' + h(shortDate(x.meeting_date))) +
            (x.last_contact ? ' · last contact ' + h(shortDate(x.last_contact.date)) + ' by ' + h(METHOD[x.last_contact.method] || x.last_contact.method) : '') + '</span></span></button>';
        }).join('') : '<div class="empty">' + (items.length ? 'Nobody in this group.' : 'Nobody needs a follow-up right now.') + '</div>';
        $all('#flist .row', el).forEach(function (b) {
          b.onclick = function () { contactSheet(items.filter(function (x) { return x.participant_id === b.dataset.id; })[0], null); };
        });
      }
      var fc = $('#fc', el); if (fc) fc.onchange = function () { fState.center = fc.value; viewFollowUp(el); };
      $all('.chip-btn', el).forEach(function (b) { b.onclick = function () { fState.reason = b.dataset.r; $all('.chip-btn', el).forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }; });
      $all('[data-bday]', el).forEach(function (b) {
        b.onclick = function () { contactSheet(f.birthdays.filter(function (x) { return x.participant_id === b.dataset.bday; })[0], 'birthday'); };
      });
      draw();
    });
  }

  /**
   * Contact a child or his guardian, then log what happened. Both numbers are offered;
   * the child's own number comes first when there is one.
   */
  function contactSheet(x, forced) {
    if (!templatesCache) { busy(true); loadTemplates().then(function () { busy(false); contactSheet(x, forced); }).catch(fail); return; }
    var programId = (jobCenters('followup').filter(function (c) { return c.center_id === x.center_id; })[0] || {}).program_id;
    var reason = forced || x.reasons[0], purpose = PURPOSE_FOR[reason] || 'absentee';
    var tpl = ((templatesCache && templatesCache.templates[programId]) || {})[purpose] || { body: '', body_guardian: '' };
    var ctx = { child: firstName(x.name), date: x.meeting_date ? fmtDate(x.meeting_date) : '', theme: x.theme || '', center: x.center, leader: firstName(me.user.name) };
    var who = [];
    if (x.phone) who.push({ key: 'child', label: x.name.split(' ')[0] + ' (child)', phone: x.phone, text: fillTemplate(tpl.body, Object.assign({}, ctx, { name: firstName(x.name) })) });
    if (x.guardian_phone) who.push({ key: 'guardian', label: (x.guardian_name || 'Guardian') + ' (guardian)', phone: x.guardian_phone,
      text: fillTemplate(tpl.body_guardian || tpl.body, Object.assign({}, ctx, { name: String(x.guardian_name || '').trim() || 'there' })) });
    var reasonText = reason === 'birthday' ? 'Birthday ' + (x.in_days === 0 ? 'today' : 'on ' + fmtDate(x.birthday)) + ', turns ' + x.turning
      : x.reasons.map(function (r) { return r === 'inactive' ? 'Missed ' + x.streak + ' meetings in a row' : r === 'due' ? 'Next action due: ' + x.due_action : REASON[r][0]; }).join(' · ');
    var d = sheet(x.name,
      '<p class="muted">' + h(reasonText) + '</p>' + (x.meeting_date && reason !== 'birthday' && reason !== 'due' ? '<p class="small muted">' + h(fmtDate(x.meeting_date)) + (x.theme ? ' · ' + h(x.theme) : '') + '</p>' : '') +
      (x.last_contact ? '<p class="small">Last contact ' + h(fmtDate(x.last_contact.date)) + ' by ' + h(METHOD[x.last_contact.method] || '') + ': ' + h(x.last_contact.outcome) + '</p>' : '') +
      (who.length ? who.map(function (w, i) {
        return '<div class="contact"><p><strong>' + h(w.label) + '</strong> · ' + h(w.phone) + '</p>' +
          '<label class="field small">Message<textarea rows="4" data-msg="' + i + '">' + h(w.text) + '</textarea></label>' +
          '<div class="cbtns"><a class="btn quiet" data-m="call" href="tel:' + h(telNumber(w.phone)) + '">Call</a>' +
          '<a class="btn quiet" data-m="whatsapp" data-w="' + i + '" target="_blank" rel="noopener" href="#">WhatsApp</a>' +
          '<a class="btn quiet" data-m="sms" data-w="' + i + '" href="#">SMS</a></div></div>';
      }).join('') : '<p class="error">No phone number is recorded for this child or the guardian. Add one under Children, or log a visit.</p>') +
      '<hr><h2>Log what happened</h2>' +
      '<div class="seg" role="radiogroup" style="margin-top:8px">' + Object.keys(METHOD).map(function (m) { return '<label><input type="radio" name="method" value="' + m + '"><span>' + METHOD[m] + '</span></label>'; }).join('') + '</div>' +
      '<div class="chips" style="margin-top:10px">' + ['Spoke with guardian', 'Spoke with child', 'No answer', 'Message sent', 'Will come next time', 'Was sick', 'Travelled'].map(function (o) {
        return '<button type="button" class="chip-btn" data-o="' + h(o) + '">' + h(o) + '</button>'; }).join('') + '</div>' +
      '<label class="field">What happened<input type="text" name="outcome" maxlength="300" autocomplete="off"></label>' +
      '<label class="field">Notes<span class="hint">Optional</span><textarea name="notes" rows="2" maxlength="1000"></textarea></label>' +
      '<div class="two"><label class="field">Next action<span class="hint">Optional</span><input type="text" name="next_action" maxlength="200" placeholder="e.g. Call again"></label>' +
      '<label class="field">On<span class="hint">Back on the list then</span><input type="date" name="next_action_date"></label></div>',
      'Save', function (form) {
        var f = form.elements, m = form.querySelector('[name=method]:checked');
        if (!m) throw new Error('Choose how you made contact: Call, WhatsApp, SMS or Visit.');
        if (!f.outcome.value.trim()) throw new Error('Say what happened.');
        if (f.next_action_date.value && !f.next_action.value.trim()) throw new Error('Say what the next action is.');
        var body = { participant_id: x.participant_id, session_id: reason === 'birthday' ? '' : x.session_id, reason: reason,
          method: m.value, outcome: f.outcome.value, notes: f.notes.value, next_action: f.next_action.value, next_action_date: f.next_action_date.value };
        var keep = function () {
          Sync.add('logFollowUp', body, 'Follow-up: ' + x.name + ', ' + METHOD[m.value]);
          toast('Saved on this phone. It is sent when you are online.'); render();
        };
        if (!navigator.onLine) return keep();
        body.client_id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
        return Api.call('logFollowUp', body).then(function () { toast('Saved for ' + firstName(x.name)); render(); })
          .catch(function (e) { if (e.code === 'OFFLINE') return keep(); throw e; });
      });
    var pick = function (m) { var r = d.querySelector('[name=method][value=' + m + ']'); if (r) r.checked = true; };
    $all('[data-m]', d).forEach(function (a) {
      a.addEventListener('click', function (e) {
        pick(a.dataset.m);
        if (a.dataset.w === undefined) return;
        var i = +a.dataset.w, w = who[i], text = d.querySelector('[data-msg="' + i + '"]').value;
        if (a.dataset.m === 'whatsapp') a.href = 'https://wa.me/' + waNumber(w.phone) + '?text=' + encodeURIComponent(text);
        else { e.preventDefault(); location.href = 'sms:' + telNumber(w.phone) + '?body=' + encodeURIComponent(text); }
      });
    });
    $all('[data-o]', d).forEach(function (b) { b.onclick = function () { d.querySelector('[name=outcome]').value = b.dataset.o; }; });
  }

  /* ---------- a child's history ---------- */
  var DECISION_NAME = { salvation: 'Salvation', rededication: 'Rededication', commitment_to_grow: 'Commitment to grow' };
  function historySheet(p) {
    busy(true);
    Api.call('participantHistory', { participant_id: p.participant_id }).then(function (r) {
      busy(false);
      sheet(p.name,
        '<div class="tiles">' + tile(r.rate === null ? '–' : r.rate + '%', 'attendance', r.present + ' of ' + r.recorded + ' meetings') +
          tile(r.present_streak, 'in a row now') + tile(r.best_streak, 'best run') + '</div>' +
        (r.absent_streak ? '<p class="small"><span class="badge ' + (r.absent_streak > 1 ? 'bad' : 'warn') + '">Missed the last ' + (r.absent_streak === 1 ? 'meeting' : r.absent_streak + ' meetings') + '</span></p>' : '') +
        '<h3 style="margin-top:14px">Meetings</h3>' + (r.attendance.length ? '<div class="dots">' + r.attendance.slice().reverse().map(function (a) {
          return '<span class="dot' + (a.present ? ' on' : '') + '" title="' + h(fmtDate(a.date)) + ': ' + (a.present ? 'present' : 'absent') + '"><i></i><small>' + h(shortDate(a.date)) + '</small></span>';
        }).join('') + '</div><p class="small muted">Green = present. Oldest on the left.</p>' : '<p class="muted small">No submitted meeting yet.</p>') +
        '<h3 style="margin-top:14px">Decisions</h3>' + (r.decisions.length ? '<ul class="plain">' + r.decisions.map(function (x) { return '<li>' + h(fmtDate(x.date)) + ': ' + h(x.type === 'other' ? x.label : (DECISION_NAME[x.type] || x.type)) + '</li>'; }).join('') + '</ul>' : '<p class="muted small">None recorded.</p>') +
        '<h3 style="margin-top:14px">Follow-up log</h3>' + (r.followups.length ? '<ul class="plain">' + r.followups.map(function (x) {
          return '<li><strong>' + h(fmtDate(x.date)) + '</strong> · ' + h(METHOD[x.method] || x.method) + (x.by ? ' by ' + h(x.by) : '') + '<br>' + h(x.outcome) +
            (x.notes ? '<br><span class="muted">' + h(x.notes) + '</span>' : '') + (x.next_action ? '<br><span class="small">Next: ' + h(x.next_action) + (x.next_action_date ? ' on ' + h(fmtDate(x.next_action_date)) : '') + '</span>' : '') + '</li>';
        }).join('') + '</ul>' : '<p class="muted small">No contact logged yet.</p>'));
    }).catch(fail);
  }

  /* ---------- statistics ---------- */
  var sState = { months: 6, program: '', center: '' };
  function viewStats(el) {
    paint(el, 'stats|' + sState.months + '|' + sState.program + '|' + sState.center, function () { return Api.call('stats', { months: sState.months, program_id: sState.program || undefined, center_id: sState.center || undefined }); }, function (st) {
      var T = st.totals, avg = T.meetings ? Math.round(T.present * 10 / T.meetings) / 10 : 0, tr = st.trend;
      var progs = st.programs, cents = st.centers.filter(function (c) { return !sState.program || c.program_id === sState.program; });
      el.innerHTML = (me.can.record ? '<a href="#/more" class="small">‹ More</a>' : '') + '<h1>Statistics</h1>' +
        '<div class="seg small-seg">' + [3, 6, 12].map(function (m) { return '<label><input type="radio" name="months" value="' + m + '"' + (sState.months === m ? ' checked' : '') + '><span>' + m + ' months</span></label>'; }).join('') + '</div>' +
        (progs.length > 1 && !sState.center ? '<label class="field">Program<select id="sp"><option value="">All programs</option>' + progs.map(function (p) {
          return '<option value="' + h(p.program_id) + '"' + (p.program_id === sState.program ? ' selected' : '') + '>' + h(p.name) + '</option>'; }).join('') + '</select></label>' : '') +
        ((cents.length > 1 || sState.center) ? '<label class="field">Center<select id="sc"><option value="">All centers</option>' + cents.map(function (c) {
          return '<option value="' + h(c.center_id) + '"' + (c.center_id === sState.center ? ' selected' : '') + '>' + h(c.name) + '</option>'; }).join('') + '</select></label>' : '') +
        '<div class="tiles">' + tile(avg, 'present per meeting', T.meetings + (T.meetings === 1 ? ' meeting' : ' meetings')) + tile(T.first_timers, 'first-timers') +
          tile(T.decisions, 'decisions') + tile(T.retention ? T.retention.pct + '%' : '–', 'came back', T.retention ? T.retention.returned + ' of ' + T.retention.first_timers + ' first-timers' : 'no first-timers yet') + '</div>' +
        (tr.length ? '<section class="card"><h2>Attendance per meeting</h2><p class="small muted">All selected centers together. Tap a bar for the numbers.</p>' +
          barChart({ id: 'st-att', labels: tr.map(function (b) { return shortDate(b.date); }), full: tr.map(function (b) { return fmtDate(b.date) + ' (' + b.centers + (b.centers === 1 ? ' center)' : ' centers)'); }),
            series: [{ name: 'Returning', color: 'var(--s1)', values: tr.map(function (b) { return b.returning; }) }, { name: 'First-timers', color: 'var(--s2)', values: tr.map(function (b) { return b.first_timers; }) }] }) + '</section>' +
          (T.decisions ? '<section class="card"><h2>Decisions per meeting</h2>' +
            barChart({ id: 'st-dec', labels: tr.map(function (b) { return shortDate(b.date); }), full: tr.map(function (b) { return fmtDate(b.date); }),
              series: [{ name: 'Salvation', color: 'var(--s1)', values: tr.map(function (b) { return b.salvation; }) },
                       { name: 'Rededication', color: 'var(--s2)', values: tr.map(function (b) { return b.rededication; }) },
                       { name: 'Commitment to grow', color: 'var(--s3)', values: tr.map(function (b) { return b.commitment_to_grow; }) },
                       { name: 'Other kinds', color: 'var(--s4)', values: tr.map(function (b) { return b.other || 0; }) }].filter(function (x, i) { return i < 3 || x.values.some(Boolean); }) }) + '</section>' : '')
          : '<div class="card empty">No submitted reports in this period.</div>') +
        (st.per_center.length > 1 ? '<section class="card"><h2>Centers compared</h2><p class="small muted">Average present per meeting</p>' +
          hbars(st.per_center, function (c) { return c.name; }, function (c) { return c.avg_present; }) +
          '<div class="scroll"><table class="data"><thead><tr><th>Center</th><th>Reports</th><th>Avg present</th><th>First-timers</th><th>Decisions</th><th>Came back</th><th>On time</th><th>Tasks done</th></tr></thead><tbody>' +
          st.per_center.map(function (c) {
            return '<tr><td>' + h(c.name) + '</td><td>' + c.reports + '</td><td>' + c.avg_present + '</td><td>' + c.first_timers + '</td><td>' + c.decisions + '</td><td>' +
              (c.retention ? c.retention.pct + '%' : '–') + '</td><td>' + (c.on_time_pct === null ? '–' : c.on_time_pct + '%') + '</td><td>' +
              (c.task_completion ? c.task_completion.pct + '% (' + c.task_completion.done + '/' + c.task_completion.total + ')' : '–') + '</td></tr>';
          }).join('') + '</tbody></table></div><p class="small muted">Tasks done: tasks of the center due in this period that are marked done.</p></section>' : '') +
        (st.per_program.length ? '<section class="card"><h2>Programs compared</h2>' + hbars(st.per_program, function (p) { return p.name; }, function (p) { return p.avg_present_per_meeting; }) +
          '<div class="scroll"><table class="data"><thead><tr><th>Program</th><th>Centers</th><th>Meetings</th><th>Avg present</th><th>First-timers</th><th>Decisions</th></tr></thead><tbody>' +
          st.per_program.map(function (p) { return '<tr><td>' + h(p.name) + '</td><td>' + p.centers + '</td><td>' + p.meetings + '</td><td>' + p.avg_present_per_meeting + '</td><td>' + p.first_timers + '</td><td>' + p.decisions + '</td></tr>'; }).join('') +
          '</tbody></table></div></section>' : '') +
        (st.children ? '<section class="card"><h2>Most faithful</h2><p class="small muted">Attendance rate in this period, at least 2 meetings</p>' +
          (st.children.faithful.length ? '<div class="list">' + st.children.faithful.map(function (k) {
            return '<div class="row static"><span class="grow"><span class="name">' + h(k.name) + '</span><br><span class="sub">' + (st.per_center.length > 1 ? h(k.center) + ' · ' : '') +
              k.present + ' of ' + k.recorded + ' · ' + k.streak + ' in a row now · best run ' + k.best_streak + '</span></span><span class="badge">' + k.rate + '%</span></div>'; }).join('') + '</div>' : '<p class="muted small">Not enough meetings yet.</p>') +
          '</section><section class="card"><h2>At risk</h2><p class="small muted">Missed ' + (st.children.at_risk.length ? 'several' : '') + ' meetings in a row (from the setting “inactivity meetings”)</p>' +
          (st.children.at_risk.length ? '<div class="list">' + st.children.at_risk.map(function (k) {
            return '<div class="row static"><span class="grow"><span class="name">' + h(k.name) + '</span><br><span class="sub">' + (st.per_center.length > 1 ? h(k.center) + ' · ' : '') +
              (k.last_present ? 'last came ' + h(fmtDate(k.last_present)) : 'never present yet') + '</span></span><span class="badge bad">' + k.absent_streak + ' missed</span></div>'; }).join('') + '</div>' : '<p class="muted small">Nobody right now.</p>') +
          '</section>' : '') +
        '<p class="small muted center">' + h(fmtDate(st.range.from)) + ' – ' + h(fmtDate(st.range.to)) + ' · submitted reports only</p>';
      $all('[name=months]', el).forEach(function (i) { i.onchange = function () { sState.months = +i.value; viewStats(el); }; });
      var sp = $('#sp', el); if (sp) sp.onchange = function () { sState.program = sp.value; sState.center = ''; viewStats(el); };
      var sc = $('#sc', el); if (sc) sc.onchange = function () { sState.center = sc.value; viewStats(el); };
      wireCharts(el);
    });
  }

  /* ---------- message templates ---------- */
  var TPL_NAME = { absentee: 'Absent', inactivity: 'Missed several in a row', first_timer: 'First-timer welcome', decision: 'After a decision', birthday: 'Birthday' };
  var tState = { program: '' };
  function viewTemplates(el) {
    templatesCache = null;
    el.innerHTML = skeleton();
    loadTemplates().then(function (t) {
      var pids = Object.keys(t.templates);
      if (!tState.program || pids.indexOf(tState.program) === -1) tState.program = pids[0] || '';
      var set = t.templates[tState.program] || {}, canEdit = t.can_edit.indexOf(tState.program) !== -1;
      el.innerHTML = '<a href="#/more" class="small">‹ More</a><h1>Message templates</h1>' +
        '<p class="muted small">Used by the WhatsApp and SMS buttons in Follow-up. You can still change a message before sending it.</p>' +
        (pids.length > 1 ? '<label class="field">Program<select id="tp">' + pids.map(function (p) { return '<option value="' + h(p) + '"' + (p === tState.program ? ' selected' : '') + '>' + h(programName(p)) + '</option>'; }).join('') + '</select></label>' : '') +
        '<div class="card small"><strong>Placeholders</strong><br>{name} the person you message · {child} the child\'s first name · {date} meeting date · {theme} · {center} · {leader} your first name</div>' +
        Object.keys(TPL_NAME).map(function (k) {
          var x = set[k]; if (!x) return '';
          return '<section class="card"><div class="head"><h2>' + TPL_NAME[k] + '</h2>' + (x.own ? '<span class="badge">This program</span>' : '') +
            (canEdit ? '<button class="btn quiet mini" data-edit="' + k + '">Edit</button>' : '') + '</div>' +
            '<p class="small muted">To the child</p><p class="tpl">' + h(x.body) + '</p><p class="small muted">To the guardian</p><p class="tpl">' + h(x.body_guardian) + '</p></section>';
        }).join('') + (!canEdit ? '<p class="small muted">Only the Coordinator of the program can change these.</p>' : '');
      var tp = $('#tp', el); if (tp) tp.onchange = function () { tState.program = tp.value; viewTemplates(el); };
      $all('[data-edit]', el).forEach(function (b) {
        b.onclick = function () {
          var k = b.dataset.edit, x = set[k];
          var d = sheet(TPL_NAME[k],
            '<label class="field">To the child<textarea name="body" rows="5" maxlength="700">' + h(x.body) + '</textarea></label>' +
            '<label class="field">To the guardian<textarea name="body_guardian" rows="5" maxlength="700">' + h(x.body_guardian) + '</textarea></label>' +
            '<p class="small muted">{name} {child} {date} {theme} {center} {leader}</p>' +
            (x.own ? '<p><button type="button" class="linkbtn" data-reset>Go back to the standard message</button></p>' : ''),
            'Save', function (form) {
              return Api.call('saveTemplate', { program_id: tState.program, purpose: k, body: form.elements.body.value, body_guardian: form.elements.body_guardian.value })
                .then(function (r) { templatesCache = r; toast('Message saved'); render(); });
            });
          var rs = $('[data-reset]', d);
          if (rs) rs.onclick = function () {
            d.close(); busy(true);
            Api.call('saveTemplate', { program_id: tState.program, purpose: k, reset: true }).then(function (r) { busy(false); templatesCache = r; toast('Standard message restored'); render(); }).catch(fail);
          };
        };
      });
    }).catch(fail);
  }

  /* ---------- tasks: jobs handed to someone in the team ---------- */
  var PRIORITY = { high: ['High', 'bad'], medium: ['Medium', 'warn'], low: ['Low', 'off'] };
  var TSTATUS = { open: 'To do', in_progress: 'Doing', done: 'Done' };
  var KIND = { report: 'Submit a report', followup: 'Follow-up', children: 'Children' };
  var KIND_HELP = {
    report: 'Takes the attendance and submits one center\'s report for one meeting. The task is finished when the report is submitted.',
    followup: 'Calls and messages the children on the center\'s follow-up list and logs what happened.',
    children: 'Adds new children and fills in missing details for the center. Deleting stays with you.'
  };
  function taskRow(t) {
    var icon = t.kind ? ICON['job_' + t.kind] : '';
    return '<button type="button" class="row task' + (t.overdue ? ' late' : '') + (t.status === 'done' ? ' done' : '') + '" data-task="' + h(t.task_id) + '">' +
      '<span class="tick-s" aria-hidden="true">' + (t.status === 'done' ? '✓' : icon) + '</span><span class="grow"><span class="name">' + h(t.title) + '</span><br>' +
      '<span class="sub">' + (t.assigned_to === me.user.user_id ? 'From ' + h(t.assigner) : 'To ' + h(t.assignee)) +
      (t.due_date ? ', by ' + h(shortDate(t.due_date)) : '') + (t.comments ? ', ' + t.comments + ' comment' + (t.comments > 1 ? 's' : '') : '') + '</span><br>' +
      (t.overdue ? '<span class="badge bad">Overdue</span>' : '') + (t.status === 'in_progress' ? '<span class="badge warn">Doing</span>' : '') +
      (t.status === 'done' ? '<span class="badge">Done' + (t.completion_date ? ' ' + h(shortDate(t.completion_date)) : '') + '</span>' : '') +
      (t.priority === 'high' && t.status !== 'done' ? '<span class="badge bad">High</span>' : '') + (!t.kind ? '<span class="badge off">Older to-do</span>' : '') +
      '</span></button>';
  }
  function wireTaskRows(el) {
    $all('[data-task]', el).forEach(function (b) { b.onclick = function () { taskSheet(b.dataset.task); }; });
  }
  var tkState = { view: 'mine', status: 'open', center: '', person: '' };
  function viewTasks(el, args) {
    if (!me.can.assign_tasks) tkState.view = 'mine';
    paint(el, 'tasks|' + tkState.view, function () { return Api.call('listTasks', { view: tkState.view }); }, function (r) {
      var tasks = r.tasks, centers = {}, people = {};
      tasks.forEach(function (t) { if (t.center) centers[t.center_id] = t.center; people[t.assigned_to] = t.assignee; });
      var tracking = tkState.view === 'tracking';
      var shown = tasks.filter(function (t) {
        if (tkState.status === 'open' && t.status === 'done') return false;
        if (tkState.status === 'overdue' && !t.overdue) return false;
        if (tkState.status === 'done' && t.status !== 'done') return false;
        if (tracking && tkState.center && t.center_id !== tkState.center) return false;
        if (tracking && tkState.person && t.assigned_to !== tkState.person) return false;
        return true;
      });
      var done = tasks.filter(function (t) { return t.status === 'done'; }).length, late = tasks.filter(function (t) { return t.overdue; }).length;
      el.innerHTML = '<a href="#/more" class="small">‹ More</a><h1>Tasks</h1>' +
        '<p class="muted small">' + (me.can.assign_tasks ? 'Hand a job to someone in your team: a report, the follow-up, or the children of a center. They can do that job in the app until it is done or you cancel it.'
          : 'Jobs handed to you. Open one from Home to start.') + '</p>' +
        (me.can.assign_tasks ? '<div class="seg"><label><input type="radio" name="tv" value="mine"' + (!tracking ? ' checked' : '') + '><span>Handed to me</span></label>' +
          '<label><input type="radio" name="tv" value="tracking"' + (tracking ? ' checked' : '') + '><span>Handed out by me</span></label></div>' : '') +
        (tracking && tasks.length ? '<div class="tiles">' + tile(done + ' of ' + tasks.length, 'done') + tile(late, 'overdue') + '</div>' : '') +
        '<div class="chips">' + [['open', 'Not done'], ['overdue', 'Overdue'], ['done', 'Done'], ['all', 'All']].map(function (x) {
          return '<button type="button" class="chip-btn' + (tkState.status === x[0] ? ' on' : '') + '" data-s="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (tracking && Object.keys(centers).length > 1 ? '<label class="field">Center<select id="tkc"><option value="">All centers</option>' + Object.keys(centers).map(function (c) {
          return '<option value="' + h(c) + '"' + (c === tkState.center ? ' selected' : '') + '>' + h(centers[c]) + '</option>'; }).join('') + '</select></label>' : '') +
        (tracking && Object.keys(people).length > 1 ? '<label class="field">Person<select id="tkp"><option value="">Everyone</option>' + Object.keys(people).sort(function (a, b) { return people[a].localeCompare(people[b]); }).map(function (u) {
          return '<option value="' + h(u) + '"' + (u === tkState.person ? ' selected' : '') + '>' + h(people[u]) + '</option>'; }).join('') + '</select></label>' : '') +
        '<div class="list">' + (shown.length ? shown.map(taskRow).join('') : '<div class="empty">' + (tasks.length ? 'No task in this list.' : tracking ? 'You have not handed out any job yet.' : 'Nothing is handed to you.') + '</div>') + '</div>' +
        (me.can.assign_tasks ? '<button class="btn fab" id="add-task">+ Hand over a job</button>' : '');
      $all('[name=tv]', el).forEach(function (i) { i.onchange = function () { tkState.view = i.value; tkState.center = tkState.person = ''; viewTasks(el); }; });
      $all('[data-s]', el).forEach(function (b) { b.onclick = function () { tkState.status = b.dataset.s; viewTasks(el); }; });
      var c = $('#tkc', el); if (c) c.onchange = function () { tkState.center = c.value; viewTasks(el); };
      var pp = $('#tkp', el); if (pp) pp.onchange = function () { tkState.person = pp.value; viewTasks(el); };
      if (me.can.assign_tasks) $('#add-task', el).onclick = function () { taskForm(null); };
      wireTaskRows(el);
      if (args && args[0]) {
        // Opened from a notification: show the task once, then forget it so a refresh does not reopen it.
        var tid = args[0]; args[0] = '';
        history.replaceState(null, '', location.pathname + location.search + '#/tasks'); currentHash = '#/tasks';
        taskSheet(tid);
      }
    });
  }

  /** Hand over a job: what (report / follow-up / children), where (center, meeting), to whom, by when. */
  function taskForm(t) {
    if (t) {
      sheet('Edit task',
        '<p class="small muted">' + h(t.title) + ', to ' + h(t.assignee) + '</p>' +
        '<label class="field">Note for ' + h(firstName(t.assignee)) + '<textarea name="description" rows="3" maxlength="1000">' + h(t.description) + '</textarea></label>' +
        '<label class="field">Finish by<span class="hint">Optional</span><input type="date" name="due_date" value="' + h(t.due_date) + '"></label>' +
        '<div class="field">Priority<div class="seg">' + ['low', 'medium', 'high'].map(function (x) {
          return '<label><input type="radio" name="priority" value="' + x + '"' + (t.priority === x ? ' checked' : '') + '><span>' + PRIORITY[x][0] + '</span></label>'; }).join('') + '</div></div>',
        'Save', function (form) {
          return Api.call('saveTask', { task_id: t.task_id, description: form.elements.description.value, due_date: form.elements.due_date.value,
            priority: (form.querySelector('[name=priority]:checked') || {}).value }).then(function () { toast('Task saved'); taskSheet(t.task_id); render(); });
        });
      return;
    }
    busy(true);
    Api.call('taskTargets').then(function (tg) {
      busy(false);
      if (!tg.centers.length) { toast('You have no center to hand a job in.', true); return; }
      var d = sheet('Hand over a job',
        '<div class="field">Job<div class="seg" id="kinds">' + Object.keys(KIND).map(function (k, i) {
          return '<label><input type="radio" name="kind" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span>' + KIND[k] + '</span></label>'; }).join('') + '</div>' +
          '<span class="hint" id="kind-help"></span></div>' +
        (tg.centers.length > 1 ? '<label class="field">Center<select name="center">' + tg.centers.map(function (c) {
          return '<option value="' + h(c.center_id) + '">' + h(c.name) + '</option>'; }).join('') + '</select></label>' : '<p class="small" style="margin-top:12px">Center: <strong>' + h(tg.centers[0].name) + '</strong></p>') +
        '<label class="field" id="mtg-field">Meeting<select name="meeting"></select></label>' +
        '<h3 style="margin-top:16px">To whom</h3>' +
        (tg.people.length ? '<input type="search" id="wq" placeholder="Find a name" autocomplete="off"><div class="picklist">' + tg.people.map(function (p) {
          return '<label class="check" data-centers="' + h(p.center_ids.join(',')) + '"><input type="radio" name="uid" value="' + h(p.user_id) + '"><span>' + h(p.name) +
            '<br><span class="small muted">' + h(ROLE[p.role]) + (p.center ? ', ' + h(p.center) : '') + '</span></span></label>'; }).join('') + '</div>'
          : '<p class="error">There is nobody else in your team yet. Add an assistant under Team first.</p>') +
        '<label class="field">Note<span class="hint">Optional, e.g. why you are handing it over</span><textarea name="description" rows="2" maxlength="1000"></textarea></label>' +
        '<label class="field">Finish by<span class="hint">Optional</span><input type="date" name="due_date"></label>',
        'Hand over', function (form) {
          var f = form.elements, kind = form.querySelector('[name=kind]:checked').value, who = form.querySelector('[name=uid]:checked');
          if (!who) throw new Error('Choose who gets the job.');
          var center = f.center ? f.center.value : tg.centers[0].center_id;
          if (kind === 'report' && !f.meeting.value) throw new Error('Choose the meeting of the report.');
          return Api.call('saveTask', { kind: kind, center_id: center, meeting_id: kind === 'report' ? f.meeting.value : '', user_id: who.value,
            description: f.description.value, due_date: f.due_date.value }).then(function () { toast('Job handed over'); render(); });
        });
      function sync() {
        var kind = d.querySelector('[name=kind]:checked').value, center = d.querySelector('[name=center]') ? d.querySelector('[name=center]').value : tg.centers[0].center_id;
        var c = tg.centers.filter(function (x) { return x.center_id === center; })[0];
        $('#kind-help', d).textContent = KIND_HELP[kind];
        $('#mtg-field', d).hidden = kind !== 'report';
        var ms = tg.meetings.filter(function (m) { return m.program_id === c.program_id && m.submitted.indexOf(center) === -1; });
        d.querySelector('[name=meeting]').innerHTML = ms.length ? ms.map(function (m) { return '<option value="' + h(m.meeting_id) + '">' + h(fmtDate(m.date)) + ', ' + h(m.theme) + '</option>'; }).join('')
          : '<option value="">No open meeting without a report</option>';
        // People of the chosen center first.
        var list = $('.picklist', d);
        if (list) $all('.check', list).sort(function (a, b) { return (b.dataset.centers.indexOf(center) !== -1) - (a.dataset.centers.indexOf(center) !== -1); }).forEach(function (l) { list.appendChild(l); });
      }
      $all('[name=kind]', d).forEach(function (i) { i.onchange = sync; });
      var cs = d.querySelector('[name=center]'); if (cs) cs.onchange = sync;
      var wq = $('#wq', d); if (wq) wq.oninput = function () { var q = wq.value.toLowerCase(); $all('.picklist .check', d).forEach(function (l) { l.hidden = q && l.textContent.toLowerCase().indexOf(q) === -1; }); };
      sync();
    }).catch(fail);
  }

  function taskSheet(id) {
    busy(true);
    Api.call('getTask', { task_id: id }).then(function (r) {
      busy(false);
      var t = r.task, mine = t.assigned_to === me.user.user_id;
      var job = mine && t.status !== 'done' && t.kind ? (me.jobs || []).filter(function (j) { return j.task_id === t.task_id; })[0] : null;
      var statuses = t.kind === 'report' ? ['open', 'in_progress'] : ['open', 'in_progress', 'done'];
      var d = sheet(t.title,
        '<p class="small muted">' + (mine ? 'From ' + h(t.assigner) : 'To ' + h(t.assignee) + ', from ' + h(t.assigner)) + '</p>' +
        '<p>' + (t.due_date ? '<span class="badge ' + (t.overdue ? 'bad' : 'off') + '">' + (t.overdue ? 'Overdue, was due ' : 'Finish by ') + h(fmtDate(t.due_date)) + '</span>' : '') +
          '<span class="badge ' + PRIORITY[t.priority][1] + '">' + PRIORITY[t.priority][0] + ' priority</span>' + (t.status === 'done' ? '<span class="badge">Done</span>' : '') + '</p>' +
        (t.kind ? '<p class="small">' + h(KIND_HELP[t.kind]) + '</p>' : '') +
        (t.description ? '<p class="tpl">' + h(t.description) + '</p>' : '') +
        (job ? '<button type="button" class="btn block" data-a="open" style="margin-top:12px">' + JOB_VERB[t.kind] + '</button>' : '') +
        (t.can_update && t.status !== 'done' ? '<div class="field">Status<div class="seg" id="tstat">' + statuses.map(function (x) {
          return '<label><input type="radio" name="status" value="' + x + '"' + (t.status === x ? ' checked' : '') + '><span>' + TSTATUS[x] + '</span></label>'; }).join('') + '</div>' +
          (t.kind === 'report' ? '<span class="hint">Finished automatically when the report is submitted.</span>' : '') + '</div>' : '') +
        '<h3 style="margin-top:16px">Comments</h3><div class="comments">' + (r.comments.length ? r.comments.map(function (c) {
          return '<div class="cm' + (c.user_id === me.user.user_id ? ' mine' : '') + '"><strong>' + h(c.name) + '</strong> <span class="small muted">' + h(new Date(c.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span><br>' + h(c.comment) + '</div>';
        }).join('') : '<p class="small muted">No comments yet.</p>') + '</div>' +
        '<label class="field">Add a comment<textarea name="comment" rows="2" maxlength="1000"></textarea></label>' +
        (t.can_edit ? '<div class="stack" style="margin-top:14px">' + (t.status !== 'done' ? '<button type="button" class="btn quiet block" data-a="edit">Change note or date</button>' : '') +
          '<button type="button" class="btn danger block" data-a="del">' + (t.status === 'done' ? 'Remove from the list' : 'Cancel this job') + '</button></div>' : ''),
        'Post comment', function (form) {
          var text = form.elements.comment.value.trim();
          if (!text) throw new Error('Write a comment first.');
          return Api.call('addTaskComment', { task_id: t.task_id, comment: text }).then(function () { toast('Comment posted'); taskSheet(t.task_id); });
        });
      $all('[name=status]', d).forEach(function (i) {
        i.onchange = function () {
          Api.call('setTaskStatus', { task_id: t.task_id, status: i.value }).then(function () {
            toast(i.value === 'done' ? 'Marked done' : 'Status saved'); d.close();
            boot().then(render).catch(function () { render(); });
          }).catch(function (e) { toast(e.message, true); });
        };
      });
      $all('[data-a]', d).forEach(function (b) {
        b.onclick = function () {
          if (b.dataset.a === 'open') { d.close(); return openJob(job); }
          if (b.dataset.a === 'edit') { d.close(); return taskForm(t); }
          if (t.status !== 'done' && !confirm('Cancel this job? ' + t.assignee + ' can no longer do it in the app.')) return;
          d.close(); busy(true);
          Api.call('deleteTask', { task_id: t.task_id }).then(function () { busy(false); toast(t.status === 'done' ? 'Removed' : 'Job cancelled'); render(); }).catch(fail);
        };
      });
    }).catch(fail);
  }

  /* ---------- notifications ---------- */
  function viewNotifications(el) {
    el.innerHTML = skeleton();
    Api.call('listNotifications').then(function (r) {
      el.innerHTML = '<h1>Notifications</h1><div class="list">' + (r.notifications.length ? r.notifications.map(function (n) {
        return '<button type="button" class="row' + (n.read ? '' : ' unread') + '" data-link="' + h(n.link) + '"><span class="grow"><span class="name">' + h(n.title) + '</span><br><span class="sub">' + h(n.body) +
          ' · ' + h(new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span></span></button>';
      }).join('') : '<div class="empty">Nothing yet.</div>') + '</div>';
      $all('[data-link]', el).forEach(function (b) {
        b.onclick = function () { var l = b.dataset.link; if (l.indexOf('task:') === 0) go('#/tasks/' + l.slice(5)); };
      });
      if (r.unread) Api.call('markNotificationsRead', {}).then(function (x) {
        me.unread = x.unread; var bell = $('.bell .dotn'); if (bell) bell.remove();
      }).catch(function () {});
    }).catch(fail);
  }

  /* ---------- reminders ---------- */
  var CHANNEL = { email: 'Email', whatsapp: 'WhatsApp', sms: 'SMS' };
  var rmState = { channel: 'whatsapp' };
  function fillReminder(text, ctx) { return String(text || '').replace(/\{(\w+)\}/g, function (m, k) { return ctx[k] !== undefined ? ctx[k] : m; }); }
  function viewReminders(el, args) {
    el.innerHTML = skeleton();
    Api.call('reminderData', args && args[0] ? { meeting_id: args[0] } : {}).then(function (r) {
      var m = r.meeting, missing = r.centers.filter(function (c) { return !c.submitted; });
      var q = r.quota;
      el.innerHTML = '<a href="#/more" class="small">‹ More</a><h1>Reminders</h1>' +
        (m ? '<label class="field" style="margin-top:0">Meeting<select id="rm">' + r.meetings.map(function (x) {
          return '<option value="' + h(x.meeting_id) + '"' + (x.meeting_id === m.meeting_id ? ' selected' : '') + '>' + h(fmtDate(x.date)) + ' — ' + h(x.theme) + (x.status === 'closed' ? ' (closed)' : '') + '</option>'; }).join('') + '</select></label>' : '') +
        (m ? '<section class="card"><h2>Report not submitted</h2>' + (missing.length ? '<p class="small muted">Everyone below is ticked. Untick anyone you do not want to remind.</p>' + missing.map(function (c) {
          return '<div class="rc"><p><strong>' + h(c.name) + '</strong> ' + (c.draft ? '<span class="badge warn">Draft started</span>' : '<span class="badge off">Not started</span>') +
            (c.reminded ? '<span class="badge">Reminded ' + h(shortDate(c.reminded.slice(0, 10))) + '</span>' : '') + '</p>' +
            (c.team.length ? c.team.map(function (u) {
              return '<label class="check"><input type="checkbox" name="ru" value="' + h(u.user_id) + '" checked><span>' + h(u.name) + ' <span class="small muted">· ' + h(ROLE[u.role]) + '</span><br>' +
                '<span class="small muted">' + (u.email && !/@example\.(com|org|net)$/i.test(u.email) ? 'email ✓' : 'no email') + ' · ' + (u.phone ? 'phone ✓' : 'no phone') + '</span></span></label>'; }).join('')
              : '<p class="small error">No leader or assistant in this center. Add one under Team.</p>') + '</div>';
        }).join('') : '<p class="muted">Every center has submitted for this meeting.</p>') +
        (r.centers.length - missing.length ? '<p class="small muted" style="margin-top:8px">Submitted: ' + r.centers.filter(function (c) { return c.submitted; }).map(function (c) { return h(c.name); }).join(', ') + '</p>' : '') + '</section>' : '<div class="card empty">No meeting yet.</div>') +
        (m && missing.length ? '<section class="card"><h2>Send by</h2><div class="seg">' + Object.keys(CHANNEL).map(function (c) {
            return '<label><input type="radio" name="ch" value="' + c + '"' + (rmState.channel === c ? ' checked' : '') + '><span>' + CHANNEL[c] + '</span></label>'; }).join('') + '</div>' +
          '<p class="small muted" id="ch-note"></p>' +
          '<div class="head" style="margin-top:12px"><h3>Message</h3>' + (r.can_edit_template ? '<button type="button" class="btn quiet mini" id="edit-tpl">Edit</button>' : '') + '</div>' +
          '<p class="tpl" id="preview"></p><p class="small muted">Reminders never include children\'s names or details.</p>' +
          '<div class="stack" style="margin-top:12px"><button type="button" class="btn block" id="send">Remind</button>' +
          '<button type="button" class="btn quiet block" id="test">Send a test to me</button></div></section>' : '') +
        '<section class="card"><div class="head"><h2>Other message</h2><button type="button" class="btn ghost mini" id="custom">Write</button></div><p class="small muted">Any message to leaders and assistants in your centers.</p></section>' +
        '<section class="card"><div class="head"><h2>Automatic</h2>' + (r.automation.can_change ? '<button type="button" class="btn quiet mini" id="auto">Change</button>' : '') + '</div>' +
          '<p class="small">' + (r.automation.enabled ? 'On: centers that have not submitted get an email ' + r.automation.hours + ' hours after the meeting day.' : 'Off: report reminders are only sent from this screen.') + '</p>' +
          '<p class="small">Task reminders: ' + (r.automation.job ? r.automation.task_days + (r.automation.task_days === 1 ? ' day' : ' days') + ' before the due date.' : 'off.') + '</p>' +
          '<p class="small muted">' + q.left + ' emails left today (' + q.for_reminders + ' for reminders).</p></section>' +
        '<section class="card"><h2>Sent</h2>' + (r.log.length ? '<div class="list">' + r.log.map(function (l) {
          var badge = l.status === 'sent' ? '' : l.status === 'queued' ? 'warn' : l.status === 'failed' ? 'bad' : 'off';
          return '<' + (l.status === 'queued' && l.mine ? 'button type="button"' : 'div') + ' class="row' + (l.status === 'queued' && l.mine ? '' : ' static') + '" data-q="' + h(l.reminder_id) + '"><span class="grow"><span class="name">' + h(l.recipient || '—') + (l.center ? ' · ' + h(l.center) : '') + '</span><br>' +
            '<span class="sub">' + h(CHANNEL[l.channel] || l.channel) + ' · ' + h(l.type === 'report_submission' ? 'report' : l.type) + ' · ' + h(l.sent_by) + ' · ' + h(shortDate(String(l.sent_at).slice(0, 10))) + (l.error ? ' · ' + h(l.error) : '') + '</span></span>' +
            '<span class="badge ' + badge + '">' + (l.status === 'queued' ? 'To send' : l.status === 'sent' ? 'Sent' : l.status === 'failed' ? 'Failed' : 'Not sent') + '</span></' + (l.status === 'queued' && l.mine ? 'button' : 'div') + '>';
        }).join('') + '</div>' : '<p class="muted small">Nothing sent yet.</p>') + '</section>';

      var rmSel = $('#rm', el); if (rmSel) rmSel.onchange = function () { go('#/reminders/' + rmSel.value); };
      function chosen() { return $all('[name=ru]:checked', el).map(function (x) { return x.value; }); }
      function update() {
        var ch = (el.querySelector('[name=ch]:checked') || {}).value; if (!ch) return;
        rmState.channel = ch;
        var n = chosen().length;
        $('#ch-note', el).textContent = ch === 'email' ? q.for_reminders + ' reminder emails left today. Sent straight away from the Sheet owner\'s Gmail.'
          : 'You will tap through each message and press Send in ' + CHANNEL[ch] + ' yourself. No paid service is used.';
        $('#send', el).textContent = n ? 'Remind ' + n + (n === 1 ? ' person' : ' people') + ' by ' + CHANNEL[ch] : 'Tick someone to remind';
        $('#send', el).disabled = !n;
        var first = missing.filter(function (c) { return c.team.some(function (u) { return chosen().indexOf(u.user_id) !== -1; }); })[0] || missing[0];
        var u = first && first.team[0];
        $('#preview', el).textContent = fillReminder(r.template.body, { center: first ? first.name : '', leader: u ? firstName(u.name) : '', date: fmtDate(m.date), theme: m.theme, program: programName(m.program_id) });
      }
      if (m && missing.length) {
        $all('[name=ch], [name=ru]', el).forEach(function (i) { i.onchange = update; }); update();
        $('#send', el).onclick = function () {
          var ids = chosen(), ch = rmState.channel;
          if (ch === 'email' && !confirm('Email ' + ids.length + (ids.length === 1 ? ' person' : ' people') + ' now?')) return;
          sendReminders({ type: 'report_submission', meeting_id: m.meeting_id, channel: ch, user_ids: ids });
        };
        $('#test', el).onclick = function () { sendReminders({ test: true, meeting_id: m.meeting_id, channel: rmState.channel }); };
        var et = $('#edit-tpl', el);
        if (et) et.onclick = function () {
          var dd = sheet('Report reminder text',
            '<label class="field">Email subject<input type="text" name="subject" maxlength="150" value="' + h(r.template.subject) + '"></label>' +
            '<label class="field">Message<textarea name="body" rows="6" maxlength="1000">' + h(r.template.body) + '</textarea></label>' +
            '<p class="small muted">You can use {leader} {center} {date} {theme} {program}. Never a child\'s name or details.</p>' +
            (r.template.own ? '<p><button type="button" class="linkbtn" data-reset>Go back to the standard message</button></p>' : ''),
            'Save', function (form) {
              return Api.call('saveReminderTemplate', { program_id: m.program_id, subject: form.elements.subject.value, body: form.elements.body.value }).then(function () { toast('Message saved'); render(); });
            });
          var rs = $('[data-reset]', dd);
          if (rs) rs.onclick = function () { dd.close(); Api.call('saveReminderTemplate', { program_id: m.program_id, reset: true }).then(function () { toast('Standard message restored'); render(); }).catch(fail); };
        };
      }
      $('#custom', el).onclick = function () { customReminder(r); };
      var au = $('#auto', el); if (au) au.onclick = function () { automationForm(r.automation); };
      $all('button[data-q]', el).forEach(function (b) {
        b.onclick = function () {
          var l = r.log.filter(function (x) { return x.reminder_id === b.dataset.q; })[0];
          queueSheet([{ reminder_id: l.reminder_id, name: l.recipient, center: l.center, phone: l.to, number: waNumber(l.to), message: l.message }], l.channel);
        };
      });
    }).catch(fail);
  }

  function sendReminders(payload) {
    busy(true);
    return Api.call('sendReminders', payload).then(function (res) {
      busy(false);
      if (payload.channel === 'email') {
        sheet(payload.test ? 'Test sent' : 'Reminders sent',
          '<p>' + (res.sent ? '<strong>' + res.sent + '</strong> ' + (res.sent === 1 ? 'email was' : 'emails were') + ' sent.' : 'No email was sent.') + '</p>' +
          (res.skipped.length ? '<p style="margin-top:10px">Not sent:</p><ul class="small">' + res.skipped.map(function (x) { return '<li>' + h(x.name) + ': ' + h(x.error) + '</li>'; }).join('') + '</ul>' : '') +
          (res.failed.length ? '<p class="error">Failed: ' + res.failed.map(function (x) { return h(x.to) + ' (' + h(x.error) + ')'; }).join(', ') + '</p>' : '') +
          '<p class="small muted" style="margin-top:10px">' + res.quota.left + ' emails left today.</p>' +
          (res.skipped.some(function (x) { return x.error === 'No email address'; }) ? '<p class="small">Those without email can be reminded by WhatsApp or SMS.</p>' : ''));
        render();
      } else if (res.queue.length) {
        queueSheet(res.queue, payload.channel);
      } else {
        sheet('Nothing to send', '<p>None of the people chosen has a phone number.</p>' + res.skipped.map(function (x) { return '<p class="small">' + h(x.name) + ': ' + h(x.error) + '</p>'; }).join(''));
      }
    }).catch(fail);
  }

  /** Tap through WhatsApp/SMS reminders one by one; each is marked sent (or skipped). */
  function queueSheet(queue, channel) {
    var left = queue.length;
    var d = sheet(CHANNEL[channel] + ': ' + queue.length + (queue.length === 1 ? ' message' : ' messages'),
      '<p class="small muted">Tap Open, press Send in ' + CHANNEL[channel] + ', come back here and tap Sent.</p><div id="q">' + queue.map(function (x, i) {
        var link = channel === 'whatsapp' ? 'https://wa.me/' + x.number + '?text=' + encodeURIComponent(x.message) : 'sms:+' + x.number + '?body=' + encodeURIComponent(x.message);
        return '<div class="qi" data-i="' + i + '"><p><strong>' + h(x.name) + '</strong>' + (x.center ? ' · ' + h(x.center) : '') + '<br><span class="small muted">' + h(x.phone) + '</span></p>' +
          '<p class="small tpl">' + h(x.message) + '</p><div class="cbtns"><a class="btn" ' + (channel === 'whatsapp' ? 'target="_blank" rel="noopener" ' : '') + 'href="' + h(link) + '" data-open>Open</a>' +
          '<button type="button" class="btn ghost" data-sent>Sent</button><button type="button" class="btn quiet" data-skip>Skip</button></div></div>';
      }).join('') + '</div><p class="small" id="q-left"></p>');
    function count() { $('#q-left', d).textContent = left ? left + ' still to send.' : 'All done.'; }
    $all('.qi', d).forEach(function (row) {
      var x = queue[+row.dataset.i];
      var mark = function (status) {
        Api.call('markReminder', { reminder_id: x.reminder_id, status: status }).then(function () {
          row.classList.add('done'); row.querySelector('.cbtns').innerHTML = '<span class="badge ' + (status === 'sent' ? '' : 'off') + '">' + (status === 'sent' ? 'Sent' : 'Skipped') + '</span>';
          left--; count();
        }).catch(function (e) { toast(e.message, true); });
      };
      $('[data-sent]', row).onclick = function () { mark('sent'); };
      $('[data-skip]', row).onclick = function () { mark('skipped'); };
    });
    count();
    d.addEventListener('close', function () { if (location.hash.indexOf('#/reminders') === 0) render(); });
  }

  function customReminder(r) {
    var byCenter = {};
    r.team.forEach(function (u) { (byCenter[u.center || '—'] = byCenter[u.center || '—'] || []).push(u); });
    var d = sheet('Message to leaders',
      '<p class="small muted">Tick who gets it.</p>' + Object.keys(byCenter).sort().map(function (c) {
        return '<p style="margin-top:10px"><strong>' + h(c) + '</strong> <button type="button" class="linkbtn small" data-all="' + h(c) + '">all</button></p>' + byCenter[c].map(function (u) {
          return '<label class="check"><input type="checkbox" name="cu" value="' + h(u.user_id) + '" data-c="' + h(c) + '"><span>' + h(u.name) + ' <span class="small muted">· ' + h(ROLE[u.role]) + '</span></span></label>'; }).join('');
      }).join('') +
      '<div class="seg" style="margin-top:12px">' + Object.keys(CHANNEL).map(function (c) { return '<label><input type="radio" name="cch" value="' + c + '"' + (c === 'whatsapp' ? ' checked' : '') + '><span>' + CHANNEL[c] + '</span></label>'; }).join('') + '</div>' +
      '<label class="field">Email subject<span class="hint">Email only</span><input type="text" name="subject" maxlength="150"></label>' +
      '<label class="field">Message<textarea name="message" rows="5" maxlength="1000" placeholder="Hello {leader}, …"></textarea></label>' +
      '<p class="small muted">You can use {leader} and {center}. Do not include any child\'s name or details; the app refuses them.</p>',
      'Send', function (form) {
        var ids = $all('[name=cu]:checked', form).map(function (x) { return x.value; });
        if (!ids.length) throw new Error('Tick at least one person.');
        var msg = form.elements.message.value.trim(); if (msg.length < 5) throw new Error('Write the message.');
        var ch = form.querySelector('[name=cch]:checked').value;
        d.close();
        sendReminders({ type: 'custom', channel: ch, user_ids: ids, message: msg, subject: form.elements.subject.value });
        return true;
      });
    $all('[data-all]', d).forEach(function (b) { b.onclick = function () { $all('[name=cu][data-c="' + b.dataset.all + '"]', d).forEach(function (x) { x.checked = true; }); }; });
  }

  function automationForm(a) {
    sheet('Automatic reminders',
      '<label class="check"><input type="checkbox" name="on"' + (a.enabled ? ' checked' : '') + '><span><strong>Email centers that have not submitted</strong><br><span class="small muted">One email to the leaders and assistants of each late center, once per meeting.</span></span></label>' +
      '<label class="field">Hours after the meeting day<input type="text" inputmode="numeric" name="hours" value="' + h(a.hours) + '"></label>' +
      '<label class="field">Task reminder, days before due<span class="hint">0 = on the due date</span><input type="text" inputmode="numeric" name="days" value="' + h(a.task_days) + '"></label>' +
      '<label class="check"><input type="checkbox" name="job"' + (a.job ? ' checked' : '') + '><span><strong>Run the daily job</strong> (every morning around 7)<br><span class="small muted">Needed for task due reminders and automatic report emails.</span></span></label>',
      'Save', function (form) {
        var f = form.elements;
        return Api.call('saveAutomation', { enabled: f.on.checked, hours: Number(f.hours.value), task_days: Number(f.days.value), job: f.job.checked })
          .then(function () { toast('Saved'); render(); });
      });
  }

  /* ---------- combined report ---------- */
  var rpState = { mode: 'meeting', month: '', program: '' };
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function kindsText(k) { return Object.keys(k).map(function (x) { return x + ' ' + k[x]; }).join(', '); }
  /** Routes: #/reports (latest), #/reports/<meeting id>, #/reports/month/<yyyy-mm>/<program id> */
  function viewReports(el, args) {
    args = args || [];
    var payload = args[0] === 'month' ? { month: args[1], program_id: args[2] || undefined } : args[0] ? { meeting_id: args[0] } : null;
    if (!payload) {
      // Latest meeting that has at least one report.
      var ms = ((homeData && homeData.meetings) || []).filter(function (m) { return m.date <= (me.today || '9') && m.centers.some(function (c) { return c.state === 'submitted'; }); });
      payload = ms.length ? { meeting_id: ms[0].meeting_id } : { month: (me.today || new Date().toISOString()).slice(0, 7) };
    }
    rpState.mode = payload.month ? 'month' : 'meeting';
    paint(el, 'report|' + JSON.stringify(payload), function () { return Api.call('report', payload); }, function (r) { drawReport(el, r, payload); });
  }
  function drawReport(el, r, payload) {
    var T = r.totals, m0 = r.meetings[0];
    var reported = r.centers.filter(function (c) { return c.reported; }), missing = r.centers.filter(function (c) { return !c.reported; });
    var monthVal = r.period === 'month' ? r.month : (m0 ? m0.date.slice(0, 7) : (me.today || '').slice(0, 7));
    el.innerHTML =
      '<div class="no-print"><a href="#/more" class="small">‹ More</a><h1>Combined report</h1>' +
      '<div class="seg"><label><input type="radio" name="rmode" value="meeting"' + (r.period === 'meeting' ? ' checked' : '') + '><span>One meeting</span></label>' +
        '<label><input type="radio" name="rmode" value="month"' + (r.period === 'month' ? ' checked' : '') + '><span>A month</span></label></div>' +
      (r.period === 'meeting' ? '<label class="field">Meeting<select id="rmeet">' + r.choices.meetings.map(function (m) {
          return '<option value="' + h(m.meeting_id) + '"' + (m0 && m.meeting_id === m0.meeting_id ? ' selected' : '') + '>' + h(fmtDate(m.date)) + ', ' + h(m.theme) + '</option>'; }).join('') + '</select></label>'
        : '<div class="two"><label class="field">Month<input type="month" id="rmonth" value="' + h(monthVal) + '"></label>' +
          (r.choices.programs.length > 1 ? '<label class="field">Program<select id="rprog">' + r.choices.programs.map(function (p) {
            return '<option value="' + h(p.program_id) + '"' + (p.program_id === r.program_id ? ' selected' : '') + '>' + h(p.name) + '</option>'; }).join('') + '</select></label>' : '') + '</div>') +
      '<div class="stack" style="margin-top:14px"><button type="button" class="btn block" id="wa">Copy WhatsApp version</button>' +
        '<button type="button" class="btn quiet block" id="print">Print or save as PDF</button></div></div>' +

      '<article class="doc">' +
        '<header><img src="img/logo-96.png" alt="LivingSeed" width="64" height="64"><div><h1>' + h(r.program) + '</h1>' +
          '<p class="meta">' + h(r.org_name) + '. Combined report, ' + h(r.period === 'meeting' ? 'meeting of ' + r.period_label : r.period_label) + '</p></div></header>' +
        (r.meetings.length ? r.meetings.map(function (m) {
          return '<p class="meta" style="margin-top:10px"><strong>' + h(m.theme) + '</strong>' + (m.scripture ? ' (' + h(m.scripture) + ')' : '') + ', ' + h(fmtDate(m.date)) + '</p>'; }).join('')
          : '<p class="meta" style="margin-top:10px">No meeting in this month.</p>') +
        '<div class="figs"><div><b>' + T.present + '</b><span>present</span></div><div><b>' + T.first_timers + '</b><span>first-timers</span></div>' +
          '<div><b>' + T.decisions + '</b><span>decisions</span></div><div><b>' + T.reported + ' of ' + T.centers + '</b><span>centers reported</span></div></div>' +
        (r.previous ? '<p class="meta" style="margin-top:8px">' + h(r.previous.label) + ': ' + r.previous.present + ' present.</p>' : '') +
        (T.decisions ? '<p style="margin-top:10px"><strong>Decisions:</strong> ' + h(kindsText(T.decision_kinds)) + '</p>' : '') +

        '<h2>Attendance by center</h2><div class="scroll"><table class="data"><thead><tr><th>Center</th><th>Present</th><th>New</th><th>Returning</th><th>Decisions</th><th>Started</th></tr></thead><tbody>' +
          r.centers.map(function (c) {
            var s0 = c.sessions[0];
            return '<tr><td>' + h(c.name) + '</td>' + (c.reported ? '<td><strong>' + c.present + '</strong></td><td>' + c.first_timers + '</td><td>' + c.returning + '</td><td>' + c.decisions + '</td><td>' +
              h(c.sessions.map(function (s) { return (s.start_time || '?') + (s.punctuality === 'late' ? ' (late)' : ''); }).join(', ')) + '</td>'
              : '<td colspan="5" class="missing">No report submitted</td>') + '</tr>';
          }).join('') +
          '<tr><td><strong>Total</strong></td><td><strong>' + T.present + '</strong></td><td>' + T.first_timers + '</td><td>' + T.returning + '</td><td>' + T.decisions + '</td><td></td></tr>' +
        '</tbody></table></div>' +

        '<h2>From the centers</h2>' + (reported.length ? reported.map(function (c) {
          return '<div class="cblock"><h3>' + h(c.name) + '</h3>' + c.sessions.map(function (s) {
            return (r.meetings.length > 1 ? '<p class="meta">' + h(fmtDate(s.date)) + '</p>' : '') +
              '<p class="meta">Facilitators: ' + h(s.facilitators || 'not given') + (s.submitted_by ? '. Report by ' + h(s.submitted_by) : '') + '.</p>' +
              (Object.keys(c.decision_kinds).length ? '<p><strong>Decisions:</strong> ' + h(kindsText(c.decision_kinds)) + '</p>' : '') +
              (s.observations ? '<p><strong>Observations:</strong> ' + h(s.observations) + '</p>' : '') +
              (s.recommendations ? '<p><strong>Recommendations:</strong> ' + h(s.recommendations) + '</p>' : '');
          }).join('') + '</div>';
        }).join('') : '<p class="meta">No center has submitted yet.</p>') +
        (missing.length ? '<p class="missing" style="margin-top:12px">Not submitted: ' + h(missing.map(function (c) { return c.name; }).join(', ')) + '</p>' : '') +

        '<h2>Conclusion</h2>' +
        (r.can_edit ? '<div class="no-print"><textarea id="concl" rows="8" maxlength="4000">' + h(r.conclusion) + '</textarea>' +
            '<p class="small muted">' + (r.conclusion_saved ? 'Saved by ' + h(r.conclusion_by) + '.' : 'Drafted by the app from the figures. Edit it, then save.') + '</p>' +
            '<div class="stack" style="margin-top:8px"><button type="button" class="btn ghost block" id="save-concl">Save conclusion</button>' +
            (r.conclusion_saved ? '<button type="button" class="linkbtn" id="reset-concl">Go back to the app\'s draft</button>' : '') + '</div></div>' +
            '<p class="conclusion print-only" hidden>' + h(r.conclusion) + '</p>'
          : '<p class="conclusion">' + h(r.conclusion) + '</p>') +
        '<footer>Prepared with Outreach Tracker on ' + h(fmtDate(me.today || new Date().toISOString().slice(0, 10))) + '. Children\'s names and details are never part of this report.</footer>' +
      '</article>';

    var go2 = function (p2) { if (p2.meeting_id) go('#/reports/' + p2.meeting_id); else go('#/reports/month/' + p2.month + '/' + (p2.program_id || r.program_id)); };
    $all('[name=rmode]', el).forEach(function (i) {
      i.onchange = function () { go2(i.value === 'month' ? { month: monthVal, program_id: r.program_id } : { meeting_id: (r.choices.meetings[0] || {}).meeting_id || '' }); };
    });
    var rm = $('#rmeet', el); if (rm) rm.onchange = function () { go2({ meeting_id: rm.value }); };
    var rmo = $('#rmonth', el); if (rmo) rmo.onchange = function () { if (rmo.value) go2({ month: rmo.value, program_id: ($('#rprog', el) || {}).value || r.program_id }); };
    var rp = $('#rprog', el); if (rp) rp.onchange = function () { go2({ month: monthVal, program_id: rp.value }); };
    $('#print', el).onclick = function () {
      var c = $('#concl', el), pc = $('.print-only', el);
      if (c && pc) { pc.textContent = c.value; pc.hidden = false; }
      window.print();
      if (pc) pc.hidden = true;
    };
    $('#wa', el).onclick = function () {
      var c = $('#concl', el), text = whatsappReport(r, c ? c.value : r.conclusion);
      var done = function () { toast('Copied. Paste it in WhatsApp.'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { showText(text); });
      else showText(text);
    };
    var sv = $('#save-concl', el);
    if (sv) sv.onclick = function () {
      busy(true);
      Api.call('saveReportConclusion', Object.assign({}, payload, { conclusion: $('#concl', el).value })).then(function (x) {
        busy(false); Api.store.set(ckey('report|' + JSON.stringify(payload)), x); toast('Conclusion saved'); drawReport(el, x, payload);
      }).catch(fail);
    };
    var rs = $('#reset-concl', el);
    if (rs) rs.onclick = function () {
      busy(true);
      Api.call('saveReportConclusion', Object.assign({}, payload, { reset: true })).then(function (x) {
        busy(false); Api.store.set(ckey('report|' + JSON.stringify(payload)), x); toast('Back to the app\'s draft'); drawReport(el, x, payload);
      }).catch(fail);
    };
  }
  function showText(text) {
    var d = sheet('WhatsApp version', '<p class="small muted">Copy all of it and paste it in WhatsApp.</p><textarea rows="14" readonly>' + h(text) + '</textarea>');
    var ta = $('textarea', d); ta.focus(); ta.select();
  }
  /** Short, emoji-marked text for a WhatsApp group. WhatsApp shows *text* as bold and _text_ as italic. */
  function whatsappReport(r, conclusion) {
    var T = r.totals, lines = [];
    lines.push('📋 *' + r.program + '*');
    lines.push('*Combined report, ' + (r.period === 'meeting' ? r.period_label : r.period_label) + '*');
    r.meetings.forEach(function (m) { lines.push('📖 _' + m.theme + '_' + (m.scripture ? ' (' + m.scripture + ')' : '')); });
    lines.push('');
    lines.push('👥 *Attendance:* ' + T.present + ' (' + T.returning + ' returning, ' + T.first_timers + ' new)');
    lines.push('🙏 *Decisions:* ' + T.decisions + (T.decisions ? ', ' + kindsText(T.decision_kinds) : ''));
    lines.push('🏠 *Centers reported:* ' + T.reported + ' of ' + T.centers);
    if (r.previous) lines.push('📈 ' + r.previous.label + ': ' + r.previous.present + ' present');
    lines.push('');
    lines.push('*Per center*');
    r.centers.forEach(function (c) {
      if (!c.reported) { lines.push('⚠️ ' + c.name + ': no report yet'); return; }
      var late = c.sessions.some(function (s) { return s.punctuality === 'late'; });
      lines.push('📍 ' + c.name + ': ' + c.present + ' present' + (c.first_timers ? ' (' + c.first_timers + ' new)' : '') +
        (c.decisions ? ', ' + plural(c.decisions, 'decision') : '') + (late ? ', started late' : ''));
    });
    var notes = [];
    r.centers.forEach(function (c) { c.sessions.forEach(function (s) { if (s.recommendations) notes.push('• ' + c.name + ': ' + s.recommendations.replace(/\s+/g, ' ').slice(0, 160)); }); });
    if (notes.length) { lines.push(''); lines.push('*Recommendations*'); lines = lines.concat(notes); }
    lines.push('');
    lines.push('📝 *Conclusion*');
    lines.push(String(conclusion || '').trim());
    lines.push('');
    lines.push('_' + r.org_name + '_');
    return lines.join('\n');
  }

  /* ---------- message all children ---------- */
  function cleanGreeting(t) { return t.replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/g, ''); }
  /** One message to every active child of a center: group SMS (Android), WhatsApp one by one, or copy for a WhatsApp group. */
  function messageAll(centerId, kids) {
    var c = jobCenters('followup').filter(function (x) { return x.center_id === centerId; })[0] || { name: '' };
    var today = me.today || new Date().toISOString().slice(0, 10);
    var known = ((Api.store.get(ckey('meetings')) || {}).meetings || []).concat((homeData && homeData.meetings) || []);
    var next = known.filter(function (m) { return m.date >= today && m.program_id === c.program_id && m.status !== 'closed'; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
    var start = next ? 'Hello {name}, our next meeting is on {date}: "{theme}". We look forward to seeing you there!'
      : 'Hello {name}, ';
    var d = sheet('Message everyone at ' + c.name,
      '<p class="small muted">Send to</p><div class="seg three"><label><input type="radio" name="aud" value="child" checked><span>Children</span></label>' +
        '<label><input type="radio" name="aud" value="guardian"><span>Guardians</span></label><label><input type="radio" name="aud" value="both"><span>Both</span></label></div>' +
      '<p class="small muted" id="aud-note"></p>' +
      '<label class="field">Message<textarea name="msg" rows="5" maxlength="700">' + h(start) + '</textarea></label>' +
      '<p class="small muted">{name} becomes each person\'s name when you send one by one. {child} {center} {date} {theme} also work.</p>' +
      '<div class="stack" style="margin-top:12px">' +
        '<a class="btn block" id="sms-all" href="#">' + ICON.msg + ' SMS to everyone at once</a>' +
        '<button type="button" class="btn ghost block" id="one-by-one">WhatsApp or SMS, one by one</button>' +
        '<button type="button" class="btn quiet block" id="copy-msg">Copy the message for a WhatsApp group</button></div>' +
      '<p class="small muted" style="margin-top:8px">Sending to everyone at once works on most Android phones. On an iPhone, send one by one.</p>');
    function people() {
      var aud = d.querySelector('[name=aud]:checked').value, seen = {}, out = [], none = 0;
      var add = function (k, to) {
        var num = waNumber(to === 'child' ? k.phone : k.guardian_phone);
        if (!num || seen[num]) return !!num;   // brothers with the same guardian get one message
        seen[num] = true;
        out.push({ k: k, num: num, name: to === 'child' ? firstName(k.name) : (k.guardian_name || ''), to: to });
        return true;
      };
      kids.forEach(function (k) {
        var any;
        if (aud === 'both') { var a = k.phone ? add(k, 'child') : false, b = k.guardian_phone ? add(k, 'guardian') : false; any = a || b; }
        else if (aud === 'child') any = k.phone ? add(k, 'child') : (k.guardian_phone ? add(k, 'guardian') : false);
        else any = k.guardian_phone ? add(k, 'guardian') : false;
        if (!any) none++;
      });
      return { list: out, none: none };
    }
    function ctx(name, k) { return { name: name, child: k ? firstName(k.name) : '', center: c.name, date: next ? fmtDate(next.date) : '', theme: next ? next.theme : '' }; }
    function text(name, k) { return cleanGreeting(fillTemplate(d.querySelector('[name=msg]').value, ctx(name, k))); }
    function generic() { return cleanGreeting(fillTemplate(d.querySelector('[name=msg]').value.replace(/\{name\}/g, '').replace(/\{child\}/g, ''), ctx('', null))); }
    function update() {
      var p = people(), aud = d.querySelector('[name=aud]:checked').value;
      $('#aud-note', d).textContent = p.list.length + (p.list.length === 1 ? ' person' : ' people') +
        (aud === 'child' ? ' (the guardian when a child has no phone)' : aud === 'both' ? ': each child with a phone and each guardian' : '') +
        (p.none ? '. ' + plural(p.none, 'child', 'children') + ' without a number for this are left out.' : '.');
      $('#sms-all', d).href = 'sms:' + p.list.map(function (x) { return '+' + x.num; }).join(',') + '?body=' + encodeURIComponent(generic());
    }
    var log = function (channel, n) {
      var body = { center_id: centerId, channel: channel, count: n, audience: d.querySelector('[name=aud]:checked').value, message: d.querySelector('[name=msg]').value };
      Api.call('logBroadcast', body).catch(function (e) { if (e.code === 'OFFLINE') Sync.add('logBroadcast', body, 'Message to all of ' + c.name); });
    };
    $all('[name=aud]', d).forEach(function (i) { i.onchange = update; });
    d.querySelector('[name=msg]').oninput = update;
    $('#sms-all', d).addEventListener('click', function () { log('sms', people().list.length); });
    $('#copy-msg', d).onclick = function () {
      var t = generic();
      (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Copied. Paste it in the WhatsApp group.'); log('whatsapp', 0); },
        function () { showText(t); });
    };
    $('#one-by-one', d).onclick = function () {
      var p = people().list; if (!p.length) { toast('Nobody has a phone number.', true); return; }
      d.close(); log('whatsapp', p.length);
      var left = p.length;
      var q = sheet(p.length + (p.length === 1 ? ' message' : ' messages'),
        '<p class="small muted">Tap WhatsApp or SMS, send, come back for the next one.</p>' + p.map(function (x, i) {
          var t = text(x.name, x.k);
          return '<div class="qi" data-i="' + i + '"><p><strong>' + h(x.to === 'child' ? x.k.name : (x.k.guardian_name || 'Guardian') + ' (guardian of ' + firstName(x.k.name) + ')') + '</strong></p>' +
            '<p class="small tpl">' + h(t) + '</p><div class="cbtns"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + h(x.num) + '?text=' + encodeURIComponent(t) + '" data-go>WhatsApp</a>' +
            '<a class="btn ghost" href="sms:+' + h(x.num) + '?body=' + encodeURIComponent(t) + '" data-go>SMS</a><button type="button" class="btn quiet" data-skip>Skip</button></div></div>';
        }).join('') + '<p class="small" id="q-left"></p>');
      var count = function () { $('#q-left', q).textContent = left ? left + ' still to send.' : 'All done.'; };
      $all('.qi', q).forEach(function (row) {
        var done = function () { if (row.classList.contains('done')) return; row.classList.add('done'); left--; count(); };
        $all('[data-go]', row).forEach(function (a) { a.addEventListener('click', done); });
        $('[data-skip]', row).onclick = done;
      });
      count();
    };
    update();
  }

  /* ---------- offline and sync ---------- */
  function when(iso) { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function viewSync(el, args) {
    var pk = me ? Api.store.get(ckey('pack')) : null, items = Sync.items();
    var kids = pk ? Object.keys(pk.participants).reduce(function (a, k) { return a + pk.participants[k].length; }, 0) : 0;
    el.innerHTML = '<a href="#/more" class="small back-more">‹ More</a><h1>Sync and download file</h1>' +
      '<div class="card"><p><strong>' + (navigator.onLine ? 'Online' : 'No connection') + '</strong></p>' +
        '<p class="small muted">' + (items.length ? plural(items.length, 'save') + ' on this phone not sent yet.' + (navigator.onLine ? '' : ' They are sent by themselves when the phone is online.') : 'Everything is sent.') + '</p>' +
        (items.length && navigator.onLine ? '<button type="button" class="btn block" id="send-now">Send now</button>' : '') + '</div>' +
      (items.length ? '<div class="list">' + items.map(function (x) {
        return '<div class="row static"><span class="grow"><span class="name">' + h(x.label) + '</span><br><span class="sub">Saved ' + h(when(x.at)) + '</span>' +
          (x.state === 'failed' ? '<br><span class="badge bad">Not accepted</span><br><span class="small">' + h(x.error) + '</span>' : '<br><span class="badge warn">Waiting</span>') + '</span>' +
          (x.state === 'failed' ? '<span class="stack"><button type="button" class="btn quiet mini" data-retry="' + h(x.id) + '">Send again</button> <button type="button" class="btn danger mini" data-drop="' + h(x.id) + '">Remove</button></span>' : '') + '</div>';
      }).join('') + '</div>' : '') +
      '<section class="card"><h2>On this phone</h2>' +
        (!onOwnPhone() ? '<p class="small">This is a borrowed phone, so nothing is kept on it. Attendance needs internet here, or waits only until the app is closed.</p>'
          : !canWorkOffline() ? '<p class="small muted">Your role does not take attendance, so nothing needs to be kept on this phone.</p>'
          : '<p class="small">' + (pk ? plural(kids, 'child', 'children') + ', ' + plural(Object.keys(pk.sessions).length, 'open report') + ' and the follow-up list. Updated ' + h(when(pk.at)) + '.'
              : 'Not downloaded yet. It happens by itself the next time the app is open with internet.') + '</p>' +
            '<p class="small muted">Kept up to date by itself whenever the app is open with internet, so attendance and follow-up work with no signal.</p>') + '</section>' +
      (me.can.export_data ? '<section class="card" id="excel">' + excelFormHtml() + '</section>' : '');
    var sn = $('#send-now', el); if (sn) sn.onclick = function () { busy(true); Sync.flush().then(function () { busy(false); viewSync(el); }); };
    $all('[data-retry]', el).forEach(function (b) { b.onclick = function () { Sync.retry(b.dataset.retry).then(function () { viewSync(el); }); }; });
    $all('[data-drop]', el).forEach(function (b) {
      b.onclick = function () { if (confirm('Remove this save from the phone? It will not be sent.')) { Sync.remove(b.dataset.drop); viewSync(el); } };
    });
    if (me.can.export_data) wireExcelForm($('#excel', el));
    if (args && args[0] === 'excel') setTimeout(function () { var x = $('#excel', el); if (x) x.scrollIntoView({ block: 'start' }); }, 50);
    if (onOwnPhone() && navigator.onLine) downloadPack(false).then(function (x) {   // automatic, at most every 10 minutes
      if (x && (!pk || x.at !== pk.at) && el.isConnected && route().page === 'sync') viewSync(el);
    });
  }

  /* ---------- download to Excel ---------- */
  var XL_KINDS = [['children', 'Children', 'Names, guardians, phones, consent'], ['meetings', 'Meeting reports', 'One row per center and meeting: present, new, decisions'],
    ['attendance', 'Attendance', 'Who was present at each meeting'], ['decisions', 'Decisions', 'Who made which decision'], ['followups', 'Follow-up log', 'Calls, visits and outcomes']];
  function excelFormHtml() {
    var cs = me.centers.filter(function (c) { return c.status === 'active'; });
    return '<h2>Download file</h2><p class="small muted">Your records as an Excel file. Tick what you need: each choice becomes a sheet in the file.</p>' +
      '<form id="xl-form" novalidate><fieldset class="checks">' + XL_KINDS.map(function (k, i) {
        return '<label class="check"><input type="checkbox" name="what" value="' + k[0] + '"' + (i === 0 ? ' checked' : '') + '><span><strong>' + k[1] + '</strong><br><span class="small muted">' + k[2] + '</span></span></label>';
      }).join('') + '</fieldset>' +
      (cs.length > 1 ? '<label class="field">Center<select name="center"><option value="">All my centers</option>' + cs.map(function (c) { return '<option value="' + h(c.center_id) + '">' + h(centerLabel(c)) + '</option>'; }).join('') + '</select></label>' : '') +
      '<label class="field">Period<span class="hint">Applies to meetings, attendance, decisions and follow-ups. Children are always the full list.</span><select name="period">' +
        '<option value="all">Everything</option><option value="month">This month</option><option value="3m">Last 3 months</option><option value="year">This year</option><option value="custom">Choose dates</option></select></label>' +
      '<div class="two" id="xl-dates" hidden><label class="field">From<input type="date" name="from"></label><label class="field">To<input type="date" name="to"></label></div>' +
      '<p class="small muted">The file holds children\'s personal details. Keep it safe, do not forward it, and delete it when you are done.</p>' +
      '<div class="error" role="alert"></div>' +
      '<button type="submit" class="btn block" id="xl-go">' + ICON.excel + ' Download Excel file</button></form>';
  }
  function periodDates(v) {
    var t = me.today || new Date().toISOString().slice(0, 10), d = new Date(t + 'T12:00:00Z');
    if (v === 'month') return { from: t.slice(0, 8) + '01', to: t };
    if (v === '3m') { d.setUTCMonth(d.getUTCMonth() - 3); return { from: d.toISOString().slice(0, 10), to: t }; }
    if (v === 'year') return { from: t.slice(0, 4) + '-01-01', to: t };
    return {};
  }
  function wireExcelForm(box) {
    var form = $('#xl-form', box), f = form.elements, err = $('.error', form);
    f.period.onchange = function () { $('#xl-dates', form).hidden = f.period.value !== 'custom'; };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); err.textContent = '';
      var what = $all('[name=what]:checked', form).map(function (i) { return i.value; });
      if (!what.length) { err.textContent = 'Tick at least one thing to download.'; return; }
      if (!navigator.onLine) { err.textContent = 'Downloading needs internet. Try again when you are online.'; return; }
      var pd = f.period.value === 'custom' ? { from: f.from.value, to: f.to.value } : periodDates(f.period.value);
      var btn = $('#xl-go', form); btn.disabled = true;
      Api.call('exportData', { what: what, center_id: f.center ? f.center.value || undefined : undefined, from: pd.from || undefined, to: pd.to || undefined }).then(function (r) {
        var url = URL.createObjectURL(window.Xlsx.build(r.sheets));
        var a = document.createElement('a'); a.href = url; a.download = r.filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast('Excel file downloaded: ' + plural(r.rows, 'row'));
      }).catch(function (e) { err.textContent = e.message; }).then(function () { btn.disabled = false; });
    });
  }

  /* ---------- more ---------- */
  function viewMore(el) {
    el.innerHTML = '<h1>More</h1>' +
      '<div class="list"><button type="button" class="row" id="my"><span class="avatar">' + h(initials(me.user.name)) + '</span><span class="grow"><span class="name">' + h(me.user.name) + '</span><br><span class="sub">' +
        h(ROLE[me.user.role]) + (me.user.email ? ' · ' + h(me.user.email) : me.user.phone ? ' · ' + h(me.user.phone) : '') + '</span></span></button></div>' +
      '<h3>Work</h3><div class="list">' +
        '<a class="row" href="#/tasks"><span class="grow"><span class="name">Tasks</span><br><span class="sub">' + (me.can.assign_tasks ? 'Hand a report, follow-up or children to someone in your team' : 'Jobs handed to you') + '</span></span></a>' +
        (me.can.reports ? '<a class="row" href="#/reports"><span class="grow"><span class="name">Combined report</span><br><span class="sub">For a meeting or a month: WhatsApp version and print</span></span></a>' : '') +
        '<a class="row" href="#/sync"><span class="grow"><span class="name">Sync and download file</span><br><span class="sub">' + (Sync.waiting() + Sync.failed() ? (Sync.waiting() + Sync.failed()) + ' not sent yet' : 'Saves made offline') + (me.can.export_data ? ', and your records as an Excel file' : '') + '</span></span></a>' +
        (me.can.remind ? '<a class="row" href="#/reminders"><span class="grow"><span class="name">Reminders</span><br><span class="sub">Report reminders by email, WhatsApp or SMS</span></span></a>' : '') +
        (me.can.record ? '<a class="row" href="#/stats"><span class="grow"><span class="name">Statistics</span><br><span class="sub">Attendance, decisions, centers compared</span></span></a>' : '') +
        (me.can.manage_users || me.user.role === 'ASSISTANT' ? '<a class="row" href="#/people"><span class="grow"><span class="name">Team</span><br><span class="sub">' + (me.can.manage_users ? 'Add people, reset PINs, switch access' : 'The people of your center') + '</span></span></a>' : '') +
        (me.can.record ? '<a class="row" href="#/templates"><span class="grow"><span class="name">Message templates</span><br><span class="sub">Texts for WhatsApp and SMS follow-up</span></span></a>' : '') +
        (me.can.manage_centers ? '<a class="row" href="#/centers"><span class="grow"><span class="name">Programs and centers</span><br><span class="sub">Add, rename or switch off</span></span></a>' : '') +
      '</div>' +
      (me.can.settings ? '<h3>Super Admin</h3><div class="list">' +
        '<button type="button" class="row" id="settings"><span class="grow"><span class="name">System settings</span><br><span class="sub">Name, sign-in, reminders</span></span></button>' +
        '<button type="button" class="row" id="shares"><span class="grow"><span class="name">Sharing between programs</span><br><span class="sub">Let one program see another\'s figures</span></span></button></div>' : '') +
      installHtml(true) +
      '<button type="button" class="btn quiet block" id="tour-again">' + ICON.help + ' Show the tips again</button>' +
      '<button class="btn danger block" id="out">Sign out</button>' +
      '<p class="small muted center">Outreach Tracker, version 9</p>';
    $('#my').onclick = myDetailsForm;
    wireInstall(el);
    $('#tour-again', el).onclick = function () { tourReset(); toast('The tips will show again on each screen.'); go('#/home'); };
    $('#out').onclick = signOut;
    if (me.can.settings) { $('#settings').onclick = settingsForm; $('#shares').onclick = sharesForm; }
  }
  function signOut() {
    var n = Sync.waiting() + Sync.failed();
    if (n && !confirm(plural(n, 'save') + ' on this phone ' + (n === 1 ? 'has' : 'have') + ' not been sent. Sign out anyway? ' +
      (onOwnPhone() ? 'They stay on this phone and are sent the next time you sign in here.' : 'On a borrowed phone they are lost.'))) return;
    var token = Auth.sessionToken();
    var done = function () { Auth.signOut(); showLogin(); };
    if (token) { busy(true); Api.call('logout', { token: token }).catch(function () {}).then(function () { busy(false); done(); }); }
    else done();
  }
  function settingsForm() {
    busy(true);
    Api.call('getSettings').then(function (r) {
      busy(false);
      sheet('System settings', r.settings.map(function (s) {
        var bool = s.value === 'TRUE' || s.value === 'FALSE';
        return '<label class="field">' + h(s.key.replace(/_/g, ' ')) + '<span class="hint">' + h(s.description) + '</span>' +
          (bool ? '<select name="' + h(s.key) + '"><option value="TRUE"' + (s.value === 'TRUE' ? ' selected' : '') + '>On</option><option value="FALSE"' + (s.value === 'FALSE' ? ' selected' : '') + '>Off</option></select>'
            : '<input type="text" name="' + h(s.key) + '" value="' + h(s.value) + '" autocapitalize="none" autocomplete="off">') + '</label>';
      }).join(''), 'Save', function (form) {
        var values = {};
        r.settings.forEach(function (s) { var v = form.elements[s.key].value.trim(); if (v !== s.value) values[s.key] = v; });
        if (values.google_client_id !== undefined && !confirm('Changing the Google client ID can lock everyone out of Google Sign-In if it is wrong. Continue?')) return true;
        return Api.call('saveSettings', { values: values }).then(refreshMe).then(function () { toast('Settings saved'); render(); });
      });
    }).catch(fail);
  }
  function sharesForm() {
    if (me.programs.length < 2) { toast('Add a second program first.'); return; }
    busy(true);
    Api.call('listShares').then(function (r) {
      busy(false);
      var opts = me.programs.map(function (p) { return '<option value="' + h(p.program_id) + '">' + h(p.name) + '</option>'; }).join('');
      var current = r.shares.length ? '<div class="list" style="margin-top:12px">' + r.shares.map(function (s) {
        return '<div class="row static"><span class="grow"><span class="name">' + h(programName(s.to_program_id)) + ' can see ' + h(programName(s.from_program_id)) + '</span><br><span class="sub">' +
          (s.level === 'participant' ? 'Names and details' : 'Totals only') + '</span>' + (s.enabled === 'TRUE' ? '' : '<br><span class="badge off">Off</span>') + '</span></div>';
      }).join('') + '</div>' : '<p class="muted" style="margin-top:12px">Nothing is shared between programs.</p>';
      sheet('Sharing between programs', current +
        '<label class="field">Share the data of<select name="from">' + opts + '</select></label>' +
        '<label class="field">with the people of<select name="to">' + opts + '</select></label>' +
        '<label class="field">How much<select name="level"><option value="summary">Totals only</option><option value="participant">Names and details of participants</option></select></label>' +
        '<label class="field">Sharing is<select name="enabled"><option value="1">On</option><option value="0">Off</option></select></label>',
        'Save', function (form) {
          var f = form.elements;
          return Api.call('saveShare', { from_program_id: f.from.value, to_program_id: f.to.value, level: f.level.value, enabled: f.enabled.value === '1' })
            .then(function () { toast('Sharing saved'); });
        });
    }).catch(fail);
  }

  /* ---------- help and tips ---------- */
  /*
   * HELP[page](role facts) gives { title, steps: [...], tour: [[selector, text], ...] }.
   * The steps show when the ? is tapped; the tour points at the screen's buttons the first time the screen opens.
   */
  function roleFacts() {
    var r = me.user.role;
    return { admin: r === 'SUPER_ADMIN' || r === 'ADMIN', coord: r === 'COORDINATOR', leader: r === 'LEADER', asst: r === 'ASSISTANT', viewer: r === 'VIEWER',
      record: me.can.record, manage: r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'COORDINATOR', jobs: (me.jobs || []).length > 0 };
  }
  var HELP = {
    home: function (x) {
      return { title: 'Home', steps: [
        'The cards show this month at a glance. Tap a card to see more.',
        x.jobs ? 'Under "Handed to you" are jobs someone gave you. Tap the green button to do the job.' : null,
        x.record ? 'To take attendance, tap Meetings at the bottom, then your center.' : null,
        x.manage ? 'Under the latest meeting you see which centers have not submitted, and can remind them.' : null,
        'The bell at the top shows new jobs, comments and finished reports.',
        'Tap ? on any screen for help with that screen.'],
        tour: [['.stats-cards', 'This month at a glance: who came, first-timers, decisions and who was absent. Tap a card to see more.'],
          ['.tabs', 'Move between the parts of the app here.'],
          ['.bell', 'New jobs, comments and finished reports show here.'],
          ['.help-btn', 'Tap ? on any screen for the steps of that screen.']] };
    },
    meetings: function (x) {
      return { title: 'Meetings', steps: x.manage ? [
        'Tap "+ New meeting" to create the next meeting: one date, theme and scripture for every center.',
        'Each meeting shows which centers have submitted.',
        'Tap a center to see or correct its report.',
        'When all reports are in, open the meeting and tap "Close the meeting". Leaders can then no longer change their report.'] : [
        'Your coordinator creates each meeting.',
        x.record ? 'Tap your center under the meeting to take attendance.' : 'You see which centers have reported.',
        x.record ? 'You can correct your report until the coordinator closes the meeting.' : null],
        tour: [['#add-meeting', 'Create the next meeting here. Every center reports on it.'],
          ['.meeting .row', x.record ? 'Tap your center to take attendance for this meeting.' : 'Each center and whether it has reported.']] };
    },
    take: function () {
      return { title: 'Taking attendance', steps: [
        'Tap a child to mark him present. Tap again to undo.',
        'For a present child, tap "Decision" if he made one. "Another kind of decision" adds a new kind for this report.',
        'A first-timer: tap "+ First-timer" and fill in his details and the guardian\'s consent.',
        'Fill in facilitators, start time and whether you started on time.',
        '"Save draft" keeps your work. "Submit report" sends it to the coordinator.',
        'No signal? It is saved on the phone and sent by itself when you are online.'],
        tour: [['.att-row', 'Tap a child to mark him present. Tap "Decision" if he made one.'],
          ['#add-new', 'Add a child who came for the first time, with the guardian\'s consent.'],
          ['.savebar', 'Save a draft, or submit the report when you are done.']] };
    },
    followup: function () {
      return { title: 'Follow-up', steps: [
        'The list shows the children to contact: absent, missed several meetings, first-timers, decisions and birthdays.',
        'Tap Call, WhatsApp or SMS next to the child\'s or the guardian\'s number. The message is filled in for you and you can change it.',
        'After the contact, tap "Log" and write what happened. The child then leaves the list.',
        'Set a next action with a date and the child comes back on that date.'],
        tour: [['.chips', 'Show one group at a time: absent, missed in a row, first-timers, decisions.'],
          ['#flist .row', 'Tap a child to call, WhatsApp or SMS him or his guardian, then log what happened. He then leaves the list.']] };
    },
    participants: function (x) {
      return { title: 'Children', steps: [
        'Tap "+ Add child" to add a child, with the guardian\'s name, phone and consent.',
        '"Message all" sends one message to every child, every guardian, or both, from your phone.',
        'Tap a child to see his attendance, decisions and contacts, or to edit him.',
        '"To complete" lists children without full details or the guardian\'s consent.',
        x.record ? 'Import CSV adds many children at once from a spreadsheet.' : null],
        tour: [['#msg-all', 'Send one message to all the children, their guardians, or both.'], ['#add-p', 'Add a new child here.']] };
    },
    stats: function () {
      return { title: 'Statistics', steps: ['Choose 3, 6 or 12 months and a program or center at the top.', 'Tap a bar in a chart for its numbers, or switch to the table.',
        'The faithful and at-risk lists help you plan follow-up.'] };
    },
    reports: function (x) {
      return { title: 'Combined report', steps: [
        'Choose one meeting or a whole month.',
        x.manage ? 'Read the conclusion the app drafted, change it, and tap "Save conclusion".' : 'The conclusion is written by the coordinator.',
        '"Copy WhatsApp version" gives a short text to paste in a group.',
        '"Print or save as PDF" gives a clean page. In the print window choose "Save as PDF".'],
        tour: [['#wa', 'A short version to paste in WhatsApp.'], ['#print', 'Print it, or save it as a PDF.']] };
    },
    tasks: function (x) {
      return { title: 'Tasks', steps: x.manage || x.leader ? [
        'A task hands one job to one person: submitting a report, the follow-up, or the children of a center.',
        'Tap "+ Hand over a job", choose the job, the center and the person.',
        'The person can do that job in the app until it is done or you cancel it.',
        '"Handed out by me" shows what you gave and lets you comment or cancel.'] : [
        'Jobs handed to you are listed here and on Home. Tap one to do it.', 'Mark a follow-up or children job done when you finish.'],
        tour: [['#add-task', 'Hand a report, the follow-up or the children of a center to someone in your team.']] };
    },
    reminders: function () {
      return { title: 'Reminders', steps: ['Choose the meeting. The centers that have not submitted are ticked.', 'Choose Email, WhatsApp or SMS.',
        'Email goes at once. WhatsApp and SMS open one by one: send, come back, tap "Sent".', 'Reminders never contain children\'s names.'] };
    },
    people: function () {
      return { title: 'Team', steps: ['Tap "+ Add person" and choose the role and center.',
        'Give a Google email, or tick "phone number + PIN" and send the setup code by WhatsApp.',
        'Tap a person to edit, reset the PIN (new setup code) or switch access off.'],
        tour: [['#add-user', 'Add a leader, assistant or viewer. Phone users get a setup code to send them.']] };
    },
    templates: function () { return { title: 'Message templates', steps: ['These texts fill the WhatsApp and SMS buttons in Follow-up.', '{name} becomes the person messaged, {child} the child.'] }; },
    centers: function () { return { title: 'Programs and centers', steps: ['Add a center to a program with "+ Center".', 'Switch a center off instead of deleting it, so its history stays.'] }; },
    sync: function (x) {
      return { title: 'Sync and download file', steps: [
        'With no signal, attendance and follow-up are saved on the phone and sent by themselves when you are online.',
        'Saves still waiting are listed here. A save the server did not accept shows why: correct it and tap "Send again", or remove it.',
        'On your own phone the children list is kept up to date by itself.',
        me.can.export_data ? 'Download file: tick what you want, choose the center and the period, then tap "Download Excel file".' : null],
        tour: [['#excel', 'Download file: tick what you need, choose a period, and get one Excel file with a sheet for each.']] };
    },
    more: function () { return { title: 'More', steps: ['Your details, other screens, install the app, and sign out.', '"Show the tips again" replays the tips on every screen.'] }; },
    notifications: function () { return { title: 'Notifications', steps: ['New jobs, comments and finished reports. Tap one to open it.'] }; }
  };
  function helpFor(page) { var f = HELP[page]; return f ? f(roleFacts()) : null; }
  function showHelp(page) {
    var hp = helpFor(page) || { title: 'Help', steps: ['Tap the parts at the bottom to move around the app.'] };
    var steps = hp.steps.filter(Boolean);
    var d = sheet('Help: ' + hp.title, '<ol class="steps">' + steps.map(function (t) { return '<li>' + h(t) + '</li>'; }).join('') + '</ol>' +
      (hp.tour && visibleStops(hp.tour).length ? '<button type="button" class="btn ghost block" id="tour-now" style="margin-top:12px">Show me on the screen</button>' : '') +
      '<p class="small muted" style="margin-top:12px">Still stuck? Ask your ' + (me.user.role === 'SUPER_ADMIN' ? 'fellow Super Admin' : me.user.role === 'ADMIN' ? 'Super Admin' : me.user.role === 'COORDINATOR' ? 'Admin' : 'coordinator') + '.</p>');
    var t = $('#tour-now', d); if (t) t.onclick = function () { d.close(); runTour(page, hp.tour); };
  }

  /* The tour: a spotlight on one part of the screen with a short note, Next / Back / Skip. */
  var TOUR_KEY = 'ot.tips';
  function tourSeen() { try { return JSON.parse(localStorage.getItem(TOUR_KEY) || '{}'); } catch (e) { return {}; } }
  function tourMark(page) { try { var x = tourSeen(); x[me.user.user_id + '|' + page] = 1; localStorage.setItem(TOUR_KEY, JSON.stringify(x)); } catch (e) { /* ignore */ } }
  function tourOff() { try { var x = tourSeen(); x[me.user.user_id + '|off'] = 1; localStorage.setItem(TOUR_KEY, JSON.stringify(x)); } catch (e) { /* ignore */ } }
  function tourReset() {
    try { var x = tourSeen(), pre = me.user.user_id + '|'; Object.keys(x).forEach(function (k) { if (k.indexOf(pre) === 0) delete x[k]; }); localStorage.setItem(TOUR_KEY, JSON.stringify(x)); } catch (e) { /* ignore */ }
  }
  function firstVisible(sel) {
    return $all(sel).filter(function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[hidden]'); })[0] || null;
  }
  function visibleStops(tour) { return (tour || []).map(function (t) { return { el: firstVisible(t[0]), text: t[1] }; }).filter(function (t) { return t.el; }); }
  var tourTimer = null;
  function maybeTour(page) {
    clearTimeout(tourTimer);
    if (!me || $('.tour')) return;
    var seen = tourSeen(), uid = me.user.user_id;
    if (seen[uid + '|off'] || seen[uid + '|' + page] || seen['all|off']) return;
    var hp = helpFor(page); if (!hp || !hp.tour) return;
    tourTimer = setTimeout(function () {   // after the screen has its data
      if (route().page !== page || document.querySelector('dialog[open]') || $('.tour')) return;
      if (visibleStops(hp.tour).length) runTour(page, hp.tour);
    }, 900);
  }
  function runTour(page, tour) {
    var stops = visibleStops(tour); if (!stops.length) return;
    var i = 0, ov = document.createElement('div');
    ov.className = 'tour'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Tips');
    ov.innerHTML = '<div class="tour-hole"></div><div class="tour-tip"><p class="tour-n"></p><p class="tour-t"></p>' +
      '<div class="tour-b"><button type="button" class="linkbtn" data-t="skip">Skip tips</button><span class="grow"></span>' +
      '<button type="button" class="btn quiet mini" data-t="back">Back</button><button type="button" class="btn mini" data-t="next">Next</button></div></div>';
    document.body.appendChild(ov);
    var hole = $('.tour-hole', ov), tip = $('.tour-tip', ov);
    function place() {
      var st = stops[i], r = st.el.getBoundingClientRect(), pad = 6;
      hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px';
      hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = Math.min(r.height + pad * 2, innerHeight - 20) + 'px';
      var tw = Math.min(340, innerWidth - 24); tip.style.width = tw + 'px';
      tip.style.left = Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2)) + 'px';
      var below = r.bottom + 14, th = tip.offsetHeight || 140;
      tip.style.top = (below + th < innerHeight - 8 ? below : Math.max(8, r.top - th - 14)) + 'px';
    }
    function show() {
      var st = stops[i];
      $('.tour-n', ov).textContent = (i + 1) + ' of ' + stops.length;
      $('.tour-t', ov).textContent = st.text;
      $('[data-t=back]', ov).hidden = i === 0;
      $('[data-t=next]', ov).textContent = i === stops.length - 1 ? 'Got it' : 'Next';
      var r = st.el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - 80) { st.el.scrollIntoView({ block: 'center' }); }
      requestAnimationFrame(place);
      $('[data-t=next]', ov).focus();
    }
    function end(off) { ov.remove(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); tourMark(page); if (off) tourOff(); }
    ov.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-t]'); if (!b) return;
      if (b.dataset.t === 'skip') return end(true);
      if (b.dataset.t === 'back') { i = Math.max(0, i - 1); return show(); }
      if (i === stops.length - 1) return end(false);
      i++; show();
    });
    ov.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') end(false); });
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    show();
  }
  window.addEventListener('hashchange', function () { var t = $('.tour'); if (t) t.remove(); });

  /* ---------- start ---------- */
  function start() {
    if (!Api.configured()) { showSetupNeeded(); return Promise.resolve(); }
    if (!Auth.has()) { showLogin(); return Promise.resolve(); }
    var saved = Api.store.get('boot');
    if (saved && saved.me) {
      // Open at once with what this phone remembers; the server's answer replaces it a moment later.
      me = saved.me; homeData = saved.home; Sync.setUser(me.user.user_id); render();
      return homeFresh();
    }
    root.innerHTML = '<div class="boot"><img src="img/logo-256.png" alt="" width="88" height="88"><p>Signing you in…</p></div>';
    return boot().then(render).catch(function (e) {
      if (me === null && Auth.has()) {     // network trouble, not a refusal
        root.innerHTML = '<div class="boot"><img src="img/logo-256.png" alt="" width="88" height="88"><p>' + h(e.message) + '</p><button class="btn" id="retry">Try again</button></div>';
        $('#retry').onclick = start;
      }
    });
  }
  Auth.on('signedIn', start);
  Auth.on('lost', function (err) { $all('dialog').forEach(function (d) { d.close(); }); busy(false); showLogin(err && err.code !== 'AUTH_REQUIRED' ? err.message : ''); });
  VIEWS = { home: viewHome, meetings: viewMeetings, take: viewTake, followup: viewFollowUp, participants: viewParticipants, people: viewPeople,
    centers: viewCenters, stats: viewStats, templates: viewTemplates, tasks: viewTasks, notifications: viewNotifications,
    reminders: viewReminders, reports: viewReports, sync: viewSync, more: viewMore };
  window.addEventListener('hashchange', function () {
    if (!me) return;
    if (leaveGuard && !leaveGuard()) { history.replaceState(null, '', currentHash || '#/home'); return; }
    window.onbeforeunload = null;
    render();
    if (route().page === 'home') homeFresh();
  });
  start();
})();
