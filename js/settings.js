import {
    db
} from "./firebase.js";

import {
    initI18n
} from "./i18n.js";

import {
    authGuard,
    buildShell
} from "./common.js";

import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const { t } =
    await initI18n();


authGuard(
    async user => {

        buildShell(
            user,
            t,
            "nav_settings"
        );


        document.getElementById(
            "pageTitle"
        ).textContent =
            t("settings");


        document.getElementById(
            "pageSubtitle"
        ).textContent =
            t("settings_subtitle");


        document.getElementById(
            "pageContent"
        ).innerHTML = `

            <section class="card">

                <div class="settings-row">

                    <div>

                        <strong>
                            ${t("language")}
                        </strong>

                        <div class="small">
                            ${t("language_desc")}
                        </div>

                    </div>


                    <select
                        id="settingsLanguage"
                        class="select"
                        style="width:auto"
                    >

                        <option value="en">
                            English
                        </option>

                        <option value="fr">
                            Français
                        </option>

                        <option value="ar">
                            العربية
                        </option>

                    </select>

                </div>


                <div class="settings-row">

                    <div>

                        <strong>
                            ${t("account")}
                        </strong>

                        <div class="small">
                            ${user.email}
                        </div>

                    </div>

                </div>


                <div class="settings-row">

                    <div>

                        <strong>
                            ${t("danger_zone")}
                        </strong>

                        <div class="small">
                            ${t("logout_desc")}
                        </div>

                    </div>


                    <button
                        id="logoutSettings"
                        class="btn btn-danger"
                    >
                        ${t("logout")}
                    </button>

                </div>

            </section>

        `;


        const languageSelect =
            document.getElementById(
                "settingsLanguage"
            );


        languageSelect.value =
            localStorage.getItem(
                "financeLanguage"
            ) || "en";


        languageSelect.onchange =
            async event => {

                const language =
                    event.target.value;


                localStorage.setItem(
                    "financeLanguage",
                    language
                );


                await updateDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        language
                    }
                );


                location.reload();

            };


        document.getElementById(
            "logoutSettings"
        ).onclick =
            () => document
                .getElementById(
                    "logoutBtn"
                )
                .click();

    }
);