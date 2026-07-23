document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");

if (menuToggle && siteMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteMenu.classList.toggle("is-open", !isOpen);
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteMenu.classList.remove("is-open");
    });
  });
}

const signupForm = document.getElementById("signup-form");
const signupMessage = document.getElementById("signup-message");

if (signupForm && signupMessage) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(signupForm);
    const displayName = (data.get("displayName") || "").trim();
    const email = (data.get("email") || "").trim();
    const password = data.get("password") || "";
    const postcode = (data.get("postcode") || "").trim();
    const ageRange = data.get("ageRange") || "";
    const avatar = data.get("avatar") || "";
    const accountType = data.get("accountType") || "player";
    const terms = data.get("terms");

    signupMessage.className = "form-message";
    signupMessage.textContent = "";

    if (!displayName || !email || !password || !postcode || !ageRange || !avatar) {
      signupMessage.classList.add("error");
      signupMessage.textContent = "Please fill in all fields.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      signupMessage.classList.add("error");
      signupMessage.textContent = "Please enter a valid email address.";
      return;
    }

    if (password.length < 6) {
      signupMessage.classList.add("error");
      signupMessage.textContent = "Password must be at least 6 characters.";
      return;
    }

    if (!terms) {
      signupMessage.classList.add("error");
      signupMessage.textContent = "Please accept the Terms & Conditions.";
      return;
    }

    signupMessage.textContent = "Creating your account...";
    signupMessage.classList.add("success");

    try {
      const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { displayName, postcode, ageRange, avatar, accountType },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await window.supabaseClient.from("profiles").insert({
          id: authData.user.id,
          display_name: displayName,
          email,
          postcode,
          age_range: ageRange,
          avatar,
          account_type: accountType,
        });

        if (profileError) throw profileError;
      }

      signupMessage.classList.add("success");
      signupMessage.textContent = "Sending confirmation code... 📧";

      try {
        await sendConfirmationCode(email, displayName);
      } catch (sendErr) {
        // Code send failed but account was created
      }

      signupMessage.textContent = "Account created! Check your email for a confirmation code. 📧";
      signupForm.reset();

      const verifyStep = document.getElementById("verify-step");
      const verifyEmail = document.getElementById("verify-email");
      if (verifyStep && verifyEmail) {
        verifyEmail.textContent = email;
        verifyStep.style.display = "block";
        signupForm.style.display = "none";
      }
    } catch (err) {
      signupMessage.classList.add("error");
      signupMessage.classList.remove("success");
      if (err.message.includes("already registered") || err.message.includes("already been registered")) {
        signupMessage.textContent = "An account with this email already exists.";
      } else {
        signupMessage.textContent = err.message || "Something went wrong. Please try again.";
      }
    }
  });
}

const cookieBanner = document.getElementById("cookie-banner");
const cookieAccept = document.getElementById("cookie-accept");
const cookieEssential = document.getElementById("cookie-essential");

if (cookieBanner) {
  const consent = localStorage.getItem("hl_cookie_consent");
  if (consent) {
    cookieBanner.classList.add("is-hidden");
  }

  cookieAccept && cookieAccept.addEventListener("click", () => {
    localStorage.setItem("hl_cookie_consent", "all");
    cookieBanner.classList.add("is-hidden");
  });

  cookieEssential && cookieEssential.addEventListener("click", () => {
    localStorage.setItem("hl_cookie_consent", "essential");
    cookieBanner.classList.add("is-hidden");
  });
}

const signupModal = document.getElementById("signup-modal");
const modalClose = document.getElementById("modal-close");

function openModal() {
  if (signupModal) {
    signupModal.classList.add("is-open");
    signupModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeModal() {
  if (signupModal) {
    signupModal.classList.remove("is-open");
    signupModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    const verifyStep = document.getElementById("verify-step");
    const form = document.getElementById("signup-form");
    if (verifyStep) verifyStep.style.display = "none";
    if (form) form.style.display = "flex";
    const msg = document.getElementById("signup-message");
    if (msg) { msg.textContent = ""; msg.className = "form-message"; }
    const vmsg = document.getElementById("verify-message");
    if (vmsg) { vmsg.textContent = ""; vmsg.className = "form-message"; }
  }
}

if (signupModal) {
  ["nav-signup", "hero-signup", "launch-signup"].forEach((id) => {
    const btn = document.getElementById(id);
    btn && btn.addEventListener("click", openModal);
  });

  modalClose && modalClose.addEventListener("click", closeModal);

  signupModal.addEventListener("click", (e) => {
    if (e.target === signupModal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && signupModal.classList.contains("is-open")) closeModal();
  });
}

const EDGE_FUNCTION_URL = "https://ncgmrylulcwoctmvncrs.supabase.co/functions/v1/send-confirmation";
let pendingVerifyEmail = null;

async function sendConfirmationCode(email, displayName) {
  pendingVerifyEmail = email;
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, displayName }),
  });
  return response.json();
}

const verifyBtn = document.getElementById("verify-btn");
const verifyMessage = document.getElementById("verify-message");
const codeInput = document.getElementById("code-input");

if (codeInput) {
  codeInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
}

if (verifyBtn && verifyMessage) {
  verifyBtn.addEventListener("click", async () => {
    const code = (codeInput && codeInput.value || "").trim();

    if (!code || code.length !== 6) {
      verifyMessage.className = "form-message error";
      verifyMessage.textContent = "Enter the 6-digit code from your email.";
      return;
    }

    verifyBtn.disabled = true;
    verifyMessage.className = "form-message success";
    verifyMessage.textContent = "Verifying...";

    try {
      const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("confirmation_code")
        .eq("email", pendingVerifyEmail)
        .single();

      if (error) throw error;

      if (data.confirmation_code === code) {
        const { error: updateError } = await window.supabaseClient
          .from("profiles")
          .update({ is_confirmed: true, confirmation_code: null })
          .eq("email", pendingVerifyEmail);

        if (updateError) throw updateError;

        verifyMessage.className = "form-message success";
        verifyMessage.textContent = "Account confirmed! Welcome to Highlife Games! 🎉";

        setTimeout(() => {
          closeModal();
        }, 2500);
      } else {
        verifyMessage.className = "form-message error";
        verifyMessage.textContent = "That code doesn't match. Try again.";
        verifyBtn.disabled = false;
      }
    } catch (err) {
      verifyMessage.className = "form-message error";
      verifyMessage.textContent = err.message || "Verification failed. Please try again.";
      verifyBtn.disabled = false;
    }
  });
}

const resendBtn = document.getElementById("resend-code");
if (resendBtn) {
  resendBtn.addEventListener("click", async () => {
    if (!pendingVerifyEmail) return;
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending...";
    try {
      await sendConfirmationCode(pendingVerifyEmail, "");
      if (verifyMessage) {
        verifyMessage.className = "form-message success";
        verifyMessage.textContent = "Code resent! Check your email. 📧";
      }
    } catch (err) {
      if (verifyMessage) {
        verifyMessage.className = "form-message error";
        verifyMessage.textContent = "Failed to resend. Please try again.";
      }
    }
    resendBtn.disabled = false;
    resendBtn.textContent = "Didn't get it? Resend code";
  });
}

// ===== LOGIN MODAL =====
const loginModal = document.getElementById("login-modal");
const loginClose = document.getElementById("login-close");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

function openLoginModal() {
  if (loginModal) {
    loginModal.classList.add("is-open");
    loginModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeLoginModal() {
  if (loginModal) {
    loginModal.classList.remove("is-open");
    loginModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (loginMessage) { loginMessage.textContent = ""; loginMessage.className = "form-message"; }
    if (loginForm) loginForm.reset();
  }
}

if (loginModal) {
  document.getElementById("nav-login") && document.getElementById("nav-login").addEventListener("click", openLoginModal);
  loginClose && loginClose.addEventListener("click", closeLoginModal);
  loginModal.addEventListener("click", (e) => { if (e.target === loginModal) closeLoginModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && loginModal.classList.contains("is-open")) closeLoginModal();
  });

  const switchToSignup = document.getElementById("switch-to-signup");
  if (switchToSignup) {
    switchToSignup.addEventListener("click", () => {
      closeLoginModal();
      openModal();
    });
  }
}

if (loginForm && loginMessage) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(loginForm);
    const email = (data.get("email") || "").trim();
    const password = data.get("password") || "";

    loginMessage.className = "form-message";
    loginMessage.textContent = "";

    if (!email || !password) {
      loginMessage.classList.add("error");
      loginMessage.textContent = "Please enter your email and password.";
      return;
    }

    loginMessage.classList.add("success");
    loginMessage.textContent = "Logging in...";

    try {
      const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: profile } = await window.supabaseClient.from("profiles").select("display_name, account_type, is_confirmed").eq("id", authData.user.id).single();

      if (profile && !profile.is_confirmed && profile.account_type !== "admin") {
        loginMessage.className = "form-message error";
        loginMessage.textContent = "Please confirm your email first. Check for a 6-digit code.";
        await window.supabaseClient.auth.signOut();
        return;
      }

      loginMessage.className = "form-message success";
      loginMessage.textContent = `Welcome back, ${profile?.display_name || email}! 🎉`;

      setTimeout(() => {
        closeLoginModal();
      }, 2000);
    } catch (err) {
      loginMessage.className = "form-message error";
      loginMessage.textContent = err.message || "Login failed. Check your details.";
    }
  });
}

// ===== CHECK EXISTING SESSION =====
(async () => {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) {
    const { data: profile } = await window.supabaseClient.from("profiles").select("display_name, account_type").eq("id", session.user.id).single();
    if (profile) {
      const navLogin = document.getElementById("nav-login");
      const navSignup = document.getElementById("nav-signup");
      if (navLogin) navLogin.textContent = `Hi, ${profile.display_name} 👋`;
      if (navLogin) navLogin.disabled = true;
      if (navSignup) navSignup.style.display = "none";
    }
  }
})();
