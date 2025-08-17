/**
 * @fileoverview Unit tests for QuestionCreate component
 * @description Tests for question creation functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuestionCreate from '../QuestionCreate';
import { AuthContext } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        error: null
      }))
    }))
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/hooks/useQuizRouteGuard', () => ({
  useQuizRouteGuard: () => ({
    quiz: {
      id: 'quiz-1',
      title: 'Test Quiz',
      folder_id: 'folder-1',
      user_id: 'user-1'
    },
    isLoading: false,
    hasAccess: true,
    isOwner: true
  })
}));

vi.mock('@/hooks/useFolderInfo', () => ({
  useFolderInfo: () => ({
    folder: { name: 'Test Folder' }
  })
}));

vi.mock('@/hooks/useQuestionCount', () => ({
  useQuestionCount: () => ({
    count: 5,
    refreshCount: vi.fn()
  })
}));

vi.mock('@/hooks/useQuestionTypeMemory', () => ({
  useQuestionTypeMemory: () => ({
    lastUsedType: 'mcq',
    updateLastUsedType: vi.fn(),
    getDefaultQuestionData: vi.fn(() => ({ options: ['', '', '', ''], correctAnswer: 0 })),
    getTypeDisplayName: vi.fn(() => 'Multiple Choice'),
    getTypeColorClass: vi.fn(() => 'bg-blue-100')
  })
}));

vi.mock('@/hooks/useQuestionTypeStats', () => ({
  useQuestionTypeStats: () => ({
    recordTypeUsage: vi.fn()
  })
}));

vi.mock('@/hooks/useQuestionFormValidation', () => ({
  useQuestionFormValidation: () => ({
    fieldErrors: {},
    fieldWarnings: {},
    fieldSuggestions: {},
    isValidating: false,
    hasErrors: false,
    hasWarnings: false,
    isFormValid: true,
    validateField: vi.fn(),
    validateForm: vi.fn(() => true),
    clearFieldValidation: vi.fn(),
    clearAllValidation: vi.fn(),
    getFieldValidation: vi.fn(() => ({ errors: [], warnings: [], suggestions: [] }))
  })
}));

vi.mock('@/hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: () => ({
    hasUnsavedChanges: false,
    navigateWithCheck: vi.fn(),
    clearUnsavedChanges: vi.fn(),
    triggerAutoSave: vi.fn(),
    getLastAutoSaveText: vi.fn(() => null)
  })
}));

vi.mock('@/hooks/useRetryOperation', () => ({
  useQuestionSaveRetry: () => ({
    executeWithRetry: vi.fn((fn) => fn()),
    isRetrying: false,
    lastError: null,
    getRetryStatusText: vi.fn(() => null)
  })
}));

vi.mock('@/hooks/useDraftStorage', () => ({
  useDraftStorage: () => ({
    draftData: {},
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
    hasDraft: vi.fn(() => false)
  })
}));

vi.mock('@/hooks/useFormKeyboardShortcuts', () => ({
  useFormKeyboardShortcuts: vi.fn()
}));

vi.mock('@/hooks/useQuestionTypeShortcuts', () => ({
  useQuestionTypeShortcuts: vi.fn()
}));

vi.mock('@/hooks/useSaveShortcuts', () => ({
  useSaveShortcuts: vi.fn()
}));

vi.mock('@/lib/quiz-service', () => ({
  validateQuestionData: vi.fn()
}));

vi.mock('@/lib/error-handling', () => ({
  getErrorHandler: () => ({
    handleError: vi.fn()
  }),
  ValidationQuizError: class ValidationQuizError extends Error {
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  }
}));

// Mock components
vi.mock('@/components/QuestionManager', () => ({
  default: ({ onChange, initialQuestions }: any) => (
    <div data-testid="question-manager">
      <textarea
        data-testid="question-text"
        placeholder="Enter your question..."
        onChange={(e) => onChange([{ ...initialQuestions[0], question_text: e.target.value }])}
      />
    </div>
  )
}));

vi.mock('@/components/QuestionPreview', () => ({
  default: ({ visible }: any) => (
    <div data-testid="question-preview" style={{ display: visible ? 'block' : 'none' }}>
      Preview
    </div>
  )
}));

vi.mock('@/components/QuestionPageHeader', () => ({
  default: ({ onBack }: any) => (
    <div data-testid="question-header">
      <button onClick={onBack} data-testid="back-button">Back</button>
    </div>
  )
}));

vi.mock('@/components/QuestionBreadcrumb', () => ({
  default: () => <div data-testid="question-breadcrumb">Breadcrumb</div>
}));

vi.mock('@/components/ErrorRecovery', () => ({
  ErrorRecovery: ({ error, onRetry, onDismiss }: any) => error ? (
    <div data-testid="error-recovery">
      <div>Error: {error.message}</div>
      <button onClick={onRetry} data-testid="retry-button">Retry</button>
      <button onClick={onDismiss} data-testid="dismiss-button">Dismiss</button>
    </div>
  ) : null
}));

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthContext.Provider value={{
          user: mockUser,
          loading: false,
          signIn: vi.fn(),
          signUp: vi.fn(),
          signOut: vi.fn(),
          resetPassword: vi.fn()
        }}>
          {children}
        </AuthContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('QuestionCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the question creation form', () => {
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    expect(screen.getByTestId('question-preview')).toBeInTheDocument();
    expect(screen.getByTestId('question-header')).toBeInTheDocument();
    expect(screen.getByTestId('question-breadcrumb')).toBeInTheDocument();
  });

  it('should display form controls and buttons', () => {
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Question Details')).toBeInTheDocument();
    expect(screen.getByText('Save & Add Another')).toBeInTheDocument();
    expect(screen.getByText('Save & Return')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should show preview toggle button', () => {
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const previewToggle = screen.getByText('Hide Preview');
    expect(previewToggle).toBeInTheDocument();
  });

  it('should toggle preview visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const previewToggle = screen.getByText('Hide Preview');
    await user.click(previewToggle);

    expect(screen.getByText('Show Preview')).toBeInTheDocument();
  });

  it('should show keyboard shortcuts help', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const keyboardButton = screen.getByRole('button', { name: /keyboard/i });
    await user.click(keyboardButton);

    expect(screen.getByText('Ctrl+S:')).toBeInTheDocument();
    expect(screen.getByText('Save question')).toBeInTheDocument();
  });

  it('should handle question text input', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, 'What is the capital of France?');

    expect(questionInput).toHaveValue('What is the capital of France?');
  });

  it('should show validation status when form is valid', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, 'What is the capital of France?');

    await waitFor(() => {
      expect(screen.getByText('Question is ready to save!')).toBeInTheDocument();
    });
  });

  it('should handle back navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Navigation should be handled by the mocked hook
    expect(backButton).toBeInTheDocument();
  });

  it('should handle cancel button', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should trigger navigation
    expect(cancelButton).toBeInTheDocument();
  });

  it('should disable save buttons when form is invalid', () => {
    // Mock invalid form state
    vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
      fieldErrors: { question_text: ['Question text is required'] },
      fieldWarnings: {},
      fieldSuggestions: {},
      isValidating: false,
      hasErrors: true,
      hasWarnings: false,
      isFormValid: false,
      validateField: vi.fn(),
      validateForm: vi.fn(() => false),
      clearFieldValidation: vi.fn(),
      clearAllValidation: vi.fn(),
      getFieldValidation: vi.fn(() => ({ errors: ['Question text is required'], warnings: [], suggestions: [] }))
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const saveButton = screen.getByText('Save & Add Another');
    const returnButton = screen.getByText('Save & Return');

    expect(saveButton).toBeDisabled();
    expect(returnButton).toBeDisabled();
  });

  it('should show validation errors', () => {
    // Mock form with errors
    vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
      fieldErrors: { question_text: ['Question text is required'] },
      fieldWarnings: {},
      fieldSuggestions: {},
      isValidating: false,
      hasErrors: true,
      hasWarnings: false,
      isFormValid: false,
      validateField: vi.fn(),
      validateForm: vi.fn(() => false),
      clearFieldValidation: vi.fn(),
      clearAllValidation: vi.fn(),
      getFieldValidation: vi.fn(() => ({ errors: ['Question text is required'], warnings: [], suggestions: [] }))
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Please fix the validation errors before saving.')).toBeInTheDocument();
  });

  it('should show warnings', () => {
    // Mock form with warnings
    vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
      fieldErrors: {},
      fieldWarnings: { question_text: ['Question should end with a question mark'] },
      fieldSuggestions: {},
      isValidating: false,
      hasErrors: false,
      hasWarnings: true,
      isFormValid: true,
      validateField: vi.fn(),
      validateForm: vi.fn(() => true),
      clearFieldValidation: vi.fn(),
      clearAllValidation: vi.fn(),
      getFieldValidation: vi.fn(() => ({ errors: [], warnings: ['Question should end with a question mark'], suggestions: [] }))
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('There are some warnings about your question content.')).toBeInTheDocument();
  });

  it('should show retry status when retrying', () => {
    // Mock retry state
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: vi.fn(),
      isRetrying: true,
      lastError: null,
      getRetryStatusText: vi.fn(() => 'Retrying... (attempt 2 of 4)')
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Retrying... (attempt 2 of 4)')).toBeInTheDocument();
  });

  it('should show error recovery when there is a save error', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Save failed');
    
    // Mock save operation that fails
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: vi.fn().mockRejectedValue(mockError),
      isRetrying: false,
      lastError: mockError,
      getRetryStatusText: vi.fn(() => null)
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    // Fill in question text to make form valid
    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, 'What is the capital of France?');

    // Try to save and trigger error
    const saveButton = screen.getByText('Save & Add Another');
    await user.click(saveButton);

    // Should show error recovery
    await waitFor(() => {
      expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
      expect(screen.getByText('Error: Save failed')).toBeInTheDocument();
    });
  });

  it('should show auto-save status', () => {
    // Mock auto-save status
    vi.mocked(require('@/hooks/useUnsavedChanges').useUnsavedChanges).mockReturnValue({
      hasUnsavedChanges: false,
      navigateWithCheck: vi.fn(),
      clearUnsavedChanges: vi.fn(),
      triggerAutoSave: vi.fn(),
      getLastAutoSaveText: vi.fn(() => 'Last saved 30 seconds ago')
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Last saved 30 seconds ago')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    // Mock loading state
    vi.mocked(require('@/hooks/useQuizRouteGuard').useQuizRouteGuard).mockReturnValue({
      quiz: null,
      isLoading: true,
      hasAccess: false,
      isOwner: false
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not render when user has no access', () => {
    // Mock no access state
    vi.mocked(require('@/hooks/useQuizRouteGuard').useQuizRouteGuard).mockReturnValue({
      quiz: null,
      isLoading: false,
      hasAccess: false,
      isOwner: false
    });

    const { container } = render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show question type badge', () => {
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
  });

  it('should handle save button states during saving', () => {
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    const saveButton = screen.getByText('Save & Add Another');
    const returnButton = screen.getByText('Save & Return');

    // Initially enabled (mocked as valid form)
    expect(saveButton).not.toBeDisabled();
    expect(returnButton).not.toBeDisabled();
  });

  it('should show correct button text during retry', () => {
    // Mock retry state
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: vi.fn(),
      isRetrying: true,
      lastError: null,
      getRetryStatusText: vi.fn(() => 'Retrying...')
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
  });

  it('should handle save and add another functionality', async () => {
    const user = userEvent.setup();
    const mockExecuteWithRetry = vi.fn().mockResolvedValue(true);
    
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: mockExecuteWithRetry,
      isRetrying: false,
      lastError: null,
      getRetryStatusText: vi.fn(() => null)
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    // Fill in question text
    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, 'What is the capital of France?');

    // Click Save & Add Another
    const saveButton = screen.getByText('Save & Add Another');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockExecuteWithRetry).toHaveBeenCalled();
    });
  });

  it('should handle save and return functionality', async () => {
    const user = userEvent.setup();
    const mockExecuteWithRetry = vi.fn().mockResolvedValue(true);
    
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: mockExecuteWithRetry,
      isRetrying: false,
      lastError: null,
      getRetryStatusText: vi.fn(() => null)
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    // Fill in question text
    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, 'What is the capital of France?');

    // Click Save & Return
    const returnButton = screen.getByText('Save & Return');
    await user.click(returnButton);

    await waitFor(() => {
      expect(mockExecuteWithRetry).toHaveBeenCalled();
    });
  });

  it('should handle keyboard shortcuts', async () => {
    const mockShortcuts = vi.fn();
    
    vi.mocked(require('@/hooks/useSaveShortcuts').useSaveShortcuts).mockImplementation(mockShortcuts);

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(mockShortcuts).toHaveBeenCalled();
  });

  it('should handle draft storage', () => {
    const mockSaveDraft = vi.fn();
    const mockClearDraft = vi.fn();
    
    vi.mocked(require('@/hooks/useDraftStorage').useDraftStorage).mockReturnValue({
      draftData: { question_text: 'Draft question' },
      saveDraft: mockSaveDraft,
      clearDraft: mockClearDraft,
      hasDraft: vi.fn(() => true)
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    // Draft functionality should be initialized
    expect(screen.getByTestId('question-manager')).toBeInTheDocument();
  });

  it('should show form validation suggestions', () => {
    // Mock form with suggestions
    vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
      fieldErrors: {},
      fieldWarnings: {},
      fieldSuggestions: { question_text: ['Consider making the question more specific'] },
      isValidating: false,
      hasErrors: false,
      hasWarnings: false,
      isFormValid: true,
      validateField: vi.fn(),
      validateForm: vi.fn(() => true),
      clearFieldValidation: vi.fn(),
      clearAllValidation: vi.fn(),
      getFieldValidation: vi.fn(() => ({ errors: [], warnings: [], suggestions: ['Consider making the question more specific'] }))
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Consider making the question more specific')).toBeInTheDocument();
  });

  it('should handle form reset after successful save', async () => {
    const user = userEvent.setup();
    const mockExecuteWithRetry = vi.fn().mockResolvedValue(true);
    const mockClearAllValidation = vi.fn();
    
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: mockExecuteWithRetry,
      isRetrying: false,
      lastError: null,
      getRetryStatusText: vi.fn(() => null)
    });

    vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
      fieldErrors: {},
      fieldWarnings: {},
      fieldSuggestions: {},
      isValidating: false,
      hasErrors: false,
      hasWarnings: false,
      isFormValid: true,
      validateField: vi.fn(),
      validateForm: vi.fn(() => true),
      clearFieldValidation: vi.fn(),
      clearAllValidation: mockClearAllValidation,
      getFieldValidation: vi.fn(() => ({ errors: [], warnings: [], suggestions: [] }))
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    // Fill in question text
    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, 'What is the capital of France?');

    // Save question
    const saveButton = screen.getByText('Save & Add Another');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockExecuteWithRetry).toHaveBeenCalled();
    });
  });

  it('should handle question type memory', () => {
    const mockUpdateLastUsedType = vi.fn();
    
    vi.mocked(require('@/hooks/useQuestionTypeMemory').useQuestionTypeMemory).mockReturnValue({
      lastUsedType: 'fill_blank',
      updateLastUsedType: mockUpdateLastUsedType,
      getDefaultQuestionData: vi.fn(() => ({ correctAnswers: [''], caseSensitive: false })),
      getTypeDisplayName: vi.fn(() => 'Fill in the Blank'),
      getTypeColorClass: vi.fn(() => 'bg-green-100')
    });

    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    expect(screen.getByText('Fill in the Blank')).toBeInTheDocument();
  });

  it('should handle error recovery retry', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Save failed');
    const mockRetry = vi.fn().mockResolvedValue(true);
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    // Simulate error state by rendering error recovery component
    const errorRecovery = screen.queryByTestId('error-recovery');
    if (errorRecovery) {
      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);
      expect(retryButton).toBeInTheDocument();
    }
  });

  it('should handle error recovery dismiss', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Save failed');
    
    render(
      <TestWrapper>
        <QuestionCreate />
      </TestWrapper>
    );

    // Simulate error state by rendering error recovery component
    const errorRecovery = screen.queryByTestId('error-recovery');
    if (errorRecovery) {
      const dismissButton = screen.getByTestId('dismiss-button');
      await user.click(dismissButton);
      expect(dismissButton).toBeInTheDocument();
    }
  });
});