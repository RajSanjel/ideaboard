import { me } from "./global/auth.js"
import API_CONFIG from "./config/api.js";
import {
    showMessage,
    isButtonClickable,
    getErrorElement,
    validateEmail,
    validatePassword
} from "./util/auth-ui.js";


const loginButton = document.getElementById("signInBtn");
const loginForm = document.getElementById("loginForm");
const messageBox = document.getElementById("signUpMessage");
const feedbackMessage = document.getElementById("feedbackMessage");

const user = await me();

if (user) {
    window.location.replace("index.html");
}
const fields = {

    email: {
        element: document.getElementById("email"),
        errorElement: getErrorElement("email")
    },
    password: {
        element: document.getElementById("password"),
        errorElement: getErrorElement("password")
    },
}

fields.email.element.addEventListener('blur', () => {
    validateEmail(fields);
    isButtonClickable(fields, loginButton);
});

fields.password.element.addEventListener('input', () => {
    validatePassword(fields);
    isButtonClickable(fields, loginButton);
});

loginButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const validations = [
        validateEmail(fields),
        validatePassword(fields),
    ];

    isButtonClickable(fields, loginButton);

    if (validations.every(Boolean)) {
        const loginData = {
            email: fields.email.element.value.trim(),
            password: fields.password.element.value,
        };
        try {
            const url = API_CONFIG.BASE_URL + API_CONFIG.AUTH_ENDPOINT + "/login";
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginData),
                credentials: "include"
            })
            const data = await resp.json();

            if (data.httpCode === 200) {
                loginForm.reset();
                window.location.replace("index.html");
            } else {
                showMessage(messageBox, feedbackMessage, data.message, "error");
            }
        } catch (error) {
            showMessage(messageBox, feedbackMessage, "Sign in failed, please try again later", "error");

            console.error(error)

        }
    }
});