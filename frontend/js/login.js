const loginButton = document.getElementById("signInBtn");


function getErrorElement(fieldName) {
    return document.querySelector(`.error[data-for="${fieldName}"]`);
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
    const allValid = Object.values(fields).every(
        field => field.element.classList.contains('valid')
    );
    loginButton.classList.toggle('disabled', !allValid);
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


fields.email.element.addEventListener('blur', () => {
    validateEmail();
    isButtonClickable();
});

fields.password.element.addEventListener('input', () => {
    validatePassword();
    isButtonClickable();
});

loginButton.addEventListener('click', (e) => {
    e.preventDefault();
    const validations = [
        validateEmail(),
        validatePassword(),
    ];

    isButtonClickable();

});