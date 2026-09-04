import {
    auth,
    db
} from "./firebase.js";

import {
    initI18n
} from "./i18n.js";

import {
    authGuard,
    buildShell,
    money,
    categoryIcon,
    categoryLabel,
    esc,
    getMonthTransactions
} from "./common.js";

import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const { t } =
    await initI18n();


authGuard(
    async user => {

        buildShell(
            user,
            t,
            "nav_transactions"
        );


        document.getElementById(
            "pageTitle"
        ).textContent =
            t("transactions");


        document.getElementById(
            "pageSubtitle"
        ).textContent =
            t("transactions_subtitle");


        await render(user);

    }
);


async function render(user) {

    const transactions =
        await getMonthTransactions(
            user.uid
        );


    document.getElementById(
        "pageContent"
    ).innerHTML = `

        <section class="card">

            <div class="section-title">

                <h2>
                    ${t("this_month")}
                </h2>

                <button
                    id="openAdd"
                    class="btn btn-primary"
                >
                    ${t("add_transaction")}
                </button>

            </div>


            <div class="toolbar">

                <select
                    id="filterType"
                    class="select"
                >

                    <option value="all">
                        ${t("all_types")}
                    </option>

                    <option value="expense">
                        ${t("expenses")}
                    </option>

                    <option value="income">
                        ${t("income")}
                    </option>

                </select>


                <select
                    id="filterCategory"
                    class="select"
                >

                    <option value="all">
                        ${t("all_categories")}
                    </option>

                    ${
                        Array.from(
                            new Set(
                                transactions
                                    .filter(
                                        transaction =>
                                            transaction.type ===
                                            "expense"
                                    )
                                    .map(
                                        transaction =>
                                            transaction.category
                                    )
                            )
                        )
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

            </div>


            <div class="table-wrap">

                <table class="table">

                    <thead>

                        <tr>

                            <th>
                                ${t("date")}
                            </th>

                            <th>
                                ${t("description")}
                            </th>

                            <th>
                                ${t("category")}
                            </th>

                            <th>
                                ${t("type")}
                            </th>

                            <th>
                                ${t("amount")}
                            </th>

                            <th></th>

                        </tr>

                    </thead>


                    <tbody id="txBody"></tbody>

                </table>

            </div>

        </section>


        <div
            id="modal"
            class="modal-backdrop"
        >

            <div class="modal">

                <h2>
                    ${t("add_transaction")}
                </h2>


                <form
                    id="txForm"
                    class="form-grid"
                >

                    <div>

                        <label>
                            ${t("type")}
                        </label>

                        <select
                            id="txType"
                            class="select"
                        >

                            <option value="expense">
                                ${t("expenses")}
                            </option>

                            <option value="income">
                                ${t("income")}
                            </option>

                        </select>

                    </div>


                    <div>

                        <label>
                            ${t("amount")}
                        </label>

                        <input
                            id="txAmount"
                            class="input"
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                        >

                    </div>


                    <div id="catWrap">

                        <label>
                            ${t("category")}
                        </label>

                        <select
                            id="txCategory"
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

                    </div>


                    <div>

                        <label>
                            ${t("date")}
                        </label>

                        <input
                            id="txDate"
                            class="input"
                            type="date"
                            value="${
                                new Date()
                                    .toISOString()
                                    .slice(0, 10)
                            }"
                            required
                        >

                    </div>


                    <div class="wide">

                        <label>
                            ${t("description")}
                        </label>

                        <input
                            id="txDescription"
                            class="input"
                            maxlength="100"
                        >

                    </div>


                    <div class="wide modal-actions">

                        <button
                            type="button"
                            id="closeModal"
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


    drawTransactions(
        transactions
    );


    document.getElementById(
        "openAdd"
    ).onclick = () => {

        document.getElementById(
            "modal"
        ).classList.add("show");

    };


    document.getElementById(
        "closeModal"
    ).onclick = () => {

        document.getElementById(
            "modal"
        ).classList.remove("show");

    };


    document.getElementById(
        "filterType"
    ).onchange =
        () => drawTransactions(
            transactions
        );


    document.getElementById(
        "filterCategory"
    ).onchange =
        () => drawTransactions(
            transactions
        );


    document.getElementById(
        "txType"
    ).onchange =
        event => {

            document.getElementById(
                "catWrap"
            ).style.display =
                event.target.value ===
                "expense"
                    ? "block"
                    : "none";

        };


    document.getElementById(
        "txForm"
    ).onsubmit =
        async event => {

            event.preventDefault();


           const type = document.getElementById("txType").value;

await addDoc(
    collection(
        db,
        "users",
        user.uid,
        "transactions"
    ),
    {
        type,
        amount: Number(
            document.getElementById("txAmount").value
        ),

        // Category is only for expenses
        category:
            type === "expense"
                ? document.getElementById("txCategory").value
                : null,

        description:
            document.getElementById("txDescription").value.trim(),

        date:
            document.getElementById("txDate").value,

        createdAt: serverTimestamp()
    }
);


            document.getElementById(
                "modal"
            ).classList.remove("show");


            render(user);

        };

}


function drawTransactions(
    allTransactions
) {

    const type =
        document.getElementById(
            "filterType"
        ).value;


    const category =
        document.getElementById(
            "filterCategory"
        ).value;


    const transactions =
        allTransactions.filter(
            transaction =>

                (
                    type === "all" ||
                    transaction.type === type
                )

                &&

                (
                    category === "all" ||
                    transaction.category === category
                )
        );


    document.getElementById(
        "txBody"
    ).innerHTML =

        transactions.length

            ? transactions
                .map(
                    transaction => `

                        <tr>

                            <td>
                                ${transaction.date}
                            </td>

                            <td>
                                ${esc(
                                    transaction.description ||
                                    "-"
                                )}
                            </td>

                            <td>

                                ${
                                    transaction.type ===
                                    "income"

                                        ? "—"

                                        : `
                                            ${categoryIcon(
                                                transaction.category
                                            )}

                                            ${categoryLabel(
                                                transaction.category,
                                                t
                                            )}
                                        `
                                }

                            </td>

                            <td>

                                ${
                                    transaction.type ===
                                    "income"

                                        ? t("income")

                                        : t("expense")

                                }

                            </td>

                            <td
                                class="${
                                    transaction.type ===
                                    "income"
                                        ? "positive"
                                        : "negative"
                                }"
                            >

                                ${
                                    transaction.type ===
                                    "income"
                                        ? "+"
                                        : "-"
                                }

                                ${money(
                                    transaction.amount
                                )}

                            </td>

                            <td>

                                <button
                                    class="btn btn-danger delete-btn"
                                    data-id="${transaction.id}"
                                >
                                    ×
                                </button>

                            </td>

                        </tr>

                    `
                )
                .join("")

            : `

                <tr>

                    <td
                        colspan="6"
                        class="empty"
                    >
                        ${t("no_transactions")}
                    </td>

                </tr>

            `;


    document
        .querySelectorAll(
            ".delete-btn"
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
                                    auth.currentUser.uid,
                                    "transactions",
                                    button.dataset.id
                                )
                            );


                            render(
                                auth.currentUser
                            );

                        }

                    };

            }
        );

}