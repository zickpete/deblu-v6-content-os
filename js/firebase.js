/* ================================================
   V.6 Content OS — Firebase Integration
   Team Collaboration Mode (Dynamic Shared ID)
   ================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'v6_team_sync_id';
  
  // Default shared ID if none exists
  let sharedRoot = localStorage.getItem(STORAGE_KEY) || 'DEBLU-DEFAULT';

  /* ─── Firebase Config ─── */
  const firebaseConfig = {
    apiKey: 'AIzaSyCZJXFRIVSHiSiwQPwgYxDdmZ1o703t9Wo',
    authDomain: 'deblu-v6.firebaseapp.com',
    projectId: 'deblu-v6',
    storageBucket: 'deblu-v6.firebasestorage.app',
    messagingSenderId: '273922303320',
    appId: '1:273922303320:web:e298b3e3c4a8eb493f312d',
    measurementId: 'G-23JN8KWP1R'
  };

  /* ─── Initialize Firebase ─── */
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // Enable Firestore offline persistence
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => console.log('[Firebase] Offline persistence enabled ✅'))
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Persistence: Multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Persistence not available in this browser.');
      }
    });

  /** Get a Firestore doc reference under the current Team ID */
  function sharedDoc(collection, docId) {
    return db.collection('teams').doc(sharedRoot).collection(collection).doc(docId);
  }

  /** Get a Firestore collection reference under the current Team ID */
  function sharedCollection(collectionName) {
    return db.collection('teams').doc(sharedRoot).collection(collectionName);
  }

  /** Update the Team Sync ID and signal a reconnect */
  function setTeamSyncId(newId) {
    if (!newId) return;
    const cleanId = newId.trim().toUpperCase().replace(/\s+/g, '-');
    sharedRoot = cleanId;
    localStorage.setItem(STORAGE_KEY, cleanId);
    console.log('[Firebase] Team Sync ID updated to:', cleanId);
    window.dispatchEvent(new CustomEvent('v6:teamIdChanged', { detail: { teamId: cleanId } }));
  }

  function getTeamSyncId() {
    return sharedRoot;
  }

  /* ─── Expose Global API ─── */
  window.V6Firebase = {
    app,
    db,
    sharedDoc,
    sharedCollection,
    setTeamSyncId,
    getTeamSyncId,
    isReady: true,
  };

  // Signal that Firebase is ready
  window.dispatchEvent(new CustomEvent('v6:firebaseReady'));

  console.log('[Firebase] V6Firebase initialized (Team ID:', sharedRoot, ') ✅');
})();
