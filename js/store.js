/* ================================================
   V.6 Content OS — Store (Dual-Write State Manager)
   Hardened Team Sync Edition
   ================================================ */

window.V6Store = (function () {
  const STORAGE_KEY    = 'v6_strategies';
  const CALENDAR_KEY   = 'v6_calendars';
  const API_KEY_KEY    = 'v6_settings_apiKey';
  const THINKING_KEY   = 'v6_deep_thinking';
  const PRODUCT_REF_KEY = 'v6_product_reference';
  const LAYER_MODELS_KEY = 'v6_layer_models';

  /* ─── State Helpers ─── */
  const generateId = () => 'str_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const generateTrackId = () => 'trk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const isFirebaseReady = () => !!(window.V6Firebase && V6Firebase.isReady);

  function fsUpdate(field, data) {
    if (!isFirebaseReady()) return;
    V6Firebase.getTeamDoc().set({ [field]: data, updated_at: new Date().toISOString() }, { merge: true })
      .catch(err => console.warn('[V6Store] Cloud Update Fail:', err.message));
  }

  /* ─── LocalStorage Access ─── */
  function getAll() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; } }
  function saveAll(strategies) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
    fsUpdate('strategies', strategies);
  }

  /* ─── Public API ─── */
  const list = () => getAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const getById = (id) => getAll().find(s => s.id === id) || null;

  function save({ month, core_products, special_events, aiResponse }) {
    const all = getAll();
    const s = {
      id: generateId(), created_at: new Date().toISOString(), month, core_products, special_events,
      status: 'draft', monthly_theme: aiResponse.monthly_theme || '',
      mood_and_tone: aiResponse.mood_and_tone || {},
      campaign_tracks: (aiResponse.campaign_tracks || []).map(t => ({ ...t, id: t.id || generateTrackId() }))
    };
    all.unshift(s);
    saveAll(all);
    return s;
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
    const s = update(id, { status: 'approved', approved_at: new Date().toISOString() });
    if (s) window.dispatchEvent(new CustomEvent('v6:strategyApproved', { detail: s }));
    return s;
  }

  function remove(id) { saveAll(getAll().filter(s => s.id !== id)); }

  /* ─── Calendar ─── */
  function getAllCalendars() { try { return JSON.parse(localStorage.getItem(CALENDAR_KEY)) || {}; } catch (e) { return {}; } }
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
  function getCalendar(id) { return getAllCalendars()[id] || []; }
  function updateCard(stratId, cardId, changes) {
    const all = getAllCalendars();
    const cards = all[stratId] || [];
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1) return null;
    cards[idx] = { ...cards[idx], ...changes, updated_at: new Date().toISOString() };
    all[stratId] = cards;
    saveAllCalendars(all);
    return cards[idx];
  }
  function deleteCard(stratId, cardId) {
    const all = getAllCalendars();
    all[stratId] = (all[stratId] || []).filter(c => c.id !== cardId);
    saveAllCalendars(all);
    return true;
  }
  function lockCalendar(id) {
    const s = update(id, { calendar_locked: true, calendar_locked_at: new Date().toISOString() });
    if (s) window.dispatchEvent(new CustomEvent('v6:calendarLocked', { detail: s }));
    return s;
  }

  /* ─── Settings ─── */
  function saveApiKey(key) { localStorage.setItem(API_KEY_KEY, key); syncSettings(); }
  function getApiKey() { return localStorage.getItem(API_KEY_KEY); }
  function saveLayerModels(map) { localStorage.setItem(LAYER_MODELS_KEY, JSON.stringify(map)); syncSettings(); }
  function getLayerModels() { 
    try { return JSON.parse(localStorage.getItem(LAYER_MODELS_KEY)) || { layer0: 'gemini-1.5-pro', layer1: 'gemini-1.5-flash', layer2: 'gemini-1.5-flash' }; }
    catch(e) { return { layer0: 'gemini-1.5-pro', layer1: 'gemini-1.5-flash', layer2: 'gemini-1.5-flash' }; }
  }
  function saveDeepThinkingMode(isDeep) { localStorage.setItem(THINKING_KEY, isDeep ? 'true' : 'false'); syncSettings(); }
  function getDeepThinkingMode() { return localStorage.getItem(THINKING_KEY) === 'true'; }
  function syncSettings() { fsUpdate('settings', { apiKey: getApiKey() || '', layerModels: getLayerModels(), deepThinking: getDeepThinkingMode() }); }
  function saveProductReference(text) { localStorage.setItem(PRODUCT_REF_KEY, text || ''); fsUpdate('products', text || ''); }
  function getProductReference() { return localStorage.getItem(PRODUCT_REF_KEY) || ''; }

  /* ═══════════════════════════════════════════════════════
     CLOUD SYNC (HARDENED)
     ═══════════════════════════════════════════════════════ */

  let _unsubTeam = null;

  function processCloudData(data, isInitial = false) {
    if (!data) return;
    console.log('[V6Store] ☁️ Processing Cloud Data (Initial:', isInitial, ')');

    if (data.strategies) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.strategies));
    if (data.calendars) localStorage.setItem(CALENDAR_KEY, JSON.stringify(data.calendars));
    if (data.settings) {
      const s = data.settings;
      if (s.apiKey !== undefined) localStorage.setItem(API_KEY_KEY, s.apiKey);
      if (s.layerModels) localStorage.setItem(LAYER_MODELS_KEY, JSON.stringify(s.layerModels));
      if (s.deepThinking !== undefined) localStorage.setItem(THINKING_KEY, s.deepThinking ? 'true' : 'false');
    }
    if (data.products !== undefined) localStorage.setItem(PRODUCT_REF_KEY, data.products);

    // Notify UI
    window.dispatchEvent(new CustomEvent('v6:cloudSync', { detail: { isInitial } }));
    window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
  }

  async function initFirestoreSync() {
    if (!isFirebaseReady()) return;
    const teamId = V6Firebase.getTeamSyncId();
    const docRef = V6Firebase.getTeamDoc();

    if (_unsubTeam) _unsubTeam();

    // 1. Initial Fetch (Mandatory for Start)
    window.dispatchEvent(new CustomEvent('v6:syncStatus', { detail: { status: 'syncing' } }));
    try {
      const doc = await docRef.get();
      if (doc.exists) {
        processCloudData(doc.data(), true);
        window.dispatchEvent(new CustomEvent('v6:syncStatus', { detail: { status: 'synced' } }));
      } else {
        window.dispatchEvent(new CustomEvent('v6:syncStatus', { detail: { status: 'new' } }));
      }
    } catch (e) {
      console.warn('[V6Store] Initial Fetch Failed:', e.message);
      window.dispatchEvent(new CustomEvent('v6:syncStatus', { detail: { status: 'error' } }));
    }

    // 2. Real-time Listener
    _unsubTeam = docRef.onSnapshot((doc) => {
      // Cloud Priority: We process snapshots even if we have pending writes, 
      // but we filter out metadata-only changes to avoid loops.
      if (!doc.exists) return;
      
      const isFromCache = doc.metadata.fromCache;
      const hasPendingWrites = doc.metadata.hasPendingWrites;
      
      if (!hasPendingWrites) {
        processCloudData(doc.data());
        window.dispatchEvent(new CustomEvent('v6:syncStatus', { detail: { status: isFromCache ? 'cached' : 'synced' } }));
      }
    }, err => {
      console.warn('[V6Store] Real-time Sync Error:', err.message);
      window.dispatchEvent(new CustomEvent('v6:syncStatus', { detail: { status: 'error' } }));
    });
  }

  async function pushLocalToCloud() {
    if (!isFirebaseReady()) return;
    const teamId = V6Firebase.getTeamSyncId();
    const flagKey = `v6_push_${teamId}`;
    if (localStorage.getItem(flagKey)) return;

    const strategies = getAll();
    const calendars = getAllCalendars();
    const apiKey = getApiKey();
    
    if (strategies.length > 0 || Object.keys(calendars).length > 0 || apiKey) {
      console.log('[V6Store] 🚚 Pushing Local State to Cloud Room:', teamId);
      await V6Firebase.getTeamDoc().set({
        strategies, calendars, products: getProductReference(),
        settings: { apiKey: apiKey || '', layerModels: getLayerModels(), deepThinking: getDeepThinkingMode() },
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
    localStorage.setItem(flagKey, new Date().toISOString());
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('v6:firebaseReady', () => { pushLocalToCloud().then(() => initFirestoreSync()); });
    window.addEventListener('v6:teamIdChanged', () => { pushLocalToCloud().then(() => initFirestoreSync()); });
  }

  return {
    list, getById, save, update, approve, remove,
    saveApiKey, getApiKey, saveLayerModels, getLayerModels,
    saveDeepThinkingMode, getDeepThinkingMode,
    saveProductReference, getProductReference,
    saveCalendar, getCalendar, updateCard, deleteCard, lockCalendar,
    initFirestoreSync
  };
})();
