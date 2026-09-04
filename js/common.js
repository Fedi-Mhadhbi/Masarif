import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getCurrentLanguage
} from "./i18n.js";


export const CATEGORIES = [

    ["food", "🍔"],
    ["housing", "🏠"],
    ["transport", "🚗"],
    ["bills", "💡"],
    ["shopping", "🛒"],
    ["entertainment", "🎮"],
    ["health", "🏥"],
    ["education", "📚"],
    ["other", "📦"]

];


export function money(value) {

    return `${Number(value || 0)
        .toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} DT`;

}


export function categoryIcon(category) {

    const item =
        CATEGORIES.find(
            item => item[0] === category
        );

    return item ? item[1] : "📦";

}


export function categoryLabel(category, t) {

    return t(`cat_${category}`);

}


export function esc(value = "") {

    return String(value)
        .replace(/[&<>"']/g, character => {

            const entities = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            };

            return entities[character];

        });

}


export function currentMonthRange() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        now.getMonth() + 1;

    const lastDay =
        new Date(year, month, 0)
            .getDate();


    const monthString =
        String(month).padStart(2, "0");


    return {

        start:
            `${year}-${monthString}-01`,

        end:
            `${year}-${monthString}-${lastDay}`

    };

}


export function authGuard(callback) {

    onAuthStateChanged(auth, user => {

        if (!user) {

            location.href = "login.html";

            return;

        }

        callback(user);

    });

}


const OFFLINE_BANNER_TEXT = {

    en: "You're offline — changes are saved locally and will sync once you're back online.",

    fr: "Vous êtes hors ligne — les modifications sont enregistrées localement et seront synchronisées dès le retour de la connexion.",

    ar: "أنت غير متصل — يتم حفظ التغييرات محليًا وستتم مزامنتها عند عودة الاتصال."

};


function initOfflineBanner() {

    let banner =
        document.getElementById(
            "offlineBanner"
        );


    if (!banner) {

        banner =
            document.createElement("div");

        banner.id = "offlineBanner";

        banner.className =
            "offline-banner";

        document.body.appendChild(
            banner
        );

    }


    const language =
        getCurrentLanguage();


    banner.textContent =
        OFFLINE_BANNER_TEXT[language] ||
        OFFLINE_BANNER_TEXT.en;


    function update() {

        banner.classList.toggle(
            "show",
            !navigator.onLine
        );

    }


    window.addEventListener(
        "online",
        update
    );

    window.addEventListener(
        "offline",
        update
    );


    update();

}


export function buildShell(
    user,
    t,
    active
) {

    const navigation = [

        [
            "dashboard.html",
            "🏠",
            "nav_dashboard"
        ],

        [
            "transactions.html",
            "💸",
            "nav_transactions"
        ],

        [
            "budget.html",
            "📊",
            "nav_budget"
        ],

        [
            "goals.html",
            "🎯",
            "nav_goals"
        ],

        [
            "settings.html",
            "⚙️",
            "nav_settings"
        ]

    ];


    document.getElementById("app").innerHTML = `

        <div class="app-shell">

            <aside class="sidebar">

                <div class="brand">

                    <span class="brand-mark">
                        ₣
                    </span>

                    <span>
                        Finance
                    </span>

                </div>


                <nav class="nav">

                    ${navigation.map(
                        ([href, icon, key]) => `

                            <a
                                href="${href}"
                                class="${
                                    active === key
                                        ? "active"
                                        : ""
                                }"
                            >

                                <span>
                                    ${icon}
                                </span>

                                <span>
                                    ${t(key)}
                                </span>

                            </a>

                        `
                    ).join("")}

                </nav>


                <div class="sidebar-bottom">

                    <button
                        id="installAppBtn"
                        class="btn btn-primary install-btn"
                        style="display:none"
                    >

                        <span>
                            📲
                        </span>

                        <span>
                            ${t("install_app")}
                        </span>

                    </button>


                    <button
                        id="logoutBtn"
                        class="btn logout"
                    >

                        <span>
                            ↪
                        </span>

                        <span>
                            ${t("logout")}
                        </span>

                    </button>

                </div>

            </aside>


            <main class="main">

                <header class="topbar">

                    <div>

                        <h1 id="pageTitle"></h1>

                        <div
                            class="small"
                            id="pageSubtitle"
                        ></div>

                    </div>


                    <div class="topbar-actions">

                        <button
                            id="installAppBtnMobile"
                            class="btn btn-primary install-btn-mobile"
                            style="display:none"
                            aria-label="${t("install_app")}"
                            title="${t("install_app")}"
                        >
                            📲
                        </button>


                        <span class="user-pill">

                            ${esc(
                                user.displayName ||
                                user.email
                            )}

                        </span>


                        <select
                            id="languageSelect"
                            class="select"
                            style="width:auto"
                        >

                            <option value="en">
                                EN
                            </option>

                            <option value="fr">
                                FR
                            </option>

                            <option value="ar">
                                AR
                            </option>

                        </select>

                    </div>

                </header>


                <div id="pageContent"></div>

            </main>

        </div>

    `;


    /*
     * Language selector
     */

    const languageSelect =
        document.getElementById(
            "languageSelect"
        );


    languageSelect.value =
        localStorage.getItem(
            "financeLanguage"
        ) || "en";


    languageSelect.addEventListener(
        "change",
        event => {

            localStorage.setItem(
                "financeLanguage",
                event.target.value
            );

            location.reload();

        }
    );


    /*
     * Offline indicator
     */

    initOfflineBanner();


    /*
     * Logout
     */

    document
        .getElementById("logoutBtn")
        .addEventListener(
            "click",
            async () => {

                await signOut(auth);

                location.href =
                    "login.html";

            }
        );


    /*
     * Install PWA buttons
     * (desktop sidebar version + mobile topbar version)
     */

    const installButton =
        document.getElementById(
            "installAppBtn"
        );

    const installButtonMobile =
        document.getElementById(
            "installAppBtnMobile"
        );


    [installButton, installButtonMobile]
        .filter(Boolean)
        .forEach(button => {

            button.addEventListener(
                "click",
                installApp
            );

        });


    /*
     * If the app is already installed,
     * don't show either install button.
     */

    const isStandalone =
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true;


    if (isStandalone) {

        [installButton, installButtonMobile]
            .filter(Boolean)
            .forEach(button => {

                button.style.display =
                    "none";

            });

    } else if (isIos()) {

        /*
         * iOS/iPadOS Safari never fires
         * "beforeinstallprompt", so show the
         * mobile button right away; tapping it
         * shows manual "Add to Home Screen" steps.
         */

        if (installButtonMobile) {

            installButtonMobile.style.display =
                "inline-flex";

        }

    }

}


export async function getCollection(
    uid,
    name
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                "users",
                uid,
                name
            )
        );


    return snapshot.docs.map(
        document => ({

            id: document.id,

            ...document.data()

        })
    );

}


export async function getMonthTransactions(
    uid
) {

    const {
        start,
        end
    } = currentMonthRange();


    const transactionQuery =
        query(

            collection(
                db,
                "users",
                uid,
                "transactions"
            ),

            where(
                "date",
                ">=",
                start
            ),

            where(
                "date",
                "<=",
                end
            )

        );


    const snapshot =
        await getDocs(
            transactionQuery
        );


    return snapshot.docs

        .map(
            document => ({

                id: document.id,

                ...document.data()

            })
        )

        .sort(
            (a, b) =>
                String(b.date)
                    .localeCompare(
                        String(a.date)
                    )
        );

}


export function calcTotals(
    transactions
) {

    let income = 0;

    let expenses = 0;


    transactions.forEach(
        transaction => {

            if (
                transaction.type ===
                "income"
            ) {

                income +=
                    Number(
                        transaction.amount
                    );

            } else {

                expenses +=
                    Number(
                        transaction.amount
                    );

            }

        }
    );


    return {

        income,

        expenses,

        balance:
            income - expenses

    };

}


/*
 * =========================================
 * PWA / SERVICE WORKER
 * =========================================
 */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service_worker.js"
                )

                .then(
                    registration => {

                        console.log(
                            "Service Worker registered:",
                            registration.scope
                        );

                    }
                )

                .catch(
                    error => {

                        console.error(
                            "Service Worker registration failed:",
                            error
                        );

                    }
                );

        }
    );

}


/*
 * =========================================
 * PWA INSTALL PROMPT
 * =========================================
 */

let deferredInstallPrompt = null;


window.addEventListener(
    "beforeinstallprompt",
    event => {

        /*
         * Prevent Chrome from showing
         * its automatic install prompt.
         */

        event.preventDefault();


        deferredInstallPrompt =
            event;


        showInstallButton();

    }
);


function getInstallButtons() {

    return [

        document.getElementById(
            "installAppBtn"
        ),

        document.getElementById(
            "installAppBtnMobile"
        )

    ].filter(Boolean);

}


function showInstallButton() {

    /*
     * Don't show the buttons if the
     * app is already installed.
     */

    if (
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true
    ) {

        return;

    }


    getInstallButtons().forEach(
        button => {

            button.style.display =
                "inline-flex";

        }
    );

}


function hideInstallButtons() {

    getInstallButtons().forEach(
        button => {

            button.style.display =
                "none";

        }
    );

}


function isIos() {

    return (
        /iphone|ipad|ipod/i.test(
            navigator.userAgent
        ) ||
        (
            navigator.platform === "MacIntel" &&
            navigator.maxTouchPoints > 1
        )
    );

}


function showIosInstallInstructions() {

    const existing =
        document.getElementById(
            "iosInstallModal"
        );


    if (existing) {

        existing.classList.add("show");

        return;

    }


    const modal =
        document.createElement("div");

    modal.id = "iosInstallModal";
    modal.className = "modal-backdrop show";

    modal.innerHTML = `

        <div class="modal">

            <h2>📲 Add to Home Screen</h2>

            <p class="muted" style="margin-bottom:14px">
                iPhone and iPad don't let apps trigger the
                install prompt directly. Just a couple of taps:
            </p>

            <ol style="margin:0 0 18px 18px; display:grid; gap:8px">
                <li>Tap the <strong>Share</strong> button
                    (the square with an arrow) in Safari's toolbar.</li>
                <li>Scroll down and tap
                    <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
            </ol>

            <div class="modal-actions">
                <button
                    type="button"
                    id="closeIosInstallModal"
                    class="btn btn-primary"
                >
                    Got it
                </button>
            </div>

        </div>

    `;


    document.body.appendChild(modal);


    modal
        .querySelector("#closeIosInstallModal")
        .addEventListener(
            "click",
            () => modal.classList.remove("show")
        );


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                modal.classList.remove("show");

            }

        }
    );

}


export async function installApp() {

    /*
     * iOS/iPadOS Safari never supports the
     * native install prompt — show manual steps.
     */

    if (isIos()) {

        showIosInstallInstructions();

        return;

    }


    /*
     * If the browser doesn't support
     * the install prompt (and isn't iOS).
     */

    if (!deferredInstallPrompt) {

        alert(
            "Installation is not currently available. " +
            "Please use your browser's 'Add to Home Screen' option."
        );

        return;

    }


    /*
     * Show browser installation dialog.
     */

    deferredInstallPrompt.prompt();


    const result =
        await deferredInstallPrompt.userChoice;


    console.log(
        "Install result:",
        result.outcome
    );


    /*
     * The prompt can only be used once.
     */

    deferredInstallPrompt =
        null;


    /*
     * Hide buttons after installation
     * or cancellation.
     */

    hideInstallButtons();

}


/*
 * When the app is successfully installed.
 */

window.addEventListener(
    "appinstalled",
    () => {

        console.log(
            "Mizan was installed successfully."
        );


        deferredInstallPrompt =
            null;


        hideInstallButtons();

    }
);