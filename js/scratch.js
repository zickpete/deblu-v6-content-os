/**
 * V.6 Content OS — Scratch Bridge
 * Propagation Guard & Global Sync Dispatcher
 */

window.V6Sync = (function() {
  
  /**
   * Dispatches a global event that all layers can listen to.
   * Useful for immediate UI updates when settings change.
   */
  function broadcastSettingsUpdate() {
    console.log('[V6Sync] Broadcasting settings update event...');
    window.dispatchEvent(new CustomEvent('v6:settingsUpdated'));
  }

  /**
   * Listen for Storage events to sync settings across multiple open tabs.
   * If the API Key changes in one tab, the others should know.
   */
  function initStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'v6_api_key' || event.key === 'v6_layer_models') {
        console.log('[V6Sync] Cross-tab settings change detected:', event.key);
        broadcastSettingsUpdate();
      }
    });
  }

  return {
    broadcast: broadcastSettingsUpdate,
    init: initStorageListener
  };
})();

// Auto-init on load
document.addEventListener('DOMContentLoaded', window.V6Sync.init);
