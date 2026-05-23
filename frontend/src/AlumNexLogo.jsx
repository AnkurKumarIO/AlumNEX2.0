// AlumNex Logo Component
import logoMark from "./assets/logo-mark.svg";

const sizeMap = {
  xs:   32,
  sm:   36,
  md:   40,
  lg:   48,
  xl:   56,
  '2xl': 80,
  '3xl': 96,
  '4xl': 112,
};

export default function AlumNexLogo({ size = 'md', className = '', showSubtext, style }) {
  const heightPx = sizeMap[size] || sizeMap.md;
  
  // By default, hide subtext on smaller sizes (xs, sm, md) to keep it clean and readable
  const finalShowSubtext = showSubtext !== undefined 
    ? showSubtext 
    : (size !== 'xs' && size !== 'sm' && size !== 'md');

  const separatorHeight = `${heightPx * 0.7}px`;
  const titleFontSize = `${heightPx * 0.45}px`;
  const subtextFontSize = `${heightPx * 0.13}px`;

  return (
    <div 
      className={`alumnex-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${heightPx * 0.22}px`,
        height: `${heightPx}px`,
        userSelect: 'none',
        verticalAlign: 'middle',
        ...style
      }}
    >
      {/* 3D Purple Graphic Icon (from SVG) */}
      <img
        src={logoMark}
        alt="AlumNEX"
        style={{
          height: '100%',
          width: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />

      {/* Vertical Separator */}
      <div 
        style={{
          width: '1px',
          height: separatorHeight,
          background: 'rgba(255, 255, 255, 0.25)',
          borderRadius: '1px'
        }}
      />

      {/* Text Container */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          lineHeight: 1.05,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        {/* Main Title: AlumNEX */}
        <div 
          style={{
            fontSize: titleFontSize,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span>Alum</span>
          <span 
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #863bff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900
            }}
          >
            NEX
          </span>
        </div>

        {/* Subtext: INTELLIGENCE PLATFORM */}
        {finalShowSubtext && (
          <div 
            style={{
              fontSize: subtextFontSize,
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.75)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              marginTop: `${heightPx * 0.05}px`
            }}
          >
            INTELLIGENCE PLATFORM
          </div>
        )}
      </div>
    </div>
  );
}

