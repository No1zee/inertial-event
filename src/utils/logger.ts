type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
    logs: [] as any[],

    log: (level: LogLevel, context: string, message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, context, message, data };

        // Internal collection for "Debug View"
        logger.logs.push(logEntry);
        if (logger.logs.length > 1000) logger.logs.shift();

        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;

        switch (level) {
            case 'info': console.info(formattedMessage, data || ''); break;
            case 'warn': console.warn(formattedMessage, data || ''); break;
            case 'error': console.error(formattedMessage, data || ''); break;
            case 'debug': console.debug(formattedMessage, data || ''); break;
        }

        // Potential push to backend for "Telemetrics"
        if (level === 'error') {
            // fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) }).catch(() => {});
        }
    },

    info: (context: string, message: string, data?: any) => logger.log('info', context, message, data),
    warn: (context: string, message: string, data?: any) => logger.log('warn', context, message, data),
    error: (context: string, message: string, data?: any) => logger.log('error', context, message, data),
    debug: (context: string, message: string, data?: any) => logger.log('debug', context, message, data)
};

export default logger;
