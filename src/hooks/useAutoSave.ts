/**
 * @fileoverview Auto-save hook for form data
 * @description Provides auto-save functionality with debouncing to prevent data loss
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  /** Unique key for localStorage */
  key: string;
  /** Data to auto-save */
  data: any;
  /** Debounce delay in milliseconds */
  delay?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Callback when auto-save occurs */
  onAutoSave?: (data: any) => void;
  /** Callback when auto-save fails */
  onAutoSaveError?: (error: Error) => void;
}

/**
 * Hook for auto-saving form data to localStorage with debouncing
 */
export const useAutoSave = ({
  key,
  data,
  delay = 2000,
  enabled = true,
  onAutoSave,
  onAutoSaveError
}: AutoSaveOptions) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  const saveToStorage = useCallback((dataToSave: any) => {
    try {
      const serialized = JSON.stringify({
        data: dataToSave,
        timestamp: Date.now(),
        version: '1.0'
      });

      // Only save if data has actually changed
      if (serialized !== lastSavedRef.current) {
        localStorage.setItem(key, serialized);
        lastSavedRef.current = serialized;
        onAutoSave?.(dataToSave);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      onAutoSaveError?.(error as Error);
    }
  }, [key, onAutoSave, onAutoSaveError]);

  const debouncedSave = useCallback((dataToSave: any) => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveToStorage(dataToSave);
    }, delay);
  }, [enabled, delay, saveToStorage]);

  // Auto-save when data changes
  useEffect(() => {
    if (data && enabled) {
      debouncedSave(data);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debouncedSave]);

  const loadFromStorage = useCallback((): any | null => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Check if data is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Failed to load auto-saved data:', error);
      // Remove corrupted data
      localStorage.removeItem(key);
      return null;
    }
  }, [key]);

  const clearAutoSave = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastSavedRef.current = '';
      
      // Clear any pending save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to clear auto-saved data:', error);
    }
  }, [key]);

  const hasAutoSavedData = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return false;

      const parsed = JSON.parse(stored);
      
      // Check if data is not too old
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      return Date.now() - parsed.timestamp <= maxAge;
    } catch (error) {
      return false;
    }
  }, [key]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToStorage(data);
  }, [data, saveToStorage]);

  return {
    loadFromStorage,
    clearAutoSave,
    hasAutoSavedData,
    forceSave
  };
};

/**
 * Hook for managing draft recovery
 */
export const useDraftRecovery = (
  autoSaveKey: string,
  onRecover: (data: any) => void,
  onDiscard: () => void
) => {
  const { toast } = useToast();
  const { loadFromStorage, clearAutoSave, hasAutoSavedData } = useAutoSave({
    key: autoSaveKey,
    data: null,
    enabled: false
  });

  const checkForDraft = useCallback(() => {
    if (hasAutoSavedData()) {
      const draftData = loadFromStorage();
      if (draftData) {
        // Show recovery notification
        toast({
          title: "Draft Found",
          description: "We found an unsaved draft. Check the console for recovery options.",
          duration: 10000,
        });

        // Log the draft data for now - components can implement their own recovery UI
        console.log('Draft data available for recovery:', draftData);
        
        // Auto-recover for now (can be made optional)
        onRecover(draftData);
      }
    }
  }, [hasAutoSavedData, loadFromStorage, onRecover, toast]);

  const recoverDraft = useCallback(() => {
    const draftData = loadFromStorage();
    if (draftData) {
      onRecover(draftData);
      toast({
        title: "Draft Recovered",
        description: "Your previous work has been restored.",
      });
    }
  }, [loadFromStorage, onRecover, toast]);

  const discardDraft = useCallback(() => {
    clearAutoSave();
    onDiscard();
    toast({
      title: "Draft Discarded",
      description: "The draft has been removed.",
    });
  }, [clearAutoSave, onDiscard, toast]);

  return {
    checkForDraft,
    recoverDraft,
    discardDraft,
    hasAutoSavedData,
    loadFromStorage,
    clearAutoSave
  };
};

export default useAutoSave;