/**
 * Profile Assets API Client
 * Handles photo and resume storage in database instead of localStorage
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Upload or update a profile asset (photo or resume)
 * @param {string} userId - User ID
 * @param {string} assetType - 'photo' or 'resume'
 * @param {string} fileData - Base64 encoded file data
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type (e.g., 'image/jpeg', 'application/pdf')
 * @returns {Promise<Object>} Asset metadata
 */
export async function uploadProfileAsset(userId, assetType, fileData, fileName, mimeType) {
  try {
    console.log(`[ProfileAssetsAPI] Uploading ${assetType} for user ${userId}`);
    console.log(`[ProfileAssetsAPI] File size: ${(fileData.length / 1024).toFixed(2)}KB`);

    const response = await fetch(`${API_URL}/profile-assets/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetType,
        fileName,
        mimeType,
        fileData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[ProfileAssetsAPI] ✓ ${assetType} uploaded successfully`);
    return result;
  } catch (err) {
    console.error(`[ProfileAssetsAPI] Upload ${assetType} failed:`, err);
    throw err;
  }
}

/**
 * Get a specific profile asset
 * @param {string} userId - User ID
 * @param {string} assetType - 'photo' or 'resume'
 * @returns {Promise<Object>} Asset data including base64 fileData
 */
export async function getProfileAsset(userId, assetType) {
  try {
    console.log(`[ProfileAssetsAPI] Fetching ${assetType} for user ${userId}`);

    const response = await fetch(`${API_URL}/profile-assets/${userId}/${assetType}`, {
      method: 'GET',
    });

    if (response.status === 404) {
      console.log(`[ProfileAssetsAPI] ${assetType} not found for user ${userId}`);
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[ProfileAssetsAPI] ✓ ${assetType} fetched, size: ${(result.fileSize / 1024).toFixed(2)}KB`);
    return result;
  } catch (err) {
    console.error(`[ProfileAssetsAPI] Get ${assetType} failed:`, err);
    throw err;
  }
}

/**
 * Get all profile assets for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object with 'photo' and 'resume' keys
 */
export async function getAllProfileAssets(userId) {
  try {
    console.log(`[ProfileAssetsAPI] Fetching all assets for user ${userId}`);

    const response = await fetch(`${API_URL}/profile-assets/${userId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[ProfileAssetsAPI] ✓ Fetched assets:`, Object.keys(result));
    return result;
  } catch (err) {
    console.error(`[ProfileAssetsAPI] Get all assets failed:`, err);
    throw err;
  }
}

/**
 * Delete a profile asset
 * @param {string} userId - User ID
 * @param {string} assetType - 'photo' or 'resume'
 * @returns {Promise<void>}
 */
export async function deleteProfileAsset(userId, assetType) {
  try {
    console.log(`[ProfileAssetsAPI] Deleting ${assetType} for user ${userId}`);

    const response = await fetch(`${API_URL}/profile-assets/${userId}/${assetType}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    console.log(`[ProfileAssetsAPI] ✓ ${assetType} deleted successfully`);
  } catch (err) {
    console.error(`[ProfileAssetsAPI] Delete ${assetType} failed:`, err);
    throw err;
  }
}

/**
 * Helper: Convert File object to base64
 * @param {File} file - File object from input
 * @returns {Promise<string>} Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Compress image before upload (optional, for large images)
 * @param {string} base64 - Base64 image data
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} Compressed base64 image
 */
export function compressImage(base64, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      console.log(`[ProfileAssetsAPI] Compressed image from ${(base64.length / 1024).toFixed(2)}KB to ${(compressed.length / 1024).toFixed(2)}KB`);
      resolve(compressed);
    };
    img.onerror = reject;
    img.src = base64;
  });
}

export default {
  uploadProfileAsset,
  getProfileAsset,
  getAllProfileAssets,
  deleteProfileAsset,
  fileToBase64,
  compressImage,
};
