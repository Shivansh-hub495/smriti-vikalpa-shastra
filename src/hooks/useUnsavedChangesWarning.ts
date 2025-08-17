/**
 * @fileoverview useUnsavedChangesWarning hook for handling navigation with unsaved changes
 * @description Hook for warning users about unsaved changes when navigating away
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseUnsavedChangesWarningOptions {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Custom warning message */
  warningMessage?: string;
  /** Whether to show browser beforeunload warning */
  enableBrowserWarning?: boolean;
}

/**
 * Hook for handling unsaved changes warnings during navigation
 */
export const useUnsavedChangesWarning = ({
  hasUnsavedChanges,
  warningMessage = 'You have unsaved changes. Are you sure you want to leave without saving?',
  enableBrowserWarning = true
}: UseUnsavedChangesWarningOptions) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle browser beforeunload event
  useEffect(() => {
    if (!enableBrowserWarning) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, enableBrowserWarning]);

  /**
   * Navigate with unsaved changes confirmation
   */
  const navigateWithConfirmation = useCallback((
    to: string | number,
    options?: { replace?: boolean }
  ) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(warningMessage);
      if (!confirmLeave) {
        return false;
      }
    }

    if (typeof to === 'string') {
      navigate(to, options);
    } else {
      navigate(to);
    }
    return true;
  }, [hasUnsavedChanges, warningMessage, navigate]);

  /**
   * Go back with unsaved changes confirmation
   */
  const goBackWithConfirmation = useCallback(() => {
    return navigateWithConfirmation(-1);
  }, [navigateWithConfirmation]);

  /**
   * Navigate to a specific route with confirmation
   */
  const navigateToWithConfirmation = useCallback((
    to: string,
    options?: { replace?: boolean }
  ) => {
    return navigateWithConfirmation(to, options);
  }, [navigateWithConfirmation]);

  return {
    navigateWithConfirmation,
    goBackWithConfirmation,
    navigateToWithConfirmation,
    hasUnsavedChanges
  };
};

export default useUnsavedChangesWarning;