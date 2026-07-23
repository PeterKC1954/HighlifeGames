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
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(signupForm);
    const displayName = (data.get("displayName") || "").trim();
    const email = (data.get("email") || "").trim();
    const password = data.get("password") || "";
    const postcode = (data.get("postcode") || "").trim();
    const ageRange = data.get("ageRange") || "";
    const avatar = data.get("avatar") || "";
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

    const accounts = JSON.parse(localStorage.getItem("hl_accounts") || "[]");

    if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      signupMessage.classList.add("error");
      signupMessage.textContent = "An account with this email already exists.";
      return;
    }

    const account = {
      displayName,
      email,
      password: btoa(password),
      postcode,
      ageRange,
      avatar,
      createdAt: new Date().toISOString(),
    };

    accounts.push(account);
    localStorage.setItem("hl_accounts", JSON.stringify(accounts));

    signupMessage.classList.add("success");
    signupMessage.textContent = `Welcome, ${displayName}! Your account has been created. 🎉`;
    signupForm.reset();
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
