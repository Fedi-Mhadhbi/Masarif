import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    initializeFirestore,
    persistentLocalCache
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {

    apiKey: "AIzaSyAb8zTw9vcxmkWIXTSTYk7K7jxmtBS5FzE",

    authDomain:
        "finance-app-e4d07.firebaseapp.com",

    projectId:
        "finance-app-e4d07",

    storageBucket:
        "finance-app-e4d07.firebasestorage.app",

    messagingSenderId:
        "597009619980",

    appId:
        "1:597009619980:web:bfc4fbaa438ac1a1bf6229",

    measurementId:
        "G-36RSTTJGBY"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/*
 * Enables Firestore's offline cache (IndexedDB-backed).
 *
 * Once enabled: reads are served from the local cache when
 * offline, and writes (addDoc/updateDoc/deleteDoc) apply to
 * the cache immediately and queue up, syncing to the server
 * automatically once the connection comes back — no other
 * code changes needed anywhere else in the app.
 *
 * Uses single-tab persistence (the default): if the user has
 * the app open in more than one tab at once, only the most
 * recently active tab keeps working offline; the others just
 * fall back to online-only behavior instead of erroring.
 */
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({})
});