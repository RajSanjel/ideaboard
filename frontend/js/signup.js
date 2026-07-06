import API_CONFIG from "./config/api.js";
const signUpForm = document.getElementById("signUpForm");

const signUpButton = document.getElementById("signUpButton");
const messageBox = document.getElementById("signUpMessage");
const feedbackMessage = document.getElementById("feedbackMessage");


function getErrorElement(fieldName) {
    return document.querySelector(`.error[data-for="${fieldName}"]`);
}

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

function setError(field, message) {
    field.element.classList.add('invalid');
    field.element.classList.remove('valid');
    if (field.errorElement) {
        field.errorElement.textContent = message;
        field.errorElement.classList.add('visible');
    }
}

function setValid(field) {
    field.element.classList.remove('invalid');
    field.element.classList.add('valid');
    if (field.errorElement) {
        field.errorElement.textContent = '';
        field.errorElement.classList.remove('visible');
    }
}

function isButtonClickable() {
    const allValid = Object.values(fields).every(field => {
        return field.element.classList.contains("valid");
    });

    signUpButton.classList.toggle("disabled", !allValid);
    signUpButton.disabled = !allValid;
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


function validateEmail() {
    const value = fields.email.element.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
        setError(fields.email, "Email is required");
        return false;
    }

    if (!emailRegex.test(value)) {
        setError(fields.email, "Email address is not valid.");
        return false;
    }

    setValid(fields.email);
    return true;
}


function validatePassword() {
    const value = fields.password.element.value;

    if (!value) {
        setError(fields.password, "Password is required");
        return false;
    }

    if (value.length < 8) {
        setError(fields.password, "Password must be atleast 8 character long.");
        return false;
    }

    setValid(fields.password);
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
    isButtonClickable();
});

fields.lastName.element.addEventListener('blur', () => {
    validateLastName();
    isButtonClickable();
});

fields.email.element.addEventListener('blur', () => {
    validateEmail();
    isButtonClickable();
});

fields.password.element.addEventListener('input', () => {
    validatePassword();
    if (fields.confirmPassword.element.value) {
        confirmPassword();
    }
    isButtonClickable();
});

fields.confirmPassword.element.addEventListener('input', () => {
    confirmPassword();
    isButtonClickable();
});

function showMessage(message, type = "error") {
    messageBox.classList.remove("hidden");
    messageBox.classList.add("visible");

    feedbackMessage.classList.remove("msgErr", "msgSuc");

    if (type === "success") {
        feedbackMessage.classList.add("msgSuc");
        feedbackMessage.innerHTML = `${message}`;
    } else {
        feedbackMessage.classList.add("msgErr");
        feedbackMessage.textContent = message;
    }

    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    })
}

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
        validateEmail(),
        validatePassword(),
        confirmPassword()
    ];
    isButtonClickable();

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
                showMessage(data.message + ` You can now <a href="./login.html" class="form_link">sign in</a>.`, "success");
                signUpForm.reset();
                resetValidation();
                isButtonClickable();
            } else {
                showMessage(data.message, "error");
            }
        } catch (error) {
            showMessage("Sign up failed, please try again later", "error");

            console.error(error)

        }
        console.log(signUpData);
    }
});