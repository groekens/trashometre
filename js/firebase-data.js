// ─────────────────────────────────────────────────────────────────────────────
// Trashomètre — Couche données Firebase + persistance offline
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, addDoc, serverTimestamp,
  query, collection, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpNbXffRyvWzoRkL8ndupe3D-v5P7pYGg",
  authDomain: "trashometre-4afb3.firebaseapp.com",
  projectId: "trashometre-4afb3",
  storageBucket: "trashometre-4afb3.firebasestorage.app",
  messagingSenderId: "659169563910",
  appId: "1:659169563910:web:ebad5ee0110c0d11163a87"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Firestore with offline persistence — works across multiple tabs
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// ── AUTH ─────────────────────────────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export async function signInEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export async function registerEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
export async function logout() {
  return signOut(auth);
}

// ── CONFIG (user document) ───────────────────────────────────────────────────
export async function loadUserConfig(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'meta', 'config'));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Backwards compat: old docs may not have `configured` field
  if (data.persons && data.configured === undefined) data.configured = true;
  return data;
}
export async function saveUserConfig(uid, config) {
  await setDoc(doc(db, 'users', uid, 'meta', 'config'), {
    ...config,
    configured: true,
    updatedAt: new Date().toISOString(),
  });
}

// ── ENTRIES ──────────────────────────────────────────────────────────────────
export function listenEntries(uid, onUpdate) {
  const q = query(collection(db, 'users', uid, 'entries'), orderBy('date', 'desc'));
  return onSnapshot(q, snap => {
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(entries);
  }, err => {
    console.error('Firestore listener error:', err);
  });
}

export async function addEntry(uid, entry) {
  await setDoc(doc(db, 'users', uid, 'entries', entry.id), entry);
}

export async function removeEntry(uid, entryId) {
  await deleteDoc(doc(db, 'users', uid, 'entries', entryId));
}

export async function deleteAllEntries(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'entries'));
  if (snap.empty) return 0;
  // Use batch for atomicity (max 500 ops per batch)
  const batches = [];
  let batch = writeBatch(db);
  let count = 0;
  let opsInBatch = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    count++;
    opsInBatch++;
    if (opsInBatch === 500) {
      batches.push(batch.commit());
      batch = writeBatch(db);
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) batches.push(batch.commit());
  await Promise.all(batches);
  return count;
}

// ── FEEDBACK ─────────────────────────────────────────────────────────────────
export async function submitFeedback({ type, message, email, userId, userEmail, lang, userAgent }) {
  const data = {
    type,
    message,
    email: email || null,
    userId: userId || null,
    userEmail: userEmail || null,
    lang: lang || 'fr',
    userAgent: userAgent || null,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, 'feedback'), data);
}
