/**
 * @fileoverview Hook for handling unsaved changes detection and warnings
 * @description Provides functionality to detect unsaved changes and warn users before navigation
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface UnsavedChangesOptions {
  /** Whether to show browser warning on page unload */
  enableBrowserWarning?: boolean;
  /** Whether to show custom warning dialog */
  enableCustomWarning?: boolean;
  /** Custom warning message */
  warningMessage?: string;
  /** Callback when user tries to navigate away */
  onNavigationAttempt?: (targetPath: string) => boolean | Promise<boolean>;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Auto-save callback function */
  onAutoSave?: () => Promise<void> | void;
}

interface UnsavedChangesState {
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  lastAutoSave: Date | null;
  autoSaveError: string | null;
}

/**
 * Hook for managing unsaved changes detection and warnings
 */
export const useUnsavedChanges = (
  hasChanges: boolean,
  options: UnsavedChangesOptions = {}
) => {
  const {
    enableBrowserWarning = true,
    enableCustomWarning = true,
    warningMessage = 'You have unsaved changes. Are you sure you want to leave?',
    onNavigationAttempt,
    autoSaveInterval,
    onAutoSave
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  
  const [state, setState] = useState<UnsavedChangesState>({
    hasUnsavedChanges: hasChanges,
    isAutoSaving: false,
    lastAutoSave: null,
    autoSaveError: null
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const navigationBlockerRef = useRef<(() => void) | null>(null);
  const pendingNavigationRef = useRef<string | null>(null);

  // Update unsaved changes state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges
    }));
  }, [hasChanges]);

  // Browser beforeunload warning
  useEffect(() => {
    if (!enableBrowserWarning) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = warningMessage;
        return warningMessage;
      }
    };

    if (state.hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.hasUnsavedChanges, enableBrowserWarning, warningMessage]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveInterval || !onAutoSave || !state.hasUnsavedChanges) {
      return;
    }

    const performAutoSave = async () => {
      if (state.isAutoSaving) return;

      setState(prev => ({ ...prev, isAutoSaving: true, autoSaveError: null }));

      try {
        await onAutoSave();
        setState(prev => ({
          ...prev,
          isAutoSaving: false,
          lastAutoSave: new Date(),
          autoSaveError: null
        }));

        toast({
          title: "Auto-saved",
          description: "Your changes have been automatically saved",
          variant: "default"
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
        setState(prev => ({
          ...prev,
          isAutoSaving: false,
          autoSaveError: errorMessage
        }));

        toast({
          title: "Auto-save failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };

    autoSaveTimeoutRef.current = setTimeout(performAutoSave, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.hasUnsavedChanges, state.isAutoSaving, autoSaveInterval, onAutoSave]);

  /**
   * Show confirmation dialog for unsaved changes
   */
  const showUnsavedChangesDialog = useCallback(async (targetPath: string): Promise<boolean> => {
    if (!enableCustomWarning || !state.hasUnsavedChanges) {
      return true;
    }

    // If custom navigation handler is provided, use it
    if (onNavigationAttempt) {
      return await onNavigationAttempt(targetPath);
    }

    // Default browser confirm dialog
    return window.confirm(warningMessage);
  }, [state.hasUnsavedChanges, enableCustomWarning, warningMessage, onNavigationAttempt]);

  /**
   * Navigate with unsaved changes check
   */
  const navigateWithCheck = useCallback(async (path: string, options?: { replace?: boolean }) => {
    const canNavigate = await showUnsavedChangesDialog(path);
    
    if (canNavigate) {
      navigate(path, options);
    }
  }, [navigate, showUnsavedChangesDialog]);

  /**
   * Force navigation without checks (for after successful save)
   */
  const forceNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    // Temporarily disable unsaved changes
    setState(prev => ({ ...prev, hasUnsavedChanges: false }));
    navigate(path, options);
  }, [navigate]);

  /**
   * Clear unsaved changes state
   */
  const clearUnsavedChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      autoSaveError: null
    }));
  }, []);

  /**
   * Manually trigger auto-save
   */
  const triggerAutoSave = useCallback(async () => {
    if (!onAutoSave || state.isAutoSaving) return;

    setState(prev => ({ ...prev, isAutoSaving: true, autoSaveError: null }));

    try {
      await onAutoSave();
      setState(prev => ({
        ...prev,
        isAutoSaving: false,
        lastAutoSave: new Date(),
        autoSaveError: null
      }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
      setState(prev => ({
        ...prev,
        isAutoSaving: false,
        autoSaveError: errorMessage
      }));
      return false;
    }
  }, [onAutoSave, state.isAutoSaving]);

  /**
   * Get formatted last auto-save time
   */
  const getLastAutoSaveText = useCallback(() => {
    if (!state.lastAutoSave) return null;

    const now = new Date();
    const diff = now.getTime() - state.lastAutoSave.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `Last saved ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return `Last saved ${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
  }, [state.lastAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (navigationBlockerRef.current) {
        navigationBlockerRef.current();
      }
    };
  }, []);

  return {
    // State
    hasUnsavedChanges: state.hasUnsavedChanges,
    isAutoSaving: state.isAutoSaving,
    lastAutoSave: state.lastAutoSave,
    autoSaveError: state.autoSaveError,
    
    // Methods
    navigateWithCheck,
    forceNavigate,
    clearUnsavedChanges,
    triggerAutoSave,
    showUnsavedChangesDialog,
    getLastAutoSaveText
  };
};

/**
 * Hook for keyboard shortcuts related to saving
 */
export const useSaveShortcuts = (onSave: () => void | Promise<void>, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        await onSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, enabled]);
};

/**
 * Hook for managing draft data in localStorage
 */
export const useDraftStorage = <T>(key: string, initialData: T) => {
  const [draftData, setDraftData] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialData;
    } catch {
      return initialData;
    }
  });

  const saveDraft = useCallback((data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setDraftData(data);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setDraftData(initialData);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key, initialData]);

  const hasDraft = useCallback(() => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }, [key]);

  return {
    draftData,
    saveDraft,
    clearDraft,
    hasDraft
  };
};