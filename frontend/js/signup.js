import API_CONFIG from "./config/api.js";
import {
    showMessage,
    isButtonClickable,
    getErrorElement,
    setError,
    setValid,
    validateEmail,
    validatePassword
} from "./util/auth-ui.js";

const signUpForm = document.getElementById("signUpForm");
const signUpButton = document.getElementById("signUpButton");
const messageBox = document.getElementById("signUpMessage");
const feedbackMessage = document.getElementById("feedbackMessage");

const fields = {
    firstName: {
        element: document.getElementById("firstname"),
        errorElement: getErrorElement("firstname")
    },
    lastName: {
        element: document.getElementById("lastname"),
        errorElement: getErrorElement("lastname")
    },
    email: {
        element: document.getElementById("email"),
        errorElement: getErrorElement("email")
    },
    password: {
        element: document.getElementById("password"),
        errorElement: getErrorElement("password")
    },
    confirmPassword: {
        element: document.getElementById("cpassword"),
        errorElement: getErrorElement("cpassword")
    }
}

function validateFirstName() {
    const value = fields.firstName.element.value.trim();
    if (!value) {
        setError(fields.firstName, "First Name is required");
        return false;
    }

    if (value.length < 2) {
        setError(fields.firstName, "First name must be atleast 2 characters long.");
        return false;
    }

    setValid(fields.firstName);
    return true;
}

function validateLastName() {
    const value = fields.lastName.element.value.trim();
    if (!value) {
        setError(fields.lastName, "Last Name is required");
        return false;
    }

    if (value.length < 2) {
        setError(fields.lastName, "Last name must be atleast 2 characters long.");
        return false;
    }

    setValid(fields.lastName);
    return true;
}

function confirmPassword() {
    const value = fields.confirmPassword.element.value;
    const passwordValue = fields.password.element.value;

    if (!value) {
        setError(fields.confirmPassword, "Please confirm your password");
        return false;
    }

    if (value !== passwordValue) {
        setError(fields.confirmPassword, "Password do not match");
        return false;
    }

    setValid(fields.confirmPassword);
    return true;
}

fields.firstName.element.addEventListener('blur', () => {
    validateFirstName();
    isButtonClickable(fields, signUpButton);
});

fields.lastName.element.addEventListener('blur', () => {
    validateLastName();
    isButtonClickable(fields, signUpButton);
});

fields.email.element.addEventListener('blur', () => {
    validateEmail(fields);
    isButtonClickable(fields, signUpButton);
});

fields.password.element.addEventListener('input', () => {
    validatePassword(fields);
    if (fields.confirmPassword.element.value) {
        confirmPassword();
    }
    isButtonClickable(fields, signUpButton);
});

fields.confirmPassword.element.addEventListener('input', () => {
    confirmPassword();
    isButtonClickable(fields, signUpButton);
});

function resetValidation() {
    Object.values(fields).forEach(field => {
        field.element.classList.remove("valid", "invalid");

        if (field.errorElement) {
            field.errorElement.textContent = "";
            field.errorElement.classList.remove("visible");
        }
    });

    signUpButton.classList.add("disabled");
}

signUpButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const validations = [
        validateFirstName(),
        validateLastName(),
        validateEmail(fields),
        validatePassword(fields),
        confirmPassword()
    ];
    isButtonClickable(fields, signUpButton);

    if (validations.every(Boolean)) {
        const signUpData = {
            firstName: fields.firstName.element.value.trim(),
            lastName: fields.lastName.element.value.trim(),
            email: fields.email.element.value.trim(),
            password: fields.password.element.value,
            confirmPassword: fields.confirmPassword.element.value,
        };
        try {
            const url = API_CONFIG.BASE_URL + API_CONFIG.AUTH_ENDPOINT + "/register";
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(signUpData)
            })
            const data = await resp.json();

            if (data.httpCode === 201) {
                showMessage(messageBox, feedbackMessage, data.message + ` You can now <a href="./login.html" class="form_link">sign in</a>.`, "success");
                signUpForm.reset();
                resetValidation();
                isButtonClickable(fields, signUpButton);
            } else {
                showMessage(messageBox, feedbackMessage, data.message, "error");
            }
        } catch (error) {
            showMessage(messageBox, feedbackMessage, "Sign up failed, please try again later", "error");

            console.error(error)

        }
    }
});