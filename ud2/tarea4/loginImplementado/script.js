"use strict";

(() => {
  
  // CONFIGURACIÓN

  const DEMO_CODE = "284196";
  const RESEND_SECONDS = 45;
  const FAKE_DELAY = 700;
  const USERS_KEY = "demo_users";
  const REMEMBER_KEY = "demo_remember_email";
  const SESSION_KEY = "demo_session_email";

  const EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;

  // UTILIDADES

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = { email: "", resetEmail: "", resetAllowed: false };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function maskEmail(email) {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    return `${user[0]}•••@${domain}`;
  }

  function readStorage(storage, key) {
    try { return storage.getItem(key); } catch { return null; }
  }
  function writeStorage(storage, key, value) {
    try {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    } catch {}
  }

  async function hashPassword(password) {
    if (window.crypto && crypto.subtle) {
      const data = new TextEncoder().encode(password);
      const buffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    return "plain:" + password;
  }

  function getUsers() {
    try { return JSON.parse(readStorage(localStorage, USERS_KEY)) || {}; }
    catch { return {}; }
  }
  function saveUsers(users) {
    writeStorage(localStorage, USERS_KEY, JSON.stringify(users));
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Mensajes de formulario y errores por campo

  function setMessage(el, text, success = false) {
    el.textContent = text;
    el.classList.toggle("is-success", success);
  }

  function setFieldError(id, text) {
    const err = $(`[data-error-for="${id}"]`);
    const input = document.getElementById(id);
    if (err) err.textContent = text || "";
    if (input && input.type !== "checkbox") input.classList.toggle("is-invalid", Boolean(text));
  }

  function clearFieldErrors(form) {
    $$("[data-error-for]", form).forEach((el) => (el.textContent = ""));
    $$(".is-invalid", form).forEach((el) => el.classList.remove("is-invalid"));
  }

  function setLoading(button, loading, loadingText) {
    if (loading) {
      button.dataset.label = button.textContent;
      button.textContent = loadingText;
    } else if (button.dataset.label) {
      button.textContent = button.dataset.label;
    }
    button.disabled = loading;
    button.classList.toggle("is-loading", loading);
  }

  // Toast

  const toast = $("#toast");
  let toastTimer = null;

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-toast]");
    if (!target) return;
    event.preventDefault();
    showToast(target.dataset.toast);
  });

 
  // MOSTRAR / OCULTAR CONTRASEÑA
  

  $$("[data-toggle-password]").forEach((button) => {
    button.innerHTML = EYE;
    button.addEventListener("click", () => {
      const input = document.getElementById(button.getAttribute("aria-controls"));
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.innerHTML = show ? EYE_OFF : EYE;
      button.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
      button.setAttribute("aria-pressed", String(show));
    });
  });

  
  // NAVEGACIÓN ENTRE PANTALLAS

  const screens = {};
  $$(".screen").forEach((el) => (screens[el.dataset.screen] = el));

  let current = null;
  let transitioning = false;
  let queued = null;

  function resolveRoute(name) {
    if (!screens[name]) return "login";
    if (name === "account" && !readStorage(sessionStorage, SESSION_KEY)) return "login";
    if (name === "verify" && !state.email) return "login";
    if (name === "reset" && !state.resetAllowed) return "forgot";
    return name;
  }

  function focusScreen(name) {
    const screen = screens[name];
    const target = name === "verify"
      ? $(".otp-input", screen)
      : $("input:not([type=checkbox])", screen) || $("button.primary-button", screen);
    if (target) target.focus({ preventScroll: true });
  }

  function onEnter(name) {
    document.title = `a25jorgefo · ${screens[name].dataset.title}`;
    window.scrollTo(0, 0);

    if (name === "verify") {
      $("#verify-email").textContent = maskEmail(state.email);
      resetOtp();
      startResendTimer();
    }
    if (name === "account") {
      $("#account-email").textContent = readStorage(sessionStorage, SESSION_KEY) || "";
    }
    if (name === "login") {
      const remembered = readStorage(localStorage, REMEMBER_KEY);
      if (remembered && !$("#login-email").value) {
        $("#login-email").value = remembered;
        $("#remember").checked = true;
      }
    }
  }

  function show(rawName, { animate = true } = {}) {
    const name = resolveRoute(rawName);

    
    if (name !== rawName && location.hash !== "#" + name) {
      history.replaceState(null, "", "#" + name);
    }

    if (name === current) return;

    if (transitioning) {
      queued = name;
      return;
    }

    const next = screens[name];

    
    if (!current || !animate) {
      if (current) screens[current].classList.remove("is-active");
      next.classList.add("is-active");
      current = name;
      onEnter(name);
      return;
    }

    const prev = screens[current];
    const duration = reducedMotion ? 0 : 220;
    transitioning = true;

    prev.classList.add("is-leaving");

    setTimeout(() => {
      prev.classList.remove("is-active", "is-leaving");

      next.classList.add("is-active", "is-entering");
      void next.offsetWidth; // forzar reflow para animar la entrada
      next.classList.remove("is-entering");

      current = name;
      onEnter(name);
      setTimeout(() => focusScreen(name), duration);

      transitioning = false;
      if (queued && queued !== current) {
        const q = queued;
        queued = null;
        show(q);
      } else {
        queued = null;
      }
    }, duration);
  }

  function navigate(name) {
    if (location.hash === "#" + name) show(name);
    else location.hash = name;
  }

  window.addEventListener("hashchange", () => {
    show(location.hash.replace("#", "") || "login");
  });


  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const name = link.getAttribute("href").slice(1);
    if (name === "forgot" || name === "register") {
      state.resetAllowed = false;
    }
  });

 
  // 1. LOGIN

  const loginForm = $("#login-form");
  const loginEmail = $("#login-email");
  const loginPassword = $("#login-password");
  const loginMessage = $("#login-message");
  const remember = $("#remember");

  loginForm.addEventListener("input", () => setMessage(loginMessage, ""));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $(".primary-button", loginForm);
    if (button.disabled) return;

    const emailValue = loginEmail.value.trim().toLowerCase();
    const passwordValue = loginPassword.value;

    if (!emailValue) {
      setMessage(loginMessage, "Introduce tu correo electrónico.");
      loginEmail.focus();
      return;
    }
    if (!isValidEmail(emailValue)) {
      setMessage(loginMessage, "Introduce un correo electrónico válido.");
      loginEmail.focus();
      return;
    }
    if (passwordValue.length === 0) {
      setMessage(loginMessage, "Introduce tu contraseña.");
      loginPassword.focus();
      return;
    }

    setLoading(button, true, "Iniciando sesión…");
    setMessage(loginMessage, "");
    await wait(FAKE_DELAY);

    const users = getUsers();
    const hashed = await hashPassword(passwordValue);
    const valid =
      (emailValue === "demo@ejemplo.com" && passwordValue === "Demo1234!") ||
      (users[emailValue] && users[emailValue] === hashed);

    setLoading(button, false);

    if (!valid) {
      setMessage(loginMessage, "Correo o contraseña incorrectos.");
      return;
    }

    writeStorage(localStorage, REMEMBER_KEY, remember.checked ? emailValue : null);

    state.email = emailValue;
    loginPassword.value = "";
    navigate("verify");
  });

 
  // 2. REGISTRO

  const registerForm = $("#register-form");

  function passwordRules(value) {
    return {
      length: value.length >= 8,
      upper: /[A-ZÁÉÍÓÚÑ]/.test(value),
      numsym: /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value),
    };
  }

  registerForm.addEventListener("input", (event) => {
    if (event.target.id) setFieldError(event.target.id, "");
  });
  registerForm.addEventListener("change", (event) => {
    if (event.target.id === "reg-terms") setFieldError("reg-terms", "");
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $(".primary-button", registerForm);
    if (button.disabled) return;

    clearFieldErrors(registerForm);

    const name = $("#reg-name").value.trim();
    const surname = $("#reg-surname").value.trim();
    const email = $("#reg-email").value.trim().toLowerCase();
    const password = $("#reg-password").value;
    const confirm = $("#reg-confirm").value;
    const terms = $("#reg-terms").checked;

    let firstInvalid = null;
    const fail = (id, text) => {
      setFieldError(id, text);
      if (!firstInvalid) firstInvalid = id;
    };

    if (!name) fail("reg-name", "Introduce tu nombre.");
    if (!surname) fail("reg-surname", "Introduce tus apellidos.");

    if (!email) fail("reg-email", "Introduce tu correo electrónico.");
    else if (!isValidEmail(email)) fail("reg-email", "Introduce un correo electrónico válido.");
    else if (getUsers()[email] || email === "demo@ejemplo.com") {
      fail("reg-email", "Ya existe una cuenta con este correo.");
    }

    const rules = passwordRules(password);
    if (!password) fail("reg-password", "Crea una contraseña.");
    else if (!rules.length || !rules.upper || !rules.numsym) {
      fail("reg-password", "La contraseña no cumple los requisitos de seguridad.");
    }

    if (!confirm) fail("reg-confirm", "Confirma tu contraseña.");
    else if (confirm !== password) fail("reg-confirm", "Las contraseñas no coinciden.");

    if (!terms) fail("reg-terms", "Debes aceptar los términos y la política de privacidad.");

    if (firstInvalid) {
      const el = document.getElementById(firstInvalid);
      if (el) el.focus();
      return;
    }

    setLoading(button, true, "Creando cuenta…");
    await wait(FAKE_DELAY);

    const users = getUsers();
    users[email] = await hashPassword(password);
    saveUsers(users);

    setLoading(button, false);
    registerForm.reset();

    state.email = email;
    navigate("verify");
  });

  
  // 3. VERIFICACIÓN 

  const verifyForm = $("#verify-form");
  const otpWrap = $(".otp");
  const otpInputs = $$(".otp-input");
  const verifyMessage = $("#verify-message");

  function getOtp() {
    return otpInputs.map((i) => i.value).join("");
  }

  function resetOtp() {
    otpInputs.forEach((i) => {
      i.value = "";
      i.classList.remove("is-filled");
    });
    otpWrap.classList.remove("is-invalid");
    setMessage(verifyMessage, "");
  }

  function clearOtpError() {
    otpWrap.classList.remove("is-invalid");
    setMessage(verifyMessage, "");
  }

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(-1);
      input.classList.toggle("is-filled", input.value !== "");
      clearOtpError();
      if (input.value && index < otpInputs.length - 1) otpInputs[index + 1].focus();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
        otpInputs[index - 1].value = "";
        otpInputs[index - 1].classList.remove("is-filled");
      } else if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        otpInputs[index - 1].focus();
      } else if (event.key === "ArrowRight" && index < otpInputs.length - 1) {
        event.preventDefault();
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("focus", () => input.select());

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      const digits = (event.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
      if (!digits) return;
      digits.split("").forEach((d, i) => {
        otpInputs[i].value = d;
        otpInputs[i].classList.add("is-filled");
      });
      clearOtpError();
      otpInputs[Math.min(digits.length, 5)].focus();
    });
  });

  verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $(".primary-button", verifyForm);
    if (button.disabled) return;

    const code = getOtp();

    if (code.length < 6) {
      otpWrap.classList.add("is-invalid");
      setMessage(verifyMessage, "Introduce los 6 dígitos del código.");
      (otpInputs.find((i) => !i.value) || otpInputs[0]).focus();
      return;
    }

    setLoading(button, true, "Verificando…");
    await wait(FAKE_DELAY);
    setLoading(button, false);

    if (code !== DEMO_CODE) {
      otpWrap.classList.add("is-invalid");
      setMessage(verifyMessage, "El código que has introducido es incorrecto.");
      return;
    }

    writeStorage(sessionStorage, SESSION_KEY, state.email);
    navigate("account");
  });

  // Temporizador de reenvío

  const resendBtn = $("#resend-btn");
  const resendTimer = $("#resend-timer");
  let resendInterval = null;

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function startResendTimer() {
    clearInterval(resendInterval);
    let remaining = RESEND_SECONDS;
    resendBtn.disabled = true;
    resendBtn.innerHTML = `Reenviar código en <span id="resend-timer">${formatTime(remaining)}</span>`;

    resendInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(resendInterval);
        resendBtn.disabled = false;
        resendBtn.textContent = "Reenviar código";
        return;
      }
      const t = $("#resend-timer");
      if (t) t.textContent = formatTime(remaining);
    }, 1000);
  }

  resendBtn.addEventListener("click", () => {
    if (resendBtn.disabled) return;
    resetOtp();
    otpInputs[0].focus();
    startResendTimer();
    showToast(`Código reenviado (demo: ${DEMO_CODE}).`);
  });

 
  // 4. RECUPERAR CONTRASEÑA

  const forgotForm = $("#forgot-form");
  const forgotInfo = $("#forgot-info");
  const forgotInfoText = $("#forgot-info-text");
  const openMailLink = $("#open-mail-link");
  const forgotDefaultText = forgotInfoText.textContent;

  forgotForm.addEventListener("input", () => {
    setFieldError("forgot-email", "");
    forgotInfo.classList.remove("is-success");
    forgotInfoText.textContent = forgotDefaultText;
    openMailLink.hidden = true;
  });

  forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $(".primary-button", forgotForm);
    if (button.disabled) return;

    const email = $("#forgot-email").value.trim().toLowerCase();

    if (!email) {
      setFieldError("forgot-email", "Introduce tu correo electrónico.");
      $("#forgot-email").focus();
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError("forgot-email", "Introduce un correo electrónico válido.");
      $("#forgot-email").focus();
      return;
    }

    setLoading(button, true, "Enviando…");
    await wait(FAKE_DELAY);
    setLoading(button, false);

    
    forgotInfo.classList.add("is-success");
    forgotInfoText.textContent =
      "Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.";
    openMailLink.hidden = false;
    state.resetEmail = email;
  });

  openMailLink.addEventListener("click", () => {
    state.resetAllowed = true;
    navigate("reset");
  });

  
  // 5. RESTABLECER CONTRASEÑA
 

  const resetForm = $("#reset-form");
  const newPassword = $("#new-password");
  const confirmPassword = $("#confirm-password");
  const resetSubmit = $("#reset-submit");
  const strength = $("#strength");
  const strengthLabel = $("#strength-label");
  const strengthText = $(".strength-text", strength);
  const strengthDefaultText = strengthText.textContent;
  const matchMsg = $("#match-msg");

  function evaluateStrength(value) {
    const rules = passwordRules(value);
    const met = Object.values(rules).filter(Boolean).length;

    let level = 0;
    if (value.length > 0) {
      if (met === 3 && value.length >= 12) level = 3;
      else if (met === 3) level = 2;
      else level = 1;
    }
    return { rules, level };
  }

  function updateResetUI() {
    const value = newPassword.value;
    const { rules, level } = evaluateStrength(value);

    
    $$("#rules li").forEach((li) => {
      const ok = rules[li.dataset.rule];
      li.classList.toggle("is-met", value.length > 0 && ok);
      li.classList.toggle("is-unmet", value.length > 0 && !ok);
    });

    // Medidor
    strength.dataset.level = String(level);
    strengthLabel.textContent = ["", "No segura", "Intermedia", "Segura"][level];
    strengthText.textContent =
      level === 2 ? "Usa 12 o más caracteres" : strengthDefaultText;

    // Coincidencia
    const confirm = confirmPassword.value;
    matchMsg.classList.remove("is-ok", "is-bad");
    let match = false;
    if (confirm.length > 0) {
      match = confirm === value;
      matchMsg.textContent = match
        ? "✓ Las contraseñas coinciden"
        : "Las contraseñas no coinciden";
      matchMsg.classList.add(match ? "is-ok" : "is-bad");
    } else {
      matchMsg.textContent = "";
    }

    resetSubmit.disabled = !(level === 3 && match);
  }

  newPassword.addEventListener("input", updateResetUI);
  confirmPassword.addEventListener("input", updateResetUI);

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (resetSubmit.disabled) return;

    setLoading(resetSubmit, true, "Guardando…");
    await wait(FAKE_DELAY);

    const email = state.resetEmail;
    const users = getUsers();
    if (email && users[email]) {
      users[email] = await hashPassword(newPassword.value);
      saveUsers(users);
    }

    setLoading(resetSubmit, false);
    resetSubmit.disabled = true;
    resetForm.reset();
    updateResetUI();
    state.resetAllowed = false;

    navigate("login");
    setMessage(loginMessage, "Contraseña actualizada. Ya puedes iniciar sesión.", true);
  });

  updateResetUI();

  
  // 6. CUENTA
 

  $("#logout-btn").addEventListener("click", () => {
    writeStorage(sessionStorage, SESSION_KEY, null);
    state.email = "";
    navigate("login");
  });

  
  // ARRANQUE
  
  show(location.hash.replace("#", "") || "login", { animate: false });
})();
