/* Outreach Tracker — saves made without internet wait here and are sent when the phone is back online.
   Each waiting save belongs to the person who made it and is only sent while that person is signed in.
   On a borrowed phone the waiting saves live only until the app closes. */
(function () {
  'use strict';
  var KEY = 'ot.q', listeners = [], sending = false, userId = '';

  function storage() { return window.Auth && window.Auth.isShared() ? sessionStorage : localStorage; }
  function all() { try { return JSON.parse(storage().getItem(KEY) || '[]'); } catch (e) { return []; } }
  function write(q) { try { storage().setItem(KEY, JSON.stringify(q)); } catch (e) { /* storage full: kept in this list only */ } emit(); }
  function mine() { return all().filter(function (x) { return x.user === userId; }); }
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function emit(info) { listeners.forEach(function (fn) { try { fn(info || {}); } catch (e) { /* ignore */ } }); }

  /**
   * Keep a save to send later. key: a later save with the same key replaces a waiting one (the newest report wins).
   * The payload gets a client_id once, so if the answer to a send is lost, sending again changes nothing on the server.
   */
  function add(action, payload, label, key) {
    if (!payload.client_id) payload.client_id = uid();
    var q = all().filter(function (x) { return !(key && x.key === key && x.user === userId && x.state !== 'sending'); });
    q.push({ id: uid(), user: userId, key: key || '', action: action, payload: payload, label: label, at: new Date().toISOString(), state: 'waiting', error: '' });
    write(q);
    setTimeout(flush, 50);
  }

  function update(id, change) {
    write(all().map(function (x) { if (x.id === id) for (var k in change) x[k] = change[k]; return x; }));
  }
  function remove(id) { write(all().filter(function (x) { return x.id !== id; })); }

  /** Sends what is waiting, one at a time, oldest first. Stops at the first sign of no connection. */
  function flush() {
    if (sending || !userId || !navigator.onLine || !window.Api) return Promise.resolve({ sent: 0 });
    var todo = mine().filter(function (x) { return x.state === 'waiting'; });
    if (!todo.length) return Promise.resolve({ sent: 0 });
    sending = true;
    var sent = 0;
    var next = function (i) {
      if (i >= todo.length) return Promise.resolve();
      var item = todo[i];
      return window.Api.call(item.action, item.payload).then(function () {
        remove(item.id); sent++;
        return next(i + 1);
      }).catch(function (e) {
        if (e.code === 'OFFLINE' || e.code === 'AUTH_EXPIRED' || e.code === 'AUTH_REQUIRED' || e.code === 'BUSY' || e.code === 'SERVER_ERROR') return;   // try again later
        update(item.id, { state: 'failed', error: e.message || 'Not accepted' });
        return next(i + 1);
      });
    };
    return next(0).then(function () { sending = false; emit({ sent: sent }); return { sent: sent }; },
      function () { sending = false; emit({ sent: sent }); return { sent: sent }; });
  }

  window.addEventListener('online', function () { emit(); flush(); });
  window.addEventListener('offline', function () { emit(); });
  setInterval(function () { if (mine().some(function (x) { return x.state === 'waiting'; })) flush(); }, 45000);
  window.addEventListener('beforeunload', function (e) {
    // On a borrowed phone, closing the app loses saves that were not sent.
    if (window.Auth && window.Auth.isShared() && mine().length) { e.preventDefault(); e.returnValue = ''; }
  });

  window.Sync = {
    setUser: function (id) { userId = id || ''; emit(); },
    add: add, flush: flush, retry: function (id) { update(id, { state: 'waiting', error: '' }); return flush(); },
    remove: remove, items: mine,
    waiting: function () { return mine().filter(function (x) { return x.state !== 'failed'; }).length; },
    failed: function () { return mine().filter(function (x) { return x.state === 'failed'; }).length; },
    find: function (key) { return mine().filter(function (x) { return x.key === key && x.state !== 'failed'; })[0] || null; },
    on: function (fn) { listeners.push(fn); },
    isSending: function () { return sending; }
  };
})();
