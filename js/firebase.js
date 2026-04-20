/* ================================================
   V.6 Content OS — Firebase Integration
   Shared Firestore (No Auth Required)
   All devices read/write to the same path
   ================================================ */

(function () {
  'use strict';

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

  /* ─── Shared Path (no auth needed) ─── */
  const SHARED_ROOT = 'deblu';

  /** Get a Firestore doc reference under the shared path */
  function sharedDoc(collection, docId) {
    return db.collection('shared').doc(SHARED_ROOT).collection(collection).doc(docId);
  }

  /** Get a Firestore collection reference under the shared path */
  function sharedCollection(collectionName) {
    return db.collection('shared').doc(SHARED_ROOT).collection(collectionName);
  }

  /* ─── Expose Global API ─── */
  window.V6Firebase = {
    app,
    db,
    sharedDoc,
    sharedCollection,
    isReady: true,
  };

  // Signal that Firebase is ready
  window.dispatchEvent(new CustomEvent('v6:firebaseReady'));

  console.log('[Firebase] V6Firebase initialized (shared mode, no auth) ✅');
})();
