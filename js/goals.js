import {
    db
} from "./firebase.js";

import {
    initI18n
} from "./i18n.js";

import {
    authGuard,
    buildShell,
    getCollection,
    money,
    esc
} from "./common.js";

import {
    collection,
    addDoc,
    deleteDoc,
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
            "nav_goals"
        );


        document.getElementById(
            "pageTitle"
        ).textContent =
            t("savings_goals");


        document.getElementById(
            "pageSubtitle"
        ).textContent =
            t("goal_subtitle");


        await render(user);

    }
);


async function render(user) {

    const goals =
        await getCollection(
            user.uid,
            "savings_goals"
        );


    document.getElementById(
        "pageContent"
    ).innerHTML = `

        <section class="card">

            <div class="section-title">

                <h2>
                    ${t("your_goals")}
                </h2>

                <button
                    id="openGoal"
                    class="btn btn-primary"
                >
                    ${t("add_goal")}
                </button>

            </div>


            <div class="cards">

                ${
                    goals
                        .map(
                            goal => {

                                const percentage =
                                    Math.min(
                                        100,
                                        Number(
                                            goal.currentAmount
                                        ) /
                                        Number(
                                            goal.targetAmount
                                        ) *
                                        100
                                        || 0
                                    );


                                return `

                                    <div
                                        class="card goal-card"
                                    >

                                        <div class="goal-top">

                                            <strong>
                                                🎯
                                                ${esc(
                                                    goal.name
                                                )}
                                            </strong>


                                            <button
                                                class="btn btn-danger del-goal"
                                                data-id="${goal.id}"
                                            >
                                                ×
                                            </button>

                                        </div>


                                        <div class="goal-amount">

                                            ${money(
                                                goal.currentAmount
                                            )}

                                            /

                                            ${money(
                                                goal.targetAmount
                                            )}

                                        </div>


                                        <div class="progress">

                                            <span
                                                style="
                                                    width:${percentage}%
                                                "
                                            ></span>

                                        </div>


                                        <div class="small">

                                            ${percentage.toFixed(0)}%

                                            ${t("complete")}

                                            ${
                                                goal.targetDate
                                                    ? ` · ${t(
                                                        "target"
                                                    )}: ${goal.targetDate}`
                                                    : ""
                                            }

                                        </div>


                                        <button
                                            class="btn btn-secondary add-saving"
                                            data-id="${goal.id}"
                                        >
                                            ${t("add_saving")}
                                        </button>

                                    </div>

                                `;

                            }
                        )
                        .join("")

                    || `

                        <div class="empty">
                            ${t("no_goals")}
                        </div>

                    `
                }

            </div>

        </section>


        <div
            id="modal"
            class="modal-backdrop"
        >

            <div class="modal">

                <h2>
                    ${t("add_goal")}
                </h2>


                <form
                    id="goalForm"
                    class="form"
                >

                    <label>
                        ${t("goal_name")}
                    </label>

                    <input
                        id="goalName"
                        class="input"
                        required
                    >


                    <label>
                        ${t("target_amount")}
                    </label>

                    <input
                        id="goalTarget"
                        class="input"
                        type="number"
                        min="1"
                        step=".01"
                        required
                    >


                    <label>
                        ${t("current_amount")}
                    </label>

                    <input
                        id="goalCurrent"
                        class="input"
                        type="number"
                        min="0"
                        step=".01"
                        value="0"
                    >


                    <label>
                        ${t("target_date")}
                    </label>

                    <input
                        id="goalDate"
                        class="input"
                        type="date"
                    >


                    <div class="modal-actions">

                        <button
                            type="button"
                            id="close"
                            class="btn btn-secondary"
                        >
                            ${t("cancel")}
                        </button>

                        <button
                            class="btn btn-primary"
                        >
                            ${t("save")}
                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;


    document.getElementById(
        "openGoal"
    ).onclick =
        () => document
            .getElementById("modal")
            .classList.add("show");


    document.getElementById(
        "close"
    ).onclick =
        () => document
            .getElementById("modal")
            .classList.remove("show");


    document.getElementById(
        "goalForm"
    ).onsubmit =
        async event => {

            event.preventDefault();


            await addDoc(
                collection(
                    db,
                    "users",
                    user.uid,
                    "savings_goals"
                ),
                {

                    name:
                        document.getElementById(
                            "goalName"
                        ).value.trim(),

                    targetAmount:
                        Number(
                            document.getElementById(
                                "goalTarget"
                            ).value
                        ),

                    currentAmount:
                        Number(
                            document.getElementById(
                                "goalCurrent"
                            ).value
                        ),

                    targetDate:
                        document.getElementById(
                            "goalDate"
                        ).value

                }
            );


            render(user);

        };


    document
        .querySelectorAll(
            ".del-goal"
        )
        .forEach(
            button => {

                button.onclick =
                    async () => {

                        if (
                            confirm(
                                t(
                                    "confirm_delete"
                                )
                            )
                        ) {

                            await deleteDoc(
                                doc(
                                    db,
                                    "users",
                                    user.uid,
                                    "savings_goals",
                                    button.dataset.id
                                )
                            );


                            render(user);

                        }

                    };

            }
        );


    document
        .querySelectorAll(
            ".add-saving"
        )
        .forEach(
            button => {

                button.onclick =
                    async () => {

                        const amount =
                            prompt(
                                t(
                                    "saving_amount"
                                )
                            );


                        if (
                            amount &&
                            Number(amount) > 0
                        ) {

                            const goal =
                                goals.find(
                                    item =>
                                        item.id ===
                                        button.dataset.id
                                );


                            await updateDoc(
                                doc(
                                    db,
                                    "users",
                                    user.uid,
                                    "savings_goals",
                                    goal.id
                                ),
                                {

                                    currentAmount:
                                        Number(
                                            goal.currentAmount
                                        ) +
                                        Number(
                                            amount
                                        )

                                }
                            );


                            render(user);

                        }

                    };

            }
        );

}