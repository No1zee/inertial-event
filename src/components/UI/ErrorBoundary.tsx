"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "./button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-zinc-400 max-w-md mb-8">
            We've encountered an unexpected error. Don't worry, your progress is safe.
          </p>

          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-white text-black hover:bg-zinc-200"
            >
              <RefreshCcw size={18} className="mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-white/10 text-white hover:bg-white/5"
            >
              <Home size={18} className="mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
