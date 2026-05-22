// AlumNex Logo Component — Vite Asset Import with Cache Busting
// Usage: <AlumNexLogo size="md" /> or <AlumNexLogo size="lg" />

import { useMemo } from 'react';
import logoImage from "./assets/alumnex-logo.jpeg";

export default function AlumNexLogo({ size = 'md', className = '' }) {
  // Cache busting: Add timestamp to force fresh image load
  const logoSrc = useMemo(() => {
    return `${logoImage}?v=${new Date().getTime()}`;
  }, []);

  // Dynamic size mapping with pixel values (ORIGINAL SIZES)
  const sizeMap = {
    xs: 32,      // 2rem (32px) - Navbar (ORIGINAL)
    sm: 36,      // 2.25rem (36px) - Small sidebar
    md: 40,      // 2.5rem (40px) - Footer (ORIGINAL)
    lg: 48,      // 3rem (48px) - Medium headers
    xl: 56,      // 3.5rem (56px) - Large headers
    '2xl': 80,   // 5rem (80px) - Hero sections
    '3xl': 96,   // 6rem (96px) - Extra large hero
    '4xl': 112,  // 7rem (112px) - Maximum hero
  };

  // Get the appropriate size in pixels
  const heightPx = sizeMap[size] || sizeMap.md;

  return (
    <img 
      src={logoSrc}
      alt="AlumNEX Intelligence Platform" 
      className={`${className}`}
      style={{
        display: 'block',
        height: `${heightPx}px`,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain'
      }}
      onError={(e) => {
        console.error('AlumNEX logo failed to load');
        console.error('Expected path:', logoImage);
        e.target.style.display = 'none';
      }}
      onLoad={() => {
        console.log('✅ AlumNEX logo loaded successfully from:', logoImage);
      }}
    />
  );
}
