#!/usr/bin/env node

/**
 * AlumNEX Logo Verification Script
 * Run this to check if your logo is set up correctly
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 AlumNEX Logo Verification\n');
console.log('='.repeat(50));

// Check if logo file exists
const logoPath = path.join(__dirname, 'public', 'alumnex-logo.png');
const exists = fs.existsSync(logoPath);

console.log('\n📁 File Location Check:');
console.log(`   Path: ${logoPath}`);
console.log(`   Exists: ${exists ? '✅ YES' : '❌ NO'}`);

if (exists) {
  // Check file size
  const stats = fs.statSync(logoPath);
  const fileSizeInBytes = stats.size;
  const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
  
  console.log(`   Size: ${fileSizeInKB} KB`);
  
  if (fileSizeInBytes === 0) {
    console.log('   ⚠️  WARNING: File is empty (0 bytes)');
  } else if (fileSizeInBytes < 1024) {
    console.log('   ⚠️  WARNING: File seems too small');
  } else {
    console.log('   ✅ File size looks good');
  }
} else {
  console.log('\n❌ LOGO FILE NOT FOUND!');
  console.log('\n📋 To fix this:');
  console.log('   1. Save your logo image as: alumnex-logo.png');
  console.log('   2. Place it in: frontend/public/');
  console.log('   3. Run this script again to verify');
}

// Check component file
const componentPath = path.join(__dirname, 'src', 'AlumNexLogo.jsx');
const componentExists = fs.existsSync(componentPath);

console.log('\n📄 Component Check:');
console.log(`   Path: ${componentPath}`);
console.log(`   Exists: ${componentExists ? '✅ YES' : '❌ NO'}`);

if (componentExists) {
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  const usesCorrectPath = componentContent.includes('/alumnex-logo.png');
  console.log(`   Uses correct path: ${usesCorrectPath ? '✅ YES' : '❌ NO'}`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:');

if (exists && componentExists) {
  console.log('   ✅ Setup looks good!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Open browser and check logo');
  console.log('   3. If old logo shows, clear cache: Ctrl+Shift+R');
} else {
  console.log('   ❌ Setup incomplete');
  console.log('\n📋 Required actions:');
  if (!exists) {
    console.log('   - Save logo to: frontend/public/alumnex-logo.png');
  }
  if (!componentExists) {
    console.log('   - Component file missing or in wrong location');
  }
}

console.log('\n' + '='.repeat(50) + '\n');
