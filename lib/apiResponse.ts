import { NextResponse } from 'next/server';

/**
 * Standard API Response Structures for Builder Panel
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  meta?: Record<string, any>;
}

/**
 * Creates a standard JSON success response
 */
export function apiSuccess<T>(data: T, message?: string, status: number = 200, meta?: Record<string, any>) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(payload, { status });
}

/**
 * Creates a standard JSON error response
 */
export function apiError(errorMessage: string, status: number = 400, details?: any) {
  const payload: ApiResponse = {
    success: false,
    error: errorMessage,
    ...(details ? { details } : {}),
  };
  return NextResponse.json(payload, { status });
}

/**
 * Global error handler wrapper for API routes
 * Ensures consistent try/catch, logging, and error output
 */
export function handleApiError(error: unknown, contextMessage: string = 'Internal Server Error') {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  console.error(`[API Error] ${contextMessage}:`, errorObj.message, errorObj.stack);

  const isDev = process.env.NODE_ENV !== 'production';
  return apiError(
    errorObj.message || contextMessage,
    500,
    isDev ? { stack: errorObj.stack } : undefined
  );
}
