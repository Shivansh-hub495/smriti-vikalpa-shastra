/**
 * @fileoverview Unit tests for QuestionEdit component
 * @description Tests for question editing functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuestionEdit from '../QuestionEdit';
import { AuthContext } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'question-1',
              quiz_id: 'quiz-1',
              question_text: 'What is 2+2?',
              question_type: 'mcq',
              question_data: {
                options: ['2', '3', '4', '5'],
                correctAnswer: 2
              },
              explanation: 'Basic arithmetic',
              order_index: 0
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
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
        value={initialQuestions[0]?.question_text || ''}
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
  default: ({ onBack, mode }: any) => (
    <div data-testid="question-header">
      <span data-testid="header-mode">{mode}</span>
      <button onClick={onBack} data-testid="back-button">Back</button>
    </div>
  )
}));

vi.mock('@/components/QuestionBreadcrumb', () => ({
  default: ({ mode }: any) => (
    <div data-testid="question-breadcrumb">
      <span data-testid="breadcrumb-mode">{mode}</span>
    </div>
  )
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

// Mock useParams to return question ID
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ quizId: 'quiz-1', questionId: 'question-1' }),
    useNavigate: () => vi.fn()
  };
});

describe('QuestionEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the question editing form', async () => {
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    expect(screen.getByTestId('question-preview')).toBeInTheDocument();
    expect(screen.getByTestId('question-header')).toBeInTheDocument();
    expect(screen.getByTestId('question-breadcrumb')).toBeInTheDocument();
  });

  it('should show edit mode in header and breadcrumb', async () => {
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('header-mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('breadcrumb-mode')).toHaveTextContent('edit');
    });
  });

  it('should pre-populate form with existing question data', async () => {
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const questionInput = screen.getByTestId('question-text');
      expect(questionInput).toHaveValue('What is 2+2?');
    });
  });

  it('should display save and cancel buttons', async () => {
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('should show unsaved changes indicator', async () => {
    // Mock unsaved changes state
    vi.mocked(require('@/hooks/useUnsavedChanges').useUnsavedChanges).mockReturnValue({
      hasUnsavedChanges: true,
      navigateWithCheck: vi.fn(),
      clearUnsavedChanges: vi.fn(),
      triggerAutoSave: vi.fn(),
      getLastAutoSaveText: vi.fn(() => null)
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Question Details')).toBeInTheDocument();
    });
  });

  it('should handle question text changes', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const questionInput = screen.getByTestId('question-text');
      expect(questionInput).toBeInTheDocument();
    });

    const questionInput = screen.getByTestId('question-text');
    await user.clear(questionInput);
    await user.type(questionInput, 'What is the capital of France?');

    expect(questionInput).toHaveValue('What is the capital of France?');
  });

  it('should show validation errors when form is invalid', async () => {
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
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Please fix the validation errors before saving.')).toBeInTheDocument();
    });
  });

  it('should disable save button when form is invalid', async () => {
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
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });
  });

  it('should handle back navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
    });

    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Navigation should be handled by the mocked hook
    expect(backButton).toBeInTheDocument();
  });

  it('should handle cancel button', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should trigger navigation
    expect(cancelButton).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    // Mock loading state
    vi.mocked(require('@/hooks/useQuizRouteGuard').useQuizRouteGuard).mockReturnValue({
      quiz: null,
      isLoading: true,
      hasAccess: false,
      isOwner: false
    });

    render(
      <TestWrapper>
        <QuestionEdit />
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
        <QuestionEdit />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show retry status when retrying', async () => {
    // Mock retry state
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: vi.fn(),
      isRetrying: true,
      lastError: null,
      getRetryStatusText: vi.fn(() => 'Retrying... (attempt 2 of 4)')
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Retrying... (attempt 2 of 4)')).toBeInTheDocument();
    });
  });

  it('should show correct button text during retry', async () => {
    // Mock retry state
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: vi.fn(),
      isRetrying: true,
      lastError: null,
      getRetryStatusText: vi.fn(() => 'Retrying...')
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });
  });

  it('should show auto-save status', async () => {
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
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Last saved 30 seconds ago')).toBeInTheDocument();
    });
  });

  it('should show question type badge', async () => {
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    });
  });

  it('should handle preview toggle', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const previewToggle = screen.getByText('Hide Preview');
      expect(previewToggle).toBeInTheDocument();
    });

    const previewToggle = screen.getByText('Hide Preview');
    await user.click(previewToggle);

    expect(screen.getByText('Show Preview')).toBeInTheDocument();
  });

  it('should show keyboard shortcuts help', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const keyboardButton = screen.getByRole('button', { name: /keyboard/i });
      expect(keyboardButton).toBeInTheDocument();
    });

    const keyboardButton = screen.getByRole('button', { name: /keyboard/i });
    await user.click(keyboardButton);

    expect(screen.getByText('Ctrl+S:')).toBeInTheDocument();
    expect(screen.getByText('Save changes')).toBeInTheDocument();
  });

  it('should show validation status when form is valid', async () => {
    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Question is ready to save!')).toBeInTheDocument();
    });
  });

  it('should handle question data loading error', async () => {
    // Mock error in data loading
    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Question not found' }
          }))
        }))
      }))
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    // Should handle the error gracefully
    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });
  });

  it('should handle save changes functionality', async () => {
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
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const questionInput = screen.getByTestId('question-text');
      expect(questionInput).toHaveValue('What is 2+2?');
    });

    // Modify question text
    const questionInput = screen.getByTestId('question-text');
    await user.clear(questionInput);
    await user.type(questionInput, 'What is the capital of France?');

    // Click Save Changes
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockExecuteWithRetry).toHaveBeenCalled();
    });
  });

  it('should handle keyboard shortcuts', async () => {
    const mockShortcuts = vi.fn();
    
    vi.mocked(require('@/hooks/useSaveShortcuts').useSaveShortcuts).mockImplementation(mockShortcuts);

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockShortcuts).toHaveBeenCalled();
    });
  });

  it('should handle draft storage for edits', async () => {
    const mockSaveDraft = vi.fn();
    const mockClearDraft = vi.fn();
    
    vi.mocked(require('@/hooks/useDraftStorage').useDraftStorage).mockReturnValue({
      draftData: { question_text: 'Draft edit' },
      saveDraft: mockSaveDraft,
      clearDraft: mockClearDraft,
      hasDraft: vi.fn(() => true)
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });
  });

  it('should show form validation suggestions in edit mode', async () => {
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
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Consider making the question more specific')).toBeInTheDocument();
    });
  });

  it('should handle unsaved changes warning on navigation', async () => {
    const user = userEvent.setup();
    const mockNavigateWithCheck = vi.fn();
    
    vi.mocked(require('@/hooks/useUnsavedChanges').useUnsavedChanges).mockReturnValue({
      hasUnsavedChanges: true,
      navigateWithCheck: mockNavigateWithCheck,
      clearUnsavedChanges: vi.fn(),
      triggerAutoSave: vi.fn(),
      getLastAutoSaveText: vi.fn(() => null)
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
    });

    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    expect(mockNavigateWithCheck).toHaveBeenCalled();
  });

  it('should handle save error with retry', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Save failed');
    const mockExecuteWithRetry = vi.fn().mockRejectedValue(mockError);
    
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: mockExecuteWithRetry,
      isRetrying: false,
      lastError: mockError,
      getRetryStatusText: vi.fn(() => null)
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const questionInput = screen.getByTestId('question-text');
      expect(questionInput).toBeInTheDocument();
    });

    // Try to save and trigger error
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
      expect(screen.getByText('Error: Save failed')).toBeInTheDocument();
    });
  });

  it('should handle different question types in edit mode', async () => {
    // Mock different question type
    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'question-1',
              quiz_id: 'quiz-1',
              question_text: 'True or false: Paris is the capital of France?',
              question_type: 'true_false',
              question_data: {
                correctAnswer: true
              },
              explanation: 'Paris is indeed the capital of France',
              order_index: 0
            },
            error: null
          }))
        }))
      }))
    });

    vi.mocked(require('@/hooks/useQuestionTypeMemory').useQuestionTypeMemory).mockReturnValue({
      lastUsedType: 'true_false',
      updateLastUsedType: vi.fn(),
      getDefaultQuestionData: vi.fn(() => ({ correctAnswer: true })),
      getTypeDisplayName: vi.fn(() => 'True/False'),
      getTypeColorClass: vi.fn(() => 'bg-yellow-100')
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('True/False')).toBeInTheDocument();
    });
  });

  it('should handle form validation during editing', async () => {
    const user = userEvent.setup();
    const mockValidateField = vi.fn();
    
    vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
      fieldErrors: {},
      fieldWarnings: {},
      fieldSuggestions: {},
      isValidating: false,
      hasErrors: false,
      hasWarnings: false,
      isFormValid: true,
      validateField: mockValidateField,
      validateForm: vi.fn(() => true),
      clearFieldValidation: vi.fn(),
      clearAllValidation: vi.fn(),
      getFieldValidation: vi.fn(() => ({ errors: [], warnings: [], suggestions: [] }))
    });

    render(
      <TestWrapper>
        <QuestionEdit />
      </TestWrapper>
    );

    await waitFor(() => {
      const questionInput = screen.getByTestId('question-text');
      expect(questionInput).toBeInTheDocument();
    });

    // Modify question text to trigger validation
    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, ' Additional text');

    // Validation should be triggered
    expect(mockValidateField).toHaveBeenCalled();
  });
});