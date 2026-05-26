/**
 * resumeStorage.js
 * Handles uploading resume PDFs to Supabase Storage and persisting the URL to the backend.
 *
 * Bucket: "resumes"  (public bucket — create it in Supabase Dashboard →
 *   Storage → New bucket → name: "resumes" → Public: ON)
 *
 * File path pattern: {userId}/{timestamp}_{filename}
 */

import { supabase } from './supabaseClient';

const BUCKET = 'resumes';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Upload a resume File object to Supabase Storage and persist the URL to the DB.
 * Returns { url, path } on success, throws on failure.
 *
 * @param {File}   file    - The PDF File object from an <input type="file">
 * @param {string} userId  - The authenticated user's ID (used as folder name)
 */
export async function uploadResume(file, userId) {
  if (!file || !userId) throw new Error('file and userId are required');

  // Sanitise filename — remove spaces and special chars
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: true,          // overwrite if same path exists
    });

  if (uploadError) throw uploadError;

  // Get the permanent public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get public URL for uploaded resume');

  const url = data.publicUrl;

  // Persist URL to backend DB (best-effort — don't block on failure)
  try {
    await fetch(`${API_URL}/profile-assets/${userId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetType:   'resume',
        fileName:    file.name,
        mimeType:    'application/pdf',
        assetUrl:    url,
        storagePath: path,
      }),
    });
  } catch (e) {
    console.warn('[resumeStorage] Failed to persist URL to backend (non-critical):', e.message);
  }

  return { url, path };
}

/**
 * Delete a previously uploaded resume from Supabase Storage.
 * Silently ignores errors (best-effort cleanup).
 *
 * @param {string} path - The storage path returned by uploadResume()
 */
export async function deleteResume(path) {
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (e) {
    console.warn('[resumeStorage] delete failed (non-critical):', e.message);
  }
}
