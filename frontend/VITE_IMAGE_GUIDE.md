# 🎯 Vite + React Image Loading Guide

## How Images Work in Vite

Vite handles images differently than Create React App:

### ✅ PUBLIC Folder (Recommended for Logos)
Files in `/public` are served at the root URL path.

**Location:** `frontend/public/alumnex-logo.png`  
**Access in code:** `/alumnex-logo.png` (starts with `/`)

```jsx
// ✅ CORRECT - Public folder
<img src="/alumnex-logo.png" alt="Logo" />
```

### ❌ SRC Folder (For Bundled Assets)
Files in `/src` need to be imported.

```jsx
// ❌ WRONG - Don't use for public assets
import logo from './assets/logo.png'
<img src={logo} alt="Logo" />
```

---

## 🔧 Our Implementation

### Current Setup:
- **File location:** `frontend/public/alumnex-logo.png`
- **Component:** `frontend/src/AlumNexLogo.jsx`
- **Access method:** `/alumnex-logo.png`

### Component Code:
```jsx
export default function AlumNexLogo({ size = 32 }) {
  const width = size * 3.5;
  const logoPath = `/alumnex-logo.png?v=${Date.now()}`;
  
  return (
    <img 
      src={logoPath}
      alt="AlumNEX Intelligence Platform" 
      style={{ 
        height: size,
        width: width,
        objectFit: 'contain',
        display: 'block'
      }}
    />
  );
}
```

---

## 🐛 Troubleshooting

### Issue 1: Logo Not Showing (404 Error)

**Symptoms:**
- Broken image icon
- Console error: "Failed to load resource: 404"

**Solution:**
1. Verify file exists: `frontend/public/alumnex-logo.png`
2. Check filename is exact (lowercase, no spaces)
3. Restart Vite dev server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue 2: Old/Wrong Image Showing

**Symptoms:**
- Updated logo but old version still shows
- Wrong image appears

**Solution:**
1. **Hard refresh browser:**
   - Chrome/Edge: `Ctrl + Shift + R`
   - Firefox: `Ctrl + F5`
   - Safari: `Cmd + Shift + R`

2. **Clear browser cache:**
   - Chrome: `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

3. **Cache-busting query parameter:**
   Our component already includes `?v=${Date.now()}` to prevent caching

4. **Restart Vite:**
   ```bash
   # Stop server
   npm run dev
   ```

### Issue 3: Image Path Issues

**Symptoms:**
- Image works in dev but not in production
- Path errors

**Solution:**
- Always use `/alumnex-logo.png` (starts with `/`)
- Never use `./alumnex-logo.png` or `../public/alumnex-logo.png`

### Issue 4: Image Size/Quality Issues

**Symptoms:**
- Logo appears blurry
- Logo too small/large

**Solution:**
1. **Use high-resolution PNG:**
   - Recommended: 1200×400px or larger
   - Maintains quality at all sizes

2. **Adjust component size prop:**
   ```jsx
   <AlumNexLogo size={50} />  // Larger
   <AlumNexLogo size={30} />  // Smaller
   ```

---

## 📊 Current Logo Sizes

| Page/Component | Size | Width | Context |
|----------------|------|-------|---------|
| Landing Hero | 100px | 350px | Large hero |
| Login Page | 50px | 175px | Medium header |
| Registration | 38px | 133px | Form header |
| Dashboards | 36-40px | 126-140px | Sidebar |
| Footer | 40px | 140px | Footer brand |
| Navbar | 32px | 112px | Top nav |

---

## 🔍 Debugging Checklist

- [ ] File exists at `frontend/public/alumnex-logo.png`
- [ ] Filename is exact (lowercase, `.png` extension)
- [ ] File size > 0 bytes (not empty)
- [ ] Vite dev server is running
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Console shows no 404 errors
- [ ] Component uses `/alumnex-logo.png` path

---

## 🚀 Production Build

When building for production:

```bash
npm run build
```

Files in `/public` are copied to `/dist` automatically.

**Production path:** `dist/alumnex-logo.png`  
**Access:** Same as dev: `/alumnex-logo.png`

---

## 💡 Best Practices

1. **Use /public for static assets** (logos, favicons, robots.txt)
2. **Use /src/assets for bundled assets** (component images, icons)
3. **Always start public paths with /** `/`
4. **Use cache-busting** for frequently updated images
5. **Optimize images** before adding (compress, resize)

---

## 📝 Quick Reference

**Save logo to:**
```
frontend/public/alumnex-logo.png
```

**Access in component:**
```jsx
<img src="/alumnex-logo.png" alt="Logo" />
```

**Clear cache:**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**Restart Vite:**
```bash
npm run dev
```

---

**Status:** Component is configured correctly. Just save the PNG file to `frontend/public/alumnex-logo.png` and refresh!
