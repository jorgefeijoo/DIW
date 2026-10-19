
"use strict";

const form = document.querySelector("#login-form");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const togglePassword = document.querySelector("#toggle-password");
const submitButton = document.querySelector("#submit-button");
const message = document.querySelector("#form-message");
const remember = document.querySelector("#remember");

let submitting = false;

// Límites de validación
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MAX_LENGTH = 128;
const REQUEST_TIMEOUT = 15000;

// Comprobar que existen los elementos necesarios.
if (
    form &&
    email &&
    password &&
    togglePassword &&
    submitButton &&
    message &&
    remember
) {
    // Restricciones del correo.
    email.maxLength = EMAIL_MAX_LENGTH;
    email.required = true;
    email.autocomplete = "username";
    email.type = "email";

    // Restricciones de la contraseña.
    password.required = true;
    password.maxLength = PASSWORD_MAX_LENGTH;
    password.autocomplete = "current-password";

    // Mostrar / ocultar contraseña.
    togglePassword.addEventListener("click", () => {
        const showPassword = password.type === "password";

        password.type = showPassword ? "text" : "password";

        togglePassword.setAttribute(
            "aria-label",
            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
        );

        togglePassword.setAttribute(
            "aria-pressed",
            String(showPassword)
        );
    });

    // Borrar errores al modificar el formulario.
    form.addEventListener("input", () => {
        message.textContent = "";
        email.setAttribute("aria-invalid", "false");
        password.setAttribute("aria-invalid", "false");
    });

    // Validar el correo electrónico.
    function validateEmail() {
        const value = email.value.trim();

        if (!value) {
            email.setCustomValidity(
                "Introduce tu correo electrónico."
            );
            return false;
        }

        if (value.length > EMAIL_MAX_LENGTH) {
            email.setCustomValidity(
                "El correo electrónico no puede superar 254 caracteres."
            );
            return false;
        }

        if (!email.validity.valid) {
            email.setCustomValidity(
                "Introduce un correo electrónico válido."
            );
            return false;
        }

        email.setCustomValidity("");
        return true;
    }

    // Validar la contraseña sin modificarla.
    function validatePassword() {
        if (password.value.length === 0) {
            password.setCustomValidity(
                "Introduce tu contraseña."
            );
            return false;
        }

        if (password.value.length > PASSWORD_MAX_LENGTH) {
            password.setCustomValidity(
                "La contraseña supera la longitud máxima permitida."
            );
            return false;
        }

        password.setCustomValidity("");
        return true;
    }

    email.addEventListener("input", validateEmail);
    password.addEventListener("input", validatePassword);

    // Enviar el formulario.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (submitting) return;

        message.textContent = "";

        const validEmail = validateEmail();
        const validPassword = validatePassword();

        if (!validEmail || !validPassword) {
            if (!validEmail) {
                email.setAttribute("aria-invalid", "true");
                email.reportValidity();
            } else {
                password.setAttribute("aria-invalid", "true");
                password.reportValidity();
            }

            return;
        }

        if (!form.reportValidity()) return;

        // Obtener el token CSRF generado por el servidor.
        const csrfToken = document.querySelector(
            'meta[name="csrf-token"]'
        )?.content?.trim();

        if (!csrfToken) {
            message.textContent =
                "No se puede iniciar sesión: falta el token de seguridad.";
            return;
        }

        submitting = true;
        submitButton.disabled = true;
        submitButton.textContent = "Iniciando sesión…";
        form.setAttribute("aria-busy", "true");

        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT
        );

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                credentials: "same-origin",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                body: JSON.stringify({
                    email: email.value.trim(),
                    // No recortar ni modificar la contraseña.
                    password: password.value,
                    remember: remember.checked
                })
            });

            if (response.status === 400) {
                message.textContent =
                    "Los datos enviados no son válidos.";
                return;
            }

            if (response.status === 401) {
                message.textContent =
                    "Correo o contraseña incorrectos.";
                return;
            }

            if (response.status === 403) {
                message.textContent =
                    "La solicitud no ha superado la comprobación de seguridad. Recarga la página e inténtalo de nuevo.";
                return;
            }

            if (response.status === 429) {
                message.textContent =
                    "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
                return;
            }

            if (!response.ok) {
                throw new Error("Error en el servidor.");
            }

            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error("Respuesta del servidor no válida.");
            }

            const result = await response.json();

            if (result.authenticated !== true) {
                throw new Error("Autenticación no confirmada.");
            }

            // Redirección a una ruta interna fija.
            window.location.assign("/cuenta");

        } catch (error) {
            if (error.name === "AbortError") {
                message.textContent =
                    "La solicitud tardó demasiado. Inténtalo de nuevo.";
            } else {
                message.textContent =
                    "No se pudo iniciar sesión. Comprueba tu conexión e inténtalo de nuevo.";
            }
        } finally {
            clearTimeout(timeout);

            submitting = false;
            submitButton.disabled = false;
            submitButton.textContent = "Iniciar sesión";

            form.removeAttribute("aria-busy");
        }
    });
}
