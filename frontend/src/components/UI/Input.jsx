import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  iconRight,
  className,
  containerClassName,
  size = 'md',
  ...props
}, ref) => {
  const sizeStyles = {
    sm: 'h-7 text-xs px-2.5',
    md: 'h-8 text-sm px-3',
    lg: 'h-9 text-sm px-3.5',
  };

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-2.5 text-text-tertiary flex items-center pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-background-tertiary border rounded-md text-text-primary',
            'placeholder:text-text-tertiary',
            'transition-all duration-150 outline-none',
            'focus:border-accent/60 focus:ring-1 focus:ring-accent/20',
            error ? 'border-red-500/60' : 'border-border',
            icon ? 'pl-8' : '',
            iconRight ? 'pr-8' : '',
            sizeStyles[size],
            className
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-2.5 text-text-tertiary flex items-center">
            {iconRight}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({ label, error, className, containerClassName, ...props }, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && <label className="text-xs font-medium text-text-secondary">{label}</label>}
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-background-tertiary border rounded-md text-text-primary text-sm',
        'placeholder:text-text-tertiary px-3 py-2',
        'transition-all duration-150 outline-none resize-none',
        'focus:border-accent/60 focus:ring-1 focus:ring-accent/20',
        error ? 'border-red-500/60' : 'border-border',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));

Textarea.displayName = 'Textarea';

export default Input;
