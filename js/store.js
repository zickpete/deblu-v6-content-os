/* ================================================
   V.6 Content OS — Store (Dual-Write State Manager)
   Single-Document Team Sync Edition
   ================================================ */

window.V6Store = (function () {
  const STORAGE_KEY    = 'v6_strategies';
  const CALENDAR_KEY   = 'v6_calendars';
  const API_KEY_KEY    = 'v6_settings_apiKey';
  const MODEL_KEY      = 'v6_gemini_model';
  const THINKING_KEY   = 'v6_deep_thinking';
  const PRODUCT_REF_KEY = 'v6_product_reference';
  const LAYER_MODELS_KEY = 'v6_layer_models';

  /* ─── Helpers ─── */
  function generateId() {
    return 'str_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function generateTrackId() {
    return 'trk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* ─── Firestore Helpers ─── */
  function isFirebaseReady() {
    return !!(window.V6Firebase && V6Firebase.isReady);
  }

  /** Update a specific field in the Team Document */
  function fsUpdate(field, data) {
    if (!isFirebaseReady()) return;
    try {
      const updateData = { [field]: data, updated_at: new Date().toISOString() };
      V6Firebase.getTeamDoc()
        .set(updateData, { merge: true })
        .catch(err => console.warn('[V6Store] Firestore update failed:', err.message));
    } catch (e) {
      console.warn('[V6Store] Firestore update error:', e.message);
    }
  }

  /* ─── localStorage Read/Write ─── */
  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveAll(strategies) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
    fsUpdate('strategies', strategies);
  }

  /* ─── Public API: Strategies ─── */

  function list() {
    return getAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function getById(id) {
    return getAll().find(s => s.id === id) || null;
  }

  function getApprovedForMonth(monthLabel) {
    return getAll()
      .filter(s => s.month === monthLabel && s.status === 'approved')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
  }

  function save({ month, core_products, special_events, aiResponse }) {
    const all = getAll();
    const strategy = {
      id:             generateId(),
      created_at:     new Date().toISOString(),
      month:          month,
      core_products:  core_products,
      special_events: special_events,
      status:         'draft',
      monthly_theme:  aiResponse.monthly_theme || '',
      mood_and_tone: {
        palette:          (aiResponse.mood_and_tone && aiResponse.mood_and_tone.palette)          || [],
        font_vibe:        (aiResponse.mood_and_tone && aiResponse.mood_and_tone.font_vibe)        || '',
        visual_direction: (aiResponse.mood_and_tone && aiResponse.mood_and_tone.visual_direction) || '',
      },
      campaign_tracks: (aiResponse.campaign_tracks || []).map(t => ({
        id: t.id || generateTrackId(),
        track_name: t.track_name || '',
        objective: t.objective || '',
        content_ratio: Number(t.content_ratio) || 0,
        key_selling_point: t.key_selling_point || '',
      })),
    };

    all.unshift(strategy);
    saveAll(all);
    return strategy;
  }

  function update(id, changes) {
    const all = getAll();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes, updated_at: new Date().toISOString() };
    saveAll(all);
    return all[idx];
  }

  function approve(id) {
    const strategy = update(id, { status: 'approved', approved_at: new Date().toISOString() });
    if (strategy) window.dispatchEvent(new CustomEvent('v6:strategyApproved', { detail: strategy }));
    return strategy;
  }

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
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(data));
    fsUpdate('calendars', data);
  }

  function saveCalendar(strategyId, cards) {
    const all = getAllCalendars();
    all[strategyId] = cards;
    saveAllCalendars(all);
    return cards;
  }

  function getCalendar(strategyId) {
    return getAllCalendars()[strategyId] || [];
  }

  function updateCard(strategyId, cardId, changes) {
    const all = getAllCalendars();
    const cards = all[strategyId] || [];
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1) return null;
    cards[idx] = { ...cards[idx], ...changes, updated_at: new Date().toISOString() };
    all[strategyId] = cards;
    saveAllCalendars(all);
    return cards[idx];
  }

  function deleteCard(strategyId, cardId) {
    const all = getAllCalendars();
    const cards = all[strategyId] || [];
    all[strategyId] = cards.filter(c => c.id !== cardId);
    saveAllCalendars(all);
    return true;
  }

  function lockCalendar(strategyId) {
    const locked = update(strategyId, { calendar_locked: true, calendar_locked_at: new Date().toISOString() });
    if (locked) window.dispatchEvent(new CustomEvent('v6:calendarLocked', { detail: locked }));
    return locked;
  }

  /* ─── Settings Management ─── */

  function saveApiKey(key) {
    localStorage.setItem(API_KEY_KEY, key);
    syncSettings();
  }

  function getApiKey() {
    return localStorage.getItem(API_KEY_KEY);
  }

  function saveLayerModels(modelsMap) {
    localStorage.setItem(LAYER_MODELS_KEY, JSON.stringify(modelsMap));
    syncSettings();
  }

  function getLayerModels() {
    try {
      const raw = localStorage.getItem(LAYER_MODELS_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { layer0: 'gemini-1.5-pro', layer1: 'gemini-1.5-flash', layer2: 'gemini-1.5-flash' };
  }

  function saveDeepThinkingMode(isDeep) {
    localStorage.setItem(THINKING_KEY, isDeep ? 'true' : 'false');
    syncSettings();
  }

  function getDeepThinkingMode() {
    return localStorage.getItem(THINKING_KEY) === 'true';
  }

  function syncSettings() {
    const data = {
      apiKey: getApiKey() || '',
      layerModels: getLayerModels(),
      deepThinking: getDeepThinkingMode()
    };
    fsUpdate('settings', data);
  }

  /* ─── Product Reference ─── */

  function saveProductReference(text) {
    localStorage.setItem(PRODUCT_REF_KEY, text || '');
    fsUpdate('products', text || '');
  }

  function getProductReference() {
    return localStorage.getItem(PRODUCT_REF_KEY) || '';
  }

  function parseProductCSV(csvStr) {
    if (!csvStr) return '';
    const lines = csvStr.split(/\r?\n/);
    const models = {};
    for (let i = 0; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (row.length < 1) continue;
        const m1 = row[0];
        if (m1 && m1 !== 'NUMBER' && /[a-zA-Z]/.test(m1)) {
            let p1 = row[7] || row[3] || row[4];
            if (p1) models[m1] = p1.replace(/,/g, '');
        }
        const m2 = row[10];
        if (m2 && m2 !== 'NUMBER' && /[a-zA-Z]/.test(m2)) {
            let p2 = row[17] || row[13] || row[14];
            if (p2) models[m2] = p2.replace(/,/g, '');
        }
    }
    return Object.entries(models).map(([m, p]) => `${m} ราคา ${p} บาท`).join('\\n');
  }

  /* ═══════════════════════════════════════════════════════
     FIRESTORE SINGLE-DOC SYNC
     ═══════════════════════════════════════════════════════ */

  let _unsubTeam = null;

  function initFirestoreSync() {
    if (!isFirebaseReady()) return;
    const teamId = V6Firebase.getTeamSyncId();
    console.log('[V6Store] 🔄 Syncing with Team Document:', teamId);

    if (_unsubTeam) _unsubTeam();

    _unsubTeam = V6Firebase.getTeamDoc().onSnapshot((doc) => {
      if (!doc.exists || doc.metadata.hasPendingWrites) return;
      const data = doc.data();

      // Sync Strategies
      if (data.strategies) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.strategies));
        window.dispatchEvent(new CustomEvent('v6:cloudSync', { detail: { type: 'strategies' } }));
      }
      // Sync Calendars
      if (data.calendars) {
        localStorage.setItem(CALENDAR_KEY, JSON.stringify(data.calendars));
        window.dispatchEvent(new CustomEvent('v6:cloudSync', { detail: { type: 'calendars' } }));
      }
      // Sync Settings
      if (data.settings) {
        const s = data.settings;
        if (s.apiKey !== undefined) localStorage.setItem(API_KEY_KEY, s.apiKey);
        if (s.layerModels) localStorage.setItem(LAYER_MODELS_KEY, JSON.stringify(s.layerModels));
        if (s.deepThinking !== undefined) localStorage.setItem(THINKING_KEY, s.deepThinking ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
      }
      // Sync Products
      if (data.products !== undefined) {
        localStorage.setItem(PRODUCT_REF_KEY, data.products);
      }
      
      console.log('[V6Store] ☁️ Team data synced!');
    }, err => console.warn('[V6Store] Sync error:', err.message));
  }

  /** Push local data to initialize a new room */
  async function pushLocalToCloud() {
    if (!isFirebaseReady()) return;
    const teamId = V6Firebase.getTeamSyncId();
    const flagKey = `v6_push_${teamId}`;
    if (localStorage.getItem(flagKey)) return;

    const data = {
      strategies: getAll(),
      calendars: getAllCalendars(),
      settings: {
        apiKey: getApiKey() || '',
        layerModels: getLayerModels(),
        deepThinking: getDeepThinkingMode()
      },
      products: getProductReference(),
      updated_at: new Date().toISOString()
    };

    // Only push if there's actual content
    if (data.strategies.length > 0 || Object.keys(data.calendars).length > 0 || data.settings.apiKey) {
      console.log('[V6Store] 🚚 Initializing Team Cloud Room...');
      await V6Firebase.getTeamDoc().set(data, { merge: true });
    }
    
    localStorage.setItem(flagKey, new Date().toISOString());
  }

  /* ─── Auto-Init ─── */
  if (typeof window !== 'undefined') {
    window.addEventListener('v6:firebaseReady', () => {
      pushLocalToCloud().then(() => initFirestoreSync());
    });
    window.addEventListener('v6:teamIdChanged', () => {
      pushLocalToCloud().then(() => initFirestoreSync());
    });
  }

  return {
    list, getById, getApprovedForMonth, save, update, approve, remove,
    saveApiKey, getApiKey, saveLayerModels, getLayerModels,
    saveDeepThinkingMode, getDeepThinkingMode,
    saveProductReference, getProductReference, parseProductCSV,
    saveCalendar, getCalendar, updateCard, deleteCard, lockCalendar,
    initFirestoreSync, pushLocalToCloud
  };
})();
