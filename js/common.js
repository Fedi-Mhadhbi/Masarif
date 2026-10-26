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
            "debts.html",
            "🤝",
            "nav_debts"
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
                            ${installLabel()}
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
                            aria-label="${installLabel()}"
                            title="${installLabel()}"
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
     * Show the install buttons unless the app is already
     * installed. Android Chrome only fires "beforeinstallprompt"
     * in some situations (and never on iOS), so the buttons are
     * always offered on touch devices, with step-by-step
     * instructions as the fallback.
     */

    if (isStandaloneMode()) {

        hideInstallButtons();

    } else if (shouldOfferInstall()) {

        showInstallButton();

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

export function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {

        return;

    }


    const hadController =
        Boolean(navigator.serviceWorker.controller);

    let reloaded = false;


    /*
     * When a NEW service worker takes over (after you
     * deploy an update), reload once so the page runs the
     * fresh files. Skipped on the very first install.
     */

    navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {

            if (!hadController || reloaded) {

                return;

            }

            reloaded = true;

            location.reload();

        }
    );


    const register = () => {

        navigator.serviceWorker
            .register(
                "./service_worker.js",
                { updateViaCache: "none" }
            )
            .then(
                registration => {

                    console.log(
                        "Service Worker registered:",
                        registration.scope
                    );

                    registration.update();

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

    };


    if (document.readyState === "complete") {

        register();

    } else {

        window.addEventListener("load", register);

    }

}


/*
 * Runs on every page that imports common.js — including
 * login/register (via auth.js), so the app is installable
 * even before the first login.
 */

registerServiceWorker();


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
        ),

        document.getElementById(
            "installAuthBtn"
        )

    ].filter(Boolean);

}


function showInstallButton() {

    /*
     * Don't show the buttons if the
     * app is already installed.
     */

    if (isStandaloneMode()) {

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


const INSTALL_TEXT = {

    en: {
        label: "Install app",
        title: "📲 Add to Home Screen",
        close: "Got it",
        iosIntro:
            "Safari doesn't let websites start the installation " +
            "directly. Just a few taps:",
        iosSteps: [
            "Tap the <strong>Share</strong> button (the square with an arrow) in Safari's toolbar.",
            "Scroll down and tap <strong>Add to Home Screen</strong>.",
            "Tap <strong>Add</strong> in the top corner."
        ],
        androidIntro:
            "Your browser didn't offer the one-tap install, " +
            "but you can add the app manually:",
        androidSteps: [
            "Tap the <strong>⋮</strong> menu in the top corner of Chrome.",
            "Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.",
            "Confirm with <strong>Install</strong> / <strong>Add</strong>."
        ],
        androidHint:
            "Can't see it? Turn OFF <strong>Desktop site</strong> in " +
            "the same menu, reload the page, then open the menu again."
    },

    fr: {
        label: "Installer l'app",
        title: "📲 Ajouter à l'écran d'accueil",
        close: "Compris",
        iosIntro:
            "Safari ne permet pas aux sites de lancer l'installation " +
            "directement. Quelques appuis suffisent :",
        iosSteps: [
            "Appuyez sur le bouton <strong>Partager</strong> (le carré avec une flèche) dans la barre de Safari.",
            "Faites défiler et appuyez sur <strong>Sur l'écran d'accueil</strong>.",
            "Appuyez sur <strong>Ajouter</strong> en haut."
        ],
        androidIntro:
            "Votre navigateur n'a pas proposé l'installation en un clic, " +
            "mais vous pouvez ajouter l'application manuellement :",
        androidSteps: [
            "Appuyez sur le menu <strong>⋮</strong> en haut de Chrome.",
            "Appuyez sur <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong>.",
            "Confirmez avec <strong>Installer</strong> / <strong>Ajouter</strong>."
        ],
        androidHint:
            "Vous ne le voyez pas ? Désactivez <strong>Version ordinateur</strong> " +
            "dans le même menu, rechargez la page, puis rouvrez le menu."
    },

    ar: {
        label: "تثبيت التطبيق",
        title: "📲 إضافة إلى الشاشة الرئيسية",
        close: "حسنًا",
        iosIntro:
            "لا يسمح Safari للمواقع ببدء التثبيت مباشرة. " +
            "فقط بضع ضغطات:",
        iosSteps: [
            "اضغط على زر <strong>المشاركة</strong> (المربع مع السهم) في شريط Safari.",
            "مرّر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية</strong>.",
            "اضغط على <strong>إضافة</strong> في الأعلى."
        ],
        androidIntro:
            "لم يعرض المتصفح التثبيت بضغطة واحدة، " +
            "لكن يمكنك إضافة التطبيق يدويًا:",
        androidSteps: [
            "اضغط على قائمة <strong>⋮</strong> في أعلى متصفح Chrome.",
            "اختر <strong>تثبيت التطبيق</strong> أو <strong>إضافة إلى الشاشة الرئيسية</strong>.",
            "أكّد بالضغط على <strong>تثبيت</strong> / <strong>إضافة</strong>."
        ],
        androidHint:
            "لا تجدها؟ ألغِ تفعيل <strong>موقع سطح المكتب</strong> " +
            "من نفس القائمة، ثم أعد تحميل الصفحة وافتح القائمة مجددًا."
    }

};


function installText() {

    return (
        INSTALL_TEXT[getCurrentLanguage()] ||
        INSTALL_TEXT.en
    );

}


function installLabel() {

    return installText().label;

}


function isStandaloneMode() {

    return (
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true
    );

}


/*
 * Touch devices (phones/tablets — including Android Chrome
 * in "Desktop site" mode) or whenever Chrome already gave us
 * the native install prompt.
 */

function shouldOfferInstall() {

    return (
        Boolean(deferredInstallPrompt) ||
        isIos() ||
        /android/i.test(navigator.userAgent) ||
        navigator.maxTouchPoints > 1
    );

}


function showInstallInstructions() {

    const text = installText();

    const ios = isIos();

    const steps =
        ios ? text.iosSteps : text.androidSteps;

    const intro =
        ios ? text.iosIntro : text.androidIntro;


    let modal =
        document.getElementById(
            "installInstructionsModal"
        );

    if (modal) {

        modal.remove();

    }


    modal = document.createElement("div");

    modal.id = "installInstructionsModal";

    modal.className = "modal-backdrop show";

    modal.innerHTML = `

        <div class="modal">

            <h2>${text.title}</h2>

            <p class="muted" style="margin-bottom:14px">
                ${intro}
            </p>

            <ol style="margin:0 18px 14px; display:grid; gap:8px">
                ${steps.map(step => `<li>${step}</li>`).join("")}
            </ol>

            ${
                ios
                    ? ""
                    : `<p class="small" style="margin-bottom:6px">
                           💡 ${text.androidHint}
                       </p>`
            }

            <div class="modal-actions">
                <button
                    type="button"
                    id="closeInstallInstructions"
                    class="btn btn-primary"
                >
                    ${text.close}
                </button>
            </div>

        </div>

    `;


    document.body.appendChild(modal);


    const close = () => modal.remove();


    modal
        .querySelector("#closeInstallInstructions")
        .addEventListener("click", close);


    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                close();

            }

        }
    );

}


export async function installApp() {

    /*
     * Chrome handed us the native prompt:
     * one-tap install.
     */

    if (deferredInstallPrompt) {

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

        deferredInstallPrompt = null;

        if (result.outcome === "accepted") {

            hideInstallButtons();

        }

        return;

    }


    /*
     * No native prompt available (iOS Safari, Android
     * Chrome in "Desktop site" mode, or Chrome hasn't
     * decided the app is installable yet): show the
     * manual "Add to Home Screen" steps.
     */

    showInstallInstructions();

}


/*
 * Adds an "Install app" button to the login/register card
 * so people can install the app before they even sign in.
 */

export function mountAuthInstallButton() {

    if (isStandaloneMode()) {

        return;

    }

    if (document.getElementById("installAuthBtn")) {

        return;

    }

    const card =
        document.querySelector(".auth-card");

    if (!card) {

        return;

    }


    const button =
        document.createElement("button");

    button.id = "installAuthBtn";

    button.type = "button";

    button.className =
        "btn btn-secondary full";

    button.style.marginTop = "14px";

    button.textContent =
        `📲 ${installLabel()}`;

    button.addEventListener(
        "click",
        installApp
    );

    card.appendChild(button);

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