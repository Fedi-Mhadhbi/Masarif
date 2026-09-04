import {
    auth,
    db
} from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    initI18n
} from "./i18n.js";


await initI18n();


document
    .querySelectorAll(".lang-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "financeLanguage",
                    button.dataset.lang
                );

                location.reload();

            }
        );

    });


onAuthStateChanged(
    auth,
    user => {

        if (
            user &&
            (
                location.pathname.endsWith(
                    "login.html"
                ) ||
                location.pathname.endsWith(
                    "register.html"
                )
            )
        ) {

            location.href =
                "dashboard.html";

        }

    }
);


/* REGISTER */

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const error =
                document.getElementById(
                    "registerError"
                );

            error.textContent = "";


            try {

                const name =
                    document
                        .getElementById(
                            "registerName"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "registerEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "registerPassword"
                        )
                        .value;


                const credentials =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                await updateProfile(
                    credentials.user,
                    {
                        displayName: name
                    }
                );


                await setDoc(
                    doc(
                        db,
                        "users",
                        credentials.user.uid
                    ),
                    {

                        name,

                        email,

                        language:
                            localStorage.getItem(
                                "financeLanguage"
                            ) || "en",

                        createdAt:
                            serverTimestamp()

                    }
                );


                location.href =
                    "dashboard.html";


            } catch (errorObject) {

                if (
                    errorObject.code ===
                    "auth/email-already-in-use"
                ) {

                    error.textContent =
                        "Email already registered.";

                } else if (
                    errorObject.code ===
                    "auth/weak-password"
                ) {

                    error.textContent =
                        "Password must be at least 6 characters.";

                } else {

                    error.textContent =
                        "Registration failed.";

                }

            }

        }
    );

}


/* LOGIN */

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const error =
                document.getElementById(
                    "loginError"
                );

            error.textContent = "";


            try {

                const email =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "loginPassword"
                        )
                        .value;


                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                location.href =
                    "dashboard.html";


            } catch (errorObject) {

                if (
                    errorObject.code ===
                    "auth/invalid-credential"
                ) {

                    error.textContent =
                        "Invalid email or password.";

                } else {

                    error.textContent =
                        "Login failed.";

                }

            }

        }
    );

}