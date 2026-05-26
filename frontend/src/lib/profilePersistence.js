/**
 * Profile Persistence Utility
 * Ensures photo and resume data persists across sessions
 */

const PROFILE_KEY = 'alumnex_profile';
const BACKUP_KEY = 'alumnex_profile_backup';

/**
 * Save profile with backup
 */
export function saveProfileToStorage(profileData) {
  try {
    const dataStr = JSON.stringify(profileData);
    
    // Save to primary key
    localStorage.setItem(PROFILE_KEY, dataStr);
    
    // Save backup copy
    localStorage.setItem(BACKUP_KEY, dataStr);
    
    console.log('[ProfilePersistence] Saved profile, size:', dataStr.length);
    console.log('[ProfilePersistence] Has photo:', !!profileData.photoPreview);
    console.log('[ProfilePersistence] Has resume:', !!profileData.resumeUrl);
    
    return true;
  } catch (err) {
    console.error('[ProfilePersistence] Save failed:', err);
    
    // Check if quota exceeded
    if (err.name === 'QuotaExceededError') {
      console.error('[ProfilePersistence] localStorage quota exceeded!');
      // Try to compress or remove old data
      tryCleanupStorage();
    }
    
    return false;
  }
}

/**
 * Load profile with fallback to backup
 */
export function loadProfileFromStorage() {
  try {
    // Try primary key first
    let dataStr = localStorage.getItem(PROFILE_KEY);
    
    if (!dataStr) {
      console.warn('[ProfilePersistence] Primary key empty, trying backup');
      dataStr = localStorage.getItem(BACKUP_KEY);
    }
    
    if (!dataStr) {
      console.warn('[ProfilePersistence] No profile data found');
      return {};
    }
    
    const profile = JSON.parse(dataStr);
    console.log('[ProfilePersistence] Loaded profile');
    console.log('[ProfilePersistence] Has photo:', !!profile.photoPreview);
    console.log('[ProfilePersistence] Has resume:', !!profile.resumeUrl);
    
    return profile;
  } catch (err) {
    console.error('[ProfilePersistence] Load failed:', err);
    
    // Try backup
    try {
      const backupStr = localStorage.getItem(BACKUP_KEY);
      if (backupStr) {
        console.log('[ProfilePersistence] Restored from backup');
        return JSON.parse(backupStr);
      }
    } catch (backupErr) {
      console.error('[ProfilePersistence] Backup also failed:', backupErr);
    }
    
    return {};
  }
}

/**
 * Verify profile data integrity
 */
export function verifyProfileIntegrity() {
  const profile = loadProfileFromStorage();
  
  const checks = {
    hasData: Object.keys(profile).length > 0,
    hasPhoto: !!profile.photoPreview,
    photoIsBase64: profile.photoPreview?.startsWith('data:image/'),
    hasResume: !!profile.resumeUrl,
    resumeIsBase64: profile.resumeUrl?.startsWith('data:application/pdf'),
  };
  
  console.log('[ProfilePersistence] Integrity check:', checks);
  
  return checks;
}

/**
 * Cleanup old data to free space
 */
function tryCleanupStorage() {
  try {
    // Remove old keys that might be taking space
    const keysToCheck = [
      'alumniconnect_profile',
      'alumniconnect_user',
      'alumnex_interview_requests',
    ];
    
    keysToCheck.forEach(key => {
      const item = localStorage.getItem(key);
      if (item && item.length > 100000) {
        console.log(`[ProfilePersistence] Removing large item: ${key}`);
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('[ProfilePersistence] Cleanup failed:', err);
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo() {
  try {
    let totalSize = 0;
    const items = {};
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage.getItem(key)?.length || 0;
        totalSize += size;
        items[key] = size;
      }
    }
    
    // Estimate quota (usually 5-10MB)
    const estimatedQuota = 5 * 1024 * 1024; // 5MB
    const usagePercent = (totalSize / estimatedQuota) * 100;
    
    console.log('[ProfilePersistence] Storage usage:', {
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      usagePercent: `${usagePercent.toFixed(1)}%`,
      largestItems: Object.entries(items)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, size]) => ({ key, size: `${(size / 1024).toFixed(2)} KB` }))
    });
    
    return { totalSize, usagePercent, items };
  } catch (err) {
    console.error('[ProfilePersistence] Storage info failed:', err);
    return null;
  }
}

export default {
  saveProfileToStorage,
  loadProfileFromStorage,
  verifyProfileIntegrity,
  getStorageInfo,
};
