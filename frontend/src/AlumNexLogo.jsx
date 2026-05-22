// AlumNex Logo Component
import logoImage from "./assets/alumnex-logo.png";

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

export default function AlumNexLogo({ size = 'md', className = '', showText, textSize, style }) {
  const heightPx = sizeMap[size] || sizeMap.md;

  return (
    <img
      src={logoImage}
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
