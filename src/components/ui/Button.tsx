import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    className = '',
    style,
    disabled,
    ...props
}) => {
    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-full)',
        fontWeight: 'var(--font-bold)',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition-fast)',
        opacity: disabled || isLoading ? 0.7 : 1,
        border: 'none',
        outline: 'none',
        position: 'relative',
        ...style
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-white)',
            boxShadow: 'var(--shadow-lg)',
        },
        secondary: {
            backgroundColor: 'var(--color-secondary)',
            color: 'var(--color-white)',
            boxShadow: 'var(--shadow-md)',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--color-text-sub)',
            boxShadow: 'none',
        },
        outline: {
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-gray-200)',
            color: 'var(--color-text-main)',
        }
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: {
            padding: 'var(--spacing-2) var(--spacing-4)',
            fontSize: 'var(--text-sm)',
        },
        md: {
            padding: 'var(--spacing-3) var(--spacing-6)',
            fontSize: 'var(--text-base)',
        },
        lg: {
            padding: 'var(--spacing-4) var(--spacing-8)',
            fontSize: 'var(--text-lg)',
        },
    };

    return (
        <button
            className={className}
            style={{
                ...baseStyles,
                ...variantStyles[variant],
                ...sizeStyles[size],
                width: fullWidth ? '100%' : 'auto',
            }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 animate-spin">⏳</span>
            ) : null}
            {children}
        </button>
    );
};
