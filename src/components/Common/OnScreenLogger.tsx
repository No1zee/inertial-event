"use client";

import { useEffect, useState } from "react";

export default function OnScreenLogger() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            setLogs(prev => [...prev, "ERROR: " + args.map(a => String(a)).join(" ")].slice(-10));
            originalError.apply(console, args);
        };

        const originalLog = console.log;
        console.log = (...args) => {
             // Only show important logs to avoid spam
             if (args[0]?.toString().startsWith('[AG]')) {
                 setLogs(prev => [...prev, "LOG: " + args.map(a => String(a)).join(" ")].slice(-10));
             }
             originalLog.apply(console, args);
        };

        window.onerror = (message, source, lineno, colno, error) => {
             setLogs(prev => [...prev, `CRASH: ${message} at ${source}:${lineno}`].slice(-10));
        };

        window.onunhandledrejection = (event) => {
             setLogs(prev => [...prev, `UNHANDLED PROMISE: ${event.reason}`].slice(-10));
        };

        return () => {
            console.error = originalError;
            console.log = originalLog;
        };
    }, []);

    if (logs.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '50%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: '#ff5555',
            zIndex: 99999,
            overflowY: 'auto',
            pointerEvents: 'none',
            fontSize: '14px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            padding: '10px'
        }}>
            <h3>DEBUG LOGS (TV)</h3>
            {logs.map((log, i) => (
                <div key={i} style={{ borderBottom: '1px solid #333', marginBottom: '4px' }}>{log}</div>
            ))}
        </div>
    );
}
