import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../../utils/logger';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('ErrorBoundary', 'Caught an unhandled error:', { error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center p-10 text-center space-y-6">
                    <h1 className="text-5xl font-black text-white tracking-tighter">Something flipped.</h1>
                    <p className="text-neutral-500 max-w-md">
                        We caught a glitch in the matrix. The app didn't crash, but this section is being stubborn.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-neutral-200 transition-all"
                    >
                        REFRESH APP
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
