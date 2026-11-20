/* Outreach Tracker service worker: keeps the app's own files on the phone so it opens at once.
   Only this folder's files are kept. Data always comes from the server; nothing about children is stored here. */
var VERSION = 'outreach-tracker-10.1.0';
var FILES = ['./', 'index.html', 'config.js', 'css/app.css', 'js/api.js', 'js/auth.js', 'js/sync.js', 'js/xlsx.js', 'js/app.js',
  'fonts/lexend.woff2', 'img/logo-96.png', 'img/logo-256.png', 'icons/favicon-48.png', 'manifest.webmanifest', 'participants-template.csv'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }));
});

self.addEventListener('activate', function (e) {
  // Remove only this app's own older copies, never another app's.
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('outreach-tracker-') === 0 && k !== VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('message', function (e) { if (e.data === 'update-now') self.skipWaiting(); });

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // server calls and Google Sign-In go straight to the network
  if (url.pathname.slice(-10) === '/config.js') {
    // The settings file: always try the network first, so a changed address takes effect.
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () { return caches.match(req); }));
    return;
  }
  // Everything else: from the phone at once; the network fills in anything missing.
  e.respondWith(caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return req.mode === 'navigate' ? caches.match('index.html') : Response.error(); });
  }));
});
