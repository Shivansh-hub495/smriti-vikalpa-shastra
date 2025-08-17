import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
}

export const usePerformanceMonitoring = (componentName: string) => {
  const startTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(Date.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
  });

  // Track component mount time
  useEffect(() => {
    const loadTime = Date.now() - startTimeRef.current;
    setMetrics(prev => ({ ...prev, loadTime }));

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} loaded in ${loadTime}ms`);
    }
  }, [componentName]);

  // Track render time
  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  });

  const trackInteraction = (interactionName: string) => {
    const interactionStart = Date.now();
    
    return () => {
      const interactionTime = Date.now() - interactionStart;
      setMetrics(prev => ({ ...prev, interactionTime }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} - ${interactionName} took ${interactionTime}ms`);
      }
    };
  };

  return {
    metrics,
    trackInteraction,
  };
};

export const usePageLoadTime = () => {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return loadTime;
};