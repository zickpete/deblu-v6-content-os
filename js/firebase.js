/* ================================================
   V.6 Content OS — Firebase Integration
   Single-Document Team Sync Mode
   ================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'v6_team_sync_id';
  let teamId = localStorage.getItem(STORAGE_KEY) || 'DEBLU-V6';

  const firebaseConfig = {
    apiKey: 'AIzaSyCZJXFRIVSHiSiwQPwgYxDdmZ1o703t9Wo',
    authDomain: 'deblu-v6.firebaseapp.com',
    projectId: 'deblu-v6',
    storageBucket: 'deblu-v6.firebasestorage.app',
    messagingSenderId: '273922303320',
    appId: '1:273922303320:web:e298b3e3c4a8eb493f312d',
    measurementId: 'G-23JN8KWP1R'
  };

  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Robust Persistence for Mobile
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => console.log('[Firebase] Persistence Enabled ✅'))
    .catch((err) => {
      console.warn('[Firebase] Persistence Failed:', err.code);
      // App continues in memory/cloud mode regardless of local persistence success
    });

  function getTeamDoc() {
    return db.collection('deblu_shared_data').doc(teamId);
  }

  function setTeamSyncId(newId) {
    if (!newId) return;
    const cleanId = newId.trim().toUpperCase().replace(/\s+/g, '-');
    teamId = cleanId;
    localStorage.setItem(STORAGE_KEY, cleanId);
    window.dispatchEvent(new CustomEvent('v6:teamIdChanged', { detail: { teamId: cleanId } }));
  }

  function getTeamSyncId() {
    return teamId;
  }

  window.V6Firebase = {
    app, db, getTeamDoc, setTeamSyncId, getTeamSyncId, isReady: true,
  };

  window.dispatchEvent(new CustomEvent('v6:firebaseReady'));
  console.log('[Firebase] Ready (Team:', teamId, ')');
})();
