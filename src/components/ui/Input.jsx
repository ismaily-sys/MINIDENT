import React, { forwardRef } from 'react';

/**
 * Input Component
 * Consistent input styles across the application
 */
const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-on-surface mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full py-2.5 bg-surface-container-low border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all
            ${Icon && iconPosition === 'left' ? 'pl-10 pr-4' : Icon && iconPosition === 'right' ? 'pl-4 pr-10' : 'px-4'}
            ${error ? 'border-error focus:ring-error' : 'border-outline-variant'}
            ${className}
          `}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <Icon className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-secondary">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
