import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for animation
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-50/90',
        error: 'bg-red-50/90',
        info: 'bg-blue-50/90',
    };

    return (
        <div
            className={`
                fixed top-6 left-1/2 -translate-x-1/2 z-[100]
                min-w-[320px] max-w-[90vw] p-4 rounded-2xl
                flex items-center gap-3 border shadow-xl
                backdrop-blur-md transition-all duration-300
                ${bgColors[type]}
                ${isExiting ? 'opacity-0 -translate-y-4 scale-95' : 'animate-slide-down'}
            `}
            style={{
                borderColor: 'rgba(255,255,255,0.4)',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
            }}
        >
            <div className="shrink-0">{icons[type]}</div>
            <p className="flex-1 text-sm font-bold text-gray-800 leading-tight">
                {message}
            </p>
            <button
                onClick={handleClose}
                className="p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-gray-400" />
            </button>
        </div>
    );
};
