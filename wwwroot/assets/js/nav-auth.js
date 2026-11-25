/**
 * Navigation Bar & Client Auth Handler
 * Unified and centralized client-side authentication display, route protection, and instant logout flow.
 */
(() => {
  // Prevent duplicate initialization or conflicting event listeners if loaded multiple times
  if (window.__bookingtour_nav_auth_initialized) {
    return;
  }
  window.__bookingtour_nav_auth_initialized = true;

  const PROTECTED_CLIENT_ROUTES = [
    '/my_tours/',
    '/my_tours',
    '/profile/',
    '/profile',
    '/payments/history.html',
    '/payments/history',
    '/reward_point.html',
    '/reward_point',
    '/booking/passengers.html'
  ];

  const LOGIN_URL = '/client/auth/login.html';

  function getLoginUrl() {
    return LOGIN_URL;
  }

  function getStoredToken() {
    try {
      return localStorage.getItem('bookingtour_token') || sessionStorage.getItem('bookingtour_token');
    } catch (_) {
      return null;
    }
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('bookingtour_user') || sessionStorage.getItem('bookingtour_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function isExplicitlyLoggedOut() {
    try {
      return sessionStorage.getItem('bookingtour_logged_out') === 'true' || 
             localStorage.getItem('bookingtour_logged_out') === 'true';
    } catch (_) {
      return false;
    }
  }

  function isAuthenticated() {
    if (isExplicitlyLoggedOut()) return false;
    const token = getStoredToken();
    const user = getStoredUser();
    // Strict authentication: MUST have an actual stored token or stored logged-in user
    // NEVER rely on mock database demo customer fallback
    return !!(token || user);
  }

  function checkProtection() {
    const path = window.location.pathname.toLowerCase();
    const isProtected = PROTECTED_CLIENT_ROUTES.some(r => path.includes(r.toLowerCase()));

    if (isProtected && !isAuthenticated()) {
      window.location.replace('/client/auth/login.html');
      return false;
    }
    return true;
  }

  // Run protection check immediately before rendering content
  checkProtection();

  let isLoggingOut = false;

  /**
   * Unified, Instantaneous Client Logout Function
   * Non-blocking: fires backend API logout in background, instantly wipes credentials,
   * sets logged_out flag, preserves mock DB, and redirects to /client/auth/login.html.
   */
  function logout() {
    if (isLoggingOut) return;
    isLoggingOut = true;

    try {
      // 1. Capture token BEFORE wiping credentials
      const token = getStoredToken();

      // 2. Dispatch backend API logout asynchronously with Bearer token (non-blocking)
      // Uses keepalive: true so browser delivers request even during page redirect
      if (token) {
        try {
          const apiBase = (window.BookingTourApi && window.BookingTourApi.API_BASE_URL) || window.location.origin;
          if (typeof fetch === 'function') {
            fetch(`${apiBase}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              keepalive: true
            }).catch(apiErr => {
              console.warn('Backend logout API notice (safe fallback):', apiErr.message || apiErr);
            });
          }
        } catch (dispatchErr) {
          console.warn('Backend logout dispatch notice:', dispatchErr);
        }
      }

      // 3. Clean up client session state immediately (Wipe auth keys, preserve mock DB)
      try {
        sessionStorage.setItem('bookingtour_logged_out', 'true');
        localStorage.setItem('bookingtour_logged_out', 'true');

        localStorage.removeItem('bookingtour_token');
        localStorage.removeItem('bookingtour_user');
        localStorage.removeItem('bookingtour_role');
        localStorage.removeItem('bookingtour_api_booking_draft');
        sessionStorage.removeItem('bookingtour_token');
        sessionStorage.removeItem('bookingtour_user');
        sessionStorage.removeItem('bookingtour_role');
        sessionStorage.removeItem('booking_passengers_draft');
        sessionStorage.removeItem('bookingtour_api_booking_draft');

        if (window.BookingTourDB && typeof window.BookingTourDB.setCurrentUser === 'function') {
          window.BookingTourDB.setCurrentUser(null);
        }
      } catch (storageErr) {
        console.warn('Storage cleanup notice:', storageErr);
      }

      // 4. Preserve bookingtour_mock_db (Mock Database is untouched)

      // 5. Force immediate navigation to login page (called exactly once)
      window.location.replace('/client/auth/login.html');
    } catch (err) {
      console.error('Logout error:', err);
      window.location.replace('/client/auth/login.html');
    }
  }

  function isLogoutElement(target) {
    if (!target) return false;
    if (typeof target.closest !== 'function') {
      target = target.parentElement;
      if (!target || typeof target.closest !== 'function') return false;
    }

    // Direct attribute / id matches on target or closest ancestor
    const trigger = target.closest(
      '[data-nav-logout], #sidebarSignOutBtn, [data-logout], #adminLogoutBtn, [id*="logout" i], [class*="logout" i], a[href*="logout" i]'
    );
    if (trigger) return true;

    // Check clickable container (button or a)
    const btn = target.closest('button, a');
    if (btn) {
      const text = (btn.textContent || '').trim().toLowerCase();
      const hasLogoutIcon = !!btn.querySelector('[data-icon="logout"]') || 
                            (btn.classList && btn.classList.contains('material-symbols-outlined') && text.includes('logout'));
      if (text.includes('sign out') || text.includes('đăng xuất') || (hasLogoutIcon && (text.includes('out') || text.includes('xuất')))) {
        return true;
      }
    }
    return false;
  }

  // SINGLE UNIFIED EVENT DELEGATION LISTENER:
  // Intercepts click on ANY logout trigger across the entire document during capture phase.
  // Preempts default actions (e.g. href="#"), stops bubbling, and dispatches single logout flow.
  document.addEventListener('click', (e) => {
    if (isLogoutElement(e.target)) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      logout();
    }
  }, true);

  // Intercept form submissions containing a logout trigger
  document.addEventListener('submit', (e) => {
    const submitter = e.submitter || document.activeElement;
    if (isLogoutElement(submitter) || isLogoutElement(e.target)) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      logout();
    }
  }, true);

  function updateNav() {
    if (!checkProtection()) return;

    const token = getStoredToken();
    const user = getStoredUser();

    const userInfoEls = document.querySelectorAll('[data-nav-auth="user"]');
    const guestInfoEls = document.querySelectorAll('[data-nav-auth="guest"]');
    const nameEls = document.querySelectorAll('[data-nav-user-name]');
    const avatarInitialsEls = document.querySelectorAll('[data-nav-user-initials]');

    if (token) {
      const displayName = user?.fullName || user?.full_name || user?.name || user?.username || user?.email || 'Quý khách';
      const initials = (displayName.charAt(0) || 'U').toUpperCase();

      userInfoEls.forEach(el => {
        el.classList.remove('hidden');
        if (!el.classList.contains('flex')) el.classList.add('flex');
      });
      guestInfoEls.forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
      });
      nameEls.forEach(el => {
        el.textContent = displayName;
      });
      avatarInitialsEls.forEach(el => {
        el.textContent = initials;
      });
    } else {
      userInfoEls.forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
      });
      guestInfoEls.forEach(el => {
        el.classList.remove('hidden');
        if (!el.classList.contains('flex')) el.classList.add('flex');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNav);
  } else {
    updateNav();
  }

  // Also listen for pageshow event (triggered when user navigates using Back/Forward cache)
  window.addEventListener('pageshow', () => {
    checkProtection();
  });

  // Export unified single logout handler and auth utilities
  window.BookingTourNavAuth = { updateNav, logout, checkProtection, isAuthenticated };
  window.bookingTourLogout = logout;
  window.logout = logout;
  window.handleLogout = logout;
})();
