import { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import type { FigureLabel } from '@/hooks/useContent';

interface FigureLightboxProps {
  open: boolean;
  src: string;
  alt: string;
  caption?: string;
  labels?: FigureLabel[];
  onClose: () => void;
}

/** Full-screen figure viewer — labels stay pinned (spatial contiguity). */
export default function FigureLightbox({ open, src, alt, caption, labels = [], onClose }: FigureLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="figure-lightbox-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="figure-lightbox" role="dialog" aria-modal="true" aria-label={alt}>
        <button type="button" className="figure-lightbox-close" onClick={onClose} aria-label="Close figure">
          <X size={18} />
        </button>
        <div className="figure-stage figure-stage-lightbox">
          <img src={src} alt={alt} decoding="async" />
          {labels.map((label, i) => (
            <span
              key={`${label.text}-${i}`}
              className={`figure-pin figure-pin-${label.side ?? 'right'}`}
              style={{ left: `${label.x}%`, top: `${label.y}%` }}
            >
              <i aria-hidden="true" />
              <em>{label.text}</em>
            </span>
          ))}
        </div>
        {caption && <p className="figure-lightbox-caption">{caption}</p>}
        <p className="figure-lightbox-hint"><ZoomIn size={13} aria-hidden="true" /> Pinch or zoom the page if you need it larger</p>
      </div>
    </div>
  );
}
