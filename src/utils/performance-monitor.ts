/**
 * @fileoverview Performance Monitoring Utilities for Quiz System
 * @description Tools for monitoring and optimizing quiz system performance
 * @author Quiz System Implementation
 * @version 1.0.0
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  totalMetrics: number;
  averageDuration: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  operationCounts: Record<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeMetrics = new Map<string, PerformanceMetric>();
  private readonly MAX_METRICS = 1000; // Prevent memory leaks

  /**
   * Start timing an operation
   */
  startTiming(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.activeMetrics.set(id, metric);
    return id;
  }

  /**
   * End timing an operation
   */
  endTiming(id: string): number | null {
    const metric = this.activeMetrics.get(id);
    if (!metric) {
      console.warn(`Performance metric not found: ${id}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeMetrics.delete(id);
    this.addMetric(metric);

    return metric.duration;
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(
    name: string, 
    fn: () => Promise<T> | T, 
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    const id = this.startTiming(name, metadata);
    
    try {
      const result = await fn();
      const duration = this.endTiming(id) || 0;
      return { result, duration };
    } catch (error) {
      this.endTiming(id);
      throw error;
    }
  }

  /**
   * Add a completed metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Prevent memory leaks by keeping only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get performance report
   */
  getReport(operationName?: string): PerformanceReport {
    const filteredMetrics = operationName 
      ? this.metrics.filter(m => m.name === operationName)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationCounts: {}
      };
    }

    const durations = filteredMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);

    const operationCounts: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      operationCounts[m.name] = (operationCounts[m.name] || 0) + 1;
    });

    return {
      totalMetrics: filteredMetrics.length,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      slowestOperation: durations.length > 0 ? filteredMetrics.find(m => m.duration === Math.max(...durations)) || null : null,
      fastestOperation: durations.length > 0 ? filteredMetrics.find(m => m.duration === Math.min(...durations)) || null : null,
      operationCounts
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsInRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(m => 
      m.startTime >= startTime && (m.endTime || m.startTime) <= endTime
    );
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeMetrics.clear();
  }

  /**
   * Log performance summary to console
   */
  logSummary(operationName?: string): void {
    const report = this.getReport(operationName);
    
    console.group(`Performance Report${operationName ? ` - ${operationName}` : ''}`);
    console.log(`Total Operations: ${report.totalMetrics}`);
    console.log(`Average Duration: ${report.averageDuration.toFixed(2)}ms`);
    
    if (report.slowestOperation) {
      console.log(`Slowest Operation: ${report.slowestOperation.name} (${report.slowestOperation.duration?.toFixed(2)}ms)`);
    }
    
    if (report.fastestOperation) {
      console.log(`Fastest Operation: ${report.fastestOperation.name} (${report.fastestOperation.duration?.toFixed(2)}ms)`);
    }
    
    console.log('Operation Counts:', report.operationCounts);
    console.groupEnd();
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      report: this.getReport()
    }, null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for timing class methods
 */
export function timed(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operationName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const { result, duration } = await performanceMonitor.timeFunction(
        operationName,
        () => originalMethod.apply(this, args),
        { args: args.length }
      );

      // Log slow operations
      if (duration > 1000) { // More than 1 second
        console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Hook for monitoring React component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderStartTime = React.useRef<number>(0);

  React.useEffect(() => {
    renderStartTime.current = performance.now();
  });

  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    performanceMonitor.addMetric({
      name: `render_${componentName}`,
      startTime: renderStartTime.current,
      endTime: performance.now(),
      duration: renderTime
    } as any);

    // Log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  });
}

/**
 * Performance monitoring for quiz operations
 */
export class QuizPerformanceMonitor {
  /**
   * Monitor quiz loading performance
   */
  static async monitorQuizLoad<T>(
    operation: () => Promise<T>,
    quizId: string,
    operationType: 'load' | 'questions' | 'attempts' | 'stats'
  ): Promise<T> {
    return performanceMonitor.timeFunction(
      `quiz_${operationType}`,
      operation,
      { quizId, operationType }
    ).then(({ result, duration }) => {
      // Log performance warnings
      const thresholds = {
        load: 500,      // 500ms for quiz loading
        questions: 300,  // 300ms for questions
        attempts: 400,   // 400ms for attempts
        stats: 200       // 200ms for stats
      };

      if (duration > thresholds[operationType]) {
        console.warn(
          `Quiz ${operationType} performance warning: ${duration.toFixed(2)}ms for quiz ${quizId}`
        );
      }

      return result;
    });
  }

  /**
   * Monitor database query performance
   */
  static async monitorDatabaseQuery<T>(
    operation: () => Promise<T>,
    tableName: string,
    queryType: 'select' | 'insert' | 'update' | 'delete'
  ): Promise<T> {
    return performanceMonitor.timeFunction(
      `db_${queryType}_${tableName}`,
      operation,
      { tableName, queryType }
    ).then(({ result, duration }) => {
      // Log slow database queries
      if (duration > 1000) {
        console.warn(
          `Slow database query: ${queryType} on ${tableName} took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    });
  }

  /**
   * Get quiz-specific performance report
   */
  static getQuizPerformanceReport(): PerformanceReport {
    const quizMetrics = performanceMonitor.getReport().operationCounts;
    const quizOperations = Object.keys(quizMetrics).filter(key => 
      key.startsWith('quiz_') || key.startsWith('db_')
    );

    console.group('Quiz System Performance Report');
    quizOperations.forEach(operation => {
      const report = performanceMonitor.getReport(operation);
      console.log(`${operation}: ${report.totalMetrics} operations, avg ${report.averageDuration.toFixed(2)}ms`);
    });
    console.groupEnd();

    return performanceMonitor.getReport();
  }
}

// React import for useRenderPerformance hook
import React from 'react';

export default performanceMonitor;