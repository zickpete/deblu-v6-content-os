/* ================================================
   V.6 Content OS — Layer 0 UI Orchestrator
   State management, rendering, event handling
   ================================================ */

window.V6Layer0 = (function () {

  /* ─── App State ─── */
  const state = {
    isLoading:       false,
    currentStrategy: null,   // In-memory working copy
    savedStrategyId: null,   // Pointer to localStorage record
    isApproved:      false,
  };

  /* ─── DOM References ─── */
  const $ = id => document.getElementById(id);

  /* ─── Toast Notification ─── */
  let toastTimer;
  function showToast(message, type = 'info', duration = 3500) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('show'); }, duration);
  }

  /* ─── AI Status Badge ─── */
  function updateAIBadge() {
    const badge = $('aiBadge');
    const dot   = $('aiDot');
    const label = $('aiLabel');
    if (!badge) return;
    const hasKey = !!window.V6Store.getApiKey();
    if (hasKey) {
      badge.className = 'ai-status-badge live';
      dot.className   = 'ai-dot live';
      label.textContent = `${V6_CONFIG.apiProvider === 'openai' ? 'OpenAI' : 'Gemini'} Live`;
    } else {
      badge.className = 'ai-status-badge mock';
      dot.className   = 'ai-dot mock';
      label.textContent = 'Demo Mode';
    }
  }

  /* ─── Month & Year Picker ─── */
  function populateMonthSelect() {
    const monthEl  = $('monthPick');
    const yearEl   = $('yearPick');
    const hiddenEl = $('monthSelect');
    if (!monthEl || !yearEl || !hiddenEl) return;

    // Auto-select next month
    const now  = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthName = next.toLocaleString('en-US', { month: 'long' });
    const nextYear      = String(next.getFullYear());

    // Set default selections
    monthEl.value = nextMonthName;
    if ([...yearEl.options].some(o => o.value === nextYear)) {
      yearEl.value = nextYear;
    }

    // Sync combined value into hidden input
    function syncValue() {
      hiddenEl.value = `${monthEl.value} ${yearEl.value}`;
    }
    syncValue();
    monthEl.addEventListener('change', syncValue);
    yearEl.addEventListener('change', syncValue);
  }

  /* ─── Tag Input ─── */
  function initTagInput() {
    const container = $('tagContainer');
    const input     = $('tagInput');
    if (!container || !input) return;

    // Pre-populate with first 2 products
    (V6_CONFIG.products.slice(0,2)).forEach(addTag);

    input.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
        e.preventDefault();
        addTag(input.value.trim().replace(',',''));
        input.value = '';
      }
      if (e.key === 'Backspace' && !input.value) {
        const tags = container.querySelectorAll('.tag-bubble');
        if (tags.length) tags[tags.length - 1].remove();
      }
    });

    container.addEventListener('click', () => input.focus());
  }

  function addTag(value) {
    if (!value) return;
    const container = $('tagContainer');
    const input     = $('tagInput');
    if (!container || !input) return;

    // Prevent duplicates
    const existing = [...container.querySelectorAll('.tag-bubble')].map(b => b.dataset.value);
    if (existing.includes(value)) return;

    const bubble = document.createElement('span');
    bubble.className    = 'tag-bubble';
    bubble.dataset.value = value;
    bubble.innerHTML    = `${value}<button class="tag-bubble-del" title="Remove" aria-label="Remove ${value}">×</button>`;
    bubble.querySelector('.tag-bubble-del').addEventListener('click', e => {
      e.stopPropagation();
      bubble.remove();
    });
    container.insertBefore(bubble, input);
  }

  function getSelectedProducts() {
    const container = $('tagContainer');
    if (!container) return [];
    return [...container.querySelectorAll('.tag-bubble')].map(b => b.dataset.value);
  }

  /* ─── Product Suggestions ─── */
  function initProductSuggestions() {
    const input    = $('tagInput');
    const dropdown = $('productDropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) { dropdown.style.display = 'none'; return; }

      const matches = V6_CONFIG.products.filter(p => p.toLowerCase().includes(q));
      if (!matches.length) { dropdown.style.display = 'none'; return; }

      dropdown.innerHTML = matches.map(p =>
        `<button class="product-suggestion" data-product="${p}">${p}</button>`
      ).join('');
      dropdown.style.display = 'flex';

      dropdown.querySelectorAll('.product-suggestion').forEach(btn => {
        btn.addEventListener('mousedown', e => {
          e.preventDefault();
          addTag(btn.dataset.product);
          input.value = '';
          dropdown.style.display = 'none';
        });
      });
    });

    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
      }
    });
  }

  /* ─── API Key Modal ─── */
  function initApiKeyModal() {
    // Note: In V.6, the modal logic is handled globally by layout.js's initGlobalApiKeyModal.
    // This local function remains for internal layer compatibility but delegates to the state store.
    if(typeof updateAIBadge === 'function') updateAIBadge();
  }

  /* ─── Show Skeleton ─── */
  function showSkeleton() {
    const output = $('outputColumn');
    if (!output) return;
    output.innerHTML = `
      <div class="skeleton-card">
        <div class="skeleton-block" style="height:20px;width:50%;margin-bottom:12px;"></div>
        <div class="skeleton-block" style="height:14px;width:30%;margin-bottom:8px;"></div>
        <div class="skeleton-block" style="height:60px;width:100%;"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-block" style="height:16px;width:60%;margin-bottom:10px;"></div>
        <div class="skeleton-block" style="height:80px;width:100%;margin-bottom:8px;"></div>
        <div class="skeleton-block" style="height:80px;width:100%;"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-block" style="height:16px;width:40%;margin-bottom:10px;"></div>
        <div class="skeleton-block" style="height:80px;width:100%;"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-block" style="height:16px;width:55%;margin-bottom:10px;"></div>
        <div class="skeleton-block" style="height:80px;width:100%;"></div>
      </div>
    `;
  }

  /* ─── Render Mood Card ─── */
  function renderMoodCard(strategy) {
    const { monthly_theme, mood_and_tone } = strategy;
    const { palette, font_vibe, visual_direction } = mood_and_tone;

    const swatches = (palette || []).map(hex => `
      <div class="palette-swatch" onclick="navigator.clipboard.writeText('${hex}').then(()=>V6Layer0.toast('Copied ${hex}!','info'))" title="Click to copy">
        <div class="swatch-circle" style="background:${hex};"></div>
        <span class="swatch-hex">${hex}</span>
      </div>
    `).join('');

    const t = typeof V6i18n !== 'undefined' ? V6i18n.t.bind(V6i18n) : (k) => k;

    return `
      <div class="glass-card mood-card" id="moodCard">
        <div class="mood-theme-label" data-i18n="l0.theme.label">${t('l0.theme.label')}</div>
        <div class="mood-theme-name" id="moodThemeName">${escHtml(monthly_theme)}</div>
        <div class="mood-divider"></div>
        <div class="mood-section-label" data-i18n="l0.palette.label">${t('l0.palette.label')}</div>
        <div class="palette-row">${swatches}</div>
        <div class="mood-divider"></div>
        <div class="mood-section-label" data-i18n="l0.font.label">${t('l0.font.label')}</div>
        <div class="vibe-chip">✦ <span>${escHtml(font_vibe)}</span></div>
        <div style="margin-top:12px;">
          <div class="mood-section-label" data-i18n="l0.visual.label">${t('l0.visual.label')}</div>
          <div class="direction-text thai-text">${escHtml(visual_direction)}</div>
        </div>
      </div>
    `;
  }

  /* ─── Render Track Card ─── */
  function renderTrackCard(track, index) {
    const trackColors = ['#a68cff','#ff6c95','#81ecff','#fbbf24','#4ade80','#f97316'];
    const color = trackColors[index] || trackColors[0];
    const ratioW = Math.min(track.content_ratio, 100);

    return `
      <div class="track-card" id="track-${track.id}" data-track-id="${track.id}" style="--track-color:${color};">
        <div class="track-header">
          <div class="track-number">${index + 1}</div>
          <div class="track-name-wrap">
            <div class="track-name thai-text" data-field="track_name" contenteditable="true" spellcheck="false">${escHtml(track.track_name)}</div>
            <div class="track-ratio-badge" style="margin-top:6px;">
              <span class="ratio-dot"></span>
              <input class="ratio-input" type="number" min="0" max="100" value="${track.content_ratio}" data-track-id="${track.id}" title="Content ratio %" />
              <span>${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.tracks.percent') : '% of posts'}</span>
            </div>
          </div>
          <div class="track-actions">
            <button class="btn btn-icon track-delete-btn" data-track-id="${track.id}" title="Delete track" ${index === 0 ? 'disabled' : ''}>🗑</button>
          </div>
        </div>
        <div class="ratio-bar-container">
          <div class="ratio-bar-fill" style="width:${ratioW}%;"></div>
        </div>
        <div class="track-body" style="margin-top:14px;">
          <div>
            <div class="track-field-label" data-i18n="l0.tracks.objective">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.tracks.objective') : '🎯 Objective'}</div>
            <div class="track-field-value thai-text" data-field="objective" contenteditable="true" spellcheck="false">${escHtml(track.objective)}</div>
          </div>
          <div>
            <div class="track-field-label" data-i18n="l0.tracks.ksp">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.tracks.ksp') : '💡 Key Selling Point'}</div>
            <div class="track-field-value track-ksp thai-text" data-field="key_selling_point" contenteditable="true" spellcheck="false">${escHtml(track.key_selling_point)}</div>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Render Full Strategy ─── */
  function renderStrategy(strategy) {
    state.currentStrategy = JSON.parse(JSON.stringify(strategy)); // Deep copy
    state.isApproved = strategy.status === 'approved';

    const output = $('outputColumn');
    if (!output) return;

    const tracksHTML = (strategy.campaign_tracks || []).map((t, i) => renderTrackCard(t, i)).join('');
    const ratioTotal = (strategy.campaign_tracks || []).reduce((s, t) => s + Number(t.content_ratio || 0), 0);

    output.innerHTML = `
      <!-- Mood & Theme -->
      ${renderMoodCard(strategy)}

      <!-- Campaign Tracks -->
      <div>
        <div class="tracks-header" style="margin-bottom:14px;">
          <span class="tracks-title" data-i18n="l0.tracks.title">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.tracks.title') : '📋 Campaign Tracks'}</span>
          <span class="tracks-ratio-warning ${ratioTotal !== 100 ? 'show' : ''}" id="ratioWarning">
            <span data-i18n="l0.ratio.warning">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.ratio.warning') : '⚠️ Ratio total:'}</span> <strong>${ratioTotal}%</strong> <span data-i18n="l0.ratio.must100">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.ratio.must100') : '(must be 100%)'}</span>
          </span>
        </div>
        <div class="tracks-grid" id="tracksGrid">
          ${tracksHTML}
        </div>

        <!-- Add Custom Track -->
        <button class="btn btn-ghost" id="addTrackBtn" style="width:100%;margin-top:14px;" ${state.isApproved ? 'disabled' : ''} data-i18n="l0.tracks.add">
          ${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.tracks.add') : '＋ Add Custom Campaign'}
        </button>
      </div>

      <!-- Approved Banner -->
      <div class="approved-banner ${state.isApproved ? 'show' : ''}" id="approvedBanner">
        <span style="font-size:20px;">✅</span>
        <div>
          <div style="font-weight:900;" data-i18n="l0.approved.title">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.approved.title') : 'Strategy Approved!'}</div>
          <div style="font-size:11px;color:#86efac;font-weight:500;margin-top:2px;" data-i18n="l0.approved.sub">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.approved.sub') : 'Saved and ready for Layer 1'}</div>
        </div>
        <button class="btn btn-secondary" style="margin-left:auto;font-size:11px;padding:8px 16px;" onclick="V6Store.exportJSON('${strategy.id}')">📥 Export JSON</button>
      </div>

      <!-- Approve Bar -->
      <div class="approve-bar ${state.isApproved ? 'hidden' : ''}" id="approveBar">
        <div class="approve-bar-info">
          <div class="approve-bar-title" data-i18n="l0.approve.question">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.approve.question') : 'Ready to lock this strategy?'}</div>
          <div class="approve-bar-desc" data-i18n="l0.approve.desc">${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.approve.desc') : 'All tracks will be saved and sent to the Content Calendar.'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="ratio-total-display ${ratioTotal === 100 ? 'valid' : 'invalid'}" id="ratioTotalDisplay">
            Ratio: ${ratioTotal}%
          </div>
          <button class="btn btn-approve btn-approve-main" id="approveBtn" ${ratioTotal !== 100 || state.isApproved ? 'disabled' : ''} data-i18n="l0.approve.btn">
            ${typeof V6i18n !== 'undefined' ? V6i18n.t('l0.approve.btn') : '✅ Approve & Send to Calendar'}
          </button>
        </div>
      </div>
    `;

    // Mark as hidden properly
    if (state.isApproved) {
      const bar = $('approveBar');
      if (bar) bar.style.display = 'none';
    }

    bindTrackEvents();
  }

  /* ─── Bind Track Events ─── */
  function bindTrackEvents() {
    // Ratio inputs
    document.querySelectorAll('.ratio-input').forEach(input => {
      input.addEventListener('input', onRatioChange);
    });

    // Delete buttons
    document.querySelectorAll('.track-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = btn.dataset.trackId;
        const tracks = document.querySelectorAll('.track-card');
        if (tracks.length <= 1) { showToast('⚠️ Need at least 1 campaign track', 'error'); return; }
        const card = document.getElementById(`track-${id}`);
        if (card) {
          card.style.transform = 'translateX(-20px)';
          card.style.opacity   = '0';
          setTimeout(() => {
            card.remove();
            syncStateFromDOM();
            updateRatioDisplay();
            renumberTracks();
          }, 250);
        }
      });
    });

    // Add track button
    const addBtn = $('addTrackBtn');
    if (addBtn) {
      addBtn.addEventListener('click', addCustomTrack);
    }

    // Approve button
    const approveBtn = $('approveBtn');
    if (approveBtn) {
      approveBtn.addEventListener('click', onApprove);
    }

    // Contenteditable fields — sync on blur
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.addEventListener('blur', syncStateFromDOM);
    });
  }

  /* ─── Ratio Change Handler ─── */
  function onRatioChange() {
    updateRatioDisplay();
  }

  function updateRatioDisplay() {
    const inputs  = [...document.querySelectorAll('.ratio-input')];
    const total   = inputs.reduce((s, i) => s + (Number(i.value) || 0), 0);
    const valid   = total === 100;

    const warning = $('ratioWarning');
    const display = $('ratioTotalDisplay');
    const btn     = $('approveBtn');

    if (warning) {
      warning.innerHTML = `⚠️ Ratio total: <strong>${total}%</strong> (must be 100%)`;
      warning.classList.toggle('show', !valid);
    }
    if (display) {
      display.textContent  = `Ratio: ${total}%`;
      display.className    = `ratio-total-display ${valid ? 'valid' : 'invalid'}`;
    }
    if (btn) btn.disabled = !valid || state.isApproved;

    // Update progress bars
    inputs.forEach(input => {
      const card = input.closest('.track-card');
      if (!card) return;
      const bar  = card.querySelector('.ratio-bar-fill');
      if (bar) bar.style.width = Math.min(Number(input.value) || 0, 100) + '%';
    });
  }

  /* ─── Sync DOM → State ─── */
  function syncStateFromDOM() {
    if (!state.currentStrategy) return;
    const tracks = [];
    document.querySelectorAll('.track-card').forEach(card => {
      const id       = card.dataset.trackId;
      const getName  = f => (card.querySelector(`[data-field="${f}"]`) || {}).innerText || '';
      const ratioEl  = card.querySelector('.ratio-input');
      tracks.push({
        id,
        track_name:        getName('track_name'),
        objective:         getName('objective'),
        key_selling_point: getName('key_selling_point'),
        content_ratio:     Number(ratioEl ? ratioEl.value : 0),
      });
    });
    state.currentStrategy.campaign_tracks = tracks;

    // Persist updated strategy to store
    if (state.savedStrategyId) {
      V6Store.update(state.savedStrategyId, { campaign_tracks: tracks });
    }
  }

  /* ─── Renumber Track Badges ─── */
  function renumberTracks() {
    document.querySelectorAll('.track-card').forEach((card, i) => {
      const num = card.querySelector('.track-number');
      if (num) num.textContent = i + 1;
    });
  }

  /* ─── Add Custom Track ─── */
  function addCustomTrack() {
    const grid = $('tracksGrid');
    if (!grid) return;
    const count = grid.querySelectorAll('.track-card').length;
    if (count >= 6) { showToast('⚠️ Maximum 6 campaign tracks reached', 'error'); return; }

    const newTrack = {
      id:                'trk_' + Date.now().toString(36),
      track_name:        'Custom Campaign',
      objective:         'กำหนด Objective ของ track นี้',
      content_ratio:     0,
      key_selling_point: 'Key Selling Point ที่ต้องการสื่อสาร',
    };

    const div = document.createElement('div');
    div.innerHTML = renderTrackCard(newTrack, count);
    grid.appendChild(div.firstElementChild);

    // Bind events for new track
    const newCard = grid.lastElementChild;
    newCard.querySelector('.ratio-input').addEventListener('input', onRatioChange);
    newCard.querySelector('.track-delete-btn').addEventListener('click', function () {
      if (grid.querySelectorAll('.track-card').length <= 1) { showToast('⚠️ Need at least 1 campaign track', 'error'); return; }
      newCard.style.transform = 'translateX(-20px)';
      newCard.style.opacity   = '0';
      setTimeout(() => { newCard.remove(); syncStateFromDOM(); updateRatioDisplay(); renumberTracks(); }, 250);
    });
    newCard.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.addEventListener('blur', syncStateFromDOM);
    });

    updateRatioDisplay();
    showToast('✅ Custom track added!', 'success');
    const nameEl = newCard.querySelector('[data-field="track_name"]');
    if (nameEl) { nameEl.focus(); document.execCommand('selectAll'); }
  }

  /* ─── Approve Handler ─── */
  async function onApprove() {
    syncStateFromDOM();
    const total = (state.currentStrategy.campaign_tracks || []).reduce((s, t) => s + (Number(t.content_ratio) || 0), 0);
    if (total !== 100) {
      showToast(`❌ Ratio total is ${total}% — must be exactly 100%`, 'error', 4000);
      return;
    }

    const btn = $('approveBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Saving...'; }

    try {
      const approved = V6Store.approve(state.savedStrategyId);
      if (approved) {
        state.isApproved = true;
        state.currentStrategy.status = 'approved';

        const banner = $('approvedBanner');
        const bar    = $('approveBar');
        if (banner) banner.classList.add('show');
        if (bar)    bar.style.display = 'none';

        // Disable editing
        document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
        document.querySelectorAll('.ratio-input').forEach(el => el.disabled = true);
        document.querySelectorAll('.track-delete-btn').forEach(el => el.disabled = true);
        const addBtn = $('addTrackBtn');
        if (addBtn) addBtn.disabled = true;

        showToast('🎉 Strategy Approved!', 'success', 4000);
        renderHistory();
        
        setTimeout(() => {
          window.location.href = 'layer1-calendar.html?strategyId=' + approved.id;
        }, 1800);
      }
    } catch (err) {
      console.error('[Layer0] Approve failed:', err);
      showToast('❌ Save failed.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '✅ Approve & Send to Calendar'; }
    }
  }

  /* ─── Generate Strategy ─── */
  async function onGenerate() {
    const month    = $('monthSelect')?.value;
    const products = getSelectedProducts();
    const events   = $('eventsTextarea')?.value.trim();

    if (!month) { showToast('⚠️ Please select a month', 'error'); return; }
    if (!products.length) { showToast('⚠️ Please add at least one product', 'error'); return; }

    state.isLoading = true;
    const genBtn = $('generateBtn');
    if (genBtn) genBtn.classList.add('loading');
    showSkeleton();

    try {
      const aiResponse = await V6AI.generate({ month, products, events });
      const saved = V6Store.save({ month, core_products: products, special_events: events, aiResponse });
      state.savedStrategyId = saved.id;
      renderStrategy({ ...saved });
      renderHistory();
      showToast('✨ Strategy generated!', 'success');
    } catch (err) {
      console.error('[Layer0] Generation error:', err);
      let errorTitle = 'Generation Failed';
      let errorDesc  = err.message;
      let checklist  = '';

      if (err.isNetwork && err.checklist) {
        errorTitle = 'Connection Failed 📡';
        checklist = `
          <div class="diagnostic-checklist" style="text-align:left; max-width:400px; margin:20px auto; padding:16px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:13px; line-height:1.6;">
            <div style="font-weight:900; margin-bottom:8px; opacity:0.8;">Troubleshooting:</div>
            <ul style="margin:0; padding-left:20px; opacity:0.7;">
              ${err.checklist.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      $('outputColumn').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">${errorTitle}</div>
          <div class="empty-desc">${escHtml(errorDesc)}</div>
          ${checklist}
          <button class="btn btn-secondary" style="margin-top:20px;" onclick="V6Layer0.generate()">🔄 Retry</button>
        </div>
      `;
      showToast('❌ ' + err.message, 'error', 5000);
    } finally {
      state.isLoading = false;
      if (genBtn) genBtn.classList.remove('loading');
    }
  }

  /* ─── Render History ─── */
  function renderHistory() {
    const container = $('historyList');
    if (!container) return;
    const strategies = V6Store.list().slice(0, 5);
    if (!strategies.length) { container.innerHTML = '<div style="font-size:12px;color:#334155;">No strategies yet.</div>'; return; }

    container.innerHTML = strategies.map(s => `
      <div class="history-item" onclick="V6Layer0.loadStrategy('${s.id}')">
        <div class="history-item-dot ${s.status}"></div>
        <div class="history-item-month">${escHtml(s.month)} — ${escHtml(s.monthly_theme)}</div>
        <div class="history-item-status ${s.status}">${s.status}</div>
      </div>
    `).join('');
  }

  /* ─── Load Strategy ─── */
  function loadStrategy(id) {
    const s = V6Store.getById(id);
    if (s) {
      state.savedStrategyId = id;
      renderStrategy(s);
      showToast('📁 Loaded strategy from ' + s.month, 'info');
    }
  }

  /* ─── Init ─── */
  function init() {
    updateAIBadge();
    populateMonthSelect();
    initTagInput();
    initProductSuggestions();
    renderHistory();
    
    const genBtn = $('generateBtn');
    if (genBtn) genBtn.addEventListener('click', onGenerate);
  }

  /* ─── Utility ─── */
  function escHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;" }[m]));
  }

  return {
    init,
    generate: onGenerate,
    loadStrategy,
    toast: showToast,
    updateAIBadge
  };

})();

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    if (window.V6Layer0) window.V6Layer0.init();
});
