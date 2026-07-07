export function validateEmail(fields) {
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



export function validatePassword(fields) {
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

export function showMessage(messageBox, feedbackMessage, message, type = "error") {

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


export function isButtonClickable(fields, button) {
    const allValid = Object.values(fields).every(field => {
        return field.element.classList.contains("valid");
    });

    button.classList.toggle("disabled", !allValid);
    button.disabled = !allValid;
}


export function getErrorElement(fieldName) {
    return document.querySelector(`.error[data-for="${fieldName}"]`);
}

export function setError(field, message) {
    field.element.classList.add('invalid');
    field.element.classList.remove('valid');
    if (field.errorElement) {
        field.errorElement.textContent = message;
        field.errorElement.classList.add('visible');
    }
}

export function setValid(field) {
    field.element.classList.remove('invalid');
    field.element.classList.add('valid');
    if (field.errorElement) {
        field.errorElement.textContent = '';
        field.errorElement.classList.remove('visible');
    }
}

