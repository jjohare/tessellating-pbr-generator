/**
 * Centralized Error Handler Module
 * Provides retry strategies, logging, and fallback mechanisms
 */

import { RetryOptions, ErrorContext, ErrorReport } from '../../interfaces';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorReport[] = [];
  private readonly defaultRetryOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'RATE_LIMIT_EXCEEDED',
      'SERVICE_UNAVAILABLE'
    ]
  };

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Execute an operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options?: RetryOptions,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const config = { ...this.defaultRetryOptions, ...options };
    let lastError: Error | null = null;
    let delay = config.initialDelay;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const errorContext: ErrorContext = {
          module: context?.module || 'unknown',
          operation: context?.operation || 'unknown',
          attempt,
          timestamp: new Date(),
          ...context
        };

        this.handleError(lastError, errorContext);

        if (!this.isRetryable(lastError, config.retryableErrors) || attempt === config.maxRetries) {
          throw lastError;
        }

        console.log(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms...`);
        await this.sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Handle and log errors with context
   */
  handleError(error: Error, context: ErrorContext): void {
    const report: ErrorReport = {
      error,
      context,
      resolution: this.determineResolution(error)
    };

    this.errorLog.push(report);
    this.logError(report);
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryable(error: Error, retryableErrors: string[]): boolean {
    const errorString = error.toString();
    const errorCode = (error as any).code;
    
    return retryableErrors.some(retryableError => 
      errorString.includes(retryableError) || errorCode === retryableError
    );
  }

  /**
   * Determine resolution strategy for an error
   */
  private determineResolution(error: Error): 'retry' | 'fallback' | 'fail' {
    const errorString = error.toString();
    
    if (this.isRetryable(error, this.defaultRetryOptions.retryableErrors)) {
      return 'retry';
    }
    
    if (errorString.includes('INVALID_') || errorString.includes('VALIDATION_')) {
      return 'fail';
    }
    
    return 'fallback';
  }

  /**
   * Log error with appropriate formatting
   */
  private logError(report: ErrorReport): void {
    const { error, context, resolution } = report;
    const timestamp = context.timestamp.toISOString();
    
    console.error(`
[${timestamp}] ERROR in ${context.module}::${context.operation}
Attempt: ${context.attempt || 1}
Resolution: ${resolution}
Error: ${error.message}
Stack: ${error.stack}
Context: ${JSON.stringify(context.input, null, 2)}
    `);
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byModule: Record<string, number>;
    byResolution: Record<string, number>;
  } {
    const stats = {
      total: this.errorLog.length,
      byModule: {} as Record<string, number>,
      byResolution: {} as Record<string, number>
    };

    this.errorLog.forEach(report => {
      // Count by module
      stats.byModule[report.context.module] = 
        (stats.byModule[report.context.module] || 0) + 1;
      
      // Count by resolution
      stats.byResolution[report.resolution || 'unknown'] = 
        (stats.byResolution[report.resolution || 'unknown'] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const retryWithBackoff = <T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext>
): Promise<T> => {
  return errorHandler.withRetry(operation, undefined, context);
};

export const retryWithCustomOptions = <T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  context: Partial<ErrorContext>
): Promise<T> => {
  return errorHandler.withRetry(operation, options, context);
};