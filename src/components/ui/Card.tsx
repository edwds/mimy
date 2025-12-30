import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    style,
    ...props
}) => {
    const baseStyles: React.CSSProperties = {
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
    };

    const variantStyles = {
        default: {
            boxShadow: 'var(--shadow-lg)',
            border: 'none',
        },
        flat: {
            boxShadow: 'none',
            border: '1px solid var(--color-border)',
        }
    };

    const paddingStyles = {
        none: { padding: 0 },
        sm: { padding: 'var(--spacing-4)' },
        md: { padding: 'var(--spacing-6)' },
        lg: { padding: 'var(--spacing-8)' },
    };

    return (
        <div
            className={className}
            style={{
                ...baseStyles,
                ...variantStyles[variant],
                ...paddingStyles[padding],
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
};
