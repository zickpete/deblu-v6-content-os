/* ================================================
   V.6 Content OS — Store (LocalStorage State Manager)
   MonthlyStrategy schema & CRUD operations
   ================================================ */

window.V6Store = (function () {
  const STORAGE_KEY  = 'v6_strategies';
  const CALENDAR_KEY  = 'v6_calendars';
  const API_KEY_KEY   = 'v6_settings_apiKey';
  const MODEL_KEY     = 'v6_gemini_model';
  const THINKING_KEY  = 'v6_deep_thinking';

  /* ─── Helpers ─── */
  function generateId() {
    return 'str_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function generateTrackId() {
    return 'trk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[V6Store] Parse error, resetting store', e);
      return [];
    }
  }

  function saveAll(strategies) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
    } catch (e) {
      console.error('[V6Store] Failed to save to localStorage', e);
    }
  }

  /* ─── Public API ─── */

  /**
   * List all strategies, newest first.
   */
  function list() {
    return getAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * Get a single strategy by ID.
   */
  function getById(id) {
    return getAll().find(s => s.id === id) || null;
  }

  /**
   * Get the most recent approved strategy for a given month label.
   */
  function getApprovedForMonth(monthLabel) {
    return getAll()
      .filter(s => s.month === monthLabel && s.status === 'approved')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
  }

  /**
   * Create or update a strategy.
   * Input: raw AI response + form input data.
   * Returns the saved strategy object.
   */
  function save({ month, core_products, special_events, aiResponse }) {
    const all = getAll();

    // Enrich tracks with IDs if missing
    const tracks = (aiResponse.campaign_tracks || []).map(t => ({
      id: t.id || generateTrackId(),
      track_name:       t.track_name       || '',
      objective:        t.objective        || '',
      content_ratio:    Number(t.content_ratio) || 0,
      key_selling_point: t.key_selling_point || '',
    }));

    const strategy = {
      id:             generateId(),
      created_at:     new Date().toISOString(),
      month:          month,
      core_products:  core_products,
      special_events: special_events,
      status:         'draft',

      // AI-generated fields
      monthly_theme:  aiResponse.monthly_theme || '',
      mood_and_tone: {
        palette:          (aiResponse.mood_and_tone && aiResponse.mood_and_tone.palette)          || [],
        font_vibe:        (aiResponse.mood_and_tone && aiResponse.mood_and_tone.font_vibe)        || '',
        visual_direction: (aiResponse.mood_and_tone && aiResponse.mood_and_tone.visual_direction) || '',
      },
      campaign_tracks: tracks,

      /* ─── Layer 1 Handoff Payload ─── */
      // When status becomes 'approved', Layer 1 (Calendar) reads this.
      // Prisma/Supabase migration map:
      //   id             → monthly_strategies.id (uuid)
      //   created_at     → monthly_strategies.created_at (timestamptz)
      //   month          → monthly_strategies.month_label (text)
      //   core_products  → monthly_strategies.core_products (text[])
      //   special_events → monthly_strategies.special_events (text)
      //   monthly_theme  → monthly_strategies.monthly_theme (text)
      //   mood_and_tone  → monthly_strategies.mood_palette + mood_font_vibe + mood_visual_direction
      //   campaign_tracks→ monthly_strategies.campaign_tracks (jsonb)
      //   status         → monthly_strategies.status (text)
    };

    all.unshift(strategy);
    saveAll(all);
    console.log('[V6Store] Strategy saved:', strategy);
    return strategy;
  }

  /**
   * Update specific fields on an existing strategy.
   */
  function update(id, changes) {
    const all = getAll();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) { console.warn('[V6Store] Strategy not found:', id); return null; }
    all[idx] = { ...all[idx], ...changes, updated_at: new Date().toISOString() };
    saveAll(all);
    console.log('[V6Store] Strategy updated:', all[idx]);
    return all[idx];
  }

  /**
   * Approve a strategy. Sets status to 'approved' and triggers Layer 1 hook.
   */
  function approve(id) {
    const strategy = update(id, { status: 'approved', approved_at: new Date().toISOString() });
    if (strategy) {
      // Layer 1 hook: broadcast event so calendar module can listen
      window.dispatchEvent(new CustomEvent('v6:strategyApproved', { detail: strategy }));
      console.log('[V6Store] 🟢 Strategy approved & dispatched to Layer 1:', strategy.id);
    }
    return strategy;
  }

  /**
   * Delete a strategy.
   */
  function remove(id) {
    const all = getAll().filter(s => s.id !== id);
    saveAll(all);
  }

  /* ─── Calendar CRUD ─── */

  function getAllCalendars() {
    try {
      const raw = localStorage.getItem(CALENDAR_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveAllCalendars(data) {
    try { localStorage.setItem(CALENDAR_KEY, JSON.stringify(data)); }
    catch (e) { console.error('[V6Store] Calendar save failed', e); }
  }

  /**
   * Save (or replace) the full array of ContentCards for a strategy.
   * ContentCard schema: { id, strategy_id, date, day_of_week, track_name,
   *   track_index, special_tag, suggested_topic, status, created_at }
   */
  function saveCalendar(strategyId, cards) {
    const all = getAllCalendars();
    all[strategyId] = cards;
    saveAllCalendars(all);
    console.log('[V6Store] Calendar saved for', strategyId, '—', cards.length, 'cards');
    return cards;
  }

  /**
   * Retrieve all ContentCards for a given strategy.
   */
  function getCalendar(strategyId) {
    return getAllCalendars()[strategyId] || [];
  }

  /**
   * Patch a single ContentCard (e.g. date change from DnD, status from Kanban).
   */
  function updateCard(strategyId, cardId, changes) {
    const all   = getAllCalendars();
    const cards = all[strategyId] || [];
    const idx   = cards.findIndex(c => c.id === cardId);
    if (idx === -1) { console.warn('[V6Store] Card not found:', cardId); return null; }
    cards[idx] = { ...cards[idx], ...changes, updated_at: new Date().toISOString() };
    all[strategyId] = cards;
    saveAllCalendars(all);
    return cards[idx];
  }

  /**
   * Delete a single ContentCard.
   */
  function deleteCard(strategyId, cardId) {
    const all   = getAllCalendars();
    const cards = all[strategyId] || [];
    const filtered = cards.filter(c => c.id !== cardId);
    all[strategyId] = filtered;
    saveAllCalendars(all);
    console.log('[V6Store] Card deleted:', cardId, 'from strategy:', strategyId);
    return true;
  }

  /**
   * Lock the calendar — marks strategy as calendar_locked so Layer 2 can proceed.
   */
  function lockCalendar(strategyId) {
    const locked = update(strategyId, { calendar_locked: true, calendar_locked_at: new Date().toISOString() });
    if (locked) {
      window.dispatchEvent(new CustomEvent('v6:calendarLocked', { detail: locked }));
      console.log('[V6Store] 🔒 Calendar locked → Layer 2 ready:', strategyId);
    }
    return locked;
  }

  /* ─── API Key Management ─── */
  const API_KEY_KEY = 'v6_settings_apiKey';

  function saveApiKey(key) {
    localStorage.setItem(API_KEY_KEY, key);
  }

  function getApiKey() {
    return localStorage.getItem(API_KEY_KEY);
  }

  function clearApiKey() {
    localStorage.removeItem(API_KEY_KEY);
  }

  /* ─── AI Model Configuration ─── */
  const LAYER_MODELS_KEY = 'v6_layer_models';

  function saveLayerModels(modelsMap) {
    localStorage.setItem(LAYER_MODELS_KEY, JSON.stringify(modelsMap));
  }
  function getLayerModels() {
    try {
      const raw = localStorage.getItem(LAYER_MODELS_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    // Default mapping
    return {
      layer0: 'gemini-1.5-pro',
      layer1: 'gemini-1.5-flash',
      layer2: 'gemini-1.5-flash'
    };
  }
  
  // Keep legacy wrapper for fallback if needed, or point it to layer0 just in case
  function saveGeminiModel(model) {
    const map = getLayerModels();
    map.layer0 = model; // generic fallback
    saveLayerModels(map);
  }
  function getGeminiModel() {
    return getLayerModels().layer0;
  }
  function saveDeepThinkingMode(isDeep) {
    localStorage.setItem(THINKING_KEY, isDeep ? 'true' : 'false');
  }
  function getDeepThinkingMode() {
    return localStorage.getItem(THINKING_KEY) === 'true';
  }

  /* ─── Export ─── */
  function exportJSON(id) {
    const strategy = id ? getById(id) : list()[0];
    if (!strategy) return null;
    const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `v6-strategy-${strategy.month.replace(/ /g,'-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Cross-tab Sync ─── */
  function initStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === V6_SETTINGS_KEY) {
        // v6_settings changed in another tab, sync the API key
        try {
          const settings = JSON.parse(e.newValue || '{}');
          if (settings.apiKey) {
            localStorage.setItem(API_KEY_KEY, settings.apiKey);
            console.log('[V6Store] API Key synced from v6_settings change');
            window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
          } else if (!settings.apiKey && localStorage.getItem(API_KEY_KEY)) {
            // API key was removed in another tab
            localStorage.removeItem(API_KEY_KEY);
            window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
          }
        } catch(err) {}
      }
    });
  }
  
  // Auto-init listener
  if (typeof window !== 'undefined') {
    initStorageListener();
  }

  return {
    list, getById, getApprovedForMonth, save, update, approve, remove, exportJSON,
    saveApiKey, getApiKey, clearApiKey,
    saveLayerModels, getLayerModels,
    saveGeminiModel, getGeminiModel, saveDeepThinkingMode, getDeepThinkingMode,
    saveCalendar, getCalendar, updateCard, deleteCard, lockCalendar,
    initStorageListener,
  };
})();
