export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  private logs: LogEntry[] = [];
  private maxLogSize: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error : undefined,
      // Add user context if available (you can enhance this with actual user session)
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Add to in-memory logs
    this.logs.push(entry);
    
    // Keep logs within memory limit
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Console output
    const logMethod = entry.level === LogLevel.ERROR ? 'error' :
                      entry.level === LogLevel.WARN ? 'warn' :
                      entry.level === LogLevel.INFO ? 'info' : 'debug';

    console[logMethod](`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`, {
      context: entry.context,
      error: entry.error,
      userId: entry.userId,
      sessionId: entry.sessionId
    });

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production' && entry.level !== LogLevel.DEBUG) {
      this.sendToLogService(entry);
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.log(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.log(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.log(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.log(entry);
  }

  // Logging for specific contexts
  apiError(endpoint: string, error: Error, context?: Record<string, any>): void {
    this.error(`API Error: ${endpoint}`, { 
      endpoint, 
      ...context 
    }, error);
  }

  userAction(action: string, context?: Record<string, any>): void {
    this.info(`User Action: ${action}`, context);
  }

  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...context
    });
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  private getUserId(): string | undefined {
    // In a real app, this would come from your auth system
    try {
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    // Generate or retrieve session ID
    try {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    } catch {
      return undefined;
    }
  }

  private sendToLogService(entry: LogEntry): void {
    // In production, send to your logging service
    // Example: Sentry, LogRocket, Datadog, etc.
    try {
      // This is a placeholder for your logging service integration
      if (process.env.NEXT_PUBLIC_LOG_ENDPOINT) {
        fetch(process.env.NEXT_PUBLIC_LOG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        }).catch(err => {
          console.error('Failed to send log to external service:', err);
        });
      }
    } catch (error) {
      console.error('Error in sendToLogService:', error);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const logError = (message: string, context?: Record<string, any>, error?: Error) => {
  logger.error(message, context, error);
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(message, context);
};