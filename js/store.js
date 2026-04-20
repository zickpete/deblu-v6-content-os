/* ================================================
   V.6 Content OS — Store (Dual-Write State Manager)
   localStorage (cache) + Firestore (cloud sync)
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
    return !!(window.V6Firebase && V6Firebase.getUid());
  }

  /** Write to Firestore (fire-and-forget, non-blocking) */
  function fsWrite(collection, docId, data) {
    if (!isFirebaseReady()) return;
    try {
      const ref = V6Firebase.userDoc(collection, docId);
      if (ref) {
        ref.set(data, { merge: true })
          .catch(err => console.warn('[V6Store] Firestore write failed:', err.message));
      }
    } catch (e) {
      console.warn('[V6Store] Firestore write error:', e.message);
    }
  }

  /** Delete from Firestore (fire-and-forget) */
  function fsDelete(collection, docId) {
    if (!isFirebaseReady()) return;
    try {
      const ref = V6Firebase.userDoc(collection, docId);
      if (ref) {
        ref.delete()
          .catch(err => console.warn('[V6Store] Firestore delete failed:', err.message));
      }
    } catch (e) {
      console.warn('[V6Store] Firestore delete error:', e.message);
    }
  }

  /* ─── localStorage Read/Write ─── */
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
    // Cloud sync: write each strategy to Firestore
    if (isFirebaseReady()) {
      strategies.forEach(s => fsWrite('strategies', s.id, s));
    }
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
      monthly_theme:  aiResponse.monthly_theme || '',
      mood_and_tone: {
        palette:          (aiResponse.mood_and_tone && aiResponse.mood_and_tone.palette)          || [],
        font_vibe:        (aiResponse.mood_and_tone && aiResponse.mood_and_tone.font_vibe)        || '',
        visual_direction: (aiResponse.mood_and_tone && aiResponse.mood_and_tone.visual_direction) || '',
      },
      campaign_tracks: tracks,
    };

    all.unshift(strategy);
    saveAll(all);
    console.log('[V6Store] Strategy saved:', strategy);
    return strategy;
  }

  function update(id, changes) {
    const all = getAll();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) { console.warn('[V6Store] Strategy not found:', id); return null; }
    all[idx] = { ...all[idx], ...changes, updated_at: new Date().toISOString() };
    saveAll(all);

    // Cloud sync: update single doc
    fsWrite('strategies', id, all[idx]);

    console.log('[V6Store] Strategy updated:', all[idx]);
    return all[idx];
  }

  function approve(id) {
    const strategy = update(id, { status: 'approved', approved_at: new Date().toISOString() });
    if (strategy) {
      window.dispatchEvent(new CustomEvent('v6:strategyApproved', { detail: strategy }));
      console.log('[V6Store] 🟢 Strategy approved & dispatched to Layer 1:', strategy.id);
    }
    return strategy;
  }

  function remove(id) {
    const all = getAll().filter(s => s.id !== id);
    saveAll(all);
    fsDelete('strategies', id);
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

  function saveCalendar(strategyId, cards) {
    const all = getAllCalendars();
    all[strategyId] = cards;
    saveAllCalendars(all);

    // Cloud sync: save calendar doc
    fsWrite('calendars', strategyId, { cards: cards, updated_at: new Date().toISOString() });

    console.log('[V6Store] Calendar saved for', strategyId, '—', cards.length, 'cards');
    return cards;
  }

  function getCalendar(strategyId) {
    return getAllCalendars()[strategyId] || [];
  }

  function updateCard(strategyId, cardId, changes) {
    const all   = getAllCalendars();
    const cards = all[strategyId] || [];
    const idx   = cards.findIndex(c => c.id === cardId);
    if (idx === -1) { console.warn('[V6Store] Card not found:', cardId); return null; }
    cards[idx] = { ...cards[idx], ...changes, updated_at: new Date().toISOString() };
    all[strategyId] = cards;
    saveAllCalendars(all);

    // Cloud sync: update full calendar doc (cards array)
    fsWrite('calendars', strategyId, { cards: cards, updated_at: new Date().toISOString() });

    return cards[idx];
  }

  function deleteCard(strategyId, cardId) {
    const all   = getAllCalendars();
    const cards = all[strategyId] || [];
    const filtered = cards.filter(c => c.id !== cardId);
    all[strategyId] = filtered;
    saveAllCalendars(all);

    // Cloud sync
    fsWrite('calendars', strategyId, { cards: filtered, updated_at: new Date().toISOString() });

    console.log('[V6Store] Card deleted:', cardId, 'from strategy:', strategyId);
    return true;
  }

  function lockCalendar(strategyId) {
    const locked = update(strategyId, { calendar_locked: true, calendar_locked_at: new Date().toISOString() });
    if (locked) {
      window.dispatchEvent(new CustomEvent('v6:calendarLocked', { detail: locked }));
      console.log('[V6Store] 🔒 Calendar locked → Layer 2 ready:', strategyId);
    }
    return locked;
  }

  /* ─── API Key Management ─── */

  function saveApiKey(key) {
    localStorage.setItem(API_KEY_KEY, key);
    fsWrite('settings', 'main', { apiKey: key, updated_at: new Date().toISOString() });
  }

  function getApiKey() {
    return localStorage.getItem(API_KEY_KEY);
  }

  function clearApiKey() {
    localStorage.removeItem(API_KEY_KEY);
    fsWrite('settings', 'main', { apiKey: '', updated_at: new Date().toISOString() });
  }

  /* ─── AI Model Configuration ─── */

  function saveLayerModels(modelsMap) {
    localStorage.setItem(LAYER_MODELS_KEY, JSON.stringify(modelsMap));
    fsWrite('settings', 'main', { layerModels: modelsMap, updated_at: new Date().toISOString() });
  }

  function getLayerModels() {
    try {
      const raw = localStorage.getItem(LAYER_MODELS_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return {
      layer0: 'gemini-1.5-pro',
      layer1: 'gemini-1.5-flash',
      layer2: 'gemini-1.5-flash'
    };
  }

  function saveGeminiModel(model) {
    const map = getLayerModels();
    map.layer0 = model;
    saveLayerModels(map);
  }

  function getGeminiModel() {
    return getLayerModels().layer0;
  }

  function saveDeepThinkingMode(isDeep) {
    localStorage.setItem(THINKING_KEY, isDeep ? 'true' : 'false');
    fsWrite('settings', 'main', { deepThinking: isDeep, updated_at: new Date().toISOString() });
  }

  function getDeepThinkingMode() {
    return localStorage.getItem(THINKING_KEY) === 'true';
  }

  /* ─── Product Reference / Price List ─── */

  function saveProductReference(text) {
    localStorage.setItem(PRODUCT_REF_KEY, text || '');
    fsWrite('settings', 'products', { text: text || '', updated_at: new Date().toISOString() });
  }

  function parseProductCSV(csvStr) {
    if (!csvStr) return '';
    const lines = csvStr.split(/\r?\n/);
    const models = {};

    for (let i = 0; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        while (row.length < 18) row.push('');

        // Block 1
        const m1 = row[0];
        if (m1 && m1 !== 'NUMBER' && m1 !== 'SS' && /[a-zA-Z]/.test(m1)) {
            let p1 = row[7];
            if (!p1) p1 = row[3];
            if (!p1) p1 = row[4];
            if (p1) p1 = p1.replace(/,/g, '');
            if (p1 && !isNaN(parseInt(p1))) {
                models[m1] = p1;
            }
        }

        // Block 2
        const m2 = row[10];
        if (m2 && m2 !== 'NUMBER' && m2 !== 'SS' && /[a-zA-Z]/.test(m2)) {
            let p2 = row[17];
            if (!p2) p2 = row[13];
            if (!p2) p2 = row[14];
            if (p2) p2 = p2.replace(/,/g, '');
            if (p2 && !isNaN(parseInt(p2))) {
                models[m2] = p2;
            }
        }
    }

    return Object.entries(models).map(([m, p]) => `${m} ราคา ${p} บาท`).join('\\n');
  }

  function getProductReference() {
    let saved = localStorage.getItem(PRODUCT_REF_KEY);
    if (!saved) {
      if (typeof V6_DEFAULT_CSV !== 'undefined') {
        saved = parseProductCSV(V6_DEFAULT_CSV);
      } else {
        saved = '';
      }
    }
    return saved;
  }

  /* ─── Reset Calendar Plan ─── */
  function resetCalendarPlan() {
    localStorage.removeItem(CALENDAR_KEY);
    const all = getAll();
    all.forEach(s => {
      s.status = 'draft';
      delete s.calendar_locked;
      delete s.calendar_locked_at;
    });
    saveAll(all);

    // Cloud sync: remove all calendars (best-effort)
    if (isFirebaseReady()) {
      const col = V6Firebase.userCollection('calendars');
      if (col) {
        col.get().then(snap => {
          snap.forEach(doc => doc.ref.delete());
        }).catch(() => {});
      }
    }

    console.log('[V6Store] 🔄 Calendar plan reset — ready for new strategy');
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

  /* ═══════════════════════════════════════════════════════
     FIRESTORE REAL-TIME SYNC
     Sets up listeners that push cloud changes → localStorage
     ═══════════════════════════════════════════════════════ */

  let _unsubStrategies = null;
  let _unsubCalendars = null;
  let _unsubSettings = null;
  let _unsubProducts = null;

  function initFirestoreSync() {
    if (!isFirebaseReady()) return;
    console.log('[V6Store] 🔄 Setting up Firestore real-time sync...');

    // --- Strategies listener ---
    const stratCol = V6Firebase.userCollection('strategies');
    if (stratCol && !_unsubStrategies) {
      _unsubStrategies = stratCol.onSnapshot((snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return; // skip local writes
        const cloudStrategies = [];
        snapshot.forEach(doc => cloudStrategies.push(doc.data()));
        if (cloudStrategies.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudStrategies));
          console.log('[V6Store] ☁️ Strategies synced from cloud:', cloudStrategies.length);
          window.dispatchEvent(new CustomEvent('v6:cloudSync', { detail: { type: 'strategies' } }));
        }
      }, err => console.warn('[V6Store] Strategies listener error:', err.message));
    }

    // --- Calendars listener ---
    const calCol = V6Firebase.userCollection('calendars');
    if (calCol && !_unsubCalendars) {
      _unsubCalendars = calCol.onSnapshot((snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;
        const cloudCalendars = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.cards) cloudCalendars[doc.id] = data.cards;
        });
        if (Object.keys(cloudCalendars).length > 0) {
          localStorage.setItem(CALENDAR_KEY, JSON.stringify(cloudCalendars));
          console.log('[V6Store] ☁️ Calendars synced from cloud');
          window.dispatchEvent(new CustomEvent('v6:cloudSync', { detail: { type: 'calendars' } }));
        }
      }, err => console.warn('[V6Store] Calendars listener error:', err.message));
    }

    // --- Settings listener ---
    const settingsRef = V6Firebase.userDoc('settings', 'main');
    if (settingsRef && !_unsubSettings) {
      _unsubSettings = settingsRef.onSnapshot((doc) => {
        if (!doc.exists || doc.metadata.hasPendingWrites) return;
        const data = doc.data();
        if (data.apiKey !== undefined) localStorage.setItem(API_KEY_KEY, data.apiKey);
        if (data.layerModels) localStorage.setItem(LAYER_MODELS_KEY, JSON.stringify(data.layerModels));
        if (data.deepThinking !== undefined) localStorage.setItem(THINKING_KEY, data.deepThinking ? 'true' : 'false');
        console.log('[V6Store] ☁️ Settings synced from cloud');
        window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
      }, err => console.warn('[V6Store] Settings listener error:', err.message));
    }

    // --- Product Reference listener ---
    const productsRef = V6Firebase.userDoc('settings', 'products');
    if (productsRef && !_unsubProducts) {
      _unsubProducts = productsRef.onSnapshot((doc) => {
        if (!doc.exists || doc.metadata.hasPendingWrites) return;
        const data = doc.data();
        if (data.text !== undefined) localStorage.setItem(PRODUCT_REF_KEY, data.text);
        console.log('[V6Store] ☁️ Product reference synced from cloud');
      }, err => console.warn('[V6Store] Products listener error:', err.message));
    }
  }

  /** Migrate existing localStorage data → Firestore (one-time on first sign-in) */
  async function migrateToCloud() {
    if (!isFirebaseReady()) return;

    const migrated = localStorage.getItem('v6_firebase_migrated');
    if (migrated) {
      console.log('[V6Store] Already migrated to cloud — skipping');
      return;
    }

    console.log('[V6Store] 🚚 Migrating localStorage → Firestore...');

    try {
      // Migrate strategies
      const strategies = getAll();
      for (const s of strategies) {
        await V6Firebase.userDoc('strategies', s.id).set(s);
      }

      // Migrate calendars
      const calendars = getAllCalendars();
      for (const [stratId, cards] of Object.entries(calendars)) {
        await V6Firebase.userDoc('calendars', stratId).set({ cards, updated_at: new Date().toISOString() });
      }

      // Migrate settings
      const apiKey = getApiKey();
      const models = getLayerModels();
      const deep = getDeepThinkingMode();
      await V6Firebase.userDoc('settings', 'main').set({
        apiKey: apiKey || '',
        layerModels: models,
        deepThinking: deep,
        updated_at: new Date().toISOString()
      });

      // Migrate product reference
      const productRef = localStorage.getItem(PRODUCT_REF_KEY);
      if (productRef) {
        await V6Firebase.userDoc('settings', 'products').set({
          text: productRef,
          updated_at: new Date().toISOString()
        });
      }

      localStorage.setItem('v6_firebase_migrated', new Date().toISOString());
      console.log('[V6Store] ✅ Migration complete!');
    } catch (err) {
      console.error('[V6Store] Migration error:', err);
    }
  }

  /** Stop all Firestore listeners */
  function stopFirestoreSync() {
    if (_unsubStrategies) { _unsubStrategies(); _unsubStrategies = null; }
    if (_unsubCalendars)  { _unsubCalendars();  _unsubCalendars = null; }
    if (_unsubSettings)   { _unsubSettings();   _unsubSettings = null; }
    if (_unsubProducts)   { _unsubProducts();   _unsubProducts = null; }
    console.log('[V6Store] Firestore listeners stopped');
  }

  /* ─── Cross-tab Sync (legacy, still works) ─── */
  function initStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'v6_settings') {
        try {
          const settings = JSON.parse(e.newValue || '{}');
          if (settings.apiKey) {
            localStorage.setItem(API_KEY_KEY, settings.apiKey);
            window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
          }
        } catch(err) {}
      }
    });
  }

  /* ─── Auto-Init ─── */
  if (typeof window !== 'undefined') {
    initStorageListener();

    // When Firebase auth is ready, start sync
    window.addEventListener('v6:firebaseReady', () => {
      migrateToCloud().then(() => {
        initFirestoreSync();
      });
    });

    // When user signs out, stop listeners
    window.addEventListener('v6:authChanged', (e) => {
      if (!e.detail.user) {
        stopFirestoreSync();
      }
    });
  }

  return {
    list, getById, getApprovedForMonth, save, update, approve, remove, exportJSON,
    saveApiKey, getApiKey, clearApiKey,
    saveLayerModels, getLayerModels,
    saveGeminiModel, getGeminiModel, saveDeepThinkingMode, getDeepThinkingMode,
    saveProductReference, getProductReference, parseProductCSV,
    saveCalendar, getCalendar, updateCard, deleteCard, lockCalendar,
    resetCalendarPlan, initStorageListener,
    initFirestoreSync, migrateToCloud, stopFirestoreSync,
  };
})();
