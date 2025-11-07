import React, { forwardRef, useState, useEffect } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';
import Input from './Input';
import Button from './Button';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (data: FormData) => void | Promise<void>;
  validation?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

const Form = forwardRef<HTMLFormElement, FormProps>(({
  onSubmit,
  validation = true,
  loading = false,
  children,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const [formState, setFormState] = useState<FormState>({
    values: {},
    errors: {},
    touched: {},
    isValid: true,
    isSubmitting: false
  });

  const { colors, foundations } = siteDesignSystem;
  const themeColors = colors[theme];

  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.lg}px`,
    width: '100%',
    fontFamily: siteDesignSystem.typography.fontFamily.primary
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!onSubmit) return;

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <form
      ref={ref}
      style={formStyles}
      className={`ui-pro-form ${className}`}
      onSubmit={handleSubmit}
      noValidate={validation}
      {...props}
    >
      {children}
    </form>
  );
});

Form.displayName = 'Form';

// Form Field wrapper component
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
  label,
  error,
  hint,
  required = false,
  children,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, typography } = siteDesignSystem;
  const themeColors = colors[theme];

  const fieldStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.xs}px`,
    width: '100%'
  };

  const labelStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.sm}px`,
    fontWeight: typography.fontWeight.medium,
    color: error ? themeColors.text.error : themeColors.text.secondary,
    marginBottom: `${foundations.grid.spacing.xs}px`,
    fontFamily: typography.fontFamily.primary
  };

  const hintStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.xs}px`,
    color: error ? themeColors.text.error : themeColors.text.tertiary,
    marginTop: `${foundations.grid.spacing.xs}px`
  };

  const requiredStyles: React.CSSProperties = {
    color: themeColors.text.error,
    marginLeft: '2px'
  };

  return (
    <div
      ref={ref}
      style={fieldStyles}
      className={`ui-pro-form-field ${error ? 'ui-pro-form-field--error' : ''} ${className}`}
      {...props}
    >
      {label && (
        <label style={labelStyles} className="ui-pro-form-field-label">
          {label}
          {required && <span style={requiredStyles}>*</span>}
        </label>
      )}
      
      {children}
      
      {(hint || error) && (
        <div style={hintStyles} className={`ui-pro-form-field-hint ${error ? 'ui-pro-form-field-hint--error' : ''}`}>
          {error || hint}
        </div>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  placeholder,
  options,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, components, typography, foundations, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.xs}px`,
    width: fullWidth ? '100%' : 'auto'
  };

  const selectStyles: React.CSSProperties = {
    width: '100%',
    height: `${components.input.height.md}px`,
    padding: `0 ${components.input.padding.x + 32}px 0 ${components.input.padding.x}px`,
    fontSize: `${components.input.fontSize}px`,
    fontFamily: typography.fontFamily.primary,
    backgroundColor: themeColors.surface.secondary,
    color: themeColors.text.primary,
    border: `1px solid ${error ? themeColors.border.error : themeColors.border.subtle}`,
    borderRadius: `${components.input.borderRadius}px`,
    outline: 'none',
    cursor: 'pointer',
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(themeColors.text.secondary)}' stroke-width='2'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `right ${foundations.grid.spacing.md}px center`,
    backgroundSize: '16px 16px'
  };

  const labelStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.sm}px`,
    fontWeight: typography.fontWeight.medium,
    color: error ? themeColors.text.error : themeColors.text.secondary,
    marginBottom: `${foundations.grid.spacing.xs}px`
  };

  const hintStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.xs}px`,
    color: error ? themeColors.text.error : themeColors.text.tertiary,
    marginTop: `${foundations.grid.spacing.xs}px`
  };

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    const target = e.currentTarget;
    target.style.borderColor = themeColors.border.focus;
    target.style.boxShadow = `0 0 0 3px ${themeColors.border.focus}20`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    const target = e.currentTarget;
    target.style.borderColor = error ? themeColors.border.error : themeColors.border.subtle;
    target.style.boxShadow = 'none';
  };

  return (
    <div style={containerStyles} className={`ui-pro-select-container ${className}`}>
      {label && (
        <label style={labelStyles} className="ui-pro-select-label">
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        style={selectStyles}
        className="ui-pro-select"
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {(hint || error) && (
        <div style={hintStyles} className={`ui-pro-select-hint ${error ? 'ui-pro-select-hint--error' : ''}`}>
          {error || hint}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  resize = 'vertical',
  fullWidth = true,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, components, typography, foundations, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.xs}px`,
    width: fullWidth ? '100%' : 'auto'
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: `${components.input.height.md * 2}px`,
    padding: `${foundations.grid.spacing.sm}px ${components.input.padding.x}px`,
    fontSize: `${components.input.fontSize}px`,
    fontFamily: typography.fontFamily.primary,
    lineHeight: 1.5,
    backgroundColor: themeColors.surface.secondary,
    color: themeColors.text.primary,
    border: `1px solid ${error ? themeColors.border.error : themeColors.border.subtle}`,
    borderRadius: `${components.input.borderRadius}px`,
    outline: 'none',
    resize,
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`
  };

  const labelStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.sm}px`,
    fontWeight: typography.fontWeight.medium,
    color: error ? themeColors.text.error : themeColors.text.secondary,
    marginBottom: `${foundations.grid.spacing.xs}px`
  };

  const hintStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.xs}px`,
    color: error ? themeColors.text.error : themeColors.text.tertiary,
    marginTop: `${foundations.grid.spacing.xs}px`
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.borderColor = themeColors.border.focus;
    target.style.boxShadow = `0 0 0 3px ${themeColors.border.focus}20`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.borderColor = error ? themeColors.border.error : themeColors.border.subtle;
    target.style.boxShadow = 'none';
  };

  return (
    <div style={containerStyles} className={`ui-pro-textarea-container ${className}`}>
      {label && (
        <label style={labelStyles} className="ui-pro-textarea-label">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        style={textareaStyles}
        className="ui-pro-textarea"
        rows={rows}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      
      {(hint || error) && (
        <div style={hintStyles} className={`ui-pro-textarea-hint ${error ? 'ui-pro-textarea-hint--error' : ''}`}>
          {error || hint}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Checkbox component
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  hint,
  indeterminate = false,
  className = '',
  children,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, animation, typography } = siteDesignSystem;
  const themeColors = colors[theme];

  useEffect(() => {
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate, ref]);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.xs}px`,
    width: '100%'
  };

  const checkboxContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: `${foundations.grid.spacing.sm}px`,
    cursor: 'pointer'
  };

  const checkboxStyles: React.CSSProperties = {
    width: '18px',
    height: '18px',
    margin: '2px 0 0 0',
    accentColor: themeColors.surface.accent,
    cursor: 'pointer'
  };

  const labelStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.base}px`,
    color: themeColors.text.primary,
    cursor: 'pointer',
    lineHeight: 1.5,
    userSelect: 'none'
  };

  const hintStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.xs}px`,
    color: error ? themeColors.text.error : themeColors.text.tertiary,
    marginTop: `${foundations.grid.spacing.xs}px`,
    marginLeft: '26px'
  };

  return (
    <div style={containerStyles} className={`ui-pro-checkbox-container ${className}`}>
      <label style={checkboxContainerStyles} className="ui-pro-checkbox-wrapper">
        <input
          ref={ref}
          type="checkbox"
          style={checkboxStyles}
          className="ui-pro-checkbox"
          {...props}
        />
        {(label || children) && (
          <span style={labelStyles} className="ui-pro-checkbox-label">
            {label || children}
          </span>
        )}
      </label>
      
      {(hint || error) && (
        <div style={hintStyles} className={`ui-pro-checkbox-hint ${error ? 'ui-pro-checkbox-hint--error' : ''}`}>
          {error || hint}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Radio component
interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  label,
  error,
  className = '',
  children,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, typography } = siteDesignSystem;
  const themeColors = colors[theme];

  const radioContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${foundations.grid.spacing.sm}px`,
    cursor: 'pointer'
  };

  const radioStyles: React.CSSProperties = {
    width: '18px',
    height: '18px',
    accentColor: themeColors.surface.accent,
    cursor: 'pointer'
  };

  const labelStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.base}px`,
    color: error ? themeColors.text.error : themeColors.text.primary,
    cursor: 'pointer',
    userSelect: 'none'
  };

  return (
    <label style={radioContainerStyles} className={`ui-pro-radio-wrapper ${className}`}>
      <input
        ref={ref}
        type="radio"
        style={radioStyles}
        className="ui-pro-radio"
        {...props}
      />
      {(label || children) && (
        <span style={labelStyles} className="ui-pro-radio-label">
          {label || children}
        </span>
      )}
    </label>
  );
});

Radio.displayName = 'Radio';

export default Form;