export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    timestamp: string;
}

export interface ApiError {
    code: string;
    message: string;
    status: number;
    retryable: boolean;
}

export interface RequestConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    cache?: boolean;
    cacheTTL?: number;
}
