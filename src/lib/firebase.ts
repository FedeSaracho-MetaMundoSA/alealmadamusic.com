import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDoc, setDoc, onSnapshot, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose firebase internal logs
setLogLevel('silent');

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== ''
  ? firebaseConfig.firestoreDatabaseId
  : '(default)';

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, dbId);
} catch (e) {
  try {
    firestoreDb = getFirestore(app, dbId);
  } catch (err2) {
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;

export const STORE_DOC_REF = doc(db, "app_data", "main");

const SECTION_KEYS = ["hero", "bio", "sets", "events", "sponsors", "videos", "photos", "radioConfig"];

// Clean undefined values and preserve base64 images for Firestore
function cleanForFirestore(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(cleanForFirestore).filter(item => item !== undefined);
  }
  if (typeof val === 'object') {
    const obj: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      const sanitized = cleanForFirestore(val[key]);
      if (sanitized !== undefined) {
        obj[key] = sanitized;
      }
    }
    return obj;
  }
  return val;
}

export async function saveToFirebase(data: Record<string, any>) {
  try {
    const cleaned = cleanForFirestore(data);
    
    // 1. Try to save full main payload
    setDoc(STORE_DOC_REF, cleaned, { merge: true }).catch((err) => {
      console.warn("Main Firestore doc sync warning:", err);
    });

    // 2. Save each section document individually so single large section never blocks others
    for (const key of SECTION_KEYS) {
      if (cleaned[key] !== undefined) {
        const docRef = doc(db, "app_data", key);
        await setDoc(docRef, { [key]: cleaned[key] }, { merge: true }).catch((err) => {
          console.warn(`Firestore doc ${key} sync warning:`, err);
        });
      }
    }
    console.log("Global data successfully synced to Firebase Cloud Database!");
  } catch (err) {
    console.error("Firebase cloud sync error:", err);
  }
}

export async function loadFromFirebase() {
  try {
    const mergedData: Record<string, any> = {};

    // Load main doc
    const mainSnap = await getDoc(STORE_DOC_REF).catch(() => null);
    if (mainSnap && mainSnap.exists()) {
      Object.assign(mergedData, mainSnap.data());
    }

    // Load individual section docs
    for (const key of SECTION_KEYS) {
      const sectionSnap = await getDoc(doc(db, "app_data", key)).catch(() => null);
      if (sectionSnap && sectionSnap.exists()) {
        const d = sectionSnap.data();
        if (d && d[key] !== undefined) {
          mergedData[key] = d[key];
        }
      }
    }

    return Object.keys(mergedData).length > 0 ? mergedData : null;
  } catch (err) {
    console.warn("Firebase cloud load info:", err);
  }
  return null;
}

export function subscribeToFirebase(callback: (data: any) => void) {
  const unsubscribers: Array<() => void> = [];

  // Main doc listener
  unsubscribers.push(
    onSnapshot(
      STORE_DOC_REF,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data());
        }
      },
      (err) => console.warn("Firestore main listener info:", err)
    )
  );

  // Individual section listeners for real-time sync across all visitors
  for (const key of SECTION_KEYS) {
    unsubscribers.push(
      onSnapshot(
        doc(db, "app_data", key),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            if (d && d[key] !== undefined) {
              callback({ [key]: d[key] });
            }
          }
        },
        (err) => console.warn(`Firestore listener info for ${key}:`, err)
      )
    );
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try { unsub(); } catch (e) {}
    });
  };
}

export async function saveUploadedFileToFirebase(fileId: string, base64Data: string, mimeType: string = "image/jpeg"): Promise<string> {
  try {
    const fileDocRef = doc(db, "uploaded_files", fileId);
    await setDoc(fileDocRef, {
      data: base64Data,
      mimeType,
      createdAt: Date.now()
    });
    return base64Data;
  } catch (e) {
    console.warn("Could not save file to Firestore uploaded_files:", e);
    return base64Data;
  }
}

export async function getUploadedFileFromFirebase(fileId: string): Promise<string | null> {
  try {
    const fileDocRef = doc(db, "uploaded_files", fileId);
    const snap = await getDoc(fileDocRef);
    if (snap.exists()) {
      return snap.data()?.data || null;
    }
  } catch (e) {
    console.warn("Could not fetch file from Firestore uploaded_files:", e);
  }
  return null;
}



