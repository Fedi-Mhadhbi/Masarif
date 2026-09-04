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


/*
 * "all" | "owe" | "owed"
 */

let activeFilter = "all";


authGuard(
    async user => {

        buildShell(
            user,
            t,
            "nav_debts"
        );


        document.getElementById(
            "pageTitle"
        ).textContent =
            t("debts");


        document.getElementById(
            "pageSubtitle"
        ).textContent =
            t("debts_subtitle");


        await render(user);

    }
);


function calcDebtTotals(debts) {

    let totalOwe = 0;

    let totalOwed = 0;


    debts.forEach(
        debt => {

            const remaining =
                Math.max(
                    0,
                    Number(debt.amount || 0) -
                    Number(debt.paidAmount || 0)
                );


            if (debt.type === "owe") {

                totalOwe += remaining;

            } else {

                totalOwed += remaining;

            }

        }
    );


    return {

        totalOwe,

        totalOwed,

        net: totalOwed - totalOwe

    };

}


function debtCard(debt, t) {

    const total =
        Number(debt.amount || 0);

    const paid =
        Math.min(
            total,
            Number(debt.paidAmount || 0)
        );

    const remaining =
        Math.max(0, total - paid);

    const percentage =
        Math.min(
            100,
            (paid / total) * 100 || 0
        );

    const isSettled =
        remaining <= 0;

    const isOwe =
        debt.type === "owe";


    return `

        <div class="card goal-card debt-card">

            <div class="goal-top">

                <strong>

                    ${isOwe ? "📤" : "📥"}

                    ${esc(debt.personName)}

                </strong>


                <button
                    class="btn btn-danger del-debt"
                    data-id="${debt.id}"
                >
                    ×
                </button>

            </div>


            <span
                class="badge ${
                    isOwe
                        ? "badge-owe"
                        : "badge-owed"
                }"
            >
                ${isOwe ? t("you_owe") : t("owed_to_you")}
            </span>


            ${
                debt.note
                    ? `<div class="small">${esc(debt.note)}</div>`
                    : ""
            }


            <div class="goal-amount">

                ${money(paid)}

                /

                ${money(total)}

            </div>


            <div class="progress">

                <span
                    style="
                        width:${percentage}%;
                        ${
                            isSettled
                                ? "background:var(--success);"
                                : ""
                        }
                    "
                ></span>

            </div>


            <div class="small">

                ${
                    isSettled
                        ? `✅ ${t("settled")}`
                        : `${money(remaining)} ${t("remaining")}`
                }

                ${
                    debt.dueDate
                        ? ` · ${t("due")}: ${debt.dueDate}`
                        : ""
                }

            </div>


            ${
                isSettled
                    ? ""
                    : `
                        <button
                            class="btn btn-secondary record-payment"
                            data-id="${debt.id}"
                        >
                            ${t("record_payment")}
                        </button>
                    `
            }

        </div>

    `;

}


async function render(user) {

    const debts =
        await getCollection(
            user.uid,
            "debts"
        );


    const totals =
        calcDebtTotals(debts);


    const filtered =
        activeFilter === "all"
            ? debts
            : debts.filter(
                debt =>
                    debt.type ===
                    activeFilter
            );


    document.getElementById(
        "pageContent"
    ).innerHTML = `

        <section class="card">

            <div class="debt-summary">

                <div class="summary-item">

                    <div class="small">
                        ${t("you_owe")}
                    </div>

                    <div class="summary-amount negative">
                        ${money(totals.totalOwe)}
                    </div>

                </div>


                <div class="summary-item">

                    <div class="small">
                        ${t("owed_to_you")}
                    </div>

                    <div class="summary-amount positive">
                        ${money(totals.totalOwed)}
                    </div>

                </div>


                <div class="summary-item">

                    <div class="small">
                        ${t("net_balance")}
                    </div>

                    <div class="summary-amount ${
                        totals.net >= 0
                            ? "positive"
                            : "negative"
                    }">
                        ${money(Math.abs(totals.net))}
                    </div>

                </div>

            </div>

        </section>


        <section class="card page-card">

            <div class="section-title">

                <h2>
                    ${t("your_debts")}
                </h2>

                <button
                    id="openDebt"
                    class="btn btn-primary"
                >
                    ${t("add_debt")}
                </button>

            </div>


            <div class="tabs">

                <button
                    class="tab-btn ${
                        activeFilter === "all"
                            ? "active"
                            : ""
                    }"
                    data-filter="all"
                >
                    ${t("all")}
                </button>

                <button
                    class="tab-btn ${
                        activeFilter === "owe"
                            ? "active"
                            : ""
                    }"
                    data-filter="owe"
                >
                    ${t("you_owe")}
                </button>

                <button
                    class="tab-btn ${
                        activeFilter === "owed"
                            ? "active"
                            : ""
                    }"
                    data-filter="owed"
                >
                    ${t("owed_to_you")}
                </button>

            </div>


            <div class="cards">

                ${
                    filtered.length
                        ? filtered
                            .map(debt => debtCard(debt, t))
                            .join("")

                        : `
                            <div class="empty">
                                ${t("no_debts")}
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
                    ${t("add_debt")}
                </h2>


                <form
                    id="debtForm"
                    class="form"
                >

                    <label>
                        ${t("person_name")}
                    </label>

                    <input
                        id="debtPerson"
                        class="input"
                        required
                    >


                    <label>
                        ${t("debt_type")}
                    </label>

                    <select
                        id="debtType"
                        class="select"
                    >
                        <option value="owe">
                            ${t("type_owe")}
                        </option>
                        <option value="owed">
                            ${t("type_owed")}
                        </option>
                    </select>


                    <label>
                        ${t("amount")}
                    </label>

                    <input
                        id="debtAmount"
                        class="input"
                        type="number"
                        min="1"
                        step=".01"
                        required
                    >


                    <label>
                        ${t("due_date_optional")}
                    </label>

                    <input
                        id="debtDueDate"
                        class="input"
                        type="date"
                    >


                    <label>
                        ${t("note_optional")}
                    </label>

                    <input
                        id="debtNote"
                        class="input"
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


    /*
     * Tabs
     */

    document
        .querySelectorAll(
            ".tab-btn"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        activeFilter =
                            button.dataset
                                .filter;

                        render(user);

                    };

            }
        );


    /*
     * Modal
     */

    document.getElementById(
        "openDebt"
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
        "debtForm"
    ).onsubmit =
        async event => {

            event.preventDefault();


            await addDoc(
                collection(
                    db,
                    "users",
                    user.uid,
                    "debts"
                ),
                {

                    personName:
                        document.getElementById(
                            "debtPerson"
                        ).value.trim(),

                    type:
                        document.getElementById(
                            "debtType"
                        ).value,

                    amount:
                        Number(
                            document.getElementById(
                                "debtAmount"
                            ).value
                        ),

                    paidAmount: 0,

                    dueDate:
                        document.getElementById(
                            "debtDueDate"
                        ).value,

                    note:
                        document.getElementById(
                            "debtNote"
                        ).value.trim()

                }
            );


            render(user);

        };


    /*
     * Delete
     */

    document
        .querySelectorAll(
            ".del-debt"
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
                                    "debts",
                                    button.dataset.id
                                )
                            );


                            render(user);

                        }

                    };

            }
        );


    /*
     * Record payment
     */

    document
        .querySelectorAll(
            ".record-payment"
        )
        .forEach(
            button => {

                button.onclick =
                    async () => {

                        const amount =
                            prompt(
                                t(
                                    "payment_amount_prompt"
                                )
                            );


                        if (
                            amount &&
                            Number(amount) > 0
                        ) {

                            const debt =
                                debts.find(
                                    item =>
                                        item.id ===
                                        button.dataset.id
                                );


                            const newPaid =
                                Math.min(
                                    Number(
                                        debt.amount
                                    ),
                                    Number(
                                        debt.paidAmount || 0
                                    ) +
                                    Number(amount)
                                );


                            await updateDoc(
                                doc(
                                    db,
                                    "users",
                                    user.uid,
                                    "debts",
                                    debt.id
                                ),
                                {

                                    paidAmount:
                                        newPaid

                                }
                            );


                            render(user);

                        }

                    };

            }
        );

}
