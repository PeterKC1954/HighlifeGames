document.getElementById("year").textContent = new Date().getFullYear();

// ===== NAV SCROLL STATE =====
const siteNav = document.querySelector(".site-nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 40) siteNav.classList.add("scrolled");
  else siteNav.classList.remove("scrolled");
});

// ===== PRICING SIGNUP BUTTONS =====
["pricing-signup", "pricing-signup-2"].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener("click", () => openModal("advertiser"));
});

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

// Signup modal has two modes: player (default, main CTAs) and advertiser (advertisers section CTA)
const advertiserFields = document.getElementById("advertiser-fields");
const playerFields = document.getElementById("player-fields");
const accountTypeInput = document.getElementById("account-type-input");

function setSignupMode(mode) {
  const isAdvertiser = mode === "advertiser";
  if (accountTypeInput) accountTypeInput.value = mode;
  if (advertiserFields) advertiserFields.style.display = isAdvertiser ? "block" : "none";
  if (playerFields) playerFields.style.display = isAdvertiser ? "none" : "block";
  if (advertiserFields) {
    advertiserFields.querySelectorAll("input").forEach(el => { el.required = isAdvertiser; });
  }
  if (playerFields) {
    playerFields.querySelectorAll("select, input").forEach(el => { el.required = !isAdvertiser; });
  }
  // Swap modal copy
  const eyebrow = document.getElementById("modal-eyebrow");
  const title = document.getElementById("modal-title");
  const subtitle = document.getElementById("modal-subtitle-text");
  if (isAdvertiser) {
    if (eyebrow) eyebrow.textContent = "📣 Advertise with us";
    if (title) title.textContent = "Create your advertiser account";
    if (subtitle) subtitle.textContent = "Claim your postcode area, sponsor questions, and get your brand in the game. Admin approval required.";
  } else {
    if (eyebrow) eyebrow.textContent = "🎮 Join the fun";
    if (title) title.textContent = "Create your account";
    if (subtitle) subtitle.textContent = "Get early access, claim your avatar, and start your journey to Account Director! 🚀";
  }
}

setSignupMode("player");

// ===== DEEP LINKING =====
// ?ref=CODE → pre-fill referral code and open signup modal
// ?session=expired → show session expired message
// #signup → open player signup modal
// #login → open login modal
(function handleDeepLinks() {
  const params = new URLSearchParams(window.location.search);
  const refCode = (params.get("ref") || "").toUpperCase().trim();
  const sessionExpired = params.get("session") === "expired";
  const hash = window.location.hash.toLowerCase();

  if (sessionExpired) {
    setTimeout(() => window.showToast("Your session has expired. Please log in again.", "error"), 500);
    window.history.replaceState({}, "", window.location.pathname);
  }

  if (refCode) {
    const refInput = document.querySelector('input[name="referralCode"]');
    if (refInput) refInput.value = refCode;
    setTimeout(() => openModal("player"), 300);
  } else if (hash === "#signup") {
    setTimeout(() => openModal("player"), 300);
  } else if (hash === "#login") {
    setTimeout(() => {
      const loginModal = document.getElementById("login-modal");
      if (loginModal) {
        loginModal.classList.add("is-open");
        loginModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }
    }, 300);
  }
})();

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
    const referralCode = (data.get("referralCode") || "").trim().toUpperCase();

    // Advertiser-specific fields
    const companyName = (data.get("companyName") || "").trim();
    const website = (data.get("website") || "").trim();
    const contactName = (data.get("contactName") || "").trim();
    const telephone = (data.get("telephone") || "").trim();
    const crn = (data.get("crn") || "").trim();
    const proofFile = data.get("proofOfAddress");

    signupMessage.className = "form-message";
    signupMessage.textContent = "";

    if (!displayName || !email || !password || !postcode) {
      signupMessage.classList.add("error");
      signupMessage.textContent = "Please fill in all required fields.";
      return;
    }

    if (accountType === "player" && (!ageRange || !avatar)) {
      signupMessage.classList.add("error");
      signupMessage.textContent = "Please fill in all required fields.";
      return;
    }

    if (accountType === "advertiser") {
      if (!companyName || !website || !contactName || !telephone || !crn) {
        signupMessage.classList.add("error");
        signupMessage.textContent = "Please fill in all advertiser fields.";
        return;
      }
      if (!proofFile || !proofFile.name) {
        signupMessage.classList.add("error");
        signupMessage.textContent = "Please upload proof of business address.";
        return;
      }
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
      const result = await window.authApi.signup({
        email, password, displayName, postcode, accountType, ageRange, avatar,
        companyName, website, contactName, telephone, crn, referralCode,
      });

      if (result && result.error) throw new Error(result.error);

      // Upload proof of address to Supabase Storage if advertiser
      if (accountType === "advertiser" && proofFile && proofFile.name && result.user_id) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${result.user_id}-proof.${fileExt}`;
        const { error: uploadError } = await window.supabaseClient.storage
          .from('advertiser-docs')
          .upload(fileName, proofFile);
        if (!uploadError) {
          const { data: urlData } = window.supabaseClient.storage
            .from('advertiser-docs')
            .getPublicUrl(fileName);
          await window.supabaseClient.rpc("set_proof_of_address", {
            p_user_id: result.user_id,
            p_url: urlData.publicUrl,
          });
        }
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
      if (err.message.includes("already registered")) {
        signupMessage.textContent = "An account with this email already exists.";
      } else {
        signupMessage.textContent = err.message || "Something went wrong. Please try again.";
      }
    }
  });
}

// ===== CONTACT FORM =====
const contactForm = document.querySelector(".contact-form");

// ===== WAITING LIST =====
const waitingListForm = document.getElementById("waiting-list-form");
const waitingListMsg = document.getElementById("waiting-list-message");
if (waitingListForm && waitingListMsg) {
  waitingListForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (new FormData(waitingListForm).get("wlEmail") || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      waitingListMsg.className = "form-message error";
      waitingListMsg.textContent = "Please enter a valid email address.";
      return;
    }

    const btn = waitingListForm.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Joining…";
    btn.disabled = true;

    try {
      const { data: result, error } = await window.supabaseClient.rpc("join_waiting_list", { p_email: email });
      if (error || (result && result.error)) {
        waitingListMsg.className = "form-message error";
        waitingListMsg.textContent = result?.error || error?.message || "Something went wrong.";
      } else {
        waitingListMsg.className = "form-message success";
        waitingListMsg.textContent = "You're on the list! We'll email you the moment we launch. 🎉";
        waitingListForm.reset();
      }
    } catch (err) {
      waitingListMsg.className = "form-message error";
      waitingListMsg.textContent = err.message || "Something went wrong.";
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = (data.get("name") || "").trim();
    const email = (data.get("email") || "").trim();
    const message = (data.get("message") || "").trim();

    if (!name || !email || !message) return;

    const btn = contactForm.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Sending…";
    btn.disabled = true;

    try {
      const { data: result, error } = await window.supabaseClient.rpc("submit_contact_form", {
        p_name: name, p_email: email, p_message: message,
      });
      if (error || (result && result.error)) throw new Error(error?.message || result?.error);
      window.showToast("Message sent! We'll get back to you soon. ✉️", "success");
      contactForm.reset();
    } catch (err) {
      window.showToast("Failed to send: " + (err.message || "Unknown error"), "error");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

// ===== WAITING LIST COUNTER =====
(async function loadWaitingListCount() {
  const countEl = document.getElementById("waiting-list-count-text");
  if (!countEl) return;
  try {
    const { data } = await window.supabaseClient.rpc("get_waiting_list_count");
    if (data && data.count != null && data.count > 0) {
      countEl.innerHTML = `🔥 <b>${data.count}</b> ${data.count === 1 ? "person has" : "people have"} already joined the list`;
    }
  } catch (e) { /* silent fail */ }
})();

// ===== FOOTER BUTTONS =====
const footerSignup = document.getElementById("footer-signup");
const footerLogin = document.getElementById("footer-login");
if (footerSignup) footerSignup.addEventListener("click", () => openModal("player"));
if (footerLogin) footerLogin.addEventListener("click", () => {
  const loginModal = document.getElementById("login-modal");
  if (loginModal) {
    loginModal.classList.add("is-open");
    loginModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
});

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

function openModal(mode) {
  if (signupModal) {
    setSignupMode(mode === "advertiser" ? "advertiser" : "player");
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
  // Main CTAs = player signup
  ["nav-signup", "hero-signup", "launch-signup"].forEach((id) => {
    const btn = document.getElementById(id);
    btn && btn.addEventListener("click", () => openModal("player"));
  });

  // Advertisers section CTA = advertiser signup
  const advertiserBtn = document.getElementById("advertiser-signup");
  advertiserBtn && advertiserBtn.addEventListener("click", () => openModal("advertiser"));

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

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Save code in DB
  await window.authApi.setConfirmationCode(email, code);

  // Send email via Edge Function
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, displayName, code }),
    });
    return response.json();
  } catch (err) {
    // Email failed but code is saved in DB
    console.error("Email send failed:", err);
  }
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
      const result = await window.authApi.confirmCode(pendingVerifyEmail, code);

      if (result && result.error) {
        verifyMessage.className = "form-message error";
        verifyMessage.textContent = result.error === "Invalid code" ? "That code doesn't match. Try again." : result.error;
        verifyBtn.disabled = false;
        return;
      }

      verifyMessage.className = "form-message success";
      verifyMessage.textContent = "Account confirmed! Welcome to Highlife Games! 🎉";

      setTimeout(() => {
        window.location.href = "waiting-room.html";
      }, 1500);
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
      const result = await window.authApi.login(email, password);

      if (result && result.error) {
        loginMessage.className = "form-message error";
        loginMessage.textContent = result.error;
        return;
      }

      // Save session token
      window.authApi.saveToken(result.token);

      loginMessage.className = "form-message success";
      loginMessage.textContent = `Welcome back, ${result.display_name || email}! 🎉`;

      setTimeout(() => {
        window.authApi.routeByAccountType(result.account_type, result.is_approved);
      }, 1500);
    } catch (err) {
      loginMessage.className = "form-message error";
      loginMessage.textContent = err.message || "Login failed. Check your details.";
    }
  });
}

// ===== CHECK EXISTING SESSION =====
(async () => {
  try {
    const token = window.authApi.getToken();
    if (!token) return;

    const result = await window.authApi.validateSession(token);

    if (!result || result.error) {
      window.authApi.clearToken();
      return;
    }

    // Only redirect if confirmed (or admin)
    if (!result.is_confirmed && result.account_type !== "admin") {
      return;
    }

    // Don't redirect if user came via referral link or hash route
    const params = new URLSearchParams(window.location.search);
    const hasRef = params.get("ref");
    const hash = window.location.hash.toLowerCase();
    if (hasRef || hash === "#signup") return;

    window.authApi.routeByAccountType(result.account_type, result.is_approved);
  } catch (err) {
    window.authApi.clearToken();
  }
})();
