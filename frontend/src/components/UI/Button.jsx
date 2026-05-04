import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const variants = {
  primary: 'bg-accent hover:bg-accent-hover text-white border border-transparent',
  secondary: 'bg-surface hover:bg-surface-hover text-text-primary border border-border',
  ghost: 'bg-transparent hover:bg-surface text-text-secondary hover:text-text-primary border border-transparent',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  outline: 'bg-transparent hover:bg-surface text-text-primary border border-border',
};

const sizes = {
  xs: 'h-6 px-2 text-xs gap-1',
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-sm gap-2',
  lg: 'h-9 px-4 text-sm gap-2',
};

const Button = forwardRef(({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  loading = false,
  disabled = false,
  icon,
  iconRight,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-all duration-150 select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;
