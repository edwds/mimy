import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    style,
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-2 w-full ${className}`}>
            {label && (
                <label
                    className="text-sm font-medium ml-1"
                    style={{ color: 'var(--color-text-sub)' }}
                >
                    {label}
                </label>
            )}
            <input
                className="w-full px-5 py-3 transition-all outline-none"
                style={{
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-gray-50)',
                    border: error ? '2px solid var(--color-primary)' : '2px solid transparent',
                    color: 'var(--color-text-main)',
                    fontSize: 'var(--text-lg)',
                    ...style
                }}
                {...props}
            />
            {error && (
                <span
                    className="text-xs ml-1 mt-1"
                    style={{ color: 'var(--color-primary)' }}
                >
                    {error}
                </span>
            )}
        </div>
    );
};
