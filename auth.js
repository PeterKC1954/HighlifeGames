// Custom auth helper — uses Supabase RPC functions, no Supabase Auth
const AUTH_TOKEN_KEY = "hl_auth_token";

const authApi = {
  async signup(data) {
    const { data: result, error } = await window.supabaseClient.rpc("auth_signup", {
      p_email: data.email,
      p_password: data.password,
      p_display_name: data.displayName,
      p_postcode: data.postcode,
      p_account_type: data.accountType || "player",
      p_age_range: data.ageRange || null,
      p_avatar: data.avatar || null,
      p_company_name: data.companyName || null,
      p_website: data.website || null,
      p_contact_name: data.contactName || null,
      p_telephone: data.telephone || null,
      p_crn: data.crn || null,
      p_referral_code: data.referralCode || null,
    });
    if (error) throw error;
    return result;
  },

  async login(email, password) {
    const { data: result, error } = await window.supabaseClient.rpc("auth_login", {
      p_email: email,
      p_password: password,
    });
    if (error) throw error;
    return result;
  },

  async validateSession(token) {
    const { data: result, error } = await window.supabaseClient.rpc("auth_validate_session", {
      p_token: token,
    });
    if (error) throw error;
    return result;
  },

  async logout(token) {
    await window.supabaseClient.rpc("auth_logout", { p_token: token });
  },

  async setConfirmationCode(email, code) {
    await window.supabaseClient.rpc("auth_set_confirmation_code", {
      p_email: email,
      p_code: code,
    });
  },

  async confirmCode(email, code) {
    const { data: result, error } = await window.supabaseClient.rpc("auth_confirm_code", {
      p_email: email,
      p_code: code,
    });
    if (error) throw error;
    return result;
  },

  saveToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  routeByAccountType(accountType, isApproved) {
    if (accountType === "admin") {
      window.location.href = "dashboard.html";
    } else if (accountType === "advertiser" && isApproved) {
      window.location.href = "advertiser.html";
    } else if (accountType === "player") {
      window.location.href = "waiting-room.html";
    }
  },

  buildReferralLink(code) {
    const base = window.location.origin + window.location.pathname;
    return base + "?ref=" + code;
  },

  getReferralCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("ref") || "").toUpperCase().trim();
  },
};

window.authApi = authApi;
