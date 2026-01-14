import React from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    return (
        <div className={`fixed bottom-8 right-8 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-xl animate-in slide-in-from-right duration-300 z-[100] flex items-center gap-4`}>
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="hover:opacity-70">
                ✕
            </button>
        </div>
    );
};

export default Toast;
