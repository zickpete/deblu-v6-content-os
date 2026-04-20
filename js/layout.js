/* ================================================
   V.6 Content OS — Global Layout Components
   ================================================ */

class V6Header extends HTMLElement {
  connectedCallback() {
    const layer = this.getAttribute('active-layer') || '0';
    
    // Breadcrumb logic
    let breadcrumbHTML = '';
    if (layer === '0') {
      breadcrumbHTML = `<span class="crumb-active" data-i18n="header.crumb.brain">Layer 0: Brain</span>`;
    } else if (layer === '1') {
      breadcrumbHTML = `
        <a href="layer0-brain.html" style="color:#475569;text-decoration:none;" data-i18n="header.crumb.brain">Layer 0: Brain</a>
        <span class="crumb-sep">›</span>
        <span class="crumb-active" data-i18n="header.crumb.calendar">Layer 1: Calendar</span>
      `;
    } else if (layer === '2') {
      breadcrumbHTML = `
        <a href="layer0-brain.html" style="color:#475569;text-decoration:none;" data-i18n="header.crumb.brain">Layer 0: Brain</a>
        <span class="crumb-sep">›</span>
        <a href="layer1-calendar.html" style="color:#475569;text-decoration:none;" data-i18n="header.crumb.calendar">Layer 1: Calendar</a>
        <span class="crumb-sep">›</span>
        <span class="crumb-active" data-i18n="header.crumb.factory">Layer 2: Factory</span>
      `;
    }

    this.innerHTML = `
      <header class="app-header" role="banner">
        <a href="index.html" class="app-logo" aria-label="V.6 Content OS Home">
          <div class="app-logo-icon" aria-hidden="true">📅</div>
          <span class="app-logo-text">Content OS</span>
          <span class="app-logo-version">V.6</span>
        </a>

        <div class="header-breadcrumb" aria-label="Breadcrumb">
          <span>Deblu</span>
          <span class="crumb-sep">›</span>
          ${breadcrumbHTML}
        </div>

        <nav class="layer-nav" aria-label="Layer Navigation">
          <a href="layer0-brain.html" class="layer-pill ${layer === '0' ? 'active' : ''}" data-i18n="header.layer0">🧠 Layer 0</a>
          <a href="layer1-calendar.html" class="layer-pill ${layer === '1' ? 'active' : ''}" data-i18n="header.layer1">📅 Layer 1</a>
          <a href="layer2-cards.html" class="layer-pill ${layer === '2' ? 'active' : ''}" data-i18n="header.layer2">🃏 Layer 2</a>
        </nav>

          <div class="header-actions">
          <!-- Language Toggle -->
          <div class="lang-toggle" id="langToggle" role="radiogroup" aria-label="Language">
            <button class="lang-opt lang-th active" onclick="V6i18n.toggle()" aria-label="Thai">TH</button>
            <button class="lang-opt lang-en" onclick="V6i18n.toggle()" aria-label="English">EN</button>
          </div>
          <button class="theme-toggle-btn" id="themeToggleBtn" aria-label="Toggle Theme" title="Toggle Day/Night Mode">
            ☀️
          </button>
          <div class="ai-status-badge mock" id="aiBadge" role="status" aria-live="polite">
            <span class="ai-dot mock" id="aiDot" aria-hidden="true"></span>
            <span id="aiLabel" data-i18n="common.demo">COMMON.DEMO</span>
          </div>
          <button class="btn btn-secondary" id="dbBtn" style="font-size:12px;padding:8px 16px;" title="Product Database">
            📦 ราคาสินค้า
          </button>
          <button class="btn btn-secondary" id="apiKeyBtn" style="font-size:12px;padding:8px 16px;" title="Configure AI API Key" data-i18n="header.settings">
            ⚙️ ตั้งค่า (Settings)
          </button>
          <!-- Firebase Auth Button -->
          <button class="auth-btn" id="authBtn" title="Sign In with Google">
            <span class="auth-btn-icon" id="authIcon">🔑</span>
            <span class="auth-btn-label" id="authLabel" data-i18n="header.signin">Sign In</span>
          </button>
        </div>
      </header>
    `;
    
    // Bind Theme Toggle
    setTimeout(() => {
      const btn = this.querySelector('#themeToggleBtn');
      if (btn) {
        const currentTheme = localStorage.getItem('v6_theme') || 'dark';
        btn.textContent = currentTheme === 'light' ? '🌙' : '☀️';

        btn.addEventListener('click', () => {
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          const newTheme = isLight ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem('v6_theme', newTheme);
          btn.textContent = newTheme === 'light' ? '🌙' : '☀️';
        });
      }

      // Set initial lang toggle state
      if (typeof V6i18n !== 'undefined') {
        const lang = V6i18n.getLang();
        const thBtn = this.querySelector('.lang-th');
        const enBtn = this.querySelector('.lang-en');
        if (thBtn) thBtn.classList.toggle('active', lang === 'th');
        if (enBtn) enBtn.classList.toggle('active', lang === 'en');
        // Apply translations to header elements
        V6i18n.applyLang();
      }

      // Listen for language changes to update toggle state
      window.addEventListener('v6:langChange', (e) => {
        const lang = e.detail.lang;
        const thBtn = document.querySelector('.lang-th');
        const enBtn = document.querySelector('.lang-en');
        if (thBtn) thBtn.classList.toggle('active', lang === 'th');
        if (enBtn) enBtn.classList.toggle('active', lang === 'en');
      });

      // Helper: Get clean model display name
      function getCleanModelName(modelId) {
        if (!modelId) return 'No Model';
        // Remove 'models/' prefix if present
        let clean = modelId.replace('models/', '');
        // Convert gemini model IDs to friendly names
        const modelMap = {
          'gemini-1.5-pro': 'Gemini 1.5 Pro',
          'gemini-1.5-flash': 'Gemini 1.5 Flash',
          'gemini-2.0-flash': 'Gemini 2.0 Flash',
          'gemini-2.0-pro': 'Gemini 2.0 Pro',
          'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
          'gemini-1.0-pro': 'Gemini 1.0 Pro',
          'gemini-1.0-ultra': 'Gemini 1.0 Ultra'
        };
        return modelMap[clean] || clean;
      }

      // Unified Settings Change Listener for Badge
      const updateHeaderBadge = () => {
        const badge = this.querySelector('#aiBadge');
        const dot   = this.querySelector('#aiDot');
        const label = this.querySelector('#aiLabel');
        if (!badge) return;

        const hasKey = !!window.V6Store.getApiKey();
        const map = window.V6Store.getLayerModels();
        const activeLayer = this.getAttribute('active-layer') || '0';
        const modelId = map['layer' + activeLayer] || '';
        const cleanModelName = getCleanModelName(modelId);

        if (hasKey) {
          badge.className = 'ai-status-badge live';
          dot.className   = 'ai-dot live';
          const lang = V6i18n.getLang();
          const liveText = lang === 'th' ? 'ระดับโปร' : 'PRO';
          // Format: "ระดับโปร • Gemini 1.5 Pro" or "PRO • Gemini 1.5 Flash"
          label.textContent = `${liveText} • ${cleanModelName}`;
          label.removeAttribute('data-i18n');
          badge.title = `Layer ${activeLayer}: ${modelId}`;
        } else {
          badge.className = 'ai-status-badge mock';
          dot.className   = 'ai-dot mock';
          const demoText = V6i18n.getLang() === 'th' ? 'โหมดทดลอง' : 'DEMO';
          label.textContent = demoText;
          label.setAttribute('data-i18n', 'common.demo');
          badge.title = 'Demo Mode - No API Key';
        }
      };

      // Listen for custom settings update event
      window.addEventListener('v6:settingsUpdated', updateHeaderBadge);
      
      // Cross-tab sync: Listen for storage changes from other tabs
      window.addEventListener('storage', (e) => {
        if (e.key === 'v6_layer_models' || e.key === 'v6_api_key') {
          console.log('[V6Header] Cross-tab sync: Settings changed in another tab');
          updateHeaderBadge();
        }
      });
      
      updateHeaderBadge(); // Initial state

      // ─── Firebase Auth Button Logic ───
      const authBtn   = this.querySelector('#authBtn');
      const authIcon  = this.querySelector('#authIcon');
      const authLabel = this.querySelector('#authLabel');

      const updateAuthUI = (user) => {
        if (!authBtn) return;
        if (user) {
          // Signed in → show avatar + name
          const photoURL = user.photoURL;
          const name = user.displayName || user.email || 'User';
          if (photoURL) {
            authIcon.innerHTML = `<img src="${photoURL}" alt="" style="width:20px;height:20px;border-radius:50%;">`;
          } else {
            authIcon.textContent = '👤';
          }
          authLabel.textContent = name.split(' ')[0]; // First name only
          authLabel.removeAttribute('data-i18n');
          authBtn.classList.add('signed-in');
          authBtn.title = `Signed in as ${user.email} — Click to sign out`;
        } else {
          // Not signed in
          authIcon.textContent = '🔑';
          const lang = typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th';
          authLabel.textContent = lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In';
          authLabel.setAttribute('data-i18n', 'header.signin');
          authBtn.classList.remove('signed-in');
          authBtn.title = 'Sign in with Google to sync across devices';
        }
      };

      if (authBtn) {
        authBtn.addEventListener('click', async () => {
          if (!window.V6Firebase) return;
          const user = V6Firebase.getUser();
          if (user) {
            // Already signed in → confirm sign out
            const lang = typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th';
            const msg = lang === 'th' ? 'ต้องการออกจากระบบหรือไม่?' : 'Sign out?';
            if (confirm(msg)) {
              await V6Firebase.signOut();
            }
          } else {
            // Sign in
            try {
              await V6Firebase.signIn();
            } catch (err) {
              console.error('[Auth] Sign-in failed:', err);
            }
          }
        });
      }

      // Listen for auth state changes
      window.addEventListener('v6:authChanged', (e) => {
        updateAuthUI(e.detail.user);
      });

      // Set initial auth state
      if (window.V6Firebase) {
        updateAuthUI(V6Firebase.getUser());
      }

    }, 0);
  }
}
customElements.define('v6-header', V6Header);

// Auto-apply theme immediately to avoid flash
(function() {
  const savedTheme = localStorage.getItem('v6_theme');
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

const AI_MODAL_HTML = `
  <!-- ═══ API KEY MODAL ═══ -->
  <div id="modalOverlay" role="presentation" aria-hidden="true"></div>
  <div id="apiKeyModal" role="dialog" aria-modal="true" aria-labelledby="apiModalTitle">
    <div class="modal-title" id="apiModalTitle">
      <span data-i18n="modal.ai.title">⚙️ ตั้งค่า AI</span>
      <button class="modal-close" onclick="V6Layer2.closeSettings()" aria-label="Close settings">✕</button>
    </div>

    <div class="form-group">
      <label class="form-label" data-i18n="modal.ai.engine.title">Gemini AI Engine</label>
      
      <div class="layer-mapping-group">
        
        <!-- Layer 0 Mapping -->
        <div class="layer-mapping-item">
          <label>🧠 Layer 0: The Brain (Strategy)</label>
          <button type="button" class="layer-model-trigger" data-layer="layer0">Placeholder Model</button>
          <div class="model-dropdown-popover"></div>
        </div>
        
        <!-- Deep Thinking mapped to Layer 0 -->
        <div class="form-group deep-thinking-group" style="margin-top:0;">
          <label class="toggle-switch-label">
            <div class="toggle-text">
               <span class="toggle-title" data-i18n="modal.ai.deep.title">🧠 Deep Thinking Mode</span>
               <span class="toggle-desc" data-i18n="modal.ai.deep.desc">Uses Chain-of-Thought for complex strategies (increases generation time).</span>
            </div>
            <div class="toggle-switch">
               <input type="checkbox" id="deepThinkingToggle">
               <span class="slider"></span>
            </div>
          </label>
        </div>

        <!-- Layer 1 Mapping -->
        <div class="layer-mapping-item">
          <label>📅 Layer 1: The Engine (Calendar)</label>
          <button type="button" class="layer-model-trigger" data-layer="layer1">Placeholder Model</button>
          <div class="model-dropdown-popover"></div>
        </div>

        <!-- Layer 2 Mapping -->
        <div class="layer-mapping-item">
          <label>🏭 Layer 2: The Factory (Editor Tools)</label>
          <button type="button" class="layer-model-trigger" data-layer="layer2">Placeholder Model</button>
          <div class="model-dropdown-popover"></div>
        </div>

      </div>

    <div class="form-group">
      <label class="form-label" for="apiKeyInput" data-i18n="modal.ai.key">API Key</label>
      <input
        class="form-input"
        type="password"
        id="apiKeyInput"
        placeholder="วาง API Key ที่นี่..."
        data-i18n-placeholder="modal.ai.key.placeholder"
        autocomplete="off"
        aria-label="API Key"
      />
      <div style="margin-top:6px;font-size:11px;color:#334155;line-height:1.6;">
        <span data-i18n="modal.ai.key.hint">🔒 เก็บใน Browser — ไม่ส่งไปไหนนอกจาก AI API</span><br/>
        <span data-i18n="modal.ai.key.noapihint">ไม่มี API Key? แอปจะใช้ Demo Mode แทน</span>
      </div>

      <!-- Test API Button -->
      <button type="button" class="api-tester-btn" id="apiTesterBtn" data-i18n="modal.ai.test">
        <div class="spinner"></div>
        🔌 Test API Connection & Model
      </button>
      <div id="apiTesterFeedback" class="api-tester-feedback"></div>
    </div>

    <div style="display:flex;gap:10px;margin-top:8px;">
      <button class="btn btn-primary" id="saveApiKeyBtn" style="flex:1;" data-i18n="modal.ai.save">💾 บันทึก Key</button>
      <button class="btn btn-secondary" id="clearApiKeyBtn" data-i18n="modal.ai.clear">🗑 ลบ</button>
    </div>

  </div>
`;

const DB_MODAL_HTML = `
  <!-- ═══ PRODUCT DB MODAL ═══ -->
  <div id="dbModal" role="dialog" aria-modal="true" aria-labelledby="dbModalTitle" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:90%; max-width:600px; background:var(--surface); padding:24px; border-radius:16px; border:1px solid rgba(255,255,255,0.1); box-shadow:0 24px 48px rgba(0,0,0,0.5); z-index:1001;">
    <div class="modal-title" id="dbModalTitle">
      <span data-i18n="modal.db.title">📦 ฐานข้อมูลสินค้า / Price List</span>
      <button class="modal-close" id="closeDbModalBtn" aria-label="Close database">✕</button>
    </div>

    <div class="form-group" style="margin-top:16px;">
      <label class="form-label" for="productRefInput">Price List (Product Reference)</label>
      <textarea
        class="form-input"
        id="productRefInput"
        rows="8"
        placeholder="วางข้อมูลสินค้า รหัสรุ่น ราคา ที่นี่..."
        style="font-size:12px;line-height:1.6;resize:vertical;min-height:150px;font-family:monospace;"
      ></textarea>
      
      <div style="display:flex;gap:10px;margin-top:12px;align-items:center;">
        <label for="csvUploadInput" class="btn btn-secondary" style="cursor:pointer;flex:1;text-align:center;">
          📥 อัพโหลดไฟล์ CSV (Excel)
        </label>
        <input type="file" id="csvUploadInput" accept=".csv" style="display:none;">
        <button class="btn btn-primary" id="saveDbBtn" style="flex:1;">💾 บันทึกข้อมูล</button>
      </div>

      <div style="margin-top:12px;font-size:11px;color:#64748b;line-height:1.6;">
        📌 <b>AI จะดึงราคาจากหน้านี้ไปใช้เสมอ</b><br/>
        - อัพโหลดไฟล์ "ฟอร์มนัมเบอร์-ราคารองเท้า" แบบ CSV ระบบจะอ่านราคาป้ายและดึงมาให้โดยอัตโนมัติ<br/>
        - หากลบข้อมูลทิ้ง ระบบจะดึงข้อมูลสำรอง (Default) มาใช้แทน
      </div>
    </div>
  </div>
`;

const POPOVER_OPTIONS_HTML = `<div class="model-selector-container"><div class="model-cat-header">🔌 Model Discovery Required</div><div style="padding:12px;font-size:12px;text-align:center;color:#64748b;">Please click '<b>Test API Connection</b>' to scan for available Gemini models.</div></div>`;

// Inject into layout.js
document.addEventListener('DOMContentLoaded', () => {
   if (!document.getElementById('apiKeyModal')) {
       document.body.insertAdjacentHTML('beforeend', AI_MODAL_HTML);
       document.body.insertAdjacentHTML('beforeend', DB_MODAL_HTML);
       document.querySelectorAll('.model-dropdown-popover').forEach(el => {
           el.innerHTML = POPOVER_OPTIONS_HTML;
       });
   }
   setTimeout(initGlobalApiKeyModal, 100);
});

function initGlobalApiKeyModal() {
    const btn        = document.getElementById('apiKeyBtn');
    const modal      = document.getElementById('apiKeyModal');
    const overlay    = document.getElementById('modalOverlay');
    const saveBtn    = document.getElementById('saveApiKeyBtn');
    const clearBtn   = document.getElementById('clearApiKeyBtn');
    const keyInput   = document.getElementById('apiKeyInput');
    const testBtn    = document.getElementById('apiTesterBtn');
    const testFbk    = document.getElementById('apiTesterFeedback');
    
    // DB Modal Elements
    const dbBtn      = document.getElementById('dbBtn');
    const dbModal    = document.getElementById('dbModal');
    const closeDbBtn = document.getElementById('closeDbModalBtn');
    const productRef = document.getElementById('productRefInput');
    const saveDbBtn  = document.getElementById('saveDbBtn');
    const csvInput   = document.getElementById('csvUploadInput');

    // Layer Mapping UI
    const triggers   = document.querySelectorAll('.layer-model-trigger');
    const deepToggle = document.getElementById('deepThinkingToggle');

    let activeTrigger = null;

    if (!btn || !modal) return;

    btn.addEventListener('click', openModal);
    if(overlay) overlay.addEventListener('click', closeAll);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

    // DB Modal Logic
    if (dbBtn) {
      dbBtn.addEventListener('click', () => {
        if (productRef) productRef.value = window.V6Store.getProductReference();
        if (dbModal) dbModal.style.display = 'block';
        if (overlay) overlay.classList.add('open');
        document.body.classList.add('modal-active');
      });
    }

    if (closeDbBtn) {
      closeDbBtn.addEventListener('click', closeAll);
    }

    if (saveDbBtn) {
      saveDbBtn.addEventListener('click', () => {
        if (productRef) {
          window.V6Store.saveProductReference(productRef.value.trim());
          showToast('✅ Product Database saved!', 'success');
        }
        closeAll();
      });
    }

    if (csvInput) {
      csvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
          const csvText = evt.target.result;
          const parsedMarkdown = window.V6Store.parseProductCSV(csvText);
          if (productRef) {
            productRef.value = parsedMarkdown;
            window.V6Store.saveProductReference(parsedMarkdown);
            showToast('✅ CSV Parsed successfully', 'success');
          }
        };
        reader.readAsText(file);
      });
    }

    // Expose closeAll for layout use
    window.V6Layer2 = window.V6Layer2 || {};
    window.V6Layer2.closeSettings = closeAll;

    function getModelNameDisplay(val) {
      if (!val) return 'Select Model';
      const el = document.querySelector('.model-dropdown-popover input[value="' + val + '"]');
      if (el) {
         const nameEl = el.closest('.model-option')?.querySelector('.model-opt-name');
         return nameEl ? nameEl.innerText : val.replace('models/', '');
      }
      return val.replace('models/', '');
    }

    function openModal() {
      if(keyInput) keyInput.value = window.V6Store.getApiKey();
      
      const map = window.V6Store.getLayerModels();
      triggers.forEach(tr => {
        const layerKey = tr.getAttribute('data-layer');
        if (map[layerKey]) {
          tr.setAttribute('data-model', map[layerKey]);
          tr.innerText = getModelNameDisplay(map[layerKey]);
        }
      });
      
      if (deepToggle) deepToggle.checked = window.V6Store.getDeepThinkingMode();

      modal.classList.add('open');
      if(overlay) overlay.classList.add('open');
      document.body.classList.add('modal-active'); // Add background blur
      if(keyInput) setTimeout(() => keyInput.focus(), 100);
    }

    function closeAll() {
      if(modal) modal.classList.remove('open');
      if(overlay) overlay.classList.remove('open');
      if(dbModal) dbModal.style.display = 'none';
      document.body.classList.remove('modal-active'); // Remove background blur
      
      const detailModal = document.getElementById('cardDetailModal');
      if(detailModal) detailModal.classList.remove('open');
      closePopovers();
    }

    // --- Popover Logic ---
    function closePopovers() {
      document.querySelectorAll('.model-dropdown-popover').forEach(p => p.classList.remove('open'));
      triggers.forEach(t => t.classList.remove('active'));
      activeTrigger = null;
    }

    function bindTriggers() {
        document.querySelectorAll('.layer-model-trigger').forEach(tr => {
            tr.onclick = (e) => {
                const popover = tr.nextElementSibling;
                if (!popover) return;
                e.stopPropagation();
                
                if (activeTrigger === tr) {
                  closePopovers();
                  return;
                }
                closePopovers();
                activeTrigger = tr;
                tr.classList.add('active');
                popover.classList.add('open');

                const currentModel = tr.getAttribute('data-model');
                popover.querySelectorAll('input[type="radio"]').forEach(r => {
                    r.checked = (r.value === currentModel);
                    r.onchange = () => {
                       if (r.checked) {
                          tr.setAttribute('data-model', r.value);
                          tr.innerText = r.closest('.model-option').querySelector('.model-opt-name').innerText;
                          setTimeout(closePopovers, 200);
                       }
                    };
                });
            };
        });
    }
    bindTriggers();

    document.addEventListener('click', e => {
      let clickedInside = false;
      document.querySelectorAll('.model-dropdown-popover.open').forEach(p => {
          if (p.contains(e.target)) clickedInside = true;
      });
      if (!clickedInside && activeTrigger) {
        closePopovers();
      }
    });

    // --- Dynamic Audit Logic ---
    async function auditModels(apiKey) {
      console.log('[AI Audit] Starting Comprehensive Model Scan...');
      const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey;
      
      /* --- Fetch Wrapper with Diagnostics --- */
      async function safeFetch(url, options) {
        if (window.location.protocol === 'file:') {
            console.warn('[V6AI] Detected file:// origin. Ensure a local server (server.py) is running for API requests.');
        }
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const msg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(msg);
          }
          return response;
        } catch (err) {
          console.error('[V6AI] safeFetch failed:', err);
          const diagnostic = getDiagnosticError(err);
          if (diagnostic.isNetwork) {
            const error = new Error(diagnostic.message);
            error.isNetwork = true;
            error.checklist = diagnostic.checklist;
            throw error;
          }
          throw err;
        }
      }
      
      try {
        const res = await safeFetch(url);
        const data = await res.json();
        const allModels = data.models || [];
        
        const validModels = allModels.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        rebuildModelPopovers(validModels);
        return validModels;
      } catch (err) {
        throw err;
      }
    }

    function rebuildModelPopovers(models) {
      const groups = {
        ultra: { label: '🟢 Ultra-Light & Speed', sub: '(งานเบา เน้นความเร็ว)', items: [] },
        standard: { label: '🟡 Standard & Balanced', sub: '(งานเขียนทั่วไป)', items: [] },
        advanced: { label: '🔴 Advanced Reasoning', sub: '(งานวิเคราะห์ลึกซึ้ง)', items: [] },
        other: { label: '⚪ Other Models', sub: '(รุ่นอื่นๆ)', items: [] }
      };

      models.forEach(m => {
        const id = m.name.replace('models/', '');
        const entry = { id: id, displayName: m.displayName || id };
        if (id.includes('flash-lite')) groups.ultra.items.push(entry);
        else if (id.includes('flash')) groups.standard.items.push(entry);
        else if (id.includes('pro')) groups.advanced.items.push(entry);
        else groups.other.items.push(entry);
      });

      triggers.forEach(tr => {
        const layerKey = tr.getAttribute('data-layer');
        const popover = tr.nextElementSibling;
        if (!popover || !popover.classList.contains('model-dropdown-popover')) return;

        let html = '<div class="model-selector-container">';
        for (const key in groups) {
          const group = groups[key];
          if (group.items.length === 0) continue;
          html += `<div class="model-cat-header">${group.label} <span class="model-cat-sub">${group.sub}</span></div>`;
          group.items.forEach(item => {
             const badgeClass = key === 'ultra' ? 'badge-nano' : (key === 'standard' ? 'badge-fast' : 'badge-deep');
             const badgeText = key === 'ultra' ? 'Economy' : (key === 'standard' ? 'Value' : 'Premium');
             html += `
              <label class="model-option">
                <input type="radio" name="gemini_model_${layerKey}" value="${item.id}">
                <div class="model-opt-content">
                  <div class="model-opt-top">
                      <span class="model-opt-name">${item.displayName}</span>
                      <span class="model-badge ${badgeClass}">${badgeText}</span>
                  </div>
                  <div class="model-opt-desc" style="font-size:10px; opacity:0.6;">${item.id}</div>
                </div>
              </label>`;
          });
        }
        html += '</div>';
        popover.innerHTML = html;
      });
    }

    // --- Diagnostic Test Logic ---
    if(testBtn) {
      testBtn.addEventListener('click', async () => {
        const key = keyInput.value.trim();
        if(!key) {
          showFeedback('error', '❌ Please enter an API Key first.');
          return;
        }

        testBtn.classList.add('loading');
        testBtn.disabled = true;
        if(saveBtn) saveBtn.disabled = true;
        hideFeedback();
        
        try {
          const validModels = await auditModels(key);
          if (validModels.length === 0) throw new Error('No compatible models found.');

          const testModel = validModels[0].name;
          const url = 'https://generativelanguage.googleapis.com/v1beta/' + testModel + ':generateContent?key=' + key;
          const body = {
            contents: [{ role: 'user', parts: [{ text: "Respond with: OK🚀" }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          const data = await res.json();
          if (res.ok) {
            const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            showFeedback('success', `✅ API OK. Found ${validModels.length} models. Test: "${txt.trim()}"`);
          } else {
             showFeedback('error', `❌ API Error: ${data?.error?.message || 'Unknown'}`);
          }
        } catch(err) {
            let msg = `❌ Error: ${err.message}`;
            if (err.isNetwork && err.checklist) {
              msg = `<div style="text-align:left; line-height:1.5;">
                <b style="color:#ef4444;">${err.message}</b><br/>
                <span style="font-size:10px; opacity:0.8; display:block; margin-top:4px;">Troubleshooting:</span>
                <ul style="margin:4px 0 0 16px; padding:0; font-size:10px; opacity:0.8;">
                  ${err.checklist.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>`;
            }
            showFeedback('error', msg);
        } finally {
             testBtn.classList.remove('loading');
             testBtn.disabled = false;
             if(saveBtn) saveBtn.disabled = false;
        }
      });
    }

    function showFeedback(type, text) {
      if(!testFbk) return;
      testFbk.className = 'api-tester-feedback ' + type;
      if (text.includes('<ul')) {
        testFbk.innerHTML = text;
      } else {
        testFbk.innerText = text;
      }
      testFbk.style.display = 'block';
    }
    function hideFeedback() {
      if(!testFbk) return;
      testFbk.style.display = 'none';
    }

    if(saveBtn) {
      saveBtn.addEventListener('click', () => {
        const key = keyInput.value.trim();
        const newMap = {};
        triggers.forEach(tr => {
           const l = tr.getAttribute('data-layer');
           const m = tr.getAttribute('data-model');
           if (l && m) newMap[l] = m;
        });

        // 1. Save Data
        window.V6Store.saveLayerModels(newMap);
        if (deepToggle) window.V6Store.saveDeepThinkingMode(deepToggle.checked);
        
        if (key) {
          window.V6Store.saveApiKey(key);
          showToast('✅ AI Settings saved!', 'success');
        } else {
          window.V6Store.clearApiKey();
          showToast('✅ Demo Mode active', 'info');
        }

        // 2. Broadcast to all layers (Tabs)
        if(window.V6Sync) {
            window.V6Sync.broadcast();
        } else {
            window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
        }

        // 3. Close & Reset UI
        closeAll();
      });
    }
    
     if(clearBtn) {
        clearBtn.addEventListener('click', () => {
           window.V6Store.clearApiKey();
           if(keyInput) keyInput.value = '';
           showToast('🗑️ API Key cleared', 'info');
           if(window.V6Sync) window.V6Sync.broadcast();
           closeAll();
        });
     }

    function showToast(msg, type) {
       const t = document.getElementById('toast');
       if(t) {
           t.innerText = msg;
           t.className = 'toast show ' + (type||'');
           setTimeout(() => t.classList.remove('show'), 3000);
       }
    }

    // --- REFINEMENT: Cross-Tab Modal Sync ---
    // Update modal inputs if settings changed in another tab
    window.addEventListener('v6:settingsUpdated', () => {
       if (keyInput) keyInput.value = window.V6Store.getApiKey();
       const map = window.V6Store.getLayerModels();
       triggers.forEach(tr => {
         const layerKey = tr.getAttribute('data-layer');
         if (map[layerKey]) {
           tr.setAttribute('data-model', map[layerKey]);
           tr.innerText = getModelNameDisplay(map[layerKey]);
         }
       });
       if (deepToggle) deepToggle.checked = window.V6Store.getDeepThinkingMode();
       console.log('[Layout] Modal state synced with remote changes.');
    });
}
