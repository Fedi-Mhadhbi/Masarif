import {
    auth
} from "./firebase.js";

import {
    initI18n
} from "./i18n.js";

import {
    authGuard,
    buildShell,
    installApp,
    getMonthTransactions,
    getCollection,
    calcTotals,
    money,
    categoryIcon,
    categoryLabel,
    esc
} from "./common.js";

const { t } =
    await initI18n();


authGuard(
    async user => {

        buildShell(
            user,
            t,
            "nav_dashboard"
        );

const installButton =
    document.getElementById(
        "installAppBtn"
    );


if (installButton) {

    installButton.addEventListener(
        "click",
        installApp
    );

}
        document.getElementById(
            "pageTitle"
        ).textContent =
            t("dashboard");


        document.getElementById(
            "pageSubtitle"
        ).textContent =
            new Date().toLocaleDateString(
                document.documentElement.lang,
                {
                    month: "long",
                    year: "numeric"
                }
            );


        await renderDashboard(user);

    }
);


async function renderDashboard(user) {

    const transactions =
        await getMonthTransactions(
            user.uid
        );


    const budgets =
        await getCollection(
            user.uid,
            "budgets"
        );


    const goals =
        await getCollection(
            user.uid,
            "savings_goals"
        );


    const totals =
        calcTotals(
            transactions
        );


    const spentByCategory = {};


    transactions
        .filter(
            transaction =>
                transaction.type ===
                "expense"
        )
        .forEach(
            transaction => {

                spentByCategory[
                    transaction.category
                ] =
                    (
                        spentByCategory[
                            transaction.category
                        ] || 0
                    ) +
                    Number(
                        transaction.amount
                    );

            }
        );


    const currentDate =
        new Date();


    const month =
        currentDate.getMonth() + 1;


    const year =
        currentDate.getFullYear();


    const activeBudgets =
        budgets.filter(
            budget =>
                Number(budget.month) ===
                    month &&
                Number(budget.year) ===
                    year
        );


    const score =
        calculateHealthScore(
            totals,
            activeBudgets,
            goals,
            spentByCategory
        );


    const insights =
        generateInsights(
            totals,
            activeBudgets,
            goals,
            spentByCategory,
            t
        );


    const recent =
        transactions.slice(0, 6);


    document.getElementById(
        "pageContent"
    ).innerHTML = `

        <section class="cards">

            <div class="card">

                <div class="metric-label">
                    ${t("income")}
                </div>

                <div class="metric-value positive">
                    ${money(totals.income)}
                </div>

            </div>


            <div class="card">

                <div class="metric-label">
                    ${t("expenses")}
                </div>

                <div class="metric-value negative">
                    ${money(totals.expenses)}
                </div>

            </div>


            <div class="card">

                <div class="metric-label">
                    ${t("balance")}
                </div>

                <div class="metric-value">
                    ${money(totals.balance)}
                </div>

            </div>


            <div class="card">

                <div class="metric-label">
                    ${t("savings")}
                </div>

                <div class="metric-value positive">
                    ${money(
                        Math.max(
                            0,
                            totals.balance
                        )
                    )}
                </div>

            </div>

        </section>


        <section class="grid-2">

            <div class="card">

                <div class="section-title">

                    <h2>
                        ${t("spending_overview")}
                    </h2>

                    <a
                        class="btn btn-secondary"
                        href="transactions.html"
                    >
                        ${t("view_all")}
                    </a>

                </div>

                <div class="chart-wrap">

                    <canvas id="expenseChart"></canvas>

                </div>

            </div>


            <div class="card">

                <div class="section-title">

                    <h2>
                        ${t("financial_health")}
                    </h2>

                </div>


                <div class="score">

                    <div
                        class="score-ring"
                        style="--score:${score}%"
                    >

                        <span class="score-number">
                            ${score}
                        </span>

                    </div>


                    <div>

                        <strong>

                            ${
                                score >= 80
                                    ? t("health_good")
                                    : score >= 60
                                        ? t("health_ok")
                                        : t("health_attention")
                            }

                        </strong>

                        <p class="small">
                            ${t("health_explanation")}
                        </p>

                    </div>

                </div>

            </div>

        </section>


        <section class="grid-2">

            <div class="card">

                <div class="section-title">

                    <h2>
                        ${t("recent_transactions")}
                    </h2>

                    <a
                        class="btn btn-primary"
                        href="transactions.html"
                    >
                        ${t("add_expense")}
                    </a>

                </div>


                <div class="list">

                    ${
                        recent.length

                            ? recent.map(
                                transaction => {

                                    const title =
                                        transaction.type === "income"
                                            ? (
                                                transaction.description ||
                                                t("income")
                                            )
                                            : (
                                                transaction.description ||
                                                categoryLabel(
                                                    transaction.category,
                                                    t
                                                )
                                            );


                                    return `

                                        <div class="list-item">

                                            <div class="item-left">

                                                <div class="icon-box">

                                                    ${
                                                        transaction.type ===
                                                        "income"

                                                            ? "💰"

                                                            : categoryIcon(
                                                                transaction.category
                                                            )
                                                    }

                                                </div>


                                                <div>

                                                    <strong>
                                                        ${esc(title)}
                                                    </strong>

                                                    <div class="small">
                                                        ${esc(
                                                            transaction.date
                                                        )}
                                                    </div>

                                                </div>

                                            </div>


                                            <strong
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

                                            </strong>

                                        </div>

                                    `;

                                }
                            ).join("")

                            : `

                                <div class="empty">
                                    ${t("no_transactions")}
                                </div>

                            `
                    }

                </div>

            </div>


            <div class="card">

                <div class="section-title">

                    <h2>
                        ${t("spending_insights")}
                    </h2>

                </div>


                ${
                    insights.map(
                        insight => `

                            <div class="insight">

                                <strong>
                                    ${insight.title}
                                </strong>

                                <span class="small">
                                    ${insight.text}
                                </span>

                            </div>

                        `
                    ).join("")
                }

            </div>

        </section>


        <section class="card page-card">

            <div class="section-title">

                <h2>
                    ${t("savings_goals")}
                </h2>

                <a
                    class="btn btn-secondary"
                    href="goals.html"
                >
                    ${t("manage_goals")}
                </a>

            </div>


            <div class="list">

                ${
                    goals.slice(0, 4)
                        .map(goal => {

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

                                <div class="list-item">

                                    <div
                                        style="flex:1"
                                    >

                                        <div class="goal-top">

                                            <strong>
                                                ${esc(
                                                    goal.name
                                                )}
                                            </strong>

                                            <span class="small">

                                                ${money(
                                                    goal.currentAmount
                                                )}

                                                /

                                                ${money(
                                                    goal.targetAmount
                                                )}

                                            </span>

                                        </div>


                                        <div class="progress">

                                            <span
                                                style="width:${percentage}%"
                                            ></span>

                                        </div>

                                    </div>

                                </div>

                            `;

                        })
                        .join("")

                    || `

                        <div class="empty">
                            ${t("no_goals")}
                        </div>

                    `
                }

            </div>

        </section>

    `;


    drawChart(
        spentByCategory,
        t
    );


    /*
     * Redraw the chart on resize/rotation so it
     * stays correctly sized instead of stretching
     * the last bitmap it painted.
     */

    window.removeEventListener(
        "resize",
        window.__expenseChartResize || (() => {})
    );

    let resizeTimeout;

    window.__expenseChartResize = () => {

        clearTimeout(resizeTimeout);

        resizeTimeout = setTimeout(
            () => drawChart(spentByCategory, t),
            150
        );

    };

    window.addEventListener(
        "resize",
        window.__expenseChartResize
    );

}


function calculateHealthScore(
    totals,
    budgets,
    goals,
    spentByCategory
) {

    if (totals.income <= 0) {
        return 20;
    }


    let score = 0;


    /*
     * 1. Spending ratio
     */

    const spendingRatio =
        totals.expenses /
        totals.income;


    if (spendingRatio <= 0.5) {

        score += 30;

    } else if (spendingRatio <= 0.7) {

        score += 24;

    } else if (spendingRatio <= 0.85) {

        score += 16;

    } else if (spendingRatio < 1) {

        score += 8;

    }


    /*
     * 2. Budget compliance
     */

    const budgetCompliance =
        budgets.length

            ? budgets.filter(
                budget =>
                    (
                        spentByCategory[
                            budget.category
                        ] || 0
                    ) <=
                    Number(
                        budget.amount
                    )
            ).length /
            budgets.length

            : 0.7;


    score +=
        Math.round(
            budgetCompliance * 25
        );


    /*
     * 3. Savings rate
     */

    const savingsRate =
        Math.max(
            0,
            totals.balance /
            totals.income
        );


    score +=
        Math.min(
            25,
            Math.round(
                savingsRate * 50
            )
        );


    /*
     * 4. Savings goals
     *
     * FIX:
     * Completed goals should increase the score.
     */

    const goalsProgress =
        goals.length

            ? goals.filter(
                goal =>
                    Number(
                        goal.currentAmount
                    ) >=
                    Number(
                        goal.targetAmount
                    )
            ).length /
            goals.length

            : 0.5;


    score +=
        Math.round(
            goalsProgress * 20
        );


    return Math.max(
        0,
        Math.min(
            100,
            score
        )
    );

}


function generateInsights(
    totals,
    budgets,
    goals,
    spentByCategory,
    t
) {

    const insights = [];


    if (totals.income <= 0) {

        insights.push({

            title:
                t("insight_add_income"),

            text:
                t(
                    "insight_add_income_text"
                )

        });

    } else if (
        totals.expenses >
        totals.income
    ) {

        insights.push({

            title:
                t("insight_over_income"),

            text:
                t(
                    "insight_over_income_text"
                )

        });

    } else {

        insights.push({

            title:
                t("insight_balance"),

            text:
                `${t(
                    "insight_balance_text"
                )} ${money(
                    totals.balance
                )}.`

        });

    }


    const topCategory =
        Object.entries(
            spentByCategory
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        )[0];


    if (topCategory) {

        insights.push({

            title:
                t("insight_top_category"),

            text:
                `${categoryLabel(
                    topCategory[0],
                    t
                )} — ${money(
                    topCategory[1]
                )}.`

        });

    }


    const exceededBudget =
        budgets.find(
            budget =>
                (
                    spentByCategory[
                        budget.category
                    ] || 0
                ) >
                Number(
                    budget.amount
                )
        );


    if (exceededBudget) {

        insights.push({

            title:
                t("insight_budget"),

            text:
                `${categoryLabel(
                    exceededBudget.category,
                    t
                )} ${t(
                    "insight_budget_text"
                )}.`

        });

    }


    if (goals.length) {

        insights.push({

            title:
                t("insight_goals"),

            text:
                `${
                    goals.filter(
                        goal =>
                            Number(
                                goal.currentAmount
                            ) >=
                            Number(
                                goal.targetAmount
                            )
                    ).length
                }/${goals.length} ${
                    t(
                        "insight_goals_text"
                    )
                }.`

        });

    }


    return insights.slice(
        0,
        4
    );

}


function drawChart(
    data,
    t
) {

    const canvas =
        document.getElementById(
            "expenseChart"
        );


    if (!canvas) {
        return;
    }


    const context =
        canvas.getContext("2d");


    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    const devicePixelRatio =
        window.devicePixelRatio || 1;


    canvas.width =
        width *
        devicePixelRatio;


    canvas.height =
        height *
        devicePixelRatio;


    context.scale(
        devicePixelRatio,
        devicePixelRatio
    );


    const entries =
        Object.entries(data);


    if (!entries.length) {

        context.fillStyle =
            "#697386";

        context.font =
            "14px sans-serif";

        context.fillText(
            t("no_chart_data"),
            20,
            35
        );

        return;

    }


    const maximum =
        Math.max(
            ...entries.map(
                item => item[1]
            ),
            1
        );


    const barWidth =
        Math.min(
            55,
            (width - 40) /
                entries.length -
                10
        );


    entries.forEach(
        ([category, value], index) => {

            const x =
                25 +
                index *
                (
                    (width - 40) /
                    entries.length
                );


            const barHeight =
                (
                    value /
                    maximum
                ) *
                (height - 55);


            const y =
                height -
                30 -
                barHeight;


            context.fillStyle =
                "#5b5bd6";


            context.fillRect(
                x,
                y,
                barWidth,
                barHeight
            );


            context.fillStyle =
                "#697386";


            context.font =
                "11px sans-serif";


            context.textAlign =
                "center";


            context.fillText(
                categoryLabel(
                    category,
                    t
                ).slice(0, 10),
                x +
                    barWidth / 2,
                height - 12
            );

        }
    );

}