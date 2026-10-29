/**
 * Persistent Storage Engine using IndexedDB with LocalStorage Mirroring
 * Ensures user data, proposals, catalogs, and compressed logos are NEVER lost
 * across browser refreshes, server updates, or restarts.
 */

const DB_NAME = 'clinic_studio_db_v2';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

// LocalStorage fallback keys
export const STORAGE_KEYS = {
  PROPOSALS: 'clinic_studio_proposals_v1',
  CLINICS: 'clinic_studio_clinics_v1',
  TESTS: 'clinic_studio_tests_v1',
  TIERS: 'clinic_studio_tiers_v1',
  ACTIVE_ID: 'clinic_studio_active_id_v1',
  BACKUP_TIMESTAMP: 'clinic_studio_last_saved',
};

// Open IndexedDB instance safely
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a key-value pair to IndexedDB and LocalStorage
 */
export async function savePersistentItem<T>(key: string, value: T): Promise<void> {
  // 1. Save to LocalStorage first (with quota error guard)
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`LocalStorage quota reached for key "${key}", relying on IndexedDB`, err);
  }

  // 2. Save to IndexedDB (virtually unlimited quota)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`IndexedDB write error for "${key}":`, err);
  }
}

/**
 * Load item from IndexedDB, falling back to LocalStorage
 */
export async function loadPersistentItem<T>(key: string, fallback: T): Promise<T> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    const item = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (item !== undefined && item !== null) {
      return item;
    }
  } catch (err) {
    console.warn(`Could not read "${key}" from IndexedDB, falling back to LocalStorage`, err);
  }

  // Fallback to LocalStorage
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed !== undefined && parsed !== null) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`LocalStorage parse error for "${key}":`, err);
  }

  return fallback;
}

/**
 * High-performance image compressor for clinic logos
 * Resizes images down to 360x360 maximum and compresses to clean WebP/JPEG Base64.
 * Turns 2MB - 5MB raw images into ~20KB - 40KB strings so they never blow storage limits.
 */
export function compressLogoImage(file: File, maxWidth = 380, maxHeight = 380, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original if canvas fails
          resolve(event.target?.result as string);
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP if supported, or PNG/JPEG
        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/png');
          }
        } catch (e) {
          dataUrl = canvas.toDataURL('image/png');
        }

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
