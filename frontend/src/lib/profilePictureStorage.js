/**
 * profilePictureStorage.js
 * Handles uploading profile pictures to Supabase Storage and returning a public URL.
 *
 * Bucket: "profile-pictures"  (public bucket — create it in Supabase Dashboard →
 *   Storage → New bucket → name: "profile-pictures" → Public: ON)
 *
 * File path pattern: {userId}/{timestamp}_{filename}
 */

import { supabase } from './supabaseClient';

const BUCKET = 'profile-pictures';

/**
 * Upload a profile picture File object to Supabase Storage.
 * Returns { url, path } on success, throws on failure.
 *
 * @param {File}   file    - The image File object from an <input type="file">
 * @param {string} userId  - The authenticated user's ID (used as folder name)
 */
export async function uploadProfilePicture(file, userId) {
  if (!file || !userId) throw new Error('file and userId are required');

  // Sanitise filename — remove spaces and special chars
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,          // overwrite if same path exists
    });

  if (uploadError) throw uploadError;

  // Get the permanent public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get public URL for uploaded profile picture');

  return { url: data.publicUrl, path };
}

/**
 * Delete a previously uploaded profile picture from Supabase Storage.
 * Silently ignores errors (best-effort cleanup).
 *
 * @param {string} path - The storage path returned by uploadProfilePicture()
 */
export async function deleteProfilePicture(path) {
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (e) {
    console.warn('[profilePictureStorage] delete failed (non-critical):', e.message);
  }
}
