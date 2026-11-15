/* Outreach Tracker — screens. Phase 2: sign-in, home, people, centers, more. */
(function () {
  'use strict';
  var Api = window.Api, Auth = window.Auth;
  var root = document.getElementById('app');
  var me = null;            // answer of the `me` call: user, scope, programs, centers, permissions
  var users = [];

  var ROLE = { SUPER_ADMIN: 'Super Admin', COORDINATOR: 'Coordinator', LEADER: 'Center Leader', ASSISTANT: 'Assistant', VIEWER: 'Viewer' };
  var ICON = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.500s5.9 1.9 6.5 5.5"/><path d="M16 4.800a3.5 3.5 0 010 6.400M18.5 14.800c1.7.8 2.7 2.5 3 5.2"/></svg>',
    centers: '<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
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
    var t = [['home', 'Home']];
    if (me.can.manage_users || me.user.role === 'ASSISTANT') t.push(['people', 'People']);
    if (me.can.manage_centers) t.push(['centers', 'Centers']);
    t.push(['more', 'More']);
    return t;
  }
  function render() {
    var tabs = tabsFor(), page = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0];
    if (!tabs.some(function (t) { return t[0] === page; })) page = 'home';
    root.innerHTML =
      '<header class="top"><strong>' + h(me.org_name) + '</strong><span class="chip">' + h(ROLE[me.user.role]) + '</span></header>' +
      '<main id="view"></main>' +
      '<nav class="tabs" aria-label="Main">' + tabs.map(function (t) {
        return '<a class="tab" href="#/' + t[0] + '"' + (t[0] === page ? ' aria-current="page"' : '') + '>' + ICON[t[0]] + '<span>' + t[1] + '</span></a>';
      }).join('') + '</nav>';
    document.title = me.org_name;
    ({ home: viewHome, people: viewPeople, centers: viewCenters, more: viewMore })[page]($('#view'));
    window.scrollTo(0, 0);
  }
  function refreshMe() { return Api.call('me').then(function (d) { me = d; }); }
  function fail(e) { busy(false); if (me) toast(e.message, true); }

  /* ---------- home ---------- */
  function viewHome(el) {
    var first = me.user.name.split(' ')[0];
    var active = me.centers.filter(function (c) { return c.status === 'active'; });
    el.innerHTML =
      '<div><h1>Hello, ' + h(first) + '</h1><p class="muted">' + h(ROLE[me.user.role]) + (me.scope.all ? ' · all programs' : '') + '</p></div>' +
      (Auth.isShared() ? '<div class="card" style="background:var(--warn-soft);border-color:#ecd98f"><strong>Borrowed phone</strong><p class="small">You will be signed out when you close the app. Tap More → Sign out when you finish.</p></div>' : '') +
      '<h3>Your access</h3>' +
      (me.programs.length ? me.programs.map(function (p) {
        var cs = active.filter(function (c) { return c.program_id === p.program_id; });
        return '<div class="card"><div class="head"><h2>' + h(p.name) + '</h2><span class="badge">' + cs.length + (cs.length === 1 ? ' center' : ' centers') + '</span></div>' +
          '<p class="muted">' + (cs.length ? cs.map(function (c) { return h(c.name); }).join(' · ') : 'No active centers yet') + '</p></div>';
      }).join('') : '<div class="card"><p class="muted">No program or center is assigned to you yet. Ask your coordinator.</p></div>') +
      '<div class="card"><h2>What comes next</h2><p class="muted">Attendance, follow-up, tasks and reports are added in the next phases. For now you can sign in' +
      (me.can.manage_users ? ', add people' : '') + (me.can.manage_centers ? ' and set up centers' : '') + '.</p></div>';
  }

  /* ---------- people ---------- */
  function viewPeople(el) {
    el.innerHTML = '<div class="boot" style="min-height:40vh"><div class="spinner"></div></div>';
    Api.call('listUsers').then(function (list) {
      users = list.sort(function (a, b) { return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name); });
      el.innerHTML = '<div class="head"><h1>People</h1></div>' +
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
    el.innerHTML = '<div class="head"><h1>Centers</h1>' + (me.can.manage_programs ? '<button class="btn ghost mini" id="add-program">+ Program</button>' : '') + '</div>' +
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

  /* ---------- more ---------- */
  function viewMore(el) {
    el.innerHTML = '<h1>More</h1>' +
      '<div class="list"><button type="button" class="row" id="my"><span class="avatar">' + h(initials(me.user.name)) + '</span><span class="grow"><span class="name">' + h(me.user.name) + '</span><br><span class="sub">' +
        h(ROLE[me.user.role]) + (me.user.email ? ' · ' + h(me.user.email) : me.user.phone ? ' · ' + h(me.user.phone) : '') + '</span></span></button></div>' +
      (me.can.settings ? '<h3>Super Admin</h3><div class="list">' +
        '<button type="button" class="row" id="settings"><span class="grow"><span class="name">System settings</span><br><span class="sub">Name, sign-in, reminders</span></span></button>' +
        '<button type="button" class="row" id="shares"><span class="grow"><span class="name">Sharing between programs</span><br><span class="sub">Let one program see another\'s figures</span></span></button></div>' : '') +
      '<button class="btn danger block" id="out">Sign out</button>' +
      '<p class="small muted center">Outreach Tracker · phase 2</p>';
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
  window.addEventListener('hashchange', function () { if (me) render(); });
  start();
})();
