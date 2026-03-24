import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 * Dialog windows for forms and confirmations
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div
        className={`relative bg-surface-container-lowest rounded-2xl shadow-xl w-full ${sizes[size]} mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
            {title && (
              <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-container-low text-secondary hover:text-on-surface transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Modal Footer Component
 * For action buttons at the bottom of modals
 */
export const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t border-outline-variant ${className}`}>
      {children}
    </div>
  );
};

export default Modal;
