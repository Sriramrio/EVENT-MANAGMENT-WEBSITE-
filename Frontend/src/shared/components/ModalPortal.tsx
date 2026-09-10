import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalPortalProps {
  children: ReactNode;
  isOpen?: boolean;
}

/**
 * Renders modal content directly into document.body via createPortal,
 * escaping any shell container stacking contexts (fixed headers, sidebars, transforms)
 * and locks body scroll while the modal is open.
 */
export function ModalPortal({ children, isOpen = true }: ModalPortalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return <>{children}</>;

  return createPortal(children, document.body);
}

export default ModalPortal;
