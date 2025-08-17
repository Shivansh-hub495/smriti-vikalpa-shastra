/**
 * @fileoverview Unit tests for useUnsavedChanges hook
 * @description Tests for unsaved changes detection and warnings
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnsavedChanges, useSaveShortcuts, useDraftStorage } from '../useUnsavedChanges';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/test' })
}));

const mockToast = vi.mocked(require('@/hooks/use-toast').toast);

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock window methods
    Object.defineProperty(window, 'confirm', {
      value: vi.fn(),
      writable: true
    });
    
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
      writable: true
    });
    
    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useUnsavedChanges(false));

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.getLastAutoSaveText()).toBeNull(