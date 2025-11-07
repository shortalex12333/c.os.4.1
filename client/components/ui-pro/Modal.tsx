import React, { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
  animationDuration?: number;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  animationDuration = 200
}, ref) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const { colors, foundations, animation, components } = siteDesignSystem;
  const themeColors = colors[theme];

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, animationDuration);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timeout);
    }
  }, [open, animationDuration]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, closeOnEscape, onClose]);

  const sizeMap = {
    sm: { maxWidth: '400px', margin: '20px' },
    md: { maxWidth: '500px', margin: '20px' },
    lg: { maxWidth: '800px', margin: '20px' },
    xl: { maxWidth: '1200px', margin: '20px' },
    fullscreen: { maxWidth: '100vw', margin: '0', height: '100vh' }
  };

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: size === 'fullscreen' ? 'stretch' : 'center',
    justifyContent: 'center',
    padding: size === 'fullscreen' ? '0' : sizeMap[size].margin,
    zIndex: 9999,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    opacity: isVisible ? 1 : 0,
    transition: `opacity ${animationDuration}ms ${animation.easing.easeOut}`
  };

  const modalStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: sizeMap[size].maxWidth,
    maxHeight: size === 'fullscreen' ? '100%' : 'calc(100vh - 40px)',
    backgroundColor: themeColors.surface.primary,
    borderRadius: size === 'fullscreen' ? '0' : `${foundations.radius.lg}px`,
    boxShadow: theme === 'light' ? foundations.elevation.xlarge : foundations.elevation.darkLarge,
    border: `1px solid ${themeColors.border.subtle}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
    opacity: isVisible ? 1 : 0,
    transition: `all ${animationDuration}ms ${animation.easing.easeOut}`,
    outline: 'none'
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${foundations.grid.spacing.lg}px ${foundations.grid.spacing.xl}px`,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    backgroundColor: themeColors.surface.secondary,
    flexShrink: 0
  };

  const titleStyles: React.CSSProperties = {
    fontSize: `${components.modal.titleSize}px`,
    fontWeight: 600,
    color: themeColors.text.primary,
    margin: 0,
    fontFamily: siteDesignSystem.typography.fontFamily.primary
  };

  const closeButtonStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: `${foundations.radius.sm}px`,
    color: themeColors.text.secondary,
    cursor: 'pointer',
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    fontSize: '18px',
    fontWeight: 'bold'
  };

  const bodyStyles: React.CSSProperties = {
    flex: 1,
    padding: `${foundations.grid.spacing.xl}px`,
    overflowY: 'auto',
    fontFamily: siteDesignSystem.typography.fontFamily.primary
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const handleCloseButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = themeColors.surface.tertiary;
    target.style.color = themeColors.text.primary;
  };

  const handleCloseButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = 'transparent';
    target.style.color = themeColors.text.secondary;
  };

  if (!shouldRender) return null;

  const modalContent = (
    <div
      className={`ui-pro-modal-overlay ${overlayClassName}`}
      style={overlayStyles}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={ref}
        className={`ui-pro-modal ui-pro-modal--${size} ${className}`}
        style={modalStyles}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <header style={headerStyles} className="ui-pro-modal-header">
            {title && (
              <h2 id="modal-title" style={titleStyles} className="ui-pro-modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                style={closeButtonStyles}
                className="ui-pro-modal-close"
                onClick={onClose}
                onMouseEnter={handleCloseButtonHover}
                onMouseLeave={handleCloseButtonLeave}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </header>
        )}
        
        <div style={bodyStyles} className="ui-pro-modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

Modal.displayName = 'Modal';

// Modal Footer component
interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
  children: React.ReactNode;
}

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(({
  align = 'right',
  className = '',
  children,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations } = siteDesignSystem;
  const themeColors = colors[theme];

  const alignmentMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    between: 'space-between'
  };

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: alignmentMap[align],
    gap: `${foundations.grid.spacing.md}px`,
    padding: `${foundations.grid.spacing.md}px ${foundations.grid.spacing.xl}px`,
    backgroundColor: themeColors.surface.secondary,
    borderTop: `1px solid ${themeColors.border.subtle}`,
    flexShrink: 0
  };

  return (
    <footer
      ref={ref}
      style={footerStyles}
      className={`ui-pro-modal-footer ui-pro-modal-footer--${align} ${className}`}
      {...props}
    >
      {children}
    </footer>
  );
});

ModalFooter.displayName = 'ModalFooter';

// Confirmation Modal component
interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}

export const ConfirmModal = forwardRef<HTMLDivElement, ConfirmModalProps>(({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false
}, ref) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      ref={ref}
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div style={{ marginBottom: '24px', lineHeight: 1.6 }}>
        {message}
      </div>
      
      <ModalFooter align="right">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
});

ConfirmModal.displayName = 'ConfirmModal';

export default Modal;