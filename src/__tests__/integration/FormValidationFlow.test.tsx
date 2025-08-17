/**
 * @fileoverview Integration tests for form validation scenarios
 * @description Tests for form validation across question creation and editing
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

// Mock Supabase
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
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

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
      <select
        data-testid="question-type"
        value={initialQuestions[0]?.question_type || 'mcq'}
        onChange={(e) => onChange([{ ...initialQuestions[0], question_type: e.target.value }])}
      >
        <option value="mcq">Multiple Choice</option>
        <option value="fill_blank">Fill in the Blank</option>
        <option value="true_false">True/False</option>
        <option value="match_following">Match Following</option>
      </select>
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

// Mock useParams for QuestionEdit
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ quizId: 'quiz-1', questionId: 'question-1' }),
    useNavigate: () => vi.fn()
  };
});

describe('Form Validation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Question Text Validation', () => {
    it('should show error when question text is empty', async () => {
      // Mock validation with empty question text error
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
      expect(screen.getByText('Save & Add Another')).toBeDisabled();
      expect(screen.getByText('Save & Return')).toBeDisabled();
    });

    it('should show error when question text is too short', async () => {
      // Mock validation with short question text error
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: { question_text: ['Question text must be at least 10 characters long'] },
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
        getFieldValidation: vi.fn(() => ({ errors: ['Question text must be at least 10 characters long'], warnings: [], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Question text must be at least 10 characters long')).toBeInTheDocument();
    });

    it('should show warning for question without question mark', async () => {
      // Mock validation with warning
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
      expect(screen.getByText('Question should end with a question mark')).toBeInTheDocument();
    });
  });

  describe('MCQ Validation', () => {
    it('should show error when MCQ has insufficient options', async () => {
      // Mock validation with MCQ options error
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: { question_data: ['MCQ questions must have at least 2 options'] },
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
        getFieldValidation: vi.fn(() => ({ errors: ['MCQ questions must have at least 2 options'], warnings: [], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('MCQ questions must have at least 2 options')).toBeInTheDocument();
    });

    it('should show error when MCQ has no correct answer selected', async () => {
      // Mock validation with no correct answer error
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: { question_data: ['Please select a correct answer'] },
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
        getFieldValidation: vi.fn(() => ({ errors: ['Please select a correct answer'], warnings: [], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Please select a correct answer')).toBeInTheDocument();
    });

    it('should show warning when MCQ options are too similar', async () => {
      // Mock validation with similar options warning
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: {},
        fieldWarnings: { question_data: ['Some options are very similar - consider making them more distinct'] },
        fieldSuggestions: {},
        isValidating: false,
        hasErrors: false,
        hasWarnings: true,
        isFormValid: true,
        validateField: vi.fn(),
        validateForm: vi.fn(() => true),
        clearFieldValidation: vi.fn(),
        clearAllValidation: vi.fn(),
        getFieldValidation: vi.fn(() => ({ errors: [], warnings: ['Some options are very similar - consider making them more distinct'], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Some options are very similar - consider making them more distinct')).toBeInTheDocument();
    });
  });

  describe('Fill in the Blank Validation', () => {
    it('should show error when fill blank has no correct answers', async () => {
      // Mock validation with no correct answers error
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: { question_data: ['Fill in the blank questions must have at least one correct answer'] },
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
        getFieldValidation: vi.fn(() => ({ errors: ['Fill in the blank questions must have at least one correct answer'], warnings: [], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Fill in the blank questions must have at least one correct answer')).toBeInTheDocument();
    });

    it('should show suggestion for case sensitivity', async () => {
      // Mock validation with case sensitivity suggestion
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: {},
        fieldWarnings: {},
        fieldSuggestions: { question_data: ['Consider enabling case-sensitive matching for proper nouns'] },
        isValidating: false,
        hasErrors: false,
        hasWarnings: false,
        isFormValid: true,
        validateField: vi.fn(),
        validateForm: vi.fn(() => true),
        clearFieldValidation: vi.fn(),
        clearAllValidation: vi.fn(),
        getFieldValidation: vi.fn(() => ({ errors: [], warnings: [], suggestions: ['Consider enabling case-sensitive matching for proper nouns'] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Consider enabling case-sensitive matching for proper nouns')).toBeInTheDocument();
    });
  });

  describe('Match Following Validation', () => {
    it('should show error when match following has insufficient pairs', async () => {
      // Mock validation with insufficient pairs error
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: { question_data: ['Match following questions must have at least 2 pairs'] },
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
        getFieldValidation: vi.fn(() => ({ errors: ['Match following questions must have at least 2 pairs'], warnings: [], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Match following questions must have at least 2 pairs')).toBeInTheDocument();
    });
  });

  describe('Real-time Validation', () => {
    it('should validate field on blur', async () => {
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
          <QuestionCreate />
        </TestWrapper>
      );

      const questionInput = screen.getByTestId('question-text');
      await user.type(questionInput, 'What is the capital?');
      await user.tab(); // Trigger blur

      expect(mockValidateField).toHaveBeenCalledWith('question_text', 'What is the capital?');
    });

    it('should show validation status during validation', async () => {
      // Mock validating state
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: {},
        fieldWarnings: {},
        fieldSuggestions: {},
        isValidating: true,
        hasErrors: false,
        hasWarnings: false,
        isFormValid: false,
        validateField: vi.fn(),
        validateForm: vi.fn(() => false),
        clearFieldValidation: vi.fn(),
        clearAllValidation: vi.fn(),
        getFieldValidation: vi.fn(() => ({ errors: [], warnings: [], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      expect(screen.getByText('Validating...')).toBeInTheDocument();
    });
  });

  describe('Form Submission Validation', () => {
    it('should prevent submission when form is invalid', async () => {
      const user = userEvent.setup();
      const mockExecuteWithRetry = vi.fn();

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

      const saveButton = screen.getByText('Save & Add Another');
      expect(saveButton).toBeDisabled();

      await user.click(saveButton);
      expect(mockExecuteWithRetry).not.toHaveBeenCalled();
    });

    it('should allow submission when form is valid', async () => {
      const user = userEvent.setup();
      const mockExecuteWithRetry = vi.fn().mockResolvedValue(true);

      // Mock valid form state
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

      const questionInput = screen.getByTestId('question-text');
      await user.type(questionInput, 'What is the capital of France?');

      const saveButton = screen.getByText('Save & Add Another');
      expect(saveButton).not.toBeDisabled();

      await user.click(saveButton);
      expect(mockExecuteWithRetry).toHaveBeenCalled();
    });
  });

  describe('Cross-field Validation', () => {
    it('should validate question type compatibility with question text', async () => {
      const user = userEvent.setup();

      // Mock validation that checks question type compatibility
      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: { question_type: ['Fill in the blank questions should contain blank indicators (____) in the question text'] },
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
        getFieldValidation: vi.fn(() => ({ errors: ['Fill in the blank questions should contain blank indicators (____) in the question text'], warnings: [], suggestions: [] }))
      });

      render(
        <TestWrapper>
          <QuestionCreate />
        </TestWrapper>
      );

      // Change to fill in the blank type
      const typeSelect = screen.getByTestId('question-type');
      await user.selectOptions(typeSelect, 'fill_blank');

      expect(screen.getByText('Fill in the blank questions should contain blank indicators (____) in the question text')).toBeInTheDocument();
    });
  });

  describe('Validation in Edit Mode', () => {
    it('should validate existing question data on load', async () => {
      const mockValidateForm = vi.fn(() => true);

      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: {},
        fieldWarnings: {},
        fieldSuggestions: {},
        isValidating: false,
        hasErrors: false,
        hasWarnings: false,
        isFormValid: true,
        validateField: vi.fn(),
        validateForm: mockValidateForm,
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
        expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      });

      // Should validate the loaded question data
      expect(mockValidateForm).toHaveBeenCalled();
    });

    it('should show validation errors for corrupted question data', async () => {
      // Mock corrupted question data
      vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'question-1',
                quiz_id: 'quiz-1',
                question_text: 'What is 2+2?',
                question_type: 'mcq',
                question_data: {
                  options: ['2'], // Invalid: only one option
                  correctAnswer: 1 // Invalid: index out of bounds
                },
                explanation: 'Basic arithmetic',
                order_index: 0
              },
              error: null
            }))
          }))
        }))
      });

      vi.mocked(require('@/hooks/useQuestionFormValidation').useQuestionFormValidation).mockReturnValue({
        fieldErrors: { 
          question_data: [
            'MCQ questions must have at least 2 options',
            'Correct answer index is out of bounds'
          ]
        },
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
        getFieldValidation: vi.fn(() => ({ 
          errors: [
            'MCQ questions must have at least 2 options',
            'Correct answer index is out of bounds'
          ], 
          warnings: [], 
          suggestions: [] 
        }))
      });

      render(
        <TestWrapper>
          <QuestionEdit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('MCQ questions must have at least 2 options')).toBeInTheDocument();
        expect(screen.getByText('Correct answer index is out of bounds')).toBeInTheDocument();
      });
    });
  });
});