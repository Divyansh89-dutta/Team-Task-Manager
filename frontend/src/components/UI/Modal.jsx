import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import Button from './Button';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full mx-4',
};

const Modal = ({ open, onClose, title, children, size = 'md', className, footer, hideClose = false }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'relative z-10 w-full bg-background-secondary border border-border',
              'rounded-xl shadow-elevation-3 flex flex-col overflow-hidden',
              sizes[size],
              className
            )}
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                {title && (
                  <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
                )}
                {!hideClose && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="ml-auto"
                    onClick={onClose}
                    icon={<X size={14} />}
                  />
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
            {footer && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
