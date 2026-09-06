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
    getMonthTransactions,
    money,
    categoryLabel,
    categoryIcon
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


/*
 * null when adding a new budget, otherwise the id of the
 * budget currently being edited.
 */

let editingId = null;


authGuard(
    async user => {

        buildShell(
            user,
            t,
            "nav_budget"
        );


        document.getElementById(
            "pageTitle"
        ).textContent =
            t("budgets");


        document.getElementById(
            "pageSubtitle"
        ).textContent =
            t("budget_subtitle");


        await render(user);

    }
);


async function render(user) {

    const budgets =
        await getCollection(
            user.uid,
            "budgets"
        );


    const transactions =
        await getMonthTransactions(
            user.uid
        );


    const date =
        new Date();


    const month =
        date.getMonth() + 1;


    const year =
        date.getFullYear();


    const activeBudgets =
        budgets.filter(
            budget =>
                Number(budget.month) === month &&
                Number(budget.year) === year
        );


    const spent = {};


    transactions
        .filter(
            transaction =>
                transaction.type ===
                "expense"
        )
        .forEach(
            transaction => {

                spent[
                    transaction.category
                ] =
                    (
                        spent[
                            transaction.category
                        ] || 0
                    ) +
                    Number(
                        transaction.amount
                    );

            }
        );


    document.getElementById(
        "pageContent"
    ).innerHTML = `

        <section class="card">

            <div class="section-title">

                <h2>
                    ${t("monthly_budgets")}
                </h2>

                <button
                    id="openBudget"
                    class="btn btn-primary"
                >
                    ${t("add_budget")}
                </button>

            </div>


            <div class="list">

                ${
                    activeBudgets.length

                        ? activeBudgets
                            .map(
                                budget => {

                                    const spentAmount =
                                        spent[
                                            budget.category
                                        ] || 0;


                                    const percentage =
                                        Math.min(
                                            100,
                                            spentAmount /
                                            Number(
                                                budget.amount
                                            ) *
                                            100
                                        );


                                    return `

                                        <div class="list-item">

                                            <div
                                                style="flex:1"
                                            >

                                                <div class="goal-top">

                                                    <strong>

                                                        ${categoryIcon(
                                                            budget.category
                                                        )}

                                                        ${categoryLabel(
                                                            budget.category,
                                                            t
                                                        )}

                                                    </strong>


                                                    <span>

                                                        ${money(
                                                            spentAmount
                                                        )}

                                                        /

                                                        ${money(
                                                            budget.amount
                                                        )}

                                                    </span>

                                                </div>


                                                <div class="progress">

                                                    <span
                                                        style="
                                                            width:${percentage}%;
                                                            ${
                                                                percentage >= 100
                                                                    ? "background:#d94b5b;"
                                                                    : ""
                                                            }
                                                        "
                                                    ></span>

                                                </div>


                                                <div class="small">

                                                    ${money(
                                                        Math.max(
                                                            0,
                                                            Number(
                                                                budget.amount
                                                            ) -
                                                            spentAmount
                                                        )
                                                    )}

                                                    ${t("remaining")}

                                                </div>

                                            </div>


                                            <div class="card-actions">

                                                <button
                                                    class="btn btn-secondary edit-budget"
                                                    data-id="${budget.id}"
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    class="btn btn-danger del-budget"
                                                    data-id="${budget.id}"
                                                >
                                                    ×
                                                </button>

                                            </div>

                                        </div>

                                    `;

                                }
                            )
                            .join("")

                        : `

                            <div class="empty">
                                ${t("no_budgets")}
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

                <h2 id="budgetModalTitle">
                    ${t("add_budget")}
                </h2>


                <form
                    id="budgetForm"
                    class="form"
                >

                    <label>
                        ${t("category")}
                    </label>

                    <select
                        id="budgetCategory"
                        class="select"
                    >

                        ${
                            [
                                "food",
                                "housing",
                                "transport",
                                "bills",
                                "shopping",
                                "entertainment",
                                "health",
                                "education",
                                "other"
                            ]
                            .map(
                                category => `

                                    <option
                                        value="${category}"
                                    >
                                        ${categoryLabel(
                                            category,
                                            t
                                        )}
                                    </option>

                                `
                            )
                            .join("")
                        }

                    </select>


                    <label>
                        ${t("amount")}
                    </label>

                    <input
                        id="budgetAmount"
                        class="input"
                        type="number"
                        min="1"
                        step=".01"
                        required
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
                            id="budgetSubmitBtn"
                            class="btn btn-primary"
                        >
                            ${t("save")}
                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;


    function openBudgetModal(budget) {

        editingId =
            budget ? budget.id : null;


        document.getElementById(
            "budgetModalTitle"
        ).textContent =
            budget ? t("edit_budget") : t("add_budget");


        document.getElementById(
            "budgetSubmitBtn"
        ).textContent =
            budget ? t("save_changes") : t("save");


        document.getElementById(
            "budgetCategory"
        ).value =
            budget ? budget.category : "food";

        document.getElementById(
            "budgetAmount"
        ).value =
            budget ? budget.amount : "";


        document
            .getElementById("modal")
            .classList.add("show");

    }


    document.getElementById(
        "openBudget"
    ).onclick =
        () => openBudgetModal(null);


    document.getElementById(
        "close"
    ).onclick =
        () => {

            editingId = null;

            document
                .getElementById("modal")
                .classList.remove("show");

        };


    document.getElementById(
        "budgetForm"
    ).onsubmit =
        async event => {

            event.preventDefault();


            const category =
                document.getElementById(
                    "budgetCategory"
                ).value;

            const amount =
                Number(
                    document.getElementById(
                        "budgetAmount"
                    ).value
                );


            if (editingId) {

                await updateDoc(
                    doc(
                        db,
                        "users",
                        user.uid,
                        "budgets",
                        editingId
                    ),
                    {

                        category,
                        amount

                    }
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "users",
                        user.uid,
                        "budgets"
                    ),
                    {

                        category,
                        amount,

                        month,

                        year

                    }
                );

            }


            editingId = null;

            render(user);

        };


    document
        .querySelectorAll(
            ".edit-budget"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        const budget =
                            activeBudgets.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        openBudgetModal(budget);

                    };

            }
        );


    document
        .querySelectorAll(
            ".del-budget"
        )
        .forEach(
            button => {

                button.onclick =
                    async () => {

                        if (
                            confirm(
                                t("confirm_delete")
                            )
                        ) {

                            await deleteDoc(
                                doc(
                                    db,
                                    "users",
                                    user.uid,
                                    "budgets",
                                    button.dataset.id
                                )
                            );


                            render(user);

                        }

                    };

            }
        );

}