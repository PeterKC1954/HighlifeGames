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

// Toggle advertiser/player fields based on account type selection
const advertiserFields = document.getElementById("advertiser-fields");
const playerFields = document.getElementById("player-fields");
const accountTypeRadios = document.querySelectorAll('input[name="accountType"]');

function toggleAccountFields() {
  const selected = document.querySelector('input[name="accountType"]:checked');
  const isAdvertiser = selected && selected.value === "advertiser";
  if (advertiserFields) advertiserFields.style.display = isAdvertiser ? "block" : "none";
  if (playerFields) playerFields.style.display = isAdvertiser ? "none" : "block";
  // Toggle required on fields
  if (advertiserFields) {
    advertiserFields.querySelectorAll("input").forEach(el => { el.required = isAdvertiser; });
  }
  if (playerFields) {
    playerFields.querySelectorAll("select, input").forEach(el => { el.required = !isAdvertiser; });
  }
}

accountTypeRadios.forEach(radio => radio.addEventListener("change", toggleAccountFields));
toggleAccountFields();

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
      const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: accountType === "advertiser"
            ? { displayName, postcode, accountType, companyName, website, contactName, telephone, crn, referralCode }
            : { displayName, postcode, ageRange, avatar, accountType, referralCode },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        let proofUrl = null;

        // Upload proof of address to Supabase Storage if advertiser
        if (accountType === "advertiser" && proofFile && proofFile.name) {
          const fileExt = proofFile.name.split('.').pop();
          const fileName = `${authData.user.id}-proof.${fileExt}`;
          const { error: uploadError } = await window.supabaseClient.storage
            .from('advertiser-docs')
            .upload(fileName, proofFile);
          if (uploadError) throw uploadError;
          const { data: urlData } = window.supabaseClient.storage
            .from('advertiser-docs')
            .getPublicUrl(fileName);
          proofUrl = urlData.publicUrl;
        }

        const profileData = {
          id: authData.user.id,
          display_name: displayName,
          email,
          postcode,
          account_type: accountType,
        };

        if (accountType === "player") {
          profileData.age_range = ageRange;
          profileData.avatar = avatar;
        } else if (accountType === "advertiser") {
          profileData.company_name = companyName;
          profileData.website = website;
          profileData.contact_name = contactName;
          profileData.telephone = telephone;
          profileData.crn = crn;
          profileData.proof_of_address_url = proofUrl;
        }

        // DB trigger already creates the profile (incl. referral rewards) — upsert fills extras like proof URL
        const { error: profileError } = await window.supabaseClient.from("profiles").upsert(profileData, { onConflict: "id" });

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
          window.location.href = "waiting-room.html";
        }, 1500);
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

      const { data: profile } = await window.supabaseClient.from("profiles").select("display_name, account_type, is_confirmed, is_approved").eq("id", authData.user.id).single();

      if (profile && !profile.is_confirmed && profile.account_type !== "admin") {
        loginMessage.className = "form-message error";
        loginMessage.textContent = "Please confirm your email first. Check for a 6-digit code.";
        await window.supabaseClient.auth.signOut();
        return;
      }

      if (profile && profile.account_type === "advertiser" && !profile.is_approved) {
        loginMessage.className = "form-message error";
        loginMessage.textContent = "Your advertiser account is pending admin approval. We'll email you once approved.";
        await window.supabaseClient.auth.signOut();
        return;
      }

      loginMessage.className = "form-message success";
      loginMessage.textContent = `Welcome back, ${profile?.display_name || email}! 🎉`;

      setTimeout(() => {
        if (profile?.account_type === "admin") {
          window.location.href = "dashboard.html";
        } else if (profile?.account_type === "advertiser") {
          window.location.href = "advertiser.html";
        } else {
          window.location.href = "waiting-room.html";
        }
      }, 1500);
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
    const { data: profile } = await window.supabaseClient.from("profiles").select("account_type, is_approved").eq("id", session.user.id).single();
    if (profile?.account_type === "admin") {
      window.location.href = "dashboard.html";
    } else if (profile?.account_type === "advertiser" && profile?.is_approved) {
      window.location.href = "advertiser.html";
    } else if (profile?.account_type === "player") {
      window.location.href = "waiting-room.html";
    }
  }
})();
