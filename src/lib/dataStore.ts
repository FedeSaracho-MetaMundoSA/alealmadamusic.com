import { loadFromFirebase, subscribeToFirebase, saveToFirebase } from "./firebase";

export const SECTION_KEYS = {
  hero: "ale_almada_hero",
  bio: "ale_almada_bio",
  sets: "ale_almada_sets",
  events: "ale_almada_events",
  sponsors: "ale_almada_sponsors",
  videos: "ale_almada_videos",
  photos: "ale_almada_photos",
  radioConfig: "sonica_radio_config"
} as const;

export type SectionKey = keyof typeof SECTION_KEYS;

let globalStoreState: Record<string, any> = {};
let isFirebaseConnected = false;

// Populate initial state from localStorage
for (const [key, lsKey] of Object.entries(SECTION_KEYS)) {
  const raw = typeof window !== "undefined" ? localStorage.getItem(lsKey) : null;
  if (raw) {
    try {
      globalStoreState[key] = JSON.parse(raw);
    } catch (e) {}
  }
}

/**
 * Applies new store data, updates localStorage and notifies listeners.
 */
export function applyStoreData(data: Record<string, any>) {
  if (!data || typeof data !== "object") return;

  let hasNew = false;
  for (const [key, lsKey] of Object.entries(SECTION_KEYS)) {
    if (data[key] !== undefined && data[key] !== null) {
      globalStoreState[key] = data[key];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(lsKey, JSON.stringify(data[key]));
        } catch (e) {}
      }
      hasNew = true;
    }
  }

  if (hasNew && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ale_almada_update", { detail: globalStoreState }));
  }
}

/**
 * Initializes listeners for Firebase Realtime updates.
 */
export function initDataStore(onUpdate?: (data: Record<string, any>) => void) {
  if (typeof window === "undefined") return () => {};

  // 1. Load from Firebase Cloud (Single Source of Truth)
  loadFromFirebase().then((fbData) => {
    if (fbData) {
      isFirebaseConnected = true;
      applyStoreData(fbData);
      if (onUpdate) onUpdate(globalStoreState);
    }
  });

  // 2. Realtime listener from Firebase
  const unsubFirebase = subscribeToFirebase((fbData) => {
    if (fbData) {
      isFirebaseConnected = true;
      applyStoreData(fbData);
      if (onUpdate) onUpdate(globalStoreState);
    }
  });

  // 3. Fallback server store load ONLY if Firebase hasn't delivered and local state is thin
  if (!isFirebaseConnected) {
    fetch("/api/store")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status !== "empty" && !isFirebaseConnected) {
          applyStoreData(data);
          if (onUpdate) onUpdate(globalStoreState);
        }
      })
      .catch(() => {});
  }

  return unsubFirebase;
}

/**
 * Helper to safely get data for a given section with fallback.
 */
export function getSectionData<T>(key: SectionKey, fallback: T): T {
  if (globalStoreState[key] !== undefined && globalStoreState[key] !== null) {
    return globalStoreState[key] as T;
  }
  if (typeof window !== "undefined") {
    const lsKey = SECTION_KEYS[key];
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== undefined && parsed !== null) {
          globalStoreState[key] = parsed;
          return parsed as T;
        }
      } catch (e) {}
    }
  }
  return fallback;
}

/**
 * Saves full or partial payload to Firebase, LocalStorage and Server API.
 */
export async function persistAllStoreData(payload: Record<string, any>) {
  // 1. Immediate local update
  applyStoreData(payload);

  // 2. Cloud Firestore persist
  await saveToFirebase(payload).catch((err) => console.warn("Cloud save warning:", err));

  // 3. Server API persist
  await fetch("/api/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify(payload)
  }).catch((err) => console.warn("Server API store error:", err));
}
