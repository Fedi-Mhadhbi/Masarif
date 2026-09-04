const CACHE_NAME = "mizan-v2";

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

    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-180.png"
];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(
                    cache =>
                        cache.addAll(
                            FILES_TO_CACHE
                        )
                )

        );

        self.skipWaiting();

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(
                    keys =>
                        Promise.all(

                            keys
                                .filter(
                                    key =>
                                        key !==
                                        CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )

                        )
                )

        );

        self.clients.claim();

    }
);


self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(
                event.request
            )
            .then(
                cachedResponse =>

                    cachedResponse ||
                    fetch(event.request)

            )

        );

    }
);