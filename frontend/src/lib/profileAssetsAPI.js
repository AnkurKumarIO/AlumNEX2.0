/**
 * profileAssetsAPI.js
 * Unified profile asset management — uploads to Supabase Storage,
 * then persists the public URL to the backend profile_assets table.
 *
 * Buckets required (create in Supabase Dashboard → Storage):
 *   - "profile-pictures"  (Public: ON)
 *   - "resumes"           (Public: ON)
 */

import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const BUCKETS = {
  photo:  'profile-pictures',
  resume: 'resumes',
};

/**
 * Upload a profile asset (photo or resume) to Supabase Storage,
 * then persist the public URL to the backend profile_assets table.
 *
 * @param {string} userId    - Authenticated user ID
 * @param {string} assetType - 'photo' or 'resume'
 * @param {File}   file      - File object from <input type="file">
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadProfileAsset(userId, assetType, file) {
  if (!userId || !assetType || !file) throw new Error('userId, assetType, and file are required');
  if (!['photo', 'resume'].includes(assetType)) throw new Error('assetType must be "photo" or "resume"');

  const bucket = BUCKETS[assetType];
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${Date.now()}_${safeName}`;

  console.log(`[ProfileAssetsAPI] Uploading ${assetType} to Supabase Storage bucket "${bucket}"...`);

  // 1. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type || (assetType === 'resume' ? 'application/pdf' : 'image/jpeg'),
      upsert: true,
    });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // 2. Get permanent public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  if (!urlData?.publicUrl) throw new Error('Could not get public URL from Supabase Storage');

  const url = urlData.publicUrl;
  console.log(`[ProfileAssetsAPI] ✓ Uploaded to Storage: ${url}`);

  // 3. Persist URL to backend profile_assets table (best-effort)
  try {
    const res = await fetch(`${API_URL}/profile-assets/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetType,
        fileName:    file.name,
        mimeType:    file.type,
        assetUrl:    url,
        storagePath,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`[ProfileAssetsAPI] Backend persist failed (non-critical): ${err.error || res.status}`);
    } else {
      console.log(`[ProfileAssetsAPI] ✓ URL persisted to profile_assets table`);
    }
  } catch (e) {
    console.warn(`[ProfileAssetsAPI] Backend unreachable (non-critical): ${e.message}`);
  }

  return { url, path: storagePath };
}

/**
 * Get a specific profile asset URL for a user.
 * Checks backend profile_assets table first (has assetUrl),
 * falls back to Supabase Storage direct listing.
 *
 * @param {string} userId    - User ID
 * @param {string} assetType - 'photo' or 'resume'
 * @returns {Promise<{ assetUrl: string, fileName: string } | null>}
 */
export async function getProfileAsset(userId, assetType) {
  try {
    const response = await fetch(`${API_URL}/profile-assets/${userId}/${assetType}`);

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    // Return assetUrl (Supabase Storage URL) — fileData (base64) is legacy
    return {
      assetUrl:  result.assetUrl  || null,
      fileData:  result.fileData  || null,  // legacy fallback
      fileName:  result.fileName  || null,
      mimeType:  result.mimeType  || null,
      fileSize:  result.fileSize  || null,
    };
  } catch (err) {
    console.warn(`[ProfileAssetsAPI] getProfileAsset failed: ${err.message}`);
    return null;
  }
}

/**
 * Get all profile assets for a user.
 * @param {string} userId
 * @returns {Promise<{ photo?: Object, resume?: Object }>}
 */
export async function getAllProfileAssets(userId) {
  try {
    const response = await fetch(`${API_URL}/profile-assets/${userId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn(`[ProfileAssetsAPI] getAllProfileAssets failed: ${err.message}`);
    return {};
  }
}

/**
 * Delete a profile asset from both Supabase Storage and the backend table.
 * @param {string} userId
 * @param {string} assetType - 'photo' or 'resume'
 * @param {string} [storagePath] - Optional storage path for deletion from bucket
 */
export async function deleteProfileAsset(userId, assetType, storagePath) {
  // Delete from Supabase Storage if path provided
  if (storagePath) {
    try {
      await supabase.storage.from(BUCKETS[assetType]).remove([storagePath]);
      console.log(`[ProfileAssetsAPI] ✓ Deleted from Storage`);
    } catch (e) {
      console.warn(`[ProfileAssetsAPI] Storage delete failed (non-critical): ${e.message}`);
    }
  }

  // Delete from backend table
  try {
    const response = await fetch(`${API_URL}/profile-assets/${userId}/${assetType}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(`[ProfileAssetsAPI] ✓ Deleted from profile_assets table`);
  } catch (err) {
    console.warn(`[ProfileAssetsAPI] Backend delete failed: ${err.message}`);
  }
}

/**
 * Helper: Compress image File before upload (reduces storage size).
 * Returns a new File object with compressed JPEG data.
 *
 * @param {File}   file     - Original image File
 * @param {number} maxWidth - Max width in px (default 800)
 * @param {number} quality  - JPEG quality 0–1 (default 0.8)
 * @returns {Promise<File>}
 */
export function compressImageFile(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (!blob) { resolve(file); return; } // fallback to original
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Legacy helpers kept for backward compatibility
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** @deprecated Use compressImageFile instead */
export function compressImage(base64, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = base64;
  });
}

export default { uploadProfileAsset, getProfileAsset, getAllProfileAssets, deleteProfileAsset, compressImageFile, fileToBase64, compressImage };
