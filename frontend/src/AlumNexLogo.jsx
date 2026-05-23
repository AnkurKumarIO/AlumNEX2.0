// AlumNex Logo Component
import logoWithSubtext from "./assets/alumnex-logo.png";
import logoWithoutSubtext from "./assets/alumnex-logo-no-subtext.png";

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
  
  // By default, hide subtext on smaller sizes (xs, sm) to keep it clean and legible,
  // and keep it on larger sizes (md, lg, xl, 2xl, etc.)
  const finalShowSubtext = showSubtext !== undefined 
    ? showSubtext 
    : (size !== 'xs' && size !== 'sm');

  const selectedLogo = finalShowSubtext ? logoWithSubtext : logoWithoutSubtext;

  return (
    <img
      src={selectedLogo}
      alt="AlumNEX"
      className={className}
      style={{
        display: 'block',
        height: `${heightPx}px`,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

