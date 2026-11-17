/* Outreach Tracker — screens. Phase 2: sign-in, people, centers. Phase 3: meetings, attendance, participants. */
(function () {
  'use strict';
  var Api = window.Api, Auth = window.Auth;
  var root = document.getElementById('app');
  var me = null;            // answer of the `me` call: user, scope, programs, centers, permissions
  var users = [];

  var ROLE = { SUPER_ADMIN: 'Super Admin', COORDINATOR: 'Coordinator', LEADER: 'Center Leader', ASSISTANT: 'Assistant', VIEWER: 'Viewer' };
  var ICON = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 010 6.4M18.5 14.8c1.7.8 2.7 2.5 3 5.2"/></svg>',
    centers: '<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    meetings: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4"/></svg>',
    participants: '<svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5c.8-4 3.6-6 7-6s6.2 2 7 6"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>'
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
  function showLogin(message) {
    me = null;
    var t = document.getElementById('toast'); if (t) t.className = '';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);   // next sign-in opens on Home
    var pin = true;   // the server refuses if PIN sign-in is switched off
    root.innerHTML =
      '<div class="login"><div class="login-head"><div class="mark">OT</div><h1>Outreach Tracker</h1><p>Sign in to continue</p></div>' +
      '<div class="login-body">' +
        '<div class="error" id="login-msg" role="alert">' + h(message || '') + '</div>' +
        (Auth.googleAvailable() ? '<div id="gbtn"></div><p class="small muted center" style="margin-top:8px">Use the Google account your coordinator registered.</p><div class="or">or</div>' : '') +
        (pin ? '<form id="pin-form" novalidate>' +
          '<h2 id="pin-title">Sign in with your phone number</h2>' +
          '<label class="field">Phone number<input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="0770 000 000" required></label>' +
          '<div id="setup-fields" hidden>' +
            '<label class="field">Setup code<span class="hint">6 digits from your coordinator. It works once.</span><input type="text" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label>' +
          '</div>' +
          '<label class="field"><span id="pin-label">PIN</span><span class="hint" id="pin-hint">Your 6-digit PIN</span><input type="password" name="pin" inputmode="numeric" maxlength="6" autocomplete="off" required></label>' +
          '<div id="confirm-field" hidden><label class="field">Type the PIN again<input type="password" name="pin2" inputmode="numeric" maxlength="6" autocomplete="off"></label></div>' +
          '<label class="check"><input type="checkbox" name="shared"><span><strong>This is not my phone</strong><br><span class="small muted">You will be signed out when the app closes, and nothing is kept on this phone.</span></span></label>' +
          '<div class="error" id="pin-err" role="alert"></div>' +
          '<button class="btn block" type="submit" id="pin-go" style="margin-top:8px">Sign in</button>' +
          '<p class="center"><button type="button" class="linkbtn" id="pin-toggle">First time, or have a new setup code?</button></p>' +
        '</form>' : '') +
      '</div></div>';

    if (Auth.googleAvailable()) {
      Auth.renderGoogleButton($('#gbtn')).catch(function () {
        $('#gbtn').innerHTML = '<p class="small muted center">Google Sign-In could not load. Check your internet.</p>';
      });
    }
    var form = $('#pin-form'), setup = false;
    $('#pin-toggle').onclick = function () {
      setup = !setup;
      $('#setup-fields').hidden = !setup; $('#confirm-field').hidden = !setup;
      $('#pin-title').textContent = setup ? 'Set up your PIN' : 'Sign in with your phone number';
      $('#pin-label').textContent = setup ? 'Choose a PIN' : 'PIN';
      $('#pin-hint').textContent = setup ? '6 digits you will remember. Not 123456 or 111111.' : 'Your 6-digit PIN';
      $('#pin-go').textContent = setup ? 'Save PIN and sign in' : 'Sign in';
      this.textContent = setup ? 'I already have a PIN' : 'First time, or have a new setup code?';
      $('#pin-err').textContent = '';
    };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = form.elements, err = $('#pin-err'); err.textContent = '';
      var payload = { phone: f.phone.value.trim(), pin: f.pin.value.trim(), shared: f.shared.checked };
      if (!payload.phone) { err.textContent = 'Enter your phone number.'; return; }
      if (!/^\d{6}$/.test(payload.pin)) { err.textContent = 'The PIN is 6 digits.'; return; }
      if (setup) {
        payload.code = f.code.value.trim();
        if (!/^\d{6}$/.test(payload.code)) { err.textContent = 'The setup code is 6 digits.'; return; }
        if (f.pin2.value.trim() !== payload.pin) { err.textContent = 'The two PINs are not the same.'; return; }
      }
      var btn = $('#pin-go'); btn.disabled = true;
      Api.call(setup ? 'pinSetup' : 'pinLogin', payload, { open: true }).then(function (s) {
        Auth.startSession(s.token, s.shared);
        return start();
      }).catch(function (e) { err.textContent = e.message; btn.disabled = false; });
    });
  }

  function showSetupNeeded() {
    root.innerHTML = '<div class="login"><div class="login-head"><div class="mark">OT</div><h1>Outreach Tracker</h1><p>Almost ready</p></div>' +
      '<div class="login-body"><div class="card"><h2>The app is not connected yet</h2>' +
      '<p>Open <code>config.js</code> and paste your Apps Script web app URL into <code>API_URL</code>. The deployment guide has the steps.</p></div></div></div>';
  }

  /* ---------- shell ---------- */
  function tabsFor() {
    var t = [['home', 'Home'], ['meetings', 'Meetings']];
    if (me.can.record) t.push(['participants', 'Children']);
    if (me.can.manage_users || me.user.role === 'ASSISTANT') t.push(['people', 'Team']);
    t.push(['more', 'More']);
    return t;
  }
  /** Pages that exist without a tab of their own, and the tab that lights up for them. */
  var EXTRA = { centers: 'more', take: 'meetings' };
  var VIEWS = {};
  var leaveGuard = null;          // set by a screen with unsaved changes; returns true if it is fine to leave
  var currentHash = '';
  function route() {
    var parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
    var tabs = tabsFor(), page = parts[0];
    var allowed = tabs.some(function (t) { return t[0] === page; }) ||
      (page === 'centers' && me.can.manage_centers) || (page === 'take' && me.can.record);
    if (!allowed) { page = 'home'; parts = ['home']; }
    return { page: page, args: parts.slice(1), tab: EXTRA[page] || page, tabs: tabs };
  }
  function render() {
    var r = route();
    leaveGuard = null;
    currentHash = location.hash;
    root.innerHTML =
      '<header class="top"><strong>' + h(me.org_name) + '</strong><span class="chip">' + h(ROLE[me.user.role]) + '</span></header>' +
      '<main id="view"></main>' +
      '<nav class="tabs" aria-label="Main">' + r.tabs.map(function (t) {
        return '<a class="tab" href="#/' + t[0] + '"' + (t[0] === r.tab ? ' aria-current="page"' : '') + '>' + ICON[t[0]] + '<span>' + t[1] + '</span></a>';
      }).join('') + '</nav>';
    document.title = me.org_name;
    VIEWS[r.page]($('#view'), r.args);
    window.scrollTo(0, 0);
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function refreshMe() { return Api.call('me').then(function (d) { me = d; }); }
  function fail(e) { busy(false); if (me) toast(e.message, true); }

  /* ---------- home ---------- */
  function viewHome(el) {
    var first = me.user.name.split(' ')[0];
    el.innerHTML =
      '<div><h1>Hello, ' + h(first) + '</h1><p class="muted">' + h(ROLE[me.user.role]) + (me.scope.all ? ' · all programs' : '') + '</p></div>' +
      (Auth.isShared() ? '<div class="card" style="background:var(--warn-soft);border-color:#ecd98f"><strong>Borrowed phone</strong><p class="small">You will be signed out when you close the app. Tap More → Sign out when you finish.</p></div>' : '') +
      '<div id="home-meeting"><div class="boot" style="min-height:20vh"><div class="spinner"></div></div></div>' +
      '<div class="card"><h2>Coming next</h2><p class="muted small">Follow-up, statistics, tasks, reminders and the combined report are added in the next phases.</p></div>';
    if (!me.programs.length) {
      $('#home-meeting').innerHTML = '<div class="card"><p class="muted">No program or center is assigned to you yet. Ask your coordinator.</p></div>';
      return;
    }
    Api.call('listMeetings').then(function (r) {
      var box = $('#home-meeting'); if (!box) return;
      var today = new Date().toISOString().slice(0, 10);
      // The meeting that matters now: the latest open one that is not in the future, else the next one.
      var open = r.meetings.filter(function (m) { return m.status !== 'closed'; });
      var m = open.filter(function (x) { return x.date <= today; })[0] || open[open.length - 1] || r.meetings[0];
      if (!m) {
        box.innerHTML = '<div class="card"><h2>No meetings yet</h2><p class="muted">' + (me.can.manage_meetings ? 'Create the next meeting so the centers can report on it.' : 'Your coordinator has not created a meeting yet.') + '</p>' +
          (me.can.manage_meetings ? '<a class="btn block" href="#/meetings">Go to Meetings</a>' : '') + '</div>';
        return;
      }
      var missing = m.centers.filter(function (c) { return c.state !== 'submitted'; });
      box.innerHTML = '<h3>' + (m.date > today ? 'Next meeting' : 'Latest meeting') + '</h3>' + meetingCard(m, true) +
        (m.centers.length > 1 ? '<p class="small muted">' + (missing.length ? missing.length + ' of ' + m.centers.length + ' centers have not submitted yet.' : 'Every center has submitted.') + '</p>' : '');
      wireMeetingCards(box, r.meetings);
    }).catch(function (e) { var box = $('#home-meeting'); if (box) box.innerHTML = '<div class="card"><p class="error">' + h(e.message) + '</p></div>'; });
  }

  /* ---------- people ---------- */
  function viewPeople(el) {
    el.innerHTML = '<div class="boot" style="min-height:40vh"><div class="spinner"></div></div>';
    Api.call('listUsers').then(function (list) {
      users = list.sort(function (a, b) { return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name); });
      el.innerHTML = '<div class="head"><h1>Team</h1></div>' +
        '<p class="muted small">' + (me.can.manage_users ? 'People who can sign in. Tap a name to edit, reset a PIN or switch access off.' : 'The team of your center.') + '</p>' +
        '<div class="list">' + (users.length ? users.map(userRow).join('') : '<div class="empty">Nobody here yet.</div>') + '</div>' +
        (me.can.manage_users ? '<button class="btn fab" id="add-user">+ Add person</button>' : '');
      $all('.row[data-id]', el).forEach(function (r) {
        r.onclick = function () { userActions(users.filter(function (u) { return u.user_id === r.dataset.id; })[0]); };
      });
      if (me.can.manage_users) $('#add-user').onclick = function () { userForm(null); };
    }).catch(fail);
  }
  var ROLE_ORDER = ['SUPER_ADMIN', 'COORDINATOR', 'LEADER', 'ASSISTANT', 'VIEWER'];
  function userScopeText(u) {
    var parts = u.center_ids.map(centerName).filter(String);
    if (u.role === 'COORDINATOR' || u.role === 'VIEWER') parts = u.program_ids.map(function (p) { return programName(p) ? 'All of ' + programName(p) : ''; }).filter(String).concat(parts);
    if (u.role === 'SUPER_ADMIN') parts = ['Everything'];
    return parts.join(', ');
  }
  function userRow(u) {
    var isMe = u.user_id === me.user.user_id, tappable = u.can_manage || isMe;
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
    var v = u || { name: '', email: '', phone: '', role: roles[roles.length > 1 && roles[0] === 'SUPER_ADMIN' ? 2 : 0], center_ids: [], program_ids: [], allow_pin: false };
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
    var canTake = me.can.record && (m.status !== 'closed' || me.user.role === 'SUPER_ADMIN' || me.user.role === 'COORDINATOR');
    return '<div class="card meeting" data-meeting="' + h(m.meeting_id) + '">' +
      '<div class="head"><div><p class="small muted">' + h(fmtDate(m.date)) + (me.programs.length > 1 ? ' · ' + h(programName(m.program_id)) : '') + '</p>' +
      '<h2>' + h(m.theme) + '</h2>' + (m.scripture ? '<p class="small muted">' + h(m.scripture) + '</p>' : '') + '</div>' +
      (m.status === 'closed' ? '<span class="badge off">Closed</span>' : '') +
      (m.can_manage && !compact ? '<button type="button" class="btn quiet mini" data-manage>Manage</button>' : '') + '</div>' +
      (m.centers.length ? '<div class="list">' + m.centers.map(function (c) {
        var st = STATE[c.state] || STATE.none, tap = me.can.record;
        var label = c.state === 'none' ? (canTake ? 'Take attendance' : st[0]) : st[0];
        return '<' + (tap ? 'button type="button"' : 'div') + ' class="row' + (tap ? '' : ' static') + '" data-take="' + h(c.center_id) + '">' +
          '<span class="grow"><span class="name">' + h(c.name) + '</span>' +
          (c.state !== 'none' ? '<br><span class="sub">' + c.total_present + ' present' + (c.total_first_timers ? ' · ' + c.total_first_timers + ' new' : '') + '</span>' : '') + '</span>' +
          '<span class="badge ' + st[1] + '">' + h(label) + '</span></' + (tap ? 'button' : 'div') + '>';
      }).join('') + '</div>' : '<p class="muted small">No centers of yours take part in this meeting.</p>') +
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
    el.innerHTML = '<div class="boot" style="min-height:40vh"><div class="spinner"></div></div>';
    Api.call('listMeetings').then(function (r) {
      el.innerHTML = '<div class="head"><h1>Meetings</h1></div>' +
        '<p class="muted small">' + (me.can.record ? 'Tap a center to take or correct its attendance.' : 'Which centers have reported.') + '</p>' +
        (r.meetings.length ? r.meetings.map(function (m) { return meetingCard(m, false); }).join('')
          : '<div class="card empty">No meetings yet.' + (me.can.manage_meetings ? ' Tap “+ New meeting”.' : '') + '</div>') +
        (me.can.manage_meetings ? '<button class="btn fab" id="add-meeting">+ New meeting</button>' : '');
      wireMeetingCards(el, r.meetings);
      if (me.can.manage_meetings) $('#add-meeting').onclick = function () { meetingForm(null); };
    }).catch(fail);
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
      (m.status === 'closed' ? '<button type="button" class="btn ghost block" data-a="open">Reopen for corrections</button>'
        : '<button type="button" class="btn quiet block" data-a="close">Close the meeting</button><p class="small muted">Leaders and assistants can correct their report until you close it.</p>') +
      (!started ? '<button type="button" class="btn danger block" data-a="del">Delete this meeting</button>' : '') + '</div>');
    $all('[data-a]', d).forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a; d.close();
        if (a === 'edit') return meetingForm(m);
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
    el.innerHTML = '<div class="boot" style="min-height:40vh"><div class="spinner"></div></div>';
    Api.call('getSession', { meeting_id: meetingId, center_id: centerId }).then(function (d) { takeScreen(el, d); }).catch(function (e) {
      el.innerHTML = '<div class="card"><p class="error">' + h(e.message) + '</p><a class="btn ghost block" href="#/meetings">Back to meetings</a></div>';
    });
  }
  function takeScreen(el, d) {
    var s = d.session || {}, ro = !d.editable, dirty = false, newId = 0, filter = '';
    var present = {}, firsts = {}, decisions = {}, newcomers = [];
    d.attendance.forEach(function (a) { if (a.present) present[a.participant_id] = true; if (a.first_timer) firsts[a.participant_id] = true; });
    d.decisions.forEach(function (x) { decisions[x.participant_id] = x.type; });
    var marked = {};
    d.attendance.forEach(function (a) { marked[a.participant_id] = true; });
    var people = d.participants.filter(function (p) { return (p.status === 'active' || marked[p.participant_id]) && !p.joined_after; });
    var later = ro ? [] : d.participants.filter(function (p) { return p.status === 'active' && p.joined_after; });

    function mark() { dirty = true; }
    leaveGuard = function () { return !dirty || confirm('You have changes that are not saved. Leave without saving?'); };
    window.onbeforeunload = function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } };

    el.innerHTML =
      '<a href="#/meetings" class="small">‹ Meetings</a>' +
      '<div><p class="small muted">' + h(fmtDate(d.meeting.date)) + ' · ' + h(d.center.name) + '</p><h1>' + h(d.meeting.theme) + '</h1>' +
      (d.meeting.scripture ? '<p class="muted">' + h(d.meeting.scripture) + '</p>' : '') +
      '<p style="margin-top:6px">' + (s.status === 'submitted' ? '<span class="badge">Submitted</span>' : s.status === 'draft' ? '<span class="badge warn">Draft — not sent yet</span>' : '') +
      (ro ? '<span class="badge off">Closed — read only</span>' : '') + '</p></div>' +

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
        (dec ? '<br><span class="badge dec">' + h(DECISION[dec]) + '</span>' : '') + '</span>' +
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
      var dlg = sheet('Decision — ' + p.name, '<div class="stack">' + Object.keys(DECISION).map(function (k) {
        return '<button type="button" class="btn ' + (decisions[id] === k ? '' : 'quiet') + ' block" data-k="' + k + '">' + DECISION[k] + '</button>';
      }).join('') + (decisions[id] ? '<button type="button" class="btn danger block" data-k="">Remove the decision</button>' : '') + '</div>');
      $all('[data-k]', dlg).forEach(function (b) {
        b.onclick = function () { if (b.dataset.k) decisions[id] = b.dataset.k; else delete decisions[id]; mark(); dlg.close(); draw(); };
      });
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
        meeting_id: d.meeting.meeting_id, center_id: d.center.center_id, submit: submit,
        facilitators: g('facilitators'), start_time: g('start_time'), punctuality: punct ? punct.value : '',
        observations: g('observations'), recommendations: g('recommendations'),
        attendance: people.map(function (p) { return { participant_id: p.participant_id, present: !!present[p.participant_id] }; }),
        new_participants: newcomers.map(function (p) {
          return { temp_id: p.temp_id, name: p.name, age: p.age, birth_date: p.birth_date, phone: p.phone, guardian_name: p.guardian_name,
            guardian_phone: p.guardian_phone, school: p.school, guardian_consent: p.guardian_consent };
        }),
        decisions: Object.keys(decisions).map(function (id) { return { participant_id: id, type: decisions[id] }; })
      };
      $all('.savebar .btn', el).forEach(function (b) { b.disabled = true; });
      busy(true);
      return Api.call('saveSession', payload).then(function (fresh) {
        busy(false); dirty = false;
        toast(submit && s.status !== 'submitted' ? 'Report submitted' : 'Saved');
        takeScreen(el, fresh);
        window.scrollTo(0, 0);
      }).catch(function (e) {
        busy(false); err.textContent = e.message; err.scrollIntoView({ block: 'center' });
        $all('.savebar .btn', el).forEach(function (b) { b.disabled = false; });
        if (e.code === 'OFFLINE') err.textContent += ' Your marks are still on this screen; do not close it.';
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
  function recordCenters() { return me.centers.filter(function (c) { return c.status === 'active'; }); }
  function viewParticipants(el) {
    var centers = recordCenters();
    if (!pState.center || !centers.some(function (c) { return c.center_id === pState.center; })) pState.center = centers.length ? centers[0].center_id : '';
    el.innerHTML = '<div class="boot" style="min-height:40vh"><div class="spinner"></div></div>';
    if (!centers.length) { el.innerHTML = '<h1>Children</h1><div class="card empty">No active center is assigned to you.</div>'; return; }
    Api.call('listParticipants', { center_id: pState.center }).then(function (r) {
      var list = r.participants.sort(function (a, b) { return a.name.localeCompare(b.name); });
      var counts = { active: 0, inactive: 0, incomplete: 0 };
      list.forEach(function (p) { counts[p.status]++; if (p.incomplete || !p.guardian_consent) counts.incomplete++; });
      el.innerHTML = '<div class="head"><h1>Children</h1><button class="btn ghost mini" id="import">Import CSV</button></div>' +
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
      draw();
    }).catch(fail);
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
      '<label class="field">Guardian\'s name<input type="text" name="guardian_name" value="' + h(v.guardian_name) + '" autocomplete="off" required></label>' +
      '<label class="field">Guardian\'s phone<input type="tel" name="guardian_phone" inputmode="tel" value="' + h(v.guardian_phone) + '" placeholder="0770 000 000" required></label>' +
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
        if (!vals.guardian_name) throw new Error('Enter the guardian\'s name.');
        if (vals.guardian_phone.replace(/\D/g, '').length < 7) throw new Error('Enter the guardian\'s phone number.');
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
      '<button type="button" class="btn quiet block" data-a="edit">Edit details</button>' +
      (p.status === 'active' ? '<button type="button" class="btn quiet block" data-a="off">Mark inactive</button><p class="small muted">Inactive children are kept but no longer listed for attendance.</p>'
        : '<button type="button" class="btn ghost block" data-a="on">Mark active again</button>') +
      '<button type="button" class="btn danger block" data-a="del">Delete this child\'s details</button></div>');
    $all('[data-a]', d).forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a; d.close();
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

  /* ---------- more ---------- */
  function viewMore(el) {
    el.innerHTML = '<h1>More</h1>' +
      '<div class="list"><button type="button" class="row" id="my"><span class="avatar">' + h(initials(me.user.name)) + '</span><span class="grow"><span class="name">' + h(me.user.name) + '</span><br><span class="sub">' +
        h(ROLE[me.user.role]) + (me.user.email ? ' · ' + h(me.user.email) : me.user.phone ? ' · ' + h(me.user.phone) : '') + '</span></span></button></div>' +
      (me.can.manage_centers ? '<h3>Organization</h3><div class="list"><a class="row" href="#/centers"><span class="grow"><span class="name">Programs and centers</span><br><span class="sub">Add, rename or switch off</span></span></a></div>' : '') +
      (me.can.settings ? '<h3>Super Admin</h3><div class="list">' +
        '<button type="button" class="row" id="settings"><span class="grow"><span class="name">System settings</span><br><span class="sub">Name, sign-in, reminders</span></span></button>' +
        '<button type="button" class="row" id="shares"><span class="grow"><span class="name">Sharing between programs</span><br><span class="sub">Let one program see another\'s figures</span></span></button></div>' : '') +
      '<button class="btn danger block" id="out">Sign out</button>' +
      '<p class="small muted center">Outreach Tracker · phase 3</p>';
    $('#my').onclick = myDetailsForm;
    $('#out').onclick = signOut;
    if (me.can.settings) { $('#settings').onclick = settingsForm; $('#shares').onclick = sharesForm; }
  }
  function signOut() {
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

  /* ---------- start ---------- */
  function start() {
    if (!Api.configured()) { showSetupNeeded(); return Promise.resolve(); }
    if (!Auth.has()) { showLogin(); return Promise.resolve(); }
    root.innerHTML = '<div class="boot"><div class="spinner"></div><p>Signing you in…</p></div>';
    return refreshMe().then(render).catch(function (e) {
      if (me === null && Auth.has()) {     // network trouble, not a refusal
        root.innerHTML = '<div class="boot"><p>' + h(e.message) + '</p><button class="btn" id="retry">Try again</button></div>';
        $('#retry').onclick = start;
      }
    });
  }
  Auth.on('signedIn', start);
  Auth.on('lost', function (err) { $all('dialog').forEach(function (d) { d.close(); }); busy(false); showLogin(err && err.code !== 'AUTH_REQUIRED' ? err.message : ''); });
  VIEWS = { home: viewHome, meetings: viewMeetings, take: viewTake, participants: viewParticipants, people: viewPeople, centers: viewCenters, more: viewMore };
  window.addEventListener('hashchange', function () {
    if (!me) return;
    if (leaveGuard && !leaveGuard()) { history.replaceState(null, '', currentHash || '#/home'); return; }
    window.onbeforeunload = null;
    render();
  });
  start();
})();
