/**
 * @fileoverview Unit tests for useRetryOperation hook
 * @description Tests for retry operation functionality with exponential backoff
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRetryOperation, useQuestionSaveRetry, useDataLoadRetry } from '../useRetryOperation';
import { NetworkQuizError } from '@/lib/error-handling';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

vi.mock('@/lib/error-handling', () => ({
  NetworkQuizError: class NetworkQuizError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NetworkQuizError';
    }
  },
  getErrorHandler: () => ({
    handleError: vi.fn()
  })
}));

const mockToast = vi.mocked(require('@/hooks/use-toast').toast);
const mockHandleError = vi.fn();

describe('useRetryOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockHandleError.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRetryOperation());

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.currentAttempt).toBe(0);
    expect(result.current.lastError).toBeNull();
    expect(result.current.totalAttempts).toBe(0);
  });

  it('should execute operation successfully on first attempt', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetryOperation());

    let operationResult: string;
    await act(async () => {
      operationResult = await result.current.executeWithRetry(mockOperation);
    });

    expect(operationResult!).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.currentAttempt).toBe(1);
    expect(result.current.totalAttempts).toBe(1);
    expect(result.current.lastError).toBeNull();
  });

  it('should retry on retryable errors', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new NetworkQuizError('Network error'))
      .mockRejectedValueOnce(new NetworkQuizError('Network error'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 3,
      initialDelay: 100
    }));

    let operationResult: string;
    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      // Fast-forward through delays
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      vi.advanceTimersByTime(200);
      await Promise.resolve();
      
      operationResult = await promise;
    });

    expect(operationResult!).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(result.current.totalAttempts).toBe(3);
    expect(mockToast).toHaveBeenCalledTimes(2); // Two retry notifications
  });

  it('should fail after max retries', async () => {
    const error = new NetworkQuizError('Persistent network error');
    const mockOperation = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 2,
      initialDelay: 100
    }));

    await act(async () => {
      try {
        const promise = result.current.executeWithRetry(mockOperation);
        
        // Fast-forward through all delays
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        
        await promise;
        expect.fail('Should have thrown an error');
      } catch (thrownError) {
        expect(thrownError).toBe(error);
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBe(error);
  });

  it('should not retry non-retryable errors', async () => {
    const error = new Error('Validation error');
    const mockOperation = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 3,
      isRetryable: (err) => err instanceof NetworkQuizError
    }));

    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
        expect.fail('Should have thrown an error');
      } catch (thrownError) {
        expect(thrownError).toBe(error);
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.isRetrying).toBe(false);
  });

  it('should use exponential backoff', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new NetworkQuizError('Error 1'))
      .mockRejectedValueOnce(new NetworkQuizError('Error 2'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 3,
      initialDelay: 100,
      useExponentialBackoff: true
    }));

    const startTime = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => startTime);

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      // First retry after 100ms
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      
      // Second retry after 200ms (exponential)
      vi.advanceTimersByTime(200);
      await Promise.resolve();
      
      await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should respect max delay', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new NetworkQuizError('Error'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 2,
      initialDelay: 1000,
      useExponentialBackoff: true,
      maxDelay: 500 // Lower than exponential would be
    }));

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      // Should use maxDelay instead of exponential delay
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      
      await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should call retry callback', async () => {
    const onRetry = vi.fn();
    const error = new NetworkQuizError('Network error');
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 2,
      initialDelay: 100,
      onRetry
    }));

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      
      await promise;
    });

    expect(onRetry).toHaveBeenCalledWith(1, error);
  });

  it('should call max retries reached callback', async () => {
    const onMaxRetriesReached = vi.fn();
    const error = new NetworkQuizError('Persistent error');
    const mockOperation = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 1,
      initialDelay: 100,
      onMaxRetriesReached
    }));

    await act(async () => {
      try {
        const promise = result.current.executeWithRetry(mockOperation);
        
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        
        await promise;
        expect.fail('Should have thrown');
      } catch {
        // Expected
      }
    });

    expect(onMaxRetriesReached).toHaveBeenCalledWith(error);
  });

  it('should cancel retry operation', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new NetworkQuizError('Error'));
    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 3,
      initialDelay: 1000
    }));

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      // Cancel during delay
      result.current.cancelRetry();
      
      try {
        await promise;
        expect.fail('Should have been cancelled');
      } catch (error: any) {
        expect(error.message).toBe('Operation was cancelled');
      }
    });

    expect(result.current.isRetrying).toBe(false);
  });

  it('should reset retry state', () => {
    const { result } = renderHook(() => useRetryOperation());

    // Simulate some state
    act(() => {
      (result.current as any).setState({
        isRetrying: true,
        currentAttempt: 2,
        lastError: new Error('Test'),
        totalAttempts: 3
      });
    });

    act(() => {
      result.current.resetRetryState();
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.currentAttempt).toBe(0);
    expect(result.current.lastError).toBeNull();
    expect(result.current.totalAttempts).toBe(0);
  });

  it('should get retry status text', () => {
    const { result } = renderHook(() => useRetryOperation({ maxRetries: 3 }));

    // Initially no status
    expect(result.current.getRetryStatusText()).toBeNull();

    // Mock retrying state
    act(() => {
      (result.current as any).setState({
        isRetrying: true,
        currentAttempt: 2
      });
    });

    expect(result.current.getRetryStatusText()).toBe('Retrying... (attempt 2 of 4)');
  });

  it('should handle custom options in executeWithRetry', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Custom error'))
      .mockResolvedValue('success');

    const customIsRetryable = vi.fn().mockReturnValue(true);

    const { result } = renderHook(() => useRetryOperation({
      maxRetries: 1,
      initialDelay: 100
    }));

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation, {
        isRetryable: customIsRetryable
      });
      
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      
      await promise;
    });

    expect(customIsRetryable).toHaveBeenCalled();
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should pass abort signal to operation', async () => {
    const mockOperation = vi.fn().mockImplementation((signal) => {
      expect(signal).toBeInstanceOf(AbortSignal);
      return Promise.resolve('success');
    });

    const { result } = renderHook(() => useRetryOperation());

    await act(async () => {
      await result.current.executeWithRetry(mockOperation);
    });

    expect(mockOperation).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
});

describe('useQuestionSaveRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct configuration for question saving', () => {
    const { result } = renderHook(() => useQuestionSaveRetry());

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.currentAttempt).toBe(0);
    expect(result.current.lastError).toBeNull();
    expect(result.current.totalAttempts).toBe(0);
  });

  it('should retry on network errors', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new NetworkQuizError('Network error'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useQuestionSaveRetry());

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      // Fast-forward through delay
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      
      await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should retry on server errors', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('500 Internal Server Error'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useQuestionSaveRetry());

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      
      await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should not retry on validation errors', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Validation failed'));
    const { result } = renderHook(() => useQuestionSaveRetry());

    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toBe('Validation failed');
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
  });
});

describe('useDataLoadRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct configuration for data loading', () => {
    const { result } = renderHook(() => useDataLoadRetry());

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.currentAttempt).toBe(0);
    expect(result.current.lastError).toBeNull();
    expect(result.current.totalAttempts).toBe(0);
  });

  it('should retry on fetch errors', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValue('data');

    const { result } = renderHook(() => useDataLoadRetry());

    await act(async () => {
      const promise = result.current.executeWithRetry(mockOperation);
      
      // Data load retry uses shorter delay
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      
      await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should have fewer max retries than save operations', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('load failed'));
    const { result } = renderHook(() => useDataLoadRetry());

    await act(async () => {
      try {
        const promise = result.current.executeWithRetry(mockOperation);
        
        // Should fail after 3 attempts (initial + 2 retries)
        vi.advanceTimersByTime(500);
        await Promise.resolve();
        vi.advanceTimersByTime(500);
        await Promise.resolve();
        
        await promise;
        expect.fail('Should have thrown');
      } catch {
        // Expected
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});