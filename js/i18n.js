let dictionary = {};
let currentLanguage = "en";

export async function initI18n() {
    currentLanguage =
        localStorage.getItem("financeLanguage") || "en";

    await loadLanguage(currentLanguage);

    return {
        t,
        language: currentLanguage
    };
}

export async function loadLanguage(language) {
    try {
        const response = await fetch(`locales/${language}.json`);

        if (!response.ok) {
            throw new Error("Language file not found");
        }

        dictionary = await response.json();
        currentLanguage = language;

        localStorage.setItem("financeLanguage", language);

        document.documentElement.lang = language;

        document.documentElement.dir =
            language === "ar" ? "rtl" : "ltr";

        applyTranslations();

    } catch (error) {
        console.error("Failed to load language:", error);

        if (language !== "en") {
            const response = await fetch("locales/en.json");
            dictionary = await response.json();

            currentLanguage = "en";

            document.documentElement.lang = "en";
            document.documentElement.dir = "ltr";

            applyTranslations();
        }
    }
}

export function t(key) {
    return dictionary[key] || key;
}

function applyTranslations() {

    document
        .querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key = element.dataset.i18n;

            if (dictionary[key]) {
                element.textContent = dictionary[key];
            }
        });

    document
        .querySelectorAll("[data-i18n-placeholder]")
        .forEach(element => {

            const key = element.dataset.i18nPlaceholder;

            if (dictionary[key]) {
                element.placeholder = dictionary[key];
            }
        });

    document
        .querySelectorAll("[data-i18n-title]")
        .forEach(element => {

            const key = element.dataset.i18nTitle;

            if (dictionary[key]) {
                element.title = dictionary[key];
            }
        });
}

export function getCurrentLanguage() {
    return currentLanguage;
}