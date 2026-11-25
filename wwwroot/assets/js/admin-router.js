/**
 * Persistent Admin Layout Router for BookingTour_DotNet Admin Portal
 * Keeps Sidebar, Header, and User Profile persistent in DOM
 * while seamlessly updating the Content Area across all 8 Admin modules.
 * Includes URL Normalization (prevents path nesting like /admin/tours/categories/index.html),
 * AbortController for race-condition prevention, guaranteed Header Profile & Role display,
 * clean error states, and reliable query parameter preservation.
 */
(() => {
  window.__BOOKINGTOUR_ROUTER_HANDLED__ = true;

  let currentNavId = 0;
  let activeAbortController = null;

  // Helper to dynamically load missing scripts safely
  function loadScript(src) {
    return new Promise((resolve) => {
      const filename = src.split('?')[0].split('/').pop();
      const existing = document.querySelector(`script[src*="${filename}"]`);
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src.startsWith('/') ? src : ('/' + src.replace(/^(\.\.\/)+/, ''));
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.body.appendChild(s);
    });
  }

  // Determine active module key from pathname
  function getModuleKey(path) {
    const p = (path || '').toLowerCase();
    if (p.includes('/tours/')) return 'tours';
    if (p.includes('/categories/')) return 'categories';
    if (p.includes('/departures/')) return 'departures';
    if (p.includes('/locations/')) return 'locations';
    if (p.includes('/customers/')) return 'customers';
    if (p.includes('/transactions/')) return 'transactions';
    if (p.includes('/employees/')) return 'employees';
    return 'dashboard';
  }

  // Normalize any admin URL to avoid incorrect nesting like /admin/tours/categories/index.html
  function normalizeAdminUrl(rawHref) {
    if (!rawHref || rawHref === '#' || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      return null;
    }

    try {
      let href = rawHref.trim();
      let searchAndHash = '';

      // Separate query string and hash
      const qIndex = href.indexOf('?');
      const hIndex = href.indexOf('#');
      let splitIndex = -1;
      if (qIndex !== -1 && hIndex !== -1) splitIndex = Math.min(qIndex, hIndex);
      else if (qIndex !== -1) splitIndex = qIndex;
      else if (hIndex !== -1) splitIndex = hIndex;

      if (splitIndex !== -1) {
        searchAndHash = href.substring(splitIndex);
        href = href.substring(0, splitIndex);
      }

      // If full absolute URL
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const parsed = new URL(href);
        if (parsed.origin !== window.location.origin) return null;
        href = parsed.pathname;
        if (!searchAndHash) searchAndHash = parsed.search + parsed.hash;
      }

      // Known top-level modules
      const topModules = [
        'dashboard.html',
        'tours/',
        'categories/',
        'departures/',
        'locations/',
        'customers/',
        'transactions/',
        'employees/'
      ];

      // If path already starts with /admin/
      if (href.toLowerCase().startsWith('/admin/')) {
        let clean = href.substring(7); // strip '/admin/'
        // Prevent accidental nested admin paths like /admin/tours/categories/index.html
        for (const mod of topModules) {
          const modIdx = clean.toLowerCase().lastIndexOf(mod);
          if (modIdx > 0) {
            clean = clean.substring(modIdx);
            break;
          }
        }
        return new URL('/admin/' + clean + searchAndHash, window.location.origin).href;
      }

      // Clean relative prefixes (../, ./)
      let clean = href.replace(/^(\.\.\/)+/, '').replace(/^(\.\/)+/, '').replace(/^\/+/, '');

      // Check if clean matches or starts with any known top-level module
      for (const mod of topModules) {
        if (clean.toLowerCase().startsWith(mod) || clean.toLowerCase() === mod.replace('/', '')) {
          return new URL('/admin/' + clean + searchAndHash, window.location.origin).href;
        }
      }

      // If clean is a sub-page file (e.g. "assign_guide.html", "edit.html", "create.html", "show.html", "create_province.html")
      const currentModule = getModuleKey(window.location.pathname);
      if (currentModule && currentModule !== 'dashboard') {
        return new URL('/admin/' + currentModule + '/' + clean + searchAndHash, window.location.origin).href;
      }

      // Fallback relative to current location
      const fallbackUrl = new URL(rawHref, window.location.href);
      return fallbackUrl.href;
    } catch (_) {
      return null;
    }
  }

  // Update active style on Sidebar links
  function updateSidebarActive(path) {
    const activeModule = getModuleKey(path);
    const sidebar = document.querySelector('aside');
    if (!sidebar) return;

    const navLinks = sidebar.querySelectorAll('nav a');
    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      let linkModule = 'dashboard';
      if (href.includes('tours/')) linkModule = 'tours';
      else if (href.includes('categories/')) linkModule = 'categories';
      else if (href.includes('departures/')) linkModule = 'departures';
      else if (href.includes('locations/')) linkModule = 'locations';
      else if (href.includes('customers/')) linkModule = 'customers';
      else if (href.includes('transactions/')) linkModule = 'transactions';
      else if (href.includes('employees/')) linkModule = 'employees';
      else if (href.includes('dashboard')) linkModule = 'dashboard';

      if (linkModule === activeModule) {
        link.className = 'rounded-xl mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all font-semibold text-sm bg-blue-900 text-white shadow-sm';
      } else {
        link.className = 'rounded-xl mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all font-semibold text-sm text-slate-600 hover:bg-slate-100 hover:text-blue-900';
      }
    });
  }

  // Setup Dynamic Header with User Profile (Avatar, Full Name, Role)
  async function setupPersistentHeader() {
    let user = null;
    try {
      const raw = localStorage.getItem('bookingtour_user') || sessionStorage.getItem('bookingtour_user');
      if (raw) user = JSON.parse(raw);
    } catch (_) {}

    const header = document.querySelector('header');
    if (!header) return;

    let nameEl = document.getElementById('adminUserDisplayName') || header.querySelector('p.text-blue-900') || header.querySelector('p');
    let roleEl = document.getElementById('adminUserRole') || header.querySelector('span.text-slate-400') || header.querySelector('span.text-xs');
    let avatarEl = document.getElementById('adminUserAvatar') || header.querySelector('img');

    // Ensure element IDs are set
    if (nameEl && !nameEl.id) nameEl.id = 'adminUserDisplayName';
    if (avatarEl && !avatarEl.id) avatarEl.id = 'adminUserAvatar';

    // If role element does not exist in DOM, dynamically create and append it under nameEl
    if (!roleEl && nameEl && nameEl.parentElement) {
      roleEl = document.createElement('span');
      roleEl.id = 'adminUserRole';
      roleEl.className = 'text-xs text-slate-400 font-medium block';
      nameEl.parentElement.appendChild(roleEl);
    } else if (roleEl && !roleEl.id) {
      roleEl.id = 'adminUserRole';
    }

    function formatRoleDisplay(rawRole) {
      if (!rawRole) return 'Quản trị viên';
      const r = String(rawRole).trim().toLowerCase();
      if (r === 'admin' || r.includes('quản trị')) return 'Quản trị viên';
      if (r === 'sale' || r.includes('kinh doanh') || r.includes('sale')) return 'Nhân viên Sale';
      if (r === 'guide' || r.includes('hướng dẫn')) return 'Hướng dẫn viên';
      return rawRole;
    }

    function applyUserData(u) {
      if (!u) return;
      const displayName = u.fullName || u.full_name || u.name || u.username || 'Nguyễn Văn Thanh';
      const rawRole = u.roleName || u.role_name || u.role || 'Admin';
      const roleDisplayName = formatRoleDisplay(rawRole);

      if (nameEl) nameEl.textContent = displayName;
      if (roleEl) roleEl.textContent = roleDisplayName;
      if (avatarEl) {
        const avatarSrc = u.avatarUrl || u.avatar || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_admin_1e3a8a_80x80.png';
        avatarEl.src = avatarSrc;
        avatarEl.onerror = () => {
          avatarEl.src = 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_admin_1e3a8a_80x80.png';
        };
      }
    }

    // Apply cached user immediately
    if (user) {
      applyUserData(user);
    } else {
      applyUserData({
        fullName: 'Nguyễn Văn Thanh',
        roleName: 'Admin'
      });
    }

    // Attempt to refresh profile from /api/auth/me if token exists
    const token = localStorage.getItem('bookingtour_token') || sessionStorage.getItem('bookingtour_token');
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const json = await res.json();
          const meData = json.data || json;
          if (meData && (meData.fullName || meData.Username || meData.FullName)) {
            const preservedRole = meData.roleName || meData.RoleName || meData.role || user?.roleName || user?.role || 'Admin';
            user = {
              id: meData.id || meData.Id,
              username: meData.username || meData.Username,
              fullName: meData.fullName || meData.FullName,
              email: meData.email || meData.Email,
              phone: meData.phone || meData.Phone,
              role: preservedRole,
              roleName: preservedRole,
              avatarUrl: meData.avatarUrl || meData.avatar || user?.avatarUrl
            };
            localStorage.setItem('bookingtour_user', JSON.stringify(user));
            applyUserData(user);
          }
        }
      } catch (_) {}
    }

    // Setup Logout Handler
    function handleLogout(e) {
      if (e) e.preventDefault();
      sessionStorage.setItem('bookingtour_logged_out', 'true');
      localStorage.removeItem('bookingtour_token');
      localStorage.removeItem('bookingtour_user');
      localStorage.removeItem('bookingtour_role');
      sessionStorage.removeItem('bookingtour_token');
      sessionStorage.removeItem('bookingtour_user');
      sessionStorage.removeItem('bookingtour_role');

      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      window.location.href = '/login.html';
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) logoutBtn.onclick = handleLogout;

    document.querySelectorAll('button, a').forEach(el => {
      const text = el.textContent.trim().toLowerCase();
      if (text === 'đăng xuất' || text.includes('logout') || el.dataset.logout !== undefined) {
        el.onclick = handleLogout;
      }
    });
  }

  // Ensure Content Area Container exists
  function ensureContentArea() {
    let contentArea = document.getElementById('adminContentArea');
    if (contentArea) return contentArea;

    const main = document.querySelector('main');
    if (!main) return null;

    const header = main.querySelector('header');
    contentArea = document.createElement('div');
    contentArea.id = 'adminContentArea';
    contentArea.className = 'flex-1 w-full max-w-none transition-opacity duration-150';

    // Move all nodes after header into contentArea
    const nodesToMove = [];
    let passedHeader = !header;
    for (const child of Array.from(main.childNodes)) {
      if (!passedHeader) {
        if (child === header) passedHeader = true;
      } else {
        nodesToMove.push(child);
      }
    }

    for (const node of nodesToMove) {
      contentArea.appendChild(node);
    }

    main.appendChild(contentArea);
    return contentArea;
  }

  // Show / Hide Loading State
  function setLoadingState(isLoading) {
    const contentArea = ensureContentArea();
    if (!contentArea) return;
    if (isLoading) {
      contentArea.style.opacity = '0.5';
      contentArea.style.pointerEvents = 'none';
    } else {
      contentArea.style.opacity = '1';
      contentArea.style.pointerEvents = 'auto';
    }
  }

  // Execute module handler according to target path
  async function runModuleHandler(targetPath) {
    const p = (targetPath || (window.location.pathname + window.location.search)).toLowerCase();

    // Ensure core shared scripts are loaded
    if (!window.BookingTourApi) {
      await loadScript('/assets/js/api-client.js');
    }

    // Give DOM a microtick to settle
    await new Promise(r => setTimeout(r, 10));

    if (p.includes('/tours/index.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleToursIndex?.();
    } else if (p.includes('/tours/create.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleToursCreate?.();
    } else if (p.includes('/tours/edit.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleToursEdit?.();
    } else if (p.includes('/tours/show.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleToursShow?.();
    } else if (p.includes('/categories/index.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleCategoriesIndex?.();
    } else if (p.includes('/locations/index.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleLocationsIndex?.();
    } else if (p.includes('/locations/create_province.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleLocationsCreate?.();
    } else if (p.includes('/departures/index.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleDeparturesIndex?.();
    } else if (p.includes('/departures/create.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleDeparturesCreate?.();
    } else if (p.includes('/departures/edit.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleDeparturesEdit?.();
    } else if (p.includes('/departures/assign_guide.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleDeparturesAssignGuide?.();
    } else if (p.includes('/customers/index.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleCustomersIndex?.();
    } else if (p.includes('/customers/create.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleCustomersCreate?.();
    } else if (p.includes('/customers/edit.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleCustomersEdit?.();
    } else if (p.includes('/customers/show.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleCustomersShow?.();
    } else if (p.includes('/transactions/index.html')) {
      if (!window.BookingTourAdminPages) await loadScript('/assets/js/admin-pages.js?v=2.2.0');
      window.BookingTourAdminPages?.handleTransactionsIndex?.();
    } else if (p.includes('/employees')) {
      if (!window.Part2) await loadScript('/assets/js/part2-common.js');
      if (!window.Part2EmployeePages) await loadScript('/assets/js/employee-pages.js');
      window.Part2EmployeePages?.start?.();
    } else {
      // Default: Dashboard
      if (!window.BookingTourDashboard) {
        await loadScript('/assets/js/admin-dashboard.js');
      }
      if (window.BookingTourDashboard && typeof window.BookingTourDashboard.initDashboard === 'function') {
        window.BookingTourDashboard.initDashboard();
      } else if (window.BookingTourDashboard && typeof window.BookingTourDashboard.loadDashboardData === 'function') {
        window.BookingTourDashboard.loadDashboardData();
      }
    }

    if (typeof window.iconsFallback === 'function') {
      window.iconsFallback();
    }
  }

  // Navigate to Target URL seamlessly with Race Condition Protection
  async function navigateTo(targetUrl, pushState = true) {
    const navId = ++currentNavId;

    // Abort previous in-flight request if user switched menu quickly
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }

    const abortController = new AbortController();
    activeAbortController = abortController;

    // Normalize URL
    const normalizedTarget = normalizeAdminUrl(targetUrl) || targetUrl;
    const urlObj = new URL(normalizedTarget, window.location.origin);
    const targetPath = urlObj.pathname + urlObj.search;

    setLoadingState(true);

    try {
      // Clean up any stray modals or backdrop leftovers attached to body
      document.querySelectorAll('body > [id*="Modal"], body > [id*="modal"]').forEach(el => {
        if (el.parentElement === document.body) el.remove();
      });

      // Fetch fresh HTML template from server
      const resp = await fetch(urlObj.pathname, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: abortController.signal
      });

      // If a newer navigation happened while this fetch was in-flight, discard this one
      if (navId !== currentNavId) return;

      if (!resp.ok) {
        window.location.href = normalizedTarget;
        return;
      }
      const html = await resp.text();

      // Check again after reading text
      if (navId !== currentNavId) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Update Document Title
      if (doc.title) {
        document.title = doc.title;
      }

      // Extract new content
      const contentArea = ensureContentArea();
      if (!contentArea) {
        window.location.href = normalizedTarget;
        return;
      }

      // Check if the target page has #adminContentArea
      let newContentNodes = [];
      const incomingContentArea = doc.getElementById('adminContentArea');
      if (incomingContentArea) {
        newContentNodes = Array.from(incomingContentArea.childNodes);
      } else {
        const incomingMain = doc.querySelector('main');
        if (incomingMain) {
          const incomingHeader = incomingMain.querySelector('header');
          let passedHeader = !incomingHeader;
          for (const node of Array.from(incomingMain.childNodes)) {
            if (!passedHeader) {
              if (node === incomingHeader) passedHeader = true;
            } else {
              newContentNodes.push(node);
            }
          }
        }
      }

      // Also grab any top-level modal dialogs from doc body
      const incomingModals = doc.querySelectorAll('body > div.fixed, body > [id*="Modal"], body > [id*="modal"]');
      incomingModals.forEach(modal => {
        if (!newContentNodes.some(n => n.id === modal.id)) {
          newContentNodes.push(modal);
        }
      });

      // Clear existing content area
      contentArea.innerHTML = '';

      // Append cloned nodes
      const inlineScriptsToRun = [];
      for (const node of newContentNodes) {
        const imported = document.importNode(node, true);
        contentArea.appendChild(imported);

        // Collect inline scripts to execute
        if (imported.nodeName === 'SCRIPT' && !imported.src) {
          inlineScriptsToRun.push(imported.textContent);
        } else if (imported.querySelectorAll) {
          imported.querySelectorAll('script').forEach(s => {
            if (!s.src) inlineScriptsToRun.push(s.textContent);
          });
        }
      }

      // Execute inline scripts in global context
      for (const code of inlineScriptsToRun) {
        try {
          const s = document.createElement('script');
          s.textContent = code;
          document.body.appendChild(s);
          s.remove();
        } catch (_) {}
      }

      // Update URL in browser (preserving query parameters)
      if (pushState) {
        window.history.pushState({ path: targetPath }, '', normalizedTarget);
      }

      // Maintain persistent header profile & role
      await setupPersistentHeader();

      // Update Active Menu highlight in Sidebar
      updateSidebarActive(urlObj.pathname);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Run Module Logic
      await runModuleHandler(urlObj.pathname + urlObj.search);

    } catch (err) {
      if (err.name === 'AbortError') {
        // Navigation was cancelled in favor of a newer navigation - ignore cleanly
        return;
      }
      console.error('[AdminRouter] Navigation error:', err);
      const contentArea = ensureContentArea();
      if (contentArea) {
        contentArea.innerHTML = `
          <div class="p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
              <span class="material-symbols-outlined text-3xl">error</span>
            </div>
            <h3 class="text-xl font-bold text-slate-800">Không thể tải nội dung module</h3>
            <p class="text-slate-500 mt-2 max-w-md mx-auto text-sm">${err.message || 'Lỗi kết nối máy chủ.'}</p>
            <button onclick="window.location.reload()" class="mt-6 px-6 py-2.5 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition">Thử lại</button>
          </div>`;
      }
    } finally {
      if (navId === currentNavId) {
        setLoadingState(false);
        activeAbortController = null;
      }
    }
  }

  // Intercept navigation links
  function initLinkInterception() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      // Check modifiers
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      if (link.target && link.target !== '_self') {
        return;
      }

      // Normalize admin URL
      const finalUrl = normalizeAdminUrl(href);
      if (!finalUrl) return;

      const url = new URL(finalUrl);

      // Only handle same-origin admin paths
      if (url.origin !== window.location.origin) return;
      if (!url.pathname.toLowerCase().includes('/admin/')) return;

      // Intercept and navigate seamlessly!
      e.preventDefault();
      navigateTo(finalUrl, true);
    });

    // Handle Browser Back / Forward buttons
    window.addEventListener('popstate', () => {
      const finalUrl = normalizeAdminUrl(window.location.href) || window.location.href;
      navigateTo(finalUrl, false);
    });
  }

  // Initialize Router
  async function initRouter() {
    ensureContentArea();
    await setupPersistentHeader();
    updateSidebarActive(window.location.pathname);
    initLinkInterception();

    // Run module handler for current page
    await runModuleHandler(window.location.pathname + window.location.search);
  }

  // Expose to window
  window.BookingTourAdminRouter = {
    navigateTo,
    updateSidebarActive,
    setupPersistentHeader,
    runModuleHandler,
    initRouter,
    normalizeAdminUrl
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
  } else {
    initRouter();
  }
})();
