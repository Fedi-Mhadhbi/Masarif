/*
 * Masarif service worker
 *
 * - Your own files (HTML/CSS/JS): NETWORK FIRST. When online you
 *   always get the newest deployed version (no more bumping the
 *   cache name after every change); when offline or the network
 *   is slow, the last cached copy is used.
 * - Firebase SDK files from gstatic.com: cached on first use
 *   (they are versioned, so cache-first is safe) so the app can
 *   start offline.
 * - Firestore/Auth API calls are never touched.
 */

const CACHE_NAME = "masarif-v3";

const NETWORK_TIMEOUT_MS = 4000;

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./login.html",
    "./register.html",
    "./dashboard.html",
    "./transactions.html",
    "./budget.html",
    "./goals.html",
    "./debts.html",
    "./settings.html",

    "./manifest.json",

    "./css/style.css",

    "./js/firebase.js",
    "./js/auth.js",
    "./js/dashboard.js",
    "./js/transactions.js",
    "./js/budget.js",
    "./js/goals.js",
    "./js/debts.js",
    "./js/settings.js",
    "./js/i18n.js",
    "./js/common.js",

    "./locales/en.json",
    "./locales/fr.json",
    "./locales/ar.json",

    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-180.png"
];


self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME).then(cache =>

            /*
             * Cache each file on its own so a single missing
             * file can't make the whole install fail (which
             * would also break installability).
             */

            Promise.allSettled(
                FILES_TO_CACHE.map(file =>
                    cache.add(file).catch(error =>
                        console.warn("SW: could not cache", file, error)
                    )
                )
            )

        )

    );

    self.skipWaiting();

});


self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys =>

            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )

        ).then(() => self.clients.claim())

    );

});


function networkFirst(request) {

    return new Promise(resolve => {

        let settled = false;

        const fromCache = () =>
            caches.match(request, { ignoreSearch: true });

        const timer = setTimeout(() => {

            fromCache().then(cached => {

                if (cached && !settled) {

                    settled = true;

                    resolve(cached);

                }

            });

        }, NETWORK_TIMEOUT_MS);

        fetch(request)

            .then(response => {

                clearTimeout(timer);

                if (response && response.ok) {

                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache =>
                        cache.put(request, copy)
                    );

                }

                if (!settled) {

                    settled = true;

                    resolve(response);

                }

            })

            .catch(() => {

                clearTimeout(timer);

                fromCache().then(cached => {

                    if (settled) {

                        return;

                    }

                    settled = true;

                    resolve(
                        cached ||
                        (
                            request.mode === "navigate"
                                ? caches.match("./login.html")
                                : Response.error()
                        )
                    );

                });

            });

    });

}


function cacheFirst(request) {

    return caches.match(request).then(cached => {

        if (cached) {

            return cached;

        }

        return fetch(request).then(response => {

            if (response && response.ok) {

                const copy = response.clone();

                caches.open(CACHE_NAME).then(cache =>
                    cache.put(request, copy)
                );

            }

            return response;

        });

    });

}


self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") {

        return;

    }

    const url = new URL(request.url);


    /*
     * Versioned Firebase SDK modules: cache-first.
     */

    if (
        url.origin === "https://www.gstatic.com" &&
        url.pathname.startsWith("/firebasejs/")
    ) {

        event.respondWith(cacheFirst(request));

        return;

    }


    /*
     * Everything else that isn't our own site (Firestore,
     * Auth, fonts, analytics...) goes straight to the network.
     */

    if (url.origin !== self.location.origin) {

        return;

    }


    event.respondWith(networkFirst(request));

});
