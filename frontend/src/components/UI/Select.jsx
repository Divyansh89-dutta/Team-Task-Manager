import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/helpers';

const Select = ({ value, onChange, options = [], placeholder = 'Select...', className, label, size = 'md' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const sizeStyles = {
    sm: 'h-7 text-xs px-2.5',
    md: 'h-8 text-sm px-3',
    lg: 'h-9 text-sm px-3.5',
  };

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-xs font-medium text-text-secondary">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'bg-background-tertiary border border-border rounded-md',
            'text-text-primary transition-all duration-150 outline-none',
            'hover:border-border-strong focus:border-accent/60 focus:ring-1 focus:ring-accent/20',
            sizeStyles[size],
            className
          )}
        >
          <span className={cn(!selected && 'text-text-tertiary')}>
            {selected?.label || placeholder}
          </span>
          <ChevronDown size={12} className={cn('text-text-tertiary transition-transform', open && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 top-full mt-1 w-full bg-background-elevated border border-border rounded-lg shadow-elevation-2 py-1 overflow-hidden"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange(option.value); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 text-sm',
                    'hover:bg-surface transition-colors text-left',
                    value === option.value ? 'text-accent' : 'text-text-primary'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  {value === option.value && <Check size={12} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Select;
