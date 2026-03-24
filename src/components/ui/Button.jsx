import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * Consistent button styles across the application
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 focus:ring-secondary',
    outline: 'border border-outline text-primary hover:bg-primary/10 focus:ring-primary',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-primary',
    danger: 'bg-error text-on-error hover:bg-error/90 focus:ring-error',
    success: 'bg-success text-on-success hover:bg-success/90 focus:ring-success',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </button>
  );
};

export default Button;
