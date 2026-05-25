/**
 * Verification Script for Profile Picture & Resume Fix
 * Run this in browser console to verify all fixes are working
 */

console.log('🔍 Starting Profile Fix Verification...\n');

// Test 1: Check if profilePersistence utility exists
try {
  console.log('✓ Test 1: Checking profilePersistence utility...');
  // This will be imported in the actual components
  console.log('  → Utility should be imported in SettingsPage and Dashboard');
} catch (err) {
  console.error('✗ Test 1 Failed:', err.message);
}

// Test 2: Check localStorage data
console.log('\n✓ Test 2: Checking localStorage data...');
try {
  const profile = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
  const backup = JSON.parse(localStorage.getItem('alumnex_profile_backup') || '{}');
  
  console.log('  → Main profile exists:', Object.keys(profile).length > 0);
  console.log('  → Backup exists:', Object.keys(backup).length > 0);
  console.log('  → Has photo:', !!profile.photoPreview);
  console.log('  → Photo is base64:', profile.photoPreview?.startsWith('data:image/'));
  console.log('  → Has resume:', !!profile.resumeUrl);
  console.log('  → Resume is base64:', profile.resumeUrl?.startsWith('data:application/pdf'));
  
  if (profile.photoPreview && profile.photoPreview.startsWith('data:image/')) {
    console.log('  ✓ Photo data is valid');
  } else if (profile.photoPreview === '__stored_locally__') {
    console.warn('  ⚠ Photo is placeholder - needs to be re-saved');
  } else if (!profile.photoPreview) {
    console.warn('  ⚠ No photo uploaded yet');
  }
  
} catch (err) {
  console.error('✗ Test 2 Failed:', err.message);
}

// Test 3: Check storage usage
console.log('\n✓ Test 3: Checking storage usage...');
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
  
  const estimatedQuota = 5 * 1024 * 1024; // 5MB
  const usagePercent = (totalSize / estimatedQuota) * 100;
  
  console.log('  → Total size:', (totalSize / 1024).toFixed(2), 'KB');
  console.log('  → Usage:', usagePercent.toFixed(1), '%');
  console.log('  → Largest items:');
  
  Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([key, size]) => {
      console.log(`    - ${key}: ${(size / 1024).toFixed(2)} KB`);
    });
  
  if (usagePercent > 80) {
    console.warn('  ⚠ Storage usage is high! Consider clearing old data.');
  } else {
    console.log('  ✓ Storage usage is healthy');
  }
  
} catch (err) {
  console.error('✗ Test 3 Failed:', err.message);
}

// Test 4: Verify data integrity
console.log('\n✓ Test 4: Verifying data integrity...');
try {
  const profile = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
  
  const checks = {
    hasData: Object.keys(profile).length > 0,
    hasName: !!profile.name,
    hasEmail: !!profile.email,
    hasPhoto: !!profile.photoPreview,
    photoIsValid: profile.photoPreview?.startsWith('data:image/'),
    hasResume: !!profile.resumeUrl,
    resumeIsValid: profile.resumeUrl?.startsWith('data:application/pdf'),
  };
  
  console.log('  → Has data:', checks.hasData);
  console.log('  → Has name:', checks.hasName);
  console.log('  → Has email:', checks.hasEmail);
  console.log('  → Has photo:', checks.hasPhoto);
  console.log('  → Photo is valid:', checks.photoIsValid);
  console.log('  → Has resume:', checks.hasResume);
  console.log('  → Resume is valid:', checks.resumeIsValid);
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  console.log(`  → Passed ${passedChecks}/${totalChecks} checks`);
  
  if (passedChecks === totalChecks) {
    console.log('  ✓ All integrity checks passed!');
  } else {
    console.warn('  ⚠ Some checks failed - profile may be incomplete');
  }
  
} catch (err) {
  console.error('✗ Test 4 Failed:', err.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log('\nNext Steps:');
console.log('1. If photo/resume missing: Go to Settings and re-upload');
console.log('2. If storage high: Open test-profile.html to clear old data');
console.log('3. Send a new interview request to test alumni view');
console.log('4. Check console logs for [sendRequest] and [StudentFullProfileModal]');
console.log('\nFor detailed testing: Open http://localhost:5173/test-profile.html');
console.log('='.repeat(60) + '\n');
