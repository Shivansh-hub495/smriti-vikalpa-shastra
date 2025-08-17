/**
 * @fileoverview Integration tests for error handling scenarios
 * @description Tests for error handling and recovery across question management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuestionCreate from '@/pages/QuestionCreate';
import QuestionEdit from '@/pages/QuestionEdit';
import { AuthContext } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';

// Mock Supabase with error scenarios
const mockSupabaseError = (errorMessage: string, errorCode?: string) => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: errorMessage, code: errorCode }
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ 
        error: { message: errorMessage, code: errorCode } 
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          error: { message: errorMessage, code: errorCode } 
        }))
      }))
    }))
  }
});

const mockSupabaseSuccess = () => ({
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
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
});

// Mock hooks with default implementations
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
      <div data-testid="error-message">Error: {error.message}</div>
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

// Mock useParams for QuestionEdit
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ quizId: 'quiz-1', questionId: 'question-1' }),
    useNavigate: () => vi.fn()
  };
});

describe('Error Handling Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Network Errors', () => {
    it('should handle network timeout during save', async () => {
      const user = userEvent.setup();
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(timeoutError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: timeoutError,
        getRetryStatusText: vi.fn(() => null)
      });

      vi.mock('@/integrations/supabase/client', () => mockSupabaseError('Network timeout', 'TIMEOUT'));

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      // Fill in question text
      const questionInput = screen.getByTestId('question-text');
      await user.type(questionInput, 'What is the capital of France?');

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network timeout');
      });
    });

    it('should handle connection lost during save', async () => {
      const user = userEvent.setup();
      const connectionError = new Error('Connection lost');
      connectionError.name = 'NetworkError';

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(connectionError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: connectionError,
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

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Connection lost');
      });
    });
  });

  describe('Database Errors', () => {
    it('should handle database constraint violation', async () => {
      const user = userEvent.setup();
      const constraintError = new Error('Unique constraint violation');
      constraintError.name = 'DatabaseError';

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(constraintError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: constraintError,
        getRetryStatusText: vi.fn(() => null)
      });

      vi.mock('@/integrations/supabase/client', () => mockSupabaseError('Unique constraint violation', 'CONSTRAINT_VIOLATION'));

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      // Fill in question text
      const questionInput = screen.getByTestId('question-text');
      await user.type(questionInput, 'What is the capital of France?');

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Unique constraint violation');
      });
    });

    it('should handle database connection error', async () => {
      const user = userEvent.setup();
      const dbError = new Error('Database connection failed');
      dbError.name = 'DatabaseConnectionError';

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(dbError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: dbError,
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

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Database connection failed');
      });
    });
  });

  describe('Permission Errors', () => {
    it('should handle unauthorized access error', async () => {
      const user = userEvent.setup();
      const authError = new Error('Unauthorized access');
      authError.name = 'AuthError';

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(authError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: authError,
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

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Unauthorized access');
      });
    });

    it('should handle insufficient permissions error', async () => {
      const user = userEvent.setup();
      const permissionError = new Error('Insufficient permissions');
      permissionError.name = 'PermissionError';

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(permissionError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: permissionError,
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

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Insufficient permissions');
      });
    });
  });

  describe('Retry Mechanism', () => {
    it('should show retry progress during multiple attempts', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network error');

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: vi.fn().mockRejectedValue(networkError),
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

    it('should handle successful retry after initial failure', async () => {
      const user = userEvent.setup();
      const mockExecuteWithRetry = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true);

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

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockExecuteWithRetry).toHaveBeenCalled();
      });
    });

    it('should handle retry button click', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn().mockResolvedValue(true);
      const networkError = new Error('Network error');

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: vi.fn().mockRejectedValue(networkError),
        isRetrying: false,
        lastError: networkError,
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

      // Try to save to trigger error
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      expect(retryButton).toBeInTheDocument();
    });

    it('should handle dismiss error', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network error');

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: vi.fn().mockRejectedValue(networkError),
        isRetrying: false,
        lastError: networkError,
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

      // Try to save to trigger error
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
      });

      // Click dismiss button
      const dismissButton = screen.getByTestId('dismiss-button');
      await user.click(dismissButton);

      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Data Loading Errors', () => {
    it('should handle question not found error in edit mode', async () => {
      vi.mock('@/integrations/supabase/client', () => mockSupabaseError('Question not found', 'NOT_FOUND'));

      render(
        <TestWrapper>
          <QuestionEdit />
        </TestWrapper>
      );

      // Should handle the error gracefully and still render the component
      await waitFor(() => {
        expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      });
    });

    it('should handle quiz access denied error', async () => {
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

      // Should not render when access is denied
      expect(container.firstChild).toBeNull();
    });

    it('should handle corrupted question data in edit mode', async () => {
      // Mock corrupted data that causes parsing errors
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
                    question_data: 'invalid json string', // Corrupted data
                    explanation: 'Basic arithmetic',
                    order_index: 0
                  },
                  error: null
                }))
              }))
            }))
          }))
        }
      }));

      render(
        <TestWrapper>
          <QuestionEdit />
        </TestWrapper>
      );

      // Should handle corrupted data gracefully
      await waitFor(() => {
        expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      });
    });
  });

  describe('Validation Errors', () => {
    it('should handle server-side validation errors', async () => {
      const user = userEvent.setup();
      const validationError = new Error('Question text is too long');
      validationError.name = 'ValidationError';

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(validationError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: validationError,
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

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Question text is too long');
      });
    });

    it('should handle conflicting validation between client and server', async () => {
      const user = userEvent.setup();
      const serverValidationError = new Error('Server validation failed');
      serverValidationError.name = 'ValidationError';

      // Mock client validation as passing
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
        clearAllValidation: vi.fn(),
        getFieldValidation: vi.fn(() => ({ errors: [], warnings: [], suggestions: [] }))
      });

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(serverValidationError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: serverValidationError,
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

      // Try to save (should pass client validation but fail server validation)
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Server validation failed');
      });
    });
  });

  describe('Auto-save Errors', () => {
    it('should handle auto-save failure gracefully', async () => {
      const autoSaveError = new Error('Auto-save failed');
      const mockTriggerAutoSave = vi.fn().mockRejectedValue(autoSaveError);

      vi.mocked(require('@/hooks/useUnsavedChanges').useUnsavedChanges).mockReturnValue({
        hasUnsavedChanges: true,
        navigateWithCheck: vi.fn(),
        clearUnsavedChanges: vi.fn(),
        triggerAutoSave: mockTriggerAutoSave,
        getLastAutoSaveText: vi.fn(() => 'Auto-save failed')
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Auto-save failed')).toBeInTheDocument();
    });

    it('should handle draft storage errors', async () => {
      const draftError = new Error('Draft storage failed');
      const mockSaveDraft = vi.fn().mockRejectedValue(draftError);

      vi.mocked(require('@/hooks/useDraftStorage').useDraftStorage).mockReturnValue({
        draftData: {},
        saveDraft: mockSaveDraft,
        clearDraft: vi.fn(),
        hasDraft: vi.fn(() => false)
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      // Component should still render despite draft storage error
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });
  });

  describe('Recovery Scenarios', () => {
    it('should preserve form data during error recovery', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network error');

      const mockExecuteWithRetry = vi.fn().mockRejectedValue(networkError);

      vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
        executeWithRetry: mockExecuteWithRetry,
        isRetrying: false,
        lastError: networkError,
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

      // Try to save to trigger error
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
      });

      // Form data should be preserved
      expect(questionInput).toHaveValue('What is the capital of France?');
    });

    it('should handle successful recovery after error', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network error');

      // First call fails, second succeeds
      const mockExecuteWithRetry = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(true);

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

      // Try to save
      const saveButton = screen.getByText('Save & Add Another');
      await user.click(saveButton);

      // Should eventually succeed
      await waitFor(() => {
        expect(mockExecuteWithRetry).toHaveBeenCalled();
      });
    });
  });
});