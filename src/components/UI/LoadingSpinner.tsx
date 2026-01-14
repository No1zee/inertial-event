import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <p className="text-neutral-400 font-medium animate-pulse">Loading amazing content...</p>
        </div>
    );
};

export default LoadingSpinner;
