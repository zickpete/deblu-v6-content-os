/* ================================================
   V.6 Content OS — Layer 1 UI Orchestrator
   Schedule generation, Calendar Grid, Kanban Board, DnD
   ================================================ */

window.V6Layer1 = (function () {

  /* ─── State ─── */
  const state = {
    strategy:    null,
    cards:       [],
    view:        'calendar',   // 'calendar' | 'kanban'
    isLocked:    false,
    isLoading:   false,
  };

  const $ = id => document.getElementById(id);
  const TRACK_COLORS = ['#a68cff', '#ff6c95', '#81ecff', '#fbbf24', '#4ade80', '#f97316'];

  /* ─── Toast ─── */
  let _toastTimer;
  function toast(msg, type = 'info', dur = 3500) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), dur);
  }

  /* ─── AI Badge ─── */
  function updateAIBadge() {
    const badge = $('aiBadge');
    const dot   = $('aiDot');
    const label = $('aiLabel');
    if (!badge) return;
    const hasKey = !!V6Store.getApiKey();
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

  /* ─── Load Strategy ─── */
  function loadStrategy() {
    // First try URL param (from layer0 approve button)
    const params  = new URLSearchParams(window.location.search);
    const urlId   = params.get('strategyId');

    let strategy = null;
    if (urlId) {
      strategy = V6Store.getById(urlId);
    }

    // Fallback: most recent approved strategy
    if (!strategy) {
      const approved = V6Store.list().filter(s => s.status === 'approved');
      strategy = approved[0] || null;
    }

    // Fallback: any draft
    if (!strategy) {
      strategy = V6Store.list()[0] || null;
    }

    return strategy;
  }

  /* ─── Render Strategy Bar ─── */
  function renderStrategyBar(strategy) {
    const bar = $('strategyBar');
    if (!bar || !strategy) return;

    const tracks = (strategy.campaign_tracks || []);
    const trackChips = tracks.map((t, i) => `
      <span class="track-chip">
        <span class="track-chip-dot" style="background:${TRACK_COLORS[i]};"></span>
        ${esc(t.track_name)} <span style="opacity:0.6;">${t.content_ratio}%</span>
      </span>
    `).join('');

    const savedSize = localStorage.getItem('v6_card_size') || '140';

    bar.innerHTML = `
      <div class="strategy-bar-info">
        <div class="strategy-month">📅 ${esc(strategy.month)}</div>
        <div class="strategy-theme">${esc(strategy.monthly_theme || '—')}</div>
        <div class="strategy-tracks">${trackChips}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <div class="card-size-control">
          <span class="card-size-label">🔍</span>
          <input type="range" class="card-size-slider" id="cardSizeSlider" min="80" max="320" value="${savedSize}" step="10" title="Card Size">
        </div>
        <div class="view-toggle">
          <button class="view-btn active" id="calViewBtn" onclick="V6Layer1.switchView('calendar')" data-i18n="l1.header.calendar">📅 Calendar</button>
          <button class="view-btn" id="kanbanViewBtn" onclick="V6Layer1.switchView('kanban')" data-i18n="l1.header.kanban">📋 Kanban</button>
        </div>
        <div class="strategy-bar-actions">
          <button class="btn-gen-schedule" id="generateScheduleBtn">
            <span class="spinner" aria-hidden="true"></span>
            <span class="btn-lbl">${V6i18n.t('l1.btn.generate')}</span>
          </button>
        </div>
      </div>
    `;

    // Apply saved size/zoom immediately
    const zoomVal = (parseInt(savedSize) || 140) / 140;
    document.documentElement.style.setProperty('--card-min-h', savedSize + 'px');
    document.documentElement.style.setProperty('--app-scale', zoomVal.toFixed(2));

    // Bind slider
    const slider = $('cardSizeSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        const zoomVal = parseInt(val) / 140;
        document.documentElement.style.setProperty('--card-min-h', val + 'px');
        document.documentElement.style.setProperty('--app-scale', zoomVal.toFixed(2));
        localStorage.setItem('v6_card_size', val);
      });
    }

    // Re-bind generate btn
    const genBtn = $('generateScheduleBtn');
    if (genBtn) genBtn.addEventListener('click', onGenerateSchedule);
  }

  /* ─── Show Skeleton ─── */
  function showSkeleton() {
    const calView  = $('calendarView');
    const calWrap  = $('calGridWrap');
    if (!calWrap) return;

    const cells = Array.from({ length: 35 }, (_, i) => `
      <div class="cal-skeleton-cell">
        <div class="cal-skeleton-num shimmer"></div>
        ${i % 3 === 0 ? `<div class="cal-skeleton-card shimmer"></div>` : ''}
      </div>
    `).join('');

    const dayHeaders = [
      V6i18n.t('day.mon'), V6i18n.t('day.tue'), V6i18n.t('day.wed'), 
      V6i18n.t('day.thu'), V6i18n.t('day.fri'), V6i18n.t('day.sat'), V6i18n.t('day.sun')
    ];

    calWrap.innerHTML = `
      <div class="cal-header-row">
        ${dayHeaders.map(d => `<div class="cal-header-cell">${d.length > 3 ? d.slice(0, 3) + '.' : d}</div>`).join('')}
      </div>
      <div class="cal-skeleton">${cells}</div>
    `;
  }

  /* ─── Generate Schedule ─── */
  async function onGenerateSchedule() {
    if (!state.strategy) {
      toast('⚠️ ไม่มี Strategy — กลับไป Layer 0 เพื่อ Approve ก่อน', 'error');
      return;
    }
    if (state.isLoading) return;

    state.isLoading = true;
    const genBtn = $('generateScheduleBtn');
    if (genBtn) genBtn.classList.add('loading');
    showSkeleton();
    switchView('calendar', true);

    try {
      // Step 1: Build skeleton schedule (Algorithm: Rules A+B)
      let cards = V6Scheduler.buildSchedule(state.strategy);
      toast('⚙️ สร้าง Schedule แล้ว — กำลัง AI Topic...', 'info', 2000);

      // Step 2: AI Batch topic generation (Rule C — single request)
      cards = await V6AI.generateTopics(state.strategy, cards);

      // Step 3: Save to store
      V6Store.saveCalendar(state.strategy.id, cards);
      state.cards = cards;

      // Step 4: Render
      renderCalendarGrid(cards);
      renderKanban(cards);
      renderStatsBar(cards);
      renderFooter(cards);
      toast('✅ Calendar สร้างเสร็จแล้ว! ' + cards.length + ' posts', 'success');

    } catch (err) {
      console.error('[Layer1] Generation error:', err);
      if (err.isNetwork && err.checklist) {
          toast(err.message, 'error', 6000);
          const wrap = $('calGridWrap');
          if (wrap) {
            wrap.innerHTML = `
              <div class="cal-container">
                <div style="padding:60px 20px;text-align:center;">
                  <div style="font-size:40px;margin-bottom:16px;">📡</div>
                  <div style="font-weight:900;color:#ef4444;margin-bottom:12px;">${err.message}</div>
                  <div style="text-align:left; max-width:400px; margin:0 auto; padding:16px; background:rgba(255,255,255,0.05); border-radius:12px; font-size:13px; line-height:1.6;">
                    <div style="font-weight:900; margin-bottom:8px; opacity:0.8;">Troubleshooting:</div>
                    <ul style="margin:0; padding-left:20px; opacity:0.7;">
                      ${err.checklist.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                  </div>
                  <button class="btn btn-secondary" style="margin-top:24px;" onclick="V6Layer1.init()">🔄 Retry</button>
                </div>
              </div>
            `;
          }
      } else {
          toast('❌ ' + err.message, 'error', 5000);
      }
    } finally {
      state.isLoading = false;
      const btn = $('generateScheduleBtn');
      if (btn) btn.classList.remove('loading');
    }
  }

  /* ─── Track Color Helper ─── */
  function trackColor(card) {
    const strategy = state.strategy;
    if (!strategy) return TRACK_COLORS[0];
    if (card.track_index < 0) return '#fbbf24'; // special/lottery
    return TRACK_COLORS[card.track_index] || TRACK_COLORS[0];
  }

  /* ─── Tag Class Helper ─── */
  function tagClass(tag) {
    if (!tag) return '';
    if (tag.includes('Lottery')) return 'tag-lottery';
    if (tag.includes('Payday'))  return 'tag-payday';
    if (tag.includes('Weekend')) return 'tag-weekend';
    return '';
  }

  /* ─── Translate Tag Text ─── */
  function translateTag(tag) {
    if (!tag) return tag;
    // Use dynamic translation for unknown tags, fallback to dictionary for known ones
    if (tag.includes('Lottery') || tag.includes('วันหวย')) return V6i18n.t('tag.lottery');
    if (tag.includes('Payday') || tag.includes('เงินเดือน')) return V6i18n.t('tag.payday');
    if (tag.includes('Weekend') || tag.includes('วันหยุด')) return V6i18n.t('tag.weekend');
    // For any other tag, try dynamic translation or return as-is
    return tag;
  }

  /* ─── Translate Status ─── */
  function translateStatus(status) {
    const statusMap = {
      'Idea': 'status.idea',
      'Drafting': 'status.drafting',
      'Graphic': 'status.graphic',
      'Review': 'status.review',
      'Scheduled': 'status.scheduled',
      'Published': 'status.published'
    };
    return statusMap[status] ? V6i18n.t(statusMap[status]) : status;
  }

  /* ─── Render Single ContentCard HTML ─── */
  function renderCard(card, showDate = false) {
    const color  = trackColor(card);
    const status = card.status || 'Idea';
    const tags   = card.special_tag ? card.special_tag.split(' · ') : [];

    // Translate tags using V6i18n
    const tagBadges = tags.map(t => `
      <span class="card-special-tag ${tagClass(t)}">${translateTag(t)}</span>
    `).join('');

    const lang = typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th';
    const displayTopic = (lang === 'en' ? card.topic_en : card.topic_th) || card.suggested_topic || V6i18n.t('l2.loading.topic');
    const displayTrack = card.track_name || 'Special';

    // Translate status for display
    const translatedStatus = translateStatus(status);

    return `
      <div class="content-card card-status-${status}"
           style="--card-color:${color}; animation-delay:${Math.random() * 0.15}s;"
           draggable="true"
           data-card-id="${card.id}"
           data-date="${card.date}"
           onclick="V6Layer1.openCardDetail('${card.id}')"
           title="${esc(displayTopic)}">
        <div class="card-status-dot"></div>
        <div class="card-status-label">${translatedStatus}</div>
        ${showDate ? `<div class="card-date-label">${card.day_number} ${V6i18n.t('day.' + card.day_of_week.toLowerCase())}</div>` : ''}
        ${tagBadges}
        <div class="card-track-name" style="color:${color};" title="${esc(displayTrack)}">${esc(displayTrack)}</div>
        <div class="card-topic thai-text">${esc(displayTopic)}</div>
      </div>
    `;
  }

  /* ─── Render Calendar Grid ─── */
  function renderCalendarGrid(cards) {
    const wrap = $('calGridWrap');
    if (!wrap) return;

    // Build date → cards map
    const byDate = {};
    cards.forEach(c => {
      if (!byDate[c.date]) byDate[c.date] = [];
      byDate[c.date].push(c);
    });

    // Calculate calendar layout
    const strategy = state.strategy;
    const { year, monthIndex } = parseMonthLabel(strategy.month);
    const firstDayOfMonth = new Date(year, monthIndex, 1).getDay(); // 0=Sun
    // Shift so week starts Monday (Mon=0...Sun=6)
    const startOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today       = new Date();
    const todayISO    = V6Scheduler.toISODate(today);

    // Build 7-col grid cells
    let cells = '';
    // Empty cells before first day - use empty-slot class for proper offset
    for (let i = 0; i < startOffset; i++) {
      cells += `<div class="cal-cell empty-slot"></div>`;
    }

    // Build all day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const date    = new Date(year, monthIndex, d);
      const iso     = V6Scheduler.toISODate(date);
      const dow     = date.getDay();
      const isWknd  = dow === 0 || dow === 6;
      const isToday = iso === todayISO;
      const dayCls  = [
        'cal-cell',
        isWknd  ? 'weekend-cell' : '',
        isToday ? 'today-cell'   : '',
      ].filter(Boolean).join(' ');

      const dayCards = (byDate[iso] || []).map(c => renderCard(c)).join('');
      cells += `
        <div class="${dayCls}" data-date="${iso}">
          <div class="cal-day-num">${d}${isToday ? ' <span style="color:#a68cff;font-size:8px;">TODAY</span>' : ''}</div>
          ${dayCards}
        </div>
      `;
    }

    // Fill remaining cells to complete last row
    const totalCells = startOffset + daysInMonth;
    const remainder  = totalCells % 7;
    if (remainder > 0) {
      for (let i = 0; i < (7 - remainder); i++) {
        cells += `<div class="cal-cell other-month"></div>`;
      }
    }

    const dayHeaders = [
      V6i18n.t('day.mon'), V6i18n.t('day.tue'), V6i18n.t('day.wed'), 
      V6i18n.t('day.thu'), V6i18n.t('day.fri'), V6i18n.t('day.sat'), V6i18n.t('day.sun')
    ];

    const headers = dayHeaders.map((d, i) => `
      <div class="cal-header-cell ${i >= 5 ? 'weekend-col' : ''}">${d.length > 3 ? d.slice(0, 3) + '.' : d}</div>
    `).join('');

    wrap.innerHTML = `
      <div class="cal-container">
        <div class="cal-header-row">${headers}</div>
        <div class="cal-grid" id="calGrid">${cells}</div>
      </div>
    `;

    bindCalendarDnD();
  }

  /* ─── Render Kanban Board ─── */
  function renderKanban(cards) {
    const board = $('kanbanBoard');
    if (!board) return;

    const statuses = V6_CONFIG.kanbanStatuses;

    // Build kanban columns
    const columns = statuses.map(s => {
      const colCards = cards.filter(c => c.status === s.id);
      const cardHtml = colCards.map(c => renderCard(c, true)).join('');
      return `
        <div class="kanban-col"
             data-status="${s.id}"
             style="--col-color:${s.color};">
          <div class="kanban-col-header">
            <span class="kanban-col-label" style="color:${s.color};">${s.label}</span>
            <span class="kanban-col-count">${colCards.length}</span>
          </div>
          <div class="kanban-cards" id="kanban-${s.id}">${cardHtml}</div>
        </div>
      `;
    });

    board.innerHTML = columns.join('');

    bindKanbanDnD();
  }

  /* ─── Render Stats Bar ─── */
  function renderStatsBar(cards) {
    const bar = $('statsBar');
    if (!bar || !cards.length) return;
    const stats   = V6Scheduler.getStats(cards);
    const statuses = V6_CONFIG.kanbanStatuses;

    bar.innerHTML = statuses.map(s => `
      <span class="stats-pill">
        <span class="stats-pill-dot" style="background:${s.color};"></span>
        ${s.label}: <strong class="stat-val">&nbsp;${stats.byStatus[s.id] || 0}</strong>
      </span>
    `).join('') + `
      <span class="stats-pill">🗓 รวม: <strong class="stat-val">&nbsp;${cards.length} posts</strong></span>
      <span class="stats-pill">⭐ พิเศษ: <strong class="stat-val">&nbsp;${stats.specials}</strong></span>
    `;
  }

  /* ─── Render Footer ─── */
  function renderFooter(cards) {
    const footer = $('actionFooter');
    if (!footer) return;
    const locked = state.isLocked;

    footer.innerHTML = `
      <div id="statsBar" class="stats-bar"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="font-size:12px;color:#334155;">
          ${locked ? V6i18n.t('l1.footer.locked') : V6i18n.t('l1.footer.instruction')}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" id="resetPlanBtn" style="color:#ef4444;border-color:rgba(239,68,68,0.2);">
            🔄 Reset & Start Over
          </button>
          <button class="btn-factory ${locked ? 'btn-factory-locked' : ''}" id="sendToFactoryBtn" ${locked ? 'disabled' : ''}>
            🚀 ${locked ? V6i18n.t('l1.btn.factory.sent') : V6i18n.t('l1.btn.factory.send')}
          </button>
        </div>
      </div>
    `;

    renderStatsBar(cards);

    const factoryBtn = $('sendToFactoryBtn');
    if (factoryBtn && !locked) {
      factoryBtn.addEventListener('click', onSendToFactory);
    }
    
    const resetBtn = $('resetPlanBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', onResetPlan);
    }
  }

  /* ─── Reset Plan ─── */
  function onResetPlan() {
    if (!confirm('⚠️ Are you sure you want to reset the calendar plan? This will clear all current scheduled posts and unlock the strategy.')) return;
    V6Store.resetCalendarPlan();
    toast('🔄 Calendar reset. Redirecting...', 'info', 2000);
    setTimeout(() => {
      window.location.href = 'layer0-brain.html';
    }, 1000);
  }

  /* ─── Send to Factory ─── */
  async function onSendToFactory() {
    if (!state.strategy || !state.cards.length) return;

    const btn = $('sendToFactoryBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลัง Lock...'; }

    V6Store.lockCalendar(state.strategy.id);
    state.isLocked = true;

    // Show locked banner
    const banner = $('lockedBanner');
    if (banner) banner.classList.add('show');

    // Transition to Kanban view after brief pause
    setTimeout(() => {
      switchView('kanban');
      toast('🔒 Calendar ถูก Lock — เปลี่ยนไป Kanban View เพื่อ Execution!', 'success', 5000);
      renderFooter(state.cards);
    }, 600);
  }

  /* ─── View Switcher ─── */
  function switchView(viewName, silent = false) {
    state.view = viewName;
    const calView    = $('calendarView');
    const kanbanView = $('kanbanView');
    const calBtn     = $('calViewBtn');
    const kanbanBtn  = $('kanbanViewBtn');

    if (calView)    { calView.classList.toggle('active',    viewName === 'calendar'); }
    if (kanbanView) { kanbanView.classList.toggle('active', viewName === 'kanban');   }
    if (calBtn)     { calBtn.classList.toggle('active',     viewName === 'calendar'); }
    if (kanbanBtn)  { kanbanBtn.classList.toggle('active',  viewName === 'kanban');   }
  }

  /* ─── Card Detail Modal ─── */
  function openCardDetail(cardId) {
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    // Data Bridge: Save full card to local for Layer 2
    localStorage.setItem('editCardData', JSON.stringify(card));
    localStorage.setItem('v6_edit_strategy_data', JSON.stringify(state.strategy));

    const modal = $('cardDetailModal');
    if (!modal) {
       // Fallback: Just navigate if modal missing (shouldn't happen)
       window.location.href = `./layer2-cards.html?strategyId=${state.strategy.id}&cardId=${card.id}`;
       return;
    }
    const overlay = $('cardDetailOverlay');
    if (!modal) return;

    const color = trackColor(card);
    const statuses = V6_CONFIG.kanbanStatuses;
    const opts = statuses.map(s =>
      `<option value="${s.id}" ${card.status === s.id ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const lang = typeof V6i18n !== 'undefined' ? V6i18n.getLang() : 'th';
    const displayTopic = (lang === 'en' ? card.topic_en : card.topic_th) || card.suggested_topic || '—';

    modal.innerHTML = `
      <div class="modal-title">
        <span style="color:${color};">● ${esc(card.track_name)}</span>
        <button class="modal-close" onclick="V6Layer1.closeCardDetail()">✕</button>
      </div>
      <div class="cdm-header">
        <div>
          <div class="cdm-date">📅 ${card.date} (${card.day_of_week_th})</div>
          ${card.special_tag ? `<div style="margin-top:5px;"><span class="card-special-tag ${tagClass(card.special_tag)}">${card.special_tag}</span></div>` : ''}
        </div>
      </div>
      <div class="cdm-topic thai-text">${esc(displayTopic)}</div>
      <div class="form-group">
        <label class="form-label">${V6i18n.t('l1.modal.status')}</label>
        <select class="cdm-status-select" id="cardStatusSelect">${opts}</select>
      </div>
      <div class="cdm-actions">
        <button class="btn btn-primary" style="flex:1;" onclick="V6Layer1.updateCardStatus('${card.id}')">${V6i18n.t('common.save')}</button>
        <button class="btn btn-secondary" onclick="window.location.href='layer2-cards.html?strategyId=${state.strategy.id}&cardId=${card.id}'">${V6i18n.t('l1.modal.edit')}</button>
      </div>

      ${card.refUrl ? `
        <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--color-border-subtle);">
          <div style="font-size:11px; font-weight:800; color:var(--color-text-subtle); margin-bottom:8px; text-transform:uppercase;">Reference / Inspiration</div>
          <a href="${card.refUrl}" target="_blank" class="btn btn-secondary" style="width:100%; text-decoration:none; justify-content:center; gap:8px;">
             🌐 View Reference
          </a>
          ${/\.(jpg|jpeg|png|webp|gif)/i.test(card.refUrl) ? `
            <div style="margin-top:12px; border-radius:12px; overflow:hidden; border:1px solid var(--color-border-subtle);">
              <img src="${card.refUrl}" style="width:100%; height:auto; display:block;" alt="Reference Preview" />
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="modal-resize-handle" id="modalResizeHandle"></div>
    `;

    // Restore saved size
    const savedW = localStorage.getItem('v6_modal_w');
    const savedH = localStorage.getItem('v6_modal_h');
    if (savedW) modal.style.width = savedW + 'px';
    if (savedH) modal.style.height = savedH + 'px';

    // Show both modal and overlay
    modal.classList.add('open');
    if (overlay) overlay.classList.add('open');

    // Bind resize handle
    bindModalResize(modal);
  }

  /* ─── Modal Resize Logic ─── */
  function bindModalResize(modal) {
    const handle = modal.querySelector('#modalResizeHandle');
    if (!handle) return;

    let startX, startY, startW, startH;

    function onMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      startW = modal.offsetWidth;
      startH = modal.offsetHeight;
      modal.classList.add('resizing');
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e) {
      // Since modal is centered with translate(-50%, -50%),
      // dragging right/down = expand by 2× the delta (to keep it centered)
      const dw = (e.clientX - startX) * 2;
      const dh = (e.clientY - startY) * 2;
      const newW = Math.max(320, Math.min(startW + dw, window.innerWidth - 40));
      const newH = Math.max(280, Math.min(startH + dh, window.innerHeight - 40));
      modal.style.width = newW + 'px';
      modal.style.height = newH + 'px';
    }

    function onMouseUp() {
      modal.classList.remove('resizing');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Persist
      localStorage.setItem('v6_modal_w', parseInt(modal.style.width));
      localStorage.setItem('v6_modal_h', parseInt(modal.style.height));
    }

    handle.addEventListener('mousedown', onMouseDown);
  }

  /* ─── Close Card Detail Modal ─── */
  function closeCardDetail() {
    const modal = $('cardDetailModal');
    const overlay = $('cardDetailOverlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  function updateCardStatus(cardId) {
    const sel = $('cardStatusSelect');
    if (!sel || !state.strategy) return;
    const newStatus = sel.value;

    // Update in-memory
    const card = state.cards.find(c => c.id === cardId);
    if (card) card.status = newStatus;

    // Persist
    V6Store.updateCard(state.strategy.id, cardId, { status: newStatus });

    // Re-render both views to reflect change
    renderCalendarGrid(state.cards);
    renderKanban(state.cards);
    renderStatsBar(state.cards);

    // Close modal and overlay
    const modal = $('cardDetailModal');
    const overlay = $('cardDetailOverlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');

    toast(`✅ Status อัปเดตเป็น ${newStatus}`, 'success');
  }

  /* ─── DnD: Calendar ─── */
  function bindCalendarDnD() {
    let draggedCardId = null;

    document.querySelectorAll('.content-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        draggedCardId = card.dataset.cardId;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedCardId);
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    document.querySelectorAll('.cal-cell').forEach(cell => {
      cell.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cell.classList.add('drop-over');
      });
      cell.addEventListener('dragleave', () => cell.classList.remove('drop-over'));
      cell.addEventListener('drop', e => {
        e.preventDefault();
        cell.classList.remove('drop-over');
        const newDate = cell.dataset.date;
        if (!newDate || !draggedCardId || !state.strategy) return;

        const card = state.cards.find(c => c.id === draggedCardId);
        if (!card || card.date === newDate) return;

        card.date = newDate;
        V6Store.updateCard(state.strategy.id, draggedCardId, { date: newDate });
        renderCalendarGrid(state.cards);
        bindKanbanDnD(); // keep kanban in sync
        toast(`📅 ย้ายโพสต์ไปวันที่ ${newDate}`, 'info', 2000);
        draggedCardId = null;
      });
    });
  }

  /* ─── DnD: Kanban ─── */
  function bindKanbanDnD() {
    let draggedCardId = null;

    document.querySelectorAll('.kanban-col .content-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        draggedCardId = card.dataset.cardId;
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', draggedCardId);
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    document.querySelectorAll('.kanban-col').forEach(col => {
      col.addEventListener('dragover', e => {
        e.preventDefault();
        col.classList.add('drop-over');
      });
      col.addEventListener('dragleave', () => col.classList.remove('drop-over'));
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('drop-over');
        const newStatus = col.dataset.status;
        if (!newStatus || !draggedCardId || !state.strategy) return;

        const card = state.cards.find(c => c.id === draggedCardId);
        if (!card || card.status === newStatus) return;

        card.status = newStatus;
        V6Store.updateCard(state.strategy.id, draggedCardId, { status: newStatus });
        renderKanban(state.cards);
        renderCalendarGrid(state.cards);
        renderStatsBar(state.cards);
        toast(`📋 ย้ายไป ${newStatus}`, 'info', 2000);
        draggedCardId = null;
      });
    });
  }


  /* ─── Parse Month Label (delegation helper) ─── */
  function parseMonthLabel(label) {
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const [name, yr] = label.split(' ');
    return { year: parseInt(yr), monthIndex: MONTHS.indexOf(name) };
  }

  /* ─── HTML Escape ─── */
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─── Init ─── */
  function init() {
    const strategy = loadStrategy();
    state.strategy = strategy;

    updateAIBadge();

    if (!strategy) {
      const output = $('calGridWrap');
      if (output) output.innerHTML = `
        <div style="padding:60px 20px;text-align:center;">
          <div style="font-size:40px;margin-bottom:16px;">📭</div>
          <div style="font-size:18px;font-weight:900;color:#475569;margin-bottom:8px;">ไม่มี Strategy — กลับไป Layer 0 ก่อน</div>
          <div style="font-size:13px;color:#334155;margin-bottom:20px;">กด Approve & Send ใน Layer 0 เพื่อส่ง Strategy มาที่นี่</div>
          <a href="layer0-brain.html" class="btn btn-primary" style="text-decoration:none;display:inline-block;padding:10px 20px;">🧠 ไป Layer 0</a>
        </div>
      `;
      return;
    }

    renderStrategyBar(strategy);

    // Check if calendar already generated
    const existing = V6Store.getCalendar(strategy.id);
    state.isLocked = !!strategy.calendar_locked;

    if (existing.length > 0) {
      state.cards = existing;
      renderCalendarGrid(existing);
      renderKanban(existing);
      renderStatsBar(existing);
      renderFooter(existing);

      if (state.isLocked) {
        const banner = $('lockedBanner');
        if (banner) banner.classList.add('show');
        switchView('kanban');
      }
    } else {
      // Show empty state with generate button
      const wrap = $('calGridWrap');
      if (wrap) wrap.innerHTML = `
        <div class="cal-container">
          <div style="padding:60px 20px;text-align:center;">
            <div style="font-size:40px;margin-bottom:16px;">📅</div>
            <div style="font-size:18px;font-weight:900;color:#475569;margin-bottom:8px;">${V6i18n.t('l1.empty.title')}</div>
            <div style="font-size:13px;color:#334155;">${V6i18n.t('l1.empty.desc').replace('{month}', strategy.month)}</div>
          </div>
        </div>
      `;
    }

    // Re-render on language change
    window.removeEventListener('v6:langChange', onLangChange);
    window.addEventListener('v6:langChange', onLangChange);

    // Cloud Sync Refresh
    window.addEventListener('v6:cloudSync', (e) => {
      console.log('[Layer1] ☁️ Cloud sync detected, refreshing UI...');
      const strategy = loadStrategy();
      if (strategy) {
        state.strategy = strategy;
        state.cards = V6Store.getCalendar(strategy.id);
        renderCalendarGrid(state.cards);
        renderKanban(state.cards);
        renderStatsBar(state.cards);
      }
    });

    console.log('[V6 Content OS] Layer 1: The Calendar Engine initialized ✅');
  }

  /* ─── Language Change Handler ─── */
  function onLangChange() {
    const existing = state.cards;
    if (existing.length > 0) {
      renderCalendarGrid(existing);
      renderKanban(existing);
      renderStatsBar(existing);
    }
  }

  /* ─── Public API ─── */
  return {
    init,
    switchView,
    openCardDetail,
    closeCardDetail,
    updateCardStatus,
    toast,
  };
})();

// Bootstrap
document.addEventListener('DOMContentLoaded', V6Layer1.init);
