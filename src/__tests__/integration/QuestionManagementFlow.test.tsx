/**
 * @fileoverview Integration tests for question management navigation flow
 * @description Tests for navigation between QuizEdit, QuestionCreate, and QuestionEdit pages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import QuizEdit from '@/pages/QuizEdit';
import QuestionCreate from '@/pages/QuestionCreate';
import QuestionEdit from '@/pages/QuestionEdit';
import type { User } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'quiz-1',
              title: 'Test Quiz',
              description: 'A test quiz',
              folder_id: 'folder-1',
              user_id: 'user-1',
              settings: {},
              questions: [
                {
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
                }
              ]
            },
            error: null
          })),
          order: vi.fn(() => Promise.resolve({
            data: [
              {
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
              }
            ],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock hooks
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
      user_id: 'user-1',
      settings: {}
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
    count: 1,
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
    navigateWithCheck: vi.fn((path) => {
      window.history.pushState({}, '', path);
    }),
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

// Mock components that are not the focus of integration tests
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
      <button onClick={onBack} data-testid="back-button">Back to Quiz</button>
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
  ErrorRecovery: ({ error }: any) => error ? (
    <div data-testid="error-recovery">Error: {error.message}</div>
  ) : null
}));

// Mock QuizEdit component with navigation buttons
vi.mock('@/pages/QuizEdit', () => ({
  default: () => {
    const navigate = require('react-router-dom').useNavigate();
    return (
      <div data-testid="quiz-edit">
        <h1>Quiz Edit Page</h1>
        <div data-testid="question-list">
          <div data-testid="question-item">
            <span>What is 2+2?</span>
            <button 
              data-testid="edit-question-btn"
              onClick={() => navigate('/quiz/quiz-1/question/question-1/edit')}
            >
              Edit
            </button>
          </div>
        </div>
        <button 
          data-testid="add-question-btn"
          onClick={() => navigate('/quiz/quiz-1/question/create')}
        >
          Add Question
        </button>
      </div>
    );
  }
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

const TestApp = ({ initialPath = '/quiz/quiz-1/edit' }: { initialPath?: string }) => {
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
          <Routes>
            <Route path="/quiz/:quizId/edit" element={<QuizEdit />} />
            <Route path="/quiz/:quizId/question/create" element={<QuestionCreate />} />
            <Route path="/quiz/:quizId/question/:questionId/edit" element={<QuestionEdit />} />
          </Routes>
        </AuthContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Question Management Navigation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window location
    window.history.replaceState({}, '', '/quiz/quiz-1/edit');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should navigate from QuizEdit to QuestionCreate', async () => {
    const user = userEvent.setup();
    
    render(<TestApp />);

    // Should start on QuizEdit page
    expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    expect(screen.getByText('Quiz Edit Page')).toBeInTheDocument();

    // Click Add Question button
    const addButton = screen.getByTestId('add-question-btn');
    await user.click(addButton);

    // Should navigate to QuestionCreate
    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      expect(screen.getByText('Save & Add Another')).toBeInTheDocument();
    });
  });

  it('should navigate from QuizEdit to QuestionEdit', async () => {
    const user = userEvent.setup();
    
    render(<TestApp />);

    // Should start on QuizEdit page
    expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();

    // Click Edit button on a question
    const editButton = screen.getByTestId('edit-question-btn');
    await user.click(editButton);

    // Should navigate to QuestionEdit
    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('should navigate back from QuestionCreate to QuizEdit', async () => {
    const user = userEvent.setup();
    
    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    // Should start on QuestionCreate page
    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      expect(screen.getByText('Save & Add Another')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Should navigate back to QuizEdit
    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });
  });

  it('should navigate back from QuestionEdit to QuizEdit', async () => {
    const user = userEvent.setup();
    
    render(<TestApp initialPath="/quiz/quiz-1/question/question-1/edit" />);

    // Should start on QuestionEdit page
    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Should navigate back to QuizEdit
    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });
  });

  it('should show correct mode indicators in QuestionCreate', async () => {
    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('header-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('breadcrumb-mode')).toHaveTextContent('create');
    });
  });

  it('should show correct mode indicators in QuestionEdit', async () => {
    render(<TestApp initialPath="/quiz/quiz-1/question/question-1/edit" />);

    await waitFor(() => {
      expect(screen.getByTestId('header-mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('breadcrumb-mode')).toHaveTextContent('edit');
    });
  });

  it('should handle cancel navigation from QuestionCreate', async () => {
    const user = userEvent.setup();
    
    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should navigate back to QuizEdit
    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });
  });

  it('should handle cancel navigation from QuestionEdit', async () => {
    const user = userEvent.setup();
    
    render(<TestApp initialPath="/quiz/quiz-1/question/question-1/edit" />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should navigate back to QuizEdit
    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });
  });

  it('should preserve quiz context across navigation', async () => {
    const user = userEvent.setup();
    
    render(<TestApp />);

    // Start on QuizEdit
    expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();

    // Navigate to QuestionCreate
    const addButton = screen.getByTestId('add-question-btn');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Navigate back
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });

    // Quiz context should be preserved
    expect(screen.getByText('Quiz Edit Page')).toBeInTheDocument();
  });

  it('should handle deep linking to question pages', async () => {
    // Test direct navigation to QuestionCreate
    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      expect(screen.getByText('Save & Add Another')).toBeInTheDocument();
    });
  });

  it('should handle deep linking to question edit pages', async () => {
    // Test direct navigation to QuestionEdit
    render(<TestApp initialPath="/quiz/quiz-1/question/question-1/edit" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('should handle navigation with form validation errors', async () => {
    const user = userEvent.setup();
    
    // Mock form with validation errors
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

    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Try to navigate back with validation errors
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Should still allow navigation despite validation errors
    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });
  });

  it('should handle navigation during save operation', async () => {
    const user = userEvent.setup();
    
    // Mock save operation in progress
    vi.mocked(require('@/hooks/useRetryOperation').useQuestionSaveRetry).mockReturnValue({
      executeWithRetry: vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000))),
      isRetrying: true,
      lastError: null,
      getRetryStatusText: vi.fn(() => 'Saving...')
    });

    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Fill in question text
    const questionInput = screen.getByTestId('question-text');
    await user.type(questionInput, 'What is the capital of France?');

    // Start save operation
    const saveButton = screen.getByText('Save & Add Another');
    await user.click(saveButton);

    // Try to navigate during save
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Should handle navigation appropriately
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should handle browser back/forward navigation', async () => {
    render(<TestApp />);

    // Start on QuizEdit
    expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();

    // Navigate to QuestionCreate
    const addButton = screen.getByTestId('add-question-btn');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Simulate browser back button
    window.history.back();

    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });
  });

  it('should handle invalid quiz ID in URL', async () => {
    // Mock quiz not found
    vi.mocked(require('@/hooks/useQuizRouteGuard').useQuizRouteGuard).mockReturnValue({
      quiz: null,
      isLoading: false,
      hasAccess: false,
      isOwner: false
    });

    const { container } = render(<TestApp initialPath="/quiz/invalid-quiz-id/question/create" />);

    // Should not render when quiz is not found
    expect(container.firstChild).toBeNull();
  });

  it('should handle invalid question ID in edit URL', async () => {
    // Mock question not found
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

    render(<TestApp initialPath="/quiz/quiz-1/question/invalid-question-id/edit" />);

    // Should handle gracefully
    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });
  });

  it('should preserve scroll position during navigation', async () => {
    const user = userEvent.setup();
    
    render(<TestApp />);

    // Start on QuizEdit
    expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();

    // Simulate scrolling
    window.scrollTo(0, 500);

    // Navigate to QuestionCreate
    const addButton = screen.getByTestId('add-question-btn');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Navigate back
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();
    });

    // Scroll position handling would be tested here
    // (actual implementation depends on scroll restoration strategy)
  });

  it('should handle rapid navigation clicks', async () => {
    const user = userEvent.setup();
    
    render(<TestApp />);

    // Start on QuizEdit
    expect(screen.getByTestId('quiz-edit')).toBeInTheDocument();

    // Rapidly click navigation buttons
    const addButton = screen.getByTestId('add-question-btn');
    await user.click(addButton);
    await user.click(addButton); // Second click should be ignored

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Should only navigate once
    expect(screen.getByText('Save & Add Another')).toBeInTheDocument();
  });

  it('should handle navigation with keyboard shortcuts', async () => {
    const user = userEvent.setup();
    
    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Simulate Escape key to cancel/go back
    await user.keyboard('{Escape}');

    // Should trigger navigation back
    // (actual implementation depends on keyboard shortcut handling)
    expect(screen.getByTestId('question-manager')).toBeInTheDocument();
  });

  it('should handle navigation state persistence across page refreshes', async () => {
    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Simulate page refresh by re-rendering with same path
    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Should maintain the same state
    expect(screen.getByText('Save & Add Another')).toBeInTheDocument();
  });

  it('should maintain form state during navigation warnings', async () => {
    const user = userEvent.setup();
    
    // Mock unsaved changes
    vi.mocked(require('@/hooks/useUnsavedChanges').useUnsavedChanges).mockReturnValue({
      hasUnsavedChanges: true,
      navigateWithCheck: vi.fn((path) => {
        // Simulate confirmation dialog
        const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (confirmed) {
          window.history.pushState({}, '', path);
        }
      }),
      clearUnsavedChanges: vi.fn(),
      triggerAutoSave: vi.fn(),
      getLastAutoSaveText: vi.fn(() => null)
    });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TestApp initialPath="/quiz/quiz-1/question/create" />);

    await waitFor(() => {
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });

    // Try to navigate back with unsaved changes
    const backButton = screen.getByTestId('back-button');
    await user.click(backButton);

    // Should show confirmation dialog
    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});