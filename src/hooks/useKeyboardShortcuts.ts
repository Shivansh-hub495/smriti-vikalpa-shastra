/**
 * @fileoverview Keyboard shortcuts hook
 * @description Provides keyboard shortcut functionality for form operations
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

interface KeyboardShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Whether to show toast notifications for shortcuts */
  showNotifications?: boolean;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutsOptions = {}
) => {
  const {
    enabled = true,
    showNotifications = false,
    preventDefault = true
  } = options;

  const { toast } = useToast();
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const activeShortcuts = shortcutsRef.current.filter(shortcut => !shortcut.disabled);

    for (const shortcut of activeShortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!event.ctrlKey === !!shortcut.ctrlKey;
      const shiftMatches = !!event.shiftKey === !!shortcut.shiftKey;
      const altMatches = !!event.altKey === !!shortcut.altKey;
      const metaMatches = !!event.metaKey === !!shortcut.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }

        try {
          shortcut.action();

          if (showNotifications) {
            toast({
              title: "Shortcut Executed",
              description: shortcut.description,
              duration: 2000,
            });
          }
        } catch (error) {
          console.error('Keyboard shortcut action failed:', error);
          
          if (showNotifications) {
            toast({
              title: "Shortcut Failed",
              description: "An error occurred while executing the shortcut",
              variant: "destructive",
              duration: 3000,
            });
          }
        }

        break; // Only execute the first matching shortcut
      }
    }
  }, [enabled, preventDefault, showNotifications, toast]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  const getShortcutDescription = useCallback((key: string, modifiers: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}) => {
    const parts: string[] = [];
    
    if (modifiers.ctrlKey) parts.push('Ctrl');
    if (modifiers.shiftKey) parts.push('Shift');
    if (modifiers.altKey) parts.push('Alt');
    if (modifiers.metaKey) parts.push('Cmd');
    
    parts.push(key.toUpperCase());
    
    return parts.join(' + ');
  }, []);

  return {
    getShortcutDescription
  };
};

/**
 * Hook specifically for form keyboard shortcuts
 */
export const useFormKeyboardShortcuts = (options: {
  onSave?: () => void;
  onSaveAndAddAnother?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  canSave?: boolean;
  canReset?: boolean;
  enabled?: boolean;
}) => {
  const {
    onSave,
    onSaveAndAddAnother,
    onCancel,
    onReset,
    canSave = true,
    canReset = true,
    enabled = true
  } = options;

  const shortcuts: KeyboardShortcut[] = [
    // Save (Ctrl+S)
    {
      key: 's',
      ctrlKey: true,
      action: () => onSave?.(),
      description: 'Save question',
      disabled: !canSave || !onSave
    },
    // Save and add another (Ctrl+Shift+S)
    {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      action: () => onSaveAndAddAnother?.(),
      description: 'Save and add another question',
      disabled: !canSave || !onSaveAndAddAnother
    },
    // Cancel (Escape)
    {
      key: 'Escape',
      action: () => onCancel?.(),
      description: 'Cancel editing',
      disabled: !onCancel
    },
    // Reset form (Ctrl+R)
    {
      key: 'r',
      ctrlKey: true,
      action: () => onReset?.(),
      description: 'Reset form',
      disabled: !canReset || !onReset
    }
  ];

  useKeyboardShortcuts(shortcuts, {
    enabled,
    showNotifications: false, // Don't show notifications for form shortcuts
    preventDefault: true
  });

  return {
    shortcuts: shortcuts.filter(s => !s.disabled)
  };
};

/**
 * Hook for question type shortcuts
 */
export const useQuestionTypeShortcuts = (
  onChangeType: (type: 'mcq' | 'fill_blank' | 'true_false' | 'match_following') => void,
  enabled = true
) => {
  const shortcuts: KeyboardShortcut[] = [
    // Multiple Choice (Ctrl+1)
    {
      key: '1',
      ctrlKey: true,
      action: () => onChangeType('mcq'),
      description: 'Switch to Multiple Choice'
    },
    // Fill in the Blank (Ctrl+2)
    {
      key: '2',
      ctrlKey: true,
      action: () => onChangeType('fill_blank'),
      description: 'Switch to Fill in the Blank'
    },
    // True/False (Ctrl+3)
    {
      key: '3',
      ctrlKey: true,
      action: () => onChangeType('true_false'),
      description: 'Switch to True/False'
    },
    // Match the Following (Ctrl+4)
    {
      key: '4',
      ctrlKey: true,
      action: () => onChangeType('match_following'),
      description: 'Switch to Match the Following'
    }
  ];

  useKeyboardShortcuts(shortcuts, {
    enabled,
    showNotifications: true,
    preventDefault: true
  });

  return {
    shortcuts
  };
};

export default useKeyboardShortcuts;