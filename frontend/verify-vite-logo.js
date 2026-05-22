#!/usr/bin/env node

/**
 * Vite Logo Verification Script
 * Verifies the logo is set up correctly using Vite's asset import method
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Vite Logo Setup Verification\n');
console.log('='.repeat(60));

// Check if logo file exists in assets folder
const assetsLogoPath = path.join(__dirname, 'src', 'assets', 'alumnex-logo.png');
const assetsExists = fs.existsSync(assetsLogoPath);

console.log('\n📁 Assets Folder Check (Vite Import Method):');
console.log(`   Path: ${assetsLogoPath}`);
console.log(`   Exists: ${assetsExists ? '✅ YES' : '❌ NO'}`);

if (assetsExists) {
  const stats = fs.statSync(assetsLogoPath);
  const fileSizeInKB = (stats.size / 1024).toFixed(2);
  console.log(`   Size: ${fileSizeInKB} KB`);
  
  if (stats.size === 0) {
    console.log('   ⚠️  WARNING: File is empty (0 bytes)');
  } else if (stats.size < 1024) {
    console.log('   ⚠️  WARNING: File seems too small');
  } else {
    console.log('   ✅ File size looks good');
  }
}

// Check if old public folder logo exists (should be removed)
const publicLogoPath = path.join(__dirname, 'public', 'alumnex-logo.png');
const publicExists = fs.existsSync(publicLogoPath);

console.log('\n📁 Public Folder Check (Old Method):');
console.log(`   Path: ${publicLogoPath}`);
console.log(`   Exists: ${publicExists ? '⚠️  YES (should remove)' : '✅ NO (correct)'}`);

if (publicExists) {
  console.log('   ℹ️  Note: Public folder logo is no longer needed');
  console.log('   ℹ️  You can delete it (we use assets folder now)');
}

// Check component file
const componentPath = path.join(__dirname, 'src', 'AlumNexLogo.jsx');
const componentExists = fs.existsSync(componentPath);

console.log('\n📄 Component Check:');
console.log(`   Path: ${componentPath}`);
console.log(`   Exists: ${componentExists ? '✅ YES' : '❌ NO'}`);

if (componentExists) {
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  const usesViteImport = componentContent.includes("import logoImage from './assets/alumnex-logo.png'");
  const usesCacheBusting = componentContent.includes('new Date().getTime()');
  const usesTailwind = componentContent.includes('className');
  
  console.log(`   Uses Vite import: ${usesViteImport ? '✅ YES' : '❌ NO'}`);
  console.log(`   Has cache busting: ${usesCacheBusting ? '✅ YES' : '❌ NO'}`);
  console.log(`   Uses Tailwind: ${usesTailwind ? '✅ YES' : '❌ NO'}`);
}

// Check package.json for required dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasReact = packageJson.dependencies?.react;
  const hasTailwind = packageJson.devDependencies?.tailwindcss || packageJson.dependencies?.tailwindcss;
  
  console.log('\n📦 Dependencies Check:');
  console.log(`   React: ${hasReact ? '✅ ' + hasReact : '❌ Missing'}`);
  console.log(`   Tailwind CSS: ${hasTailwind ? '✅ ' + hasTailwind : '⚠️  Not found (optional)'}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:');

if (assetsExists && componentExists) {
  console.log('   ✅ Setup looks good!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Restart Vite: npm run dev');
  console.log('   2. Clear browser cache: Ctrl+Shift+R');
  console.log('   3. Check console for success message');
  console.log('   4. Verify logo appears on all pages');
} else {
  console.log('   ❌ Setup incomplete');
  console.log('\n📋 Required actions:');
  if (!assetsExists) {
    console.log('   - Save logo to: frontend/src/assets/alumnex-logo.png');
  }
  if (!componentExists) {
    console.log('   - Component file missing or in wrong location');
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 Tip: Use Vite asset imports for better optimization!');
console.log('   Assets folder: Bundled & optimized by Vite');
console.log('   Public folder: Served as-is (use for static files only)');
console.log('\n' + '='.repeat(60) + '\n');
