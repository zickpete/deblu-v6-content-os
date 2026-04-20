/* ================================================
   V.6 Content OS — Firebase Integration
   Auth (Google) + Firestore (Cloud Sync)
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
  const auth = firebase.auth();
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  // Enable Firestore offline persistence
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => console.log('[Firebase] Offline persistence enabled ✅'))
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Persistence failed: Multiple tabs open. Only one tab can use persistence at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Persistence not available in this browser.');
      }
    });

  /* ─── State ─── */
  let currentUser = null;
  const authCallbacks = [];

  /* ─── Auth State Listener ─── */
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    console.log('[Firebase] Auth state:', user ? `${user.displayName} (${user.email})` : 'Not signed in');

    // Notify all registered callbacks
    authCallbacks.forEach(cb => {
      try { cb(user); } catch (e) { console.error('[Firebase] Auth callback error:', e); }
    });

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('v6:authChanged', { detail: { user } }));

    // If user just signed in, trigger data migration from localStorage → Firestore
    if (user) {
      window.dispatchEvent(new CustomEvent('v6:firebaseReady', { detail: { user } }));
    }
  });

  /* ─── Public API ─── */

  /** Sign in with Google popup */
  async function signIn() {
    try {
      const result = await auth.signInWithPopup(googleProvider);
      console.log('[Firebase] Signed in as:', result.user.displayName);
      return result.user;
    } catch (err) {
      console.error('[Firebase] Sign-in error:', err);
      // Show user-friendly error
      if (err.code === 'auth/popup-closed-by-user') {
        console.log('[Firebase] Sign-in popup closed by user');
      } else if (err.code === 'auth/network-request-failed') {
        console.error('[Firebase] Network error during sign-in');
      }
      throw err;
    }
  }

  /** Sign out */
  async function signOut() {
    try {
      await auth.signOut();
      currentUser = null;
      console.log('[Firebase] Signed out');
    } catch (err) {
      console.error('[Firebase] Sign-out error:', err);
    }
  }

  /** Get current user (or null) */
  function getUser() {
    return currentUser;
  }

  /** Get user UID (or null) */
  function getUid() {
    return currentUser ? currentUser.uid : null;
  }

  /** Register an auth state change callback */
  function onAuthChange(callback) {
    authCallbacks.push(callback);
    // Immediately call with current state
    if (currentUser !== undefined) {
      try { callback(currentUser); } catch (e) {}
    }
  }

  /** Get a user-scoped Firestore doc reference */
  function userDoc(collection, docId) {
    const uid = getUid();
    if (!uid) return null;
    return db.collection('users').doc(uid).collection(collection).doc(docId);
  }

  /** Get a user-scoped Firestore collection reference */
  function userCollection(collectionName) {
    const uid = getUid();
    if (!uid) return null;
    return db.collection('users').doc(uid).collection(collectionName);
  }

  /* ─── Expose Global API ─── */
  window.V6Firebase = {
    app,
    db,
    auth,
    signIn,
    signOut,
    getUser,
    getUid,
    onAuthChange,
    userDoc,
    userCollection,
  };

  console.log('[Firebase] V6Firebase initialized ✅');
})();
