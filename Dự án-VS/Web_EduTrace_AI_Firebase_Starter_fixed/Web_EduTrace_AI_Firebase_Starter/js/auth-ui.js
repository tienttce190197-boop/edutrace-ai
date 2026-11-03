/* ==========================================================================
   EDUTRACE AI - AUTHENTICATION & USER INTERFACE CONTROLLER
   Điều khiển Modal Đăng nhập / Đăng ký / Quên MK / Quản lý Hồ sơ,
   Hiển thị Avatar, Dropdown Navbar, Đánh giá độ mạnh mật khẩu,
   Tự động điền dữ liệu người dùng vào các form liên hệ.
   ========================================================================== */

import {
  initAuthService,
  subscribeAuth,
  getCurrentUser,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  updateUserProfile,
  getUserActivities,
  recordUserActivity,
  formatAuthError,
  DEMO_PRESET_ACCOUNTS,
  ROLE_LABELS
} from "./firebase-auth.js";
import { escapeHtml } from "./escape-html.js";
import { updateRoleWorkspace } from "./role-workspace.js";
import { pageForRole } from "./role-routing.js";

function setAvatar(element, photoURL, displayName, initial) {
  if (!element) return;
  try {
    const url = new URL(photoURL);
    if (url.protocol !== 'https:') throw new Error('Invalid image URL');
    const image = document.createElement('img');
    image.src = url.href;
    image.alt = displayName;
    element.replaceChildren(image);
  } catch {
    element.textContent = initial;
  }
}

// Helper for showing toast messages
function notifyToast(message) {
  if (typeof window.showToast === "function") {
    window.showToast(message);
  } else {
    alert(message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupAuthUI();
});

export function setupAuthUI() {
  // Elements
  const authModal = document.getElementById("authModal");
  const closeAuthModal = document.getElementById("closeAuthModal");
  const navLoginBtn = document.getElementById("navLoginBtn");
  const navRegisterBtn = document.getElementById("navRegisterBtn");
  const authNavGuest = document.getElementById("authNavGuest");
  const authNavUser = document.getElementById("authNavUser");

  // Mobile elements
  const mobileLoginBtn = document.getElementById("mobileLoginBtn");
  const mobileRegisterBtn = document.getElementById("mobileRegisterBtn");
  const mobileAuthGuest = document.getElementById("mobileAuthGuest");
  const mobileAuthUser = document.getElementById("mobileAuthUser");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  const mobileProfileBtn = document.getElementById("mobileProfileBtn");

  // Tabs
  const authTabLogin = document.getElementById("authTabLogin");
  const authTabRegister = document.getElementById("authTabRegister");
  const authPanelLogin = document.getElementById("authPanelLogin");
  const authPanelRegister = document.getElementById("authPanelRegister");
  const authPanelForgot = document.getElementById("authPanelForgot");

  // Forms
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  const formForgot = document.getElementById("formForgot");

  // Profile Modal
  const userProfileModal = document.getElementById("userProfileModal");
  const closeProfileModal = document.getElementById("closeProfileModal");
  const formEditProfile = document.getElementById("formEditProfile");
  const btnOpenUserProfile = document.getElementById("btnOpenUserProfile");
  const btnOpenUserBookings = document.getElementById("btnOpenUserBookings");

  // Dropdown toggle
  const navUserMenuToggle = document.getElementById("navUserMenuToggle");
  const navUserDropdown = document.getElementById("navUserDropdown");
  const btnLogout = document.getElementById("btnLogout");

  // Quick Demo Chips
  const demoChips = document.querySelectorAll(".demo-account-chip");

  // Password Toggles
  setupPasswordToggles();
  setupPasswordStrengthMeter();

  // Switch between Login / Register / Forgot views
  function showAuthView(viewName) {
    if (!authModal) return;

    authModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Clear alerts
    hideAuthAlerts();

    if (viewName === "login") {
      authTabLogin?.classList.add("active");
      authTabRegister?.classList.remove("active");
      if (authPanelLogin) authPanelLogin.style.display = "block";
      if (authPanelRegister) authPanelRegister.style.display = "none";
      if (authPanelForgot) authPanelForgot.style.display = "none";
    } else if (viewName === "register") {
      authTabLogin?.classList.remove("active");
      authTabRegister?.classList.add("active");
      if (authPanelLogin) authPanelLogin.style.display = "none";
      if (authPanelRegister) authPanelRegister.style.display = "block";
      if (authPanelForgot) authPanelForgot.style.display = "none";
    } else if (viewName === "forgot") {
      authTabLogin?.classList.remove("active");
      authTabRegister?.classList.remove("active");
      if (authPanelLogin) authPanelLogin.style.display = "none";
      if (authPanelRegister) authPanelRegister.style.display = "none";
      if (authPanelForgot) authPanelForgot.style.display = "block";
    }
  }

  function closeAuthDialog() {
    if (authModal) {
      authModal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  }

  // Open modal triggers
  navLoginBtn?.addEventListener("click", () => showAuthView("login"));
  navRegisterBtn?.addEventListener("click", () => showAuthView("register"));
  document.getElementById("parentPortalLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (getCurrentUser()?.role === "parent") {
      document.getElementById("roleWorkspace")?.scrollIntoView({ behavior: "smooth" });
    } else {
      showAuthView("login");
    }
  });
  mobileLoginBtn?.addEventListener("click", () => {
    closeMobileNav();
    showAuthView("login");
  });
  mobileRegisterBtn?.addEventListener("click", () => {
    closeMobileNav();
    showAuthView("register");
  });

  closeAuthModal?.addEventListener("click", closeAuthDialog);
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuthDialog();
  });

  // Tab switching
  authTabLogin?.addEventListener("click", () => showAuthView("login"));
  authTabRegister?.addEventListener("click", () => showAuthView("register"));

  document.getElementById("btnToForgot")?.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthView("forgot");
  });

  document.getElementById("btnBackToLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthView("login");
  });

  // Demo chips click handler
  demoChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const email = chip.dataset.email;
      const emailInput = document.getElementById("loginEmail");
      const passInput = document.getElementById("loginPassword");
      if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = "EduTrace@2026";
        // Visual feedback
        chip.style.transform = "scale(0.96)";
        setTimeout(() => (chip.style.transform = ""), 150);
      }
    });
  });

  // Handle Login Form Submit
  formLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail")?.value;
    const password = document.getElementById("loginPassword")?.value;
    const submitBtn = document.getElementById("loginSubmitBtn");

    if (!email || !password) {
      showAuthAlert("login", "Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang xác thực...");
    hideAuthAlerts();

    try {
      const res = await loginWithEmail({ email, password });
      if (res.user?.role === "admin") {
        window.location.href = "admin.html";
        return;
      }
      closeAuthDialog();
      formLogin.reset();
      const userName = res.user?.displayName || "bạn";
      notifyToast(`Đăng nhập thành công! Chào mừng ${userName} trở lại.`);
    } catch (err) {
      console.error("Login error:", err);
      showAuthAlert("login", formatAuthError(err));
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Handle Register Form Submit
  formRegister?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("regFullName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const phone = document.getElementById("regPhone")?.value.trim();
    const role = document.getElementById("regRole")?.value;
    const password = document.getElementById("regPassword")?.value;
    const confirmPassword = document.getElementById("regConfirmPassword")?.value;
    const agreeTerms = document.getElementById("regAgreeTerms")?.checked;
    const submitBtn = document.getElementById("registerSubmitBtn");

    if (!fullName || !email || !password) {
      showAuthAlert("register", "Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    if (password.length < 6) {
      showAuthAlert("register", "Mật khẩu phải có tối thiểu 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert("register", "Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (!agreeTerms) {
      showAuthAlert("register", "Vui lòng đồng ý với Cam kết bảo mật thông tin trẻ em.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang khởi tạo tài khoản...");
    hideAuthAlerts();

    try {
      const res = await registerWithEmail({ email, password, fullName, phone, role });
      closeAuthDialog();
      formRegister.reset();
      const roleText = ROLE_LABELS[role] || "Thành viên";
      notifyToast(`Đăng ký thành công! Chào mừng ${fullName} gia nhập mạng lưới EduTrace AI (${roleText}).`);
    } catch (err) {
      console.error("Registration error:", err);
      showAuthAlert("register", formatAuthError(err));
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Google Login / Register buttons
  const googleLoginBtn = document.getElementById("btnGoogleLogin");
  const googleRegisterBtn = document.getElementById("btnGoogleRegister");

  async function handleGoogleAuth(btn) {
    setBtnBusy(btn, true, "Đang kết nối Google...");
    hideAuthAlerts();
    try {
      const res = await loginWithGoogle();
      if (res.user?.role === "admin") {
        window.location.href = "admin.html";
        return;
      }
      closeAuthDialog();
      notifyToast(`Đăng nhập Google thành công! Xin chào ${res.user?.displayName || "bạn"}.`);
    } catch (err) {
      console.error("Google auth error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        showAuthAlert("login", formatAuthError(err));
        showAuthAlert("register", formatAuthError(err));
      }
    } finally {
      setBtnBusy(btn, false);
    }
  }

  googleLoginBtn?.addEventListener("click", () => handleGoogleAuth(googleLoginBtn));
  googleRegisterBtn?.addEventListener("click", () => handleGoogleAuth(googleRegisterBtn));

  // Forgot Password Submit
  formForgot?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgotEmail")?.value;
    const submitBtn = document.getElementById("forgotSubmitBtn");

    if (!email) {
      showAuthAlert("forgot", "Vui lòng nhập email.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang gửi...");
    hideAuthAlerts();

    try {
      await resetPassword(email);
      showAuthSuccess("forgot", `EduTrace AI đã gửi liên kết đặt lại mật khẩu đến email ${email}. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam).`);
      formForgot.reset();
    } catch (err) {
      console.error("Reset password error:", err);
      showAuthAlert("forgot", formatAuthError(err));
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Dropdown toggle for authenticated user
  navUserMenuToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navUserDropdown?.classList.toggle("open");
    navUserMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (navUserDropdown && !navUserDropdown.contains(e.target) && e.target !== navUserMenuToggle) {
      navUserDropdown.classList.remove("open");
      navUserMenuToggle?.setAttribute("aria-expanded", "false");
    }
  });

  // Logout buttons
  async function performLogout() {
    try {
      await logoutUser();
      navUserDropdown?.classList.remove("open");
      closeMobileNav();
      notifyToast("Đã đăng xuất thành công khỏi hệ thống.");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  btnLogout?.addEventListener("click", performLogout);
  mobileLogoutBtn?.addEventListener("click", performLogout);

  // Profile Modal
  btnOpenUserProfile?.addEventListener("click", () => {
    navUserDropdown?.classList.remove("open");
    openProfileModal("profile");
  });

  btnOpenUserBookings?.addEventListener("click", () => {
    navUserDropdown?.classList.remove("open");
    openProfileModal("bookings");
  });

  mobileProfileBtn?.addEventListener("click", () => {
    closeMobileNav();
    openProfileModal("profile");
  });

  closeProfileModal?.addEventListener("click", () => {
    userProfileModal?.classList.remove("active");
    document.body.style.overflow = "auto";
  });

  userProfileModal?.addEventListener("click", (e) => {
    if (e.target === userProfileModal) {
      userProfileModal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  });

  // Profile tabs switch
  const profileTabInfo = document.getElementById("profileTabInfo");
  const profileTabBookings = document.getElementById("profileTabBookings");
  const profilePanelInfo = document.getElementById("profilePanelInfo");
  const profilePanelBookings = document.getElementById("profilePanelBookings");

  function openProfileModal(tab = "profile") {
    if (!userProfileModal) return;
    userProfileModal.classList.add("active");
    document.body.style.overflow = "hidden";

    if (tab === "profile") {
      profileTabInfo?.classList.add("active");
      profileTabBookings?.classList.remove("active");
      if (profilePanelInfo) profilePanelInfo.style.display = "block";
      if (profilePanelBookings) profilePanelBookings.style.display = "none";
    } else {
      profileTabInfo?.classList.remove("active");
      profileTabBookings?.classList.add("active");
      if (profilePanelInfo) profilePanelInfo.style.display = "none";
      if (profilePanelBookings) profilePanelBookings.style.display = "block";
      renderUserBookingsList();
    }
  }

  profileTabInfo?.addEventListener("click", () => openProfileModal("profile"));
  profileTabBookings?.addEventListener("click", () => openProfileModal("bookings"));
  document.getElementById("roleWorkspaceProfile")?.addEventListener("click", () => openProfileModal("profile"));
  document.getElementById("roleWorkspaceHistory")?.addEventListener("click", () => openProfileModal("bookings"));

  // Update Profile Form Submit
  formEditProfile?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const displayName = document.getElementById("profileEditName")?.value.trim();
    const phone = document.getElementById("profileEditPhone")?.value.trim();
    const role = document.getElementById("profileEditRole")?.value;
    const submitBtn = document.getElementById("profileSubmitBtn");

    if (!displayName) {
      notifyToast("Họ và tên không được để trống.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang lưu thay đổi...");
    try {
      await updateUserProfile({ displayName, phone, role });
      notifyToast("Cập nhật thông tin tài khoản thành công!");
      userProfileModal?.classList.remove("active");
      document.body.style.overflow = "auto";
    } catch (err) {
      console.error("Profile update error:", err);
      notifyToast("Không thể cập nhật hồ sơ: " + err.message);
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Subscribe to Auth State Changes
  subscribeAuth((user) => {
    if (user && pageForRole(user.role) !== 'index.html') {
      window.location.replace(pageForRole(user.role));
      return;
    }
    updateNavbarAuthState(user);
    updateRoleWorkspace(user);
    populateFormsWithUserData(user);
    updateProfileModalData(user);
  });

  // Initialize service
  initAuthService();
}

// Helpers
function closeMobileNav() {
  const menu = document.querySelector(".nav-menu");
  if (menu) menu.classList.remove("open");
}

function setBtnBusy(btn, busy, text = "") {
  if (!btn) return;
  btn.disabled = busy;
  if (busy) {
    btn.dataset.prevText = btn.innerHTML;
    btn.innerHTML = `
      <svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      <span>${text}</span>
    `;
  } else if (btn.dataset.prevText) {
    btn.innerHTML = btn.dataset.prevText;
  }
}

function hideAuthAlerts() {
  document.querySelectorAll(".auth-alert").forEach((el) => {
    el.style.display = "none";
    el.textContent = "";
  });
}

function showAuthAlert(section, message) {
  const alertEl = document.getElementById(`${section}ErrorMessage`);
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.style.display = "flex";
  }
}

function showAuthSuccess(section, message) {
  const successEl = document.getElementById(`${section}SuccessMessage`);
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = "flex";
  }
}

// Update Navbar elements when user logs in / logs out
function updateNavbarAuthState(user) {
  const authNavGuest = document.getElementById("authNavGuest");
  const authNavUser = document.getElementById("authNavUser");
  const mobileAuthGuest = document.getElementById("mobileAuthGuest");
  const mobileAuthUser = document.getElementById("mobileAuthUser");

  if (user) {
    // Hide guest buttons, show user pill
    if (authNavGuest) authNavGuest.hidden = true;
    if (authNavUser) authNavUser.hidden = false;
    if (mobileAuthGuest) mobileAuthGuest.hidden = true;
    if (mobileAuthUser) mobileAuthUser.hidden = false;

    const displayName = user.displayName || user.email.split("@")[0];
    const initial = displayName.charAt(0).toUpperCase();
    const roleText = user.roleLabel || ROLE_LABELS[user.role] || "Thành viên";

    // Set Navbar pill
    const navAvatar = document.getElementById("navUserAvatar");
    const navName = document.getElementById("navUserName");
    const navRole = document.getElementById("navUserRole");
    setAvatar(navAvatar, user.photoURL, displayName, initial);
    if (navName) navName.textContent = displayName;
    if (navRole) navRole.textContent = roleText;

    // Set Dropdown Info
    const dropdownAvatar = document.getElementById("dropdownUserAvatar");
    const dropdownName = document.getElementById("dropdownUserName");
    const dropdownEmail = document.getElementById("dropdownUserEmail");
    const dropdownRole = document.getElementById("dropdownUserRole");

    setAvatar(dropdownAvatar, user.photoURL, displayName, initial);
    if (dropdownName) dropdownName.textContent = displayName;
    if (dropdownEmail) dropdownEmail.textContent = user.email;
    if (dropdownRole) dropdownRole.textContent = roleText;

    // Mobile nav info
    const mobileUserName = document.getElementById("mobileUserName");
    const mobileUserRole = document.getElementById("mobileUserRole");
    if (mobileUserName) mobileUserName.textContent = displayName;
    if (mobileUserRole) mobileUserRole.textContent = roleText;

    // Show admin portal link if role is admin
    const adminLink = document.getElementById("btnAdminPortal");
    const mobileAdminLink = document.getElementById("mobileAdminPortal");
    if (adminLink) {
      adminLink.style.display = user.role === "admin" ? "flex" : "none";
    }
    if (mobileAdminLink) {
      mobileAdminLink.style.display = user.role === "admin" ? "block" : "none";
    }

    // Update activities count badge (gồm cả lịch hẹn và bài test sàng lọc)
    const activities = getUserActivities();
    let clinicalCases = [];
    try {
      const raw = localStorage.getItem("edutrace_clinical_test_cases");
      if (raw) clinicalCases = JSON.parse(raw);
    } catch {}
    const totalCount = activities.length + clinicalCases.length;
    const countBadge = document.getElementById("userBookingsCount");
    if (countBadge) {
      if (totalCount > 0) {
        countBadge.style.display = "inline-flex";
        countBadge.textContent = totalCount;
      } else {
        countBadge.style.display = "none";
      }
    }
  } else {
    // Show guest buttons, hide user pill
    if (authNavGuest) authNavGuest.hidden = false;
    if (authNavUser) authNavUser.hidden = true;
    if (mobileAuthGuest) mobileAuthGuest.hidden = false;
    if (mobileAuthUser) mobileAuthUser.hidden = true;

    const adminLink = document.getElementById("btnAdminPortal");
    const mobileAdminLink = document.getElementById("mobileAdminPortal");
    if (adminLink) adminLink.style.display = "none";
    if (mobileAdminLink) mobileAdminLink.style.display = "none";

    // Khi dang xuat hoac la khach, an thong bao phan hoi bac si
    const alertEl = document.getElementById("parentClinicalResponseAlert");
    if (alertEl) alertEl.style.display = "none";
  }
}

// Keep data from a previous signed-in user out of the next user's forms.
let lastPrefilledUser = null;
// Auto-fill forms across the website when logged in
function populateFormsWithUserData(user) {
  if (!user) return;
  const changedUser = lastPrefilledUser !== null && lastPrefilledUser !== user.email;
  lastPrefilledUser = user.email;

  // 1. Consultation Form (B2C / B2B)
  const consultForm = document.getElementById("consultationForm");
  if (consultForm) {
    const nameInput = consultForm.querySelector('[name="fullname"]');
    const phoneInput = consultForm.querySelector('[name="phone"]');
    const emailInput = consultForm.querySelector('[name="email"]');
    const roleSelect = consultForm.querySelector('[name="role"]');

    if (nameInput && (changedUser || !nameInput.value)) nameInput.value = user.displayName || "";
    if (phoneInput && (changedUser || !phoneInput.value)) phoneInput.value = user.phone || "";
    if (emailInput && (changedUser || !emailInput.value)) emailInput.value = user.email || "";
    if (roleSelect && user.role) {
      if (["parent", "center", "doctor", "investor"].includes(user.role)) {
        roleSelect.value = user.role;
      }
    }
  }

  // 2. Direct 1-1 Center Booking Form
  const bookingForm = document.getElementById("centerBookingForm");
  if (bookingForm) {
    const parentName = bookingForm.querySelector('[name="parentName"]');
    const parentPhone = bookingForm.querySelector('[name="parentPhone"]');

    if (parentName && (changedUser || !parentName.value)) parentName.value = user.displayName || "";
    if (parentPhone && (changedUser || !parentPhone.value)) parentPhone.value = user.phone || "";
  }
}

// Populate User Profile Modal fields
function updateProfileModalData(user) {
  if (!user) return;
  const nameInput = document.getElementById("profileEditName");
  const emailInput = document.getElementById("profileEditEmail");
  const phoneInput = document.getElementById("profileEditPhone");
  const roleSelect = document.getElementById("profileEditRole");
  const avatarBig = document.getElementById("profileAvatarBig");
  const profileHeroName = document.getElementById("profileHeroName");
  const createdAtSpan = document.getElementById("profileCreatedAt");

  const displayName = user.displayName || user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();
  if (profileHeroName) profileHeroName.textContent = displayName;

  if (nameInput) nameInput.value = displayName;
  if (emailInput) emailInput.value = user.email;
  if (phoneInput) phoneInput.value = user.phone || "";
  if (roleSelect && user.role) roleSelect.value = user.role;
  if (createdAtSpan) createdAtSpan.textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Hôm nay";

  setAvatar(avatarBig, user.photoURL, displayName, initial);
}

// Render activities list inside Profile Modal
function renderUserBookingsList() {
  const container = document.getElementById("userActivitiesList");
  if (!container) return;

  const activities = getUserActivities();
  const currentUser = getCurrentUser();
  let clinicalCases = [];

  // Chỉ tải ca test sàng lọc nếu đã đăng nhập vào tài khoản PHỤ HUYNH
  if (currentUser && currentUser.role === "parent") {
    try {
      const raw = localStorage.getItem("edutrace_clinical_test_cases");
      if (raw) {
        const allCases = JSON.parse(raw);
        clinicalCases = allCases.filter((c) => {
          if (c.parentEmail && currentUser.email) {
            return c.parentEmail.toLowerCase() === currentUser.email.toLowerCase();
          }
          const lastId = localStorage.getItem("edutrace_last_submitted_test_id");
          if (lastId && c.id === lastId) return true;
          if (currentUser.phone && c.parentPhone && c.parentPhone.includes(currentUser.phone)) return true;
          if (currentUser.displayName && c.parentName && c.parentName.toLowerCase().includes(currentUser.displayName.toLowerCase())) return true;
          return !c.parentEmail;
        });
      }
    } catch {}
  }

  if (activities.length === 0 && clinicalCases.length === 0) {
    container.innerHTML = `
      <div class="empty-activity-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>Bạn chưa gửi yêu cầu đặt lịch can thiệp hoặc nộp bài test sàng lọc nào.</p>
        <a href="#ai-assistant-demo" class="btn btn-sm btn-primary" onclick="document.getElementById('userProfileModal').classList.remove('active');">
          Thử Trợ Lý AI &amp; Đặt Lịch Ngay
        </a>
      </div>
    `;
    return;
  }

  // 1. Render danh sách bài test sàng lọc lâm sàng (ưu tiên hiển thị trên cùng)
  const clinicalHtml = clinicalCases
    .map((c) => {
      const isResponded = c.status === "responded" && c.respondedBy;
      const resp = c.respondedBy;

      return `
        <div class="user-activity-item ${isResponded ? "has-doctor-response" : ""}" style="${
        isResponded
          ? "border: 2px solid #10b981; background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 12px;"
          : "border-left: 4px solid #ea580c; border-radius: 12px; padding: 14px; margin-bottom: 12px; background: #fffaf5;"
      }">
          <div class="activity-details" style="width: 100%;">
            <div class="activity-title-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
              <h4 style="margin: 0; font-size: 0.98rem; color: #0f172a; font-weight: 700;">
                📋 Sàng Lọc: ${escapeHtml(c.childName)} (${escapeHtml(c.childAge)}) - ${escapeHtml(c.branchTitle)}
              </h4>
              <span class="activity-status-badge" style="${
                isResponded
                  ? "background: #10b981; color: #ffffff; font-weight: 700; padding: 4px 10px; border-radius: 99px; font-size: 0.76rem;"
                  : "background: #ea580c; color: #ffffff; font-weight: 700; padding: 4px 10px; border-radius: 99px; font-size: 0.76rem;"
              }">
                ${isResponded ? "✓ BÁC SĨ ĐÃ PHẢN HỒI" : "⏳ Đang Chờ Bác Sĩ Tiếp Nhận"}
              </span>
            </div>
            <p class="activity-meta" style="margin: 6px 0 10px; font-size: 0.78rem; color: #64748b; display: flex; gap: 14px; flex-wrap: wrap;">
              <span>⏱️ Nộp lúc: <strong>${escapeHtml(c.createdTimeFormatted || "Gần đây")}</strong></span>
              <span>📊 Kết quả: <strong>${c.score}/${c.maxScore} điểm</strong> (${escapeHtml(c.riskLevel)})</span>
            </p>

            ${
              isResponded
                ? `
              <div style="background: #ffffff; border-radius: 10px; padding: 12px 16px; border-left: 3px solid #10b981; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div style="font-size: 0.85rem; font-weight: 700; color: #065f46; margin-bottom: 4px;">
                  👨‍⚕️ ${escapeHtml(resp.responderName)} • ${escapeHtml(resp.clinicName)} <span style="font-size: 0.76rem; color: #64748b; font-weight: normal;">(${escapeHtml(resp.respondedAt)})</span>
                </div>
                <div style="font-size: 0.84rem; color: #1e293b; line-height: 1.5; font-style: italic; margin-bottom: 6px;">
                  "${escapeHtml(resp.doctorFeedback)}"
                </div>
                <div style="font-size: 0.78rem; color: #475569;">
                  📍 <strong>Địa chỉ đón tiếp bé:</strong> ${escapeHtml(resp.clinicAddress)} • 📞 <strong>Hotline:</strong> <a href="tel:${escapeHtml(resp.clinicPhone)}" style="color: #059669; font-weight: 700;">${escapeHtml(resp.clinicPhone)}</a>
                </div>
              </div>
            `
                : `
              <div style="font-size: 0.8rem; color: #b45309; background: #fffbeb; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #f59e0b;">
                Hệ thống đã phát sóng ca test này đến toàn bộ các Bác sĩ &amp; Cơ sở can thiệp. Bác sĩ/phòng khám nào tiếp nhận trước sẽ được ghim phản hồi trực tiếp ngay tại đây!
              </div>
            `
            }

            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-sm btn-primary" onclick="window.viewClinicalTestResponse?.('${c.id}'); document.getElementById('userProfileModal')?.classList.remove('active');" style="${
        isResponded ? "background: #059669; border-color: #059669;" : "background: #2563eb; border-color: #2563eb;"
      } font-weight: 700; padding: 7px 14px;">
                ${isResponded ? "🔍 Xem Toàn Bộ Đánh Giá &amp; Phác Đồ Bác Sĩ ➔" : "👁️ Xem Lại Kết Quả Bài Test"}
              </button>
              ${
                isResponded && resp.clinicPhone
                  ? `
                <a href="tel:${escapeHtml(resp.clinicPhone)}" class="btn btn-sm btn-outline-light" style="font-size: 0.78rem; padding: 7px 14px; text-decoration: none; color: #059669; border-color: #10b981;">
                  📞 Gọi Ngay Cho Bác Sĩ
                </a>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // 2. Render danh sách đặt lịch hẹn hoặc tư vấn
  const bookingHtml = activities
    .map((act) => {
      const isBooking = act.type === "booking";
      const title = isBooking
        ? `Đặt lịch can thiệp 1-1 tại: ${act.data?.targetCenter || "Trung tâm đối tác"}`
        : `Đăng ký tư vấn chuyên môn EduTrace AI`;
      const schedule = act.data?.preferredSchedule
        ? `Thời gian mong muốn: ${translateSchedule(act.data.preferredSchedule)}`
        : "";
      const phone = act.data?.parentPhone || act.data?.phone || "";

      return `
        <div class="user-activity-item" style="border-radius: 12px; padding: 14px; margin-bottom: 12px;">
          <div class="activity-icon ${isBooking ? "icon-booking" : "icon-lead"}">
            ${
              isBooking
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
            }
          </div>
          <div class="activity-details">
            <div class="activity-title-row">
              <h4>${escapeHtml(title)}</h4>
              <span class="activity-status-badge status-pending">Đã tiếp nhận</span>
            </div>
            <p class="activity-meta">
              <span>📅 ${escapeHtml(act.createdAt)}</span>
              ${phone ? `<span>📞 ${escapeHtml(phone)}</span>` : ""}
              ${schedule ? `<span>⏰ ${escapeHtml(schedule)}</span>` : ""}
            </p>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = clinicalHtml + bookingHtml;
}

window.renderUserBookingsList = renderUserBookingsList;

function translateSchedule(val) {
  if (val === "weekend") return "Thứ 7 hoặc Chủ Nhật";
  if (val === "weekday_morning") return "Sáng trong tuần";
  if (val === "weekday_afternoon") return "Chiều trong tuần";
  return val;
}

// Password Eye Toggle
function setupPasswordToggles() {
  const toggles = document.querySelectorAll(".password-toggle-btn");
  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      // Toggle SVG Icon
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  });
}

// Password Strength Meter
function setupPasswordStrengthMeter() {
  const passInput = document.getElementById("regPassword");
  const meterBar = document.getElementById("passwordStrengthBar");
  const meterText = document.getElementById("passwordStrengthText");

  if (!passInput || !meterBar) return;

  passInput.addEventListener("input", () => {
    const val = passInput.value;
    if (!val) {
      meterBar.style.width = "0%";
      meterBar.className = "strength-bar";
      if (meterText) meterText.textContent = "";
      return;
    }

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) {
      meterBar.style.width = "25%";
      meterBar.style.backgroundColor = "#ef4444";
      if (meterText) {
        meterText.textContent = "Mật khẩu yếu (Cần thêm ký tự)";
        meterText.style.color = "#ef4444";
      }
    } else if (score === 2) {
      meterBar.style.width = "50%";
      meterBar.style.backgroundColor = "#f59e0b";
      if (meterText) {
        meterText.textContent = "Mật khẩu trung bình";
        meterText.style.color = "#f59e0b";
      }
    } else if (score === 3) {
      meterBar.style.width = "75%";
      meterBar.style.backgroundColor = "#3b82f6";
      if (meterText) {
        meterText.textContent = "Mật khẩu khá an toàn";
        meterText.style.color = "#3b82f6";
      }
    } else {
      meterBar.style.width = "100%";
      meterBar.style.backgroundColor = "#10b981";
      if (meterText) {
        meterText.textContent = "Mật khẩu rất mạnh";
        meterText.style.color = "#10b981";
      }
    }
  });
}
