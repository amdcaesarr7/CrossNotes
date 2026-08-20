interface MewMascotProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'cheery' | 'judgy' | 'sleepy';
  className?: string;
}

/**
 * A tiny CSS-drawn Mew companion. Keeping the mascot in markup rather than an
 * image means it stays crisp, theme-aware, and lightweight on every device.
 */
export default function MewMascot({
  size = 'md',
  mood = 'cheery',
  className = '',
}: MewMascotProps) {
  return (
    <span
      className={`mew-mascot mew-mascot--${size} mew-mascot--${mood} ${className}`}
      role="img"
      aria-label={`Mew looks ${mood}`}
    >
      <span className="mew-mascot__tail" aria-hidden="true" />
      <span className="mew-mascot__ear mew-mascot__ear--left" aria-hidden="true" />
      <span className="mew-mascot__ear mew-mascot__ear--right" aria-hidden="true" />
      <span className="mew-mascot__face" aria-hidden="true">
        <span className="mew-mascot__eye mew-mascot__eye--left" />
        <span className="mew-mascot__eye mew-mascot__eye--right" />
        <span className="mew-mascot__mouth" />
      </span>
    </span>
  );
}
