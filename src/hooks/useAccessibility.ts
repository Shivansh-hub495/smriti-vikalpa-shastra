import { useEffect, useRef } from 'react';

interface UseAccessibilityOptions {
  autoFocus?: boolean;
  announceChanges?: boolean;
  trapFocus?: boolean;
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const { autoFocus = false, announceChanges = false, trapFocus = false } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus management
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    }
  }, [autoFocus]);

  // Focus trap for modals/dialogs
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [trapFocus]);

  // Screen reader announcements
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return {
    containerRef,
    announce,
  };
};

export const useKeyboardNavigation = (
  items: HTMLElement[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
  } = {}
) => {
  const { loop = true, orientation = 'vertical' } = options;
  const currentIndex = useRef(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    if (e.key === nextKey) {
      e.preventDefault();
      currentIndex.current = loop 
        ? (currentIndex.current + 1) % items.length
        : Math.min(currentIndex.current + 1, items.length - 1);
      items[currentIndex.current]?.focus();
    } else if (e.key === prevKey) {
      e.preventDefault();
      currentIndex.current = loop
        ? (currentIndex.current - 1 + items.length) % items.length
        : Math.max(currentIndex.current - 1, 0);
      items[currentIndex.current]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      currentIndex.current = 0;
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      currentIndex.current = items.length - 1;
      items[items.length - 1]?.focus();
    }
  };

  return { handleKeyDown };
};