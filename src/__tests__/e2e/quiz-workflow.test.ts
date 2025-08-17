/**
 * @fileoverview End-to-end tests for Quiz Workflow
 * @description Tests for complete quiz creation, taking, and management workflows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock components for E2E testing
import FolderView from '../../pages/FolderView';
import CreateQuiz from '../../pages/CreateQuiz';
import QuizTaking from '../../pages/QuizTaking';
import QuizEdit from '../../pages/QuizEdit';

// Mock the MCP functions
const mockMCPInsert = vi.fn();
const mockMCPUpdate = vi.fn();
const mockMCPSelect = vi.fn();
const mockMCPDelete = vi.fn();
const mockMCPExecuteSQL = vi.fn();

Object.defineProperty(window, 'mcp_supabase_custom_insert_data', {
  value: mockMCPInsert,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_custom_update_data', {
  value: mockMCPUpdate,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_custom_select_data', {
  value: mockMCPSelect,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_custom_delete_data', {
  value: mockMCPDelete,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_execute_sql', {
  value: mockMCPExecuteSQL,
  writable: true
});

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams()
  };
});

// Mock AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  loading: false,
  signOut: vi.fn()
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Quiz Workflow E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ folderId: 'folder-123' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  describe('Complete Quiz Creation Workflow', () => {
    it('should create a quiz with multiple question types', async () => {
      const user = userEvent.setup();

      // Mock folder data
      mockMCPSelect.mockResolvedValueOnce([{
        id: 'folder-123',
        name: 'Test Folder',
        user_id: 'user-123'
      }]);

      // Mock quiz creation
      mockMCPInsert.mockResolvedValueOnce({
        id: 'quiz-123',
        title: 'Complete Test Quiz',
        description: 'A comprehensive test quiz',
        folder_id: 'folder-123',
        user_id: 'user-123',
        settings: {
          timeLimit: 30,
          shuffleQuestions: false,
          showResults: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      // Mock question creation
      const mockQuestions = [
        {
          id: 'q1',
          quiz_id: 'quiz-123',
          question_text: 'What is the capital of France?',
          question_type: 'mcq',
          question_data: {
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctAnswer: 2
          },
          explanation: 'Paris is the capital of France',
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'q2',
          quiz_id: 'quiz-123',
          question_text: 'The Earth is round.',
          question_type: 'true_false',
          question_data: {
            correctAnswer: true
          },
          explanation: 'The Earth is approximately spherical',
          order_index: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockQuestions.forEach(question => {
        mockMCPInsert.mockResolvedValueOnce(question);
      });

      renderWithRouter(<CreateQuiz />);

      // Fill in quiz details
      const titleInput = screen.getByLabelText(/quiz title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(titleInput, 'Complete Test Quiz');
      await user.type(descriptionInput, 'A comprehensive test quiz');

      // Add first question (MCQ)
      const addQuestionButton = screen.getByText('Add Question');
      await user.click(addQuestionButton);

      const questionTextInput = screen.getByPlaceholderText('Enter your question here...');
      await user.type(questionTextInput, 'What is the capital of France?');

      // Add MCQ options
      const optionInputs = screen.getAllByPlaceholderText(/option/i);
      await user.type(optionInputs[0], 'London');
      await user.type(optionInputs[1], 'Berlin');
      await user.type(optionInputs[2], 'Paris');
      await user.type(optionInputs[3], 'Madrid');

      // Set correct answer
      const correctAnswerRadio = screen.getAllByRole('radio')[2]; // Paris
      await user.click(correctAnswerRadio);

      // Add explanation
      const explanationInput = screen.getByPlaceholderText('Provide an explanation for the correct answer...');
      await user.type(explanationInput, 'Paris is the capital of France');

      // Add second question (True/False)
      await user.click(addQuestionButton);

      const questionTypeSelect = screen.getAllByRole('combobox')[1]; // Second question's type selector
      await user.click(questionTypeSelect);
      const trueFalseOption = screen.getByText('True/False');
      await user.click(trueFalseOption);

      const secondQuestionText = screen.getAllByPlaceholderText('Enter your question here...')[1];
      await user.type(secondQuestionText, 'The Earth is round.');

      const trueButton = screen.getByText('True');
      await user.click(trueButton);

      const secondExplanation = screen.getAllByPlaceholderText('Provide an explanation for the correct answer...')[1];
      await user.type(secondExplanation, 'The Earth is approximately spherical');

      // Save quiz
      const saveButton = screen.getByText('Create Quiz');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMCPInsert).toHaveBeenCalledWith({
          tableName: 'quizzes',
          data: expect.objectContaining({
            title: 'Complete Test Quiz',
            description: 'A comprehensive test quiz',
            folder_id: 'folder-123',
            user_id: 'user-123'
          })
        });
      });

      // Verify questions were created
      expect(mockMCPInsert).toHaveBeenCalledWith({
        tableName: 'questions',
        data: expect.objectContaining({
          quiz_id: 'quiz-123',
          question_text: 'What is the capital of France?',
          question_type: 'mcq'
        })
      });

      expect(mockMCPInsert).toHaveBeenCalledWith({
        tableName: 'questions',
        data: expect.objectContaining({
          quiz_id: 'quiz-123',
          question_text: 'The Earth is round.',
          question_type: 'true_false'
        })
      });

      // Verify navigation to quiz list
      expect(mockNavigate).toHaveBeenCalledWith('/folder/folder-123');
    });
  });

  describe('Complete Quiz Taking Workflow', () => {
    it('should take a quiz and submit answers', async () => {
      const user = userEvent.setup();

      mockUseParams.mockReturnValue({ quizId: 'quiz-123' });

      // Mock quiz data
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: 'A test quiz',
        folder_id: 'folder-123',
        user_id: 'user-123',
        settings: {
          timeLimit: 30,
          shuffleQuestions: false,
          showResults: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockQuestions = [
        {
          id: 'q1',
          quiz_id: 'quiz-123',
          question_text: 'What is 2 + 2?',
          question_type: 'mcq',
          question_data: {
            options: ['2', '3', '4', '5'],
            correctAnswer: 2
          },
          explanation: 'Basic addition',
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'q2',
          quiz_id: 'quiz-123',
          question_text: 'The sky is blue.',
          question_type: 'true_false',
          question_data: {
            correctAnswer: true
          },
          explanation: 'Light scattering makes the sky appear blue',
          order_index: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock data loading
      mockMCPSelect.mockResolvedValueOnce([mockQuiz]);
      mockMCPSelect.mockResolvedValueOnce(mockQuestions);

      // Mock attempt creation
      mockMCPInsert.mockResolvedValueOnce({
        id: 'attempt-123',
        quiz_id: 'quiz-123',
        user_id: 'user-123',
        started_at: '2024-01-01T00:00:00Z',
        total_questions: 2,
        correct_answers: 0,
        answers: [],
        created_at: '2024-01-01T00:00:00Z'
      });

      // Mock attempt completion
      mockMCPUpdate.mockResolvedValueOnce({
        id: 'attempt-123',
        quiz_id: 'quiz-123',
        user_id: 'user-123',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:05:00Z',
        score: 100,
        total_questions: 2,
        correct_answers: 2,
        time_taken: 300,
        answers: [
          {
            questionId: 'q1',
            answer: { type: 'mcq', selectedOption: 2 },
            correct: true,
            timeSpent: 150
          },
          {
            questionId: 'q2',
            answer: { type: 'true_false', answer: true },
            correct: true,
            timeSpent: 150
          }
        ],
        created_at: '2024-01-01T00:00:00Z'
      });

      renderWithRouter(<QuizTaking />);

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      // Start quiz
      const startButton = screen.getByText('Start Quiz');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockMCPInsert).toHaveBeenCalledWith({
          tableName: 'quiz_attempts',
          data: expect.objectContaining({
            quiz_id: 'quiz-123',
            user_id: 'user-123',
            total_questions: 2
          })
        });
      });

      // Answer first question
      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      const option4 = screen.getByLabelText('4');
      await user.click(option4);

      // Go to next question
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Answer second question
      await waitFor(() => {
        expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
      });

      const trueButton = screen.getByText('True');
      await user.click(trueButton);

      // Finish quiz
      const finishButton = screen.getByText('Finish Quiz');
      await user.click(finishButton);

      await waitFor(() => {
        expect(mockMCPUpdate).toHaveBeenCalledWith({
          tableName: 'quiz_attempts',
          data: expect.objectContaining({
            completed_at: expect.any(String),
            score: expect.any(Number),
            correct_answers: expect.any(Number),
            time_taken: expect.any(Number),
            answers: expect.any(Array)
          }),
          filter: { id: 'attempt-123' }
        });
      });

      // Verify results are shown
      await waitFor(() => {
        expect(screen.getByText('Quiz Complete!')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Management Workflow', () => {
    it('should edit an existing quiz', async () => {
      const user = userEvent.setup();

      mockUseParams.mockReturnValue({ quizId: 'quiz-123' });

      // Mock existing quiz data
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Original Quiz Title',
        description: 'Original description',
        folder_id: 'folder-123',
        user_id: 'user-123',
        settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockQuestions = [
        {
          id: 'q1',
          quiz_id: 'quiz-123',
          question_text: 'Original question',
          question_type: 'mcq',
          question_data: {
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0
          },
          explanation: 'Original explanation',
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock data loading
      mockMCPSelect.mockResolvedValueOnce([mockQuiz]);
      mockMCPSelect.mockResolvedValueOnce(mockQuestions);

      // Mock quiz update
      mockMCPUpdate.mockResolvedValueOnce({
        ...mockQuiz,
        title: 'Updated Quiz Title',
        description: 'Updated description',
        updated_at: '2024-01-01T12:00:00Z'
      });

      // Mock question update
      mockMCPUpdate.mockResolvedValueOnce({
        ...mockQuestions[0],
        question_text: 'Updated question',
        explanation: 'Updated explanation',
        updated_at: '2024-01-01T12:00:00Z'
      });

      renderWithRouter(<QuizEdit />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Quiz Title')).toBeInTheDocument();
      });

      // Update quiz title
      const titleInput = screen.getByDisplayValue('Original Quiz Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Quiz Title');

      // Update description
      const descriptionInput = screen.getByDisplayValue('Original description');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      // Update question
      const questionInput = screen.getByDisplayValue('Original question');
      await user.clear(questionInput);
      await user.type(questionInput, 'Updated question');

      // Update explanation
      const explanationInput = screen.getByDisplayValue('Original explanation');
      await user.clear(explanationInput);
      await user.type(explanationInput, 'Updated explanation');

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMCPUpdate).toHaveBeenCalledWith({
          tableName: 'quizzes',
          data: expect.objectContaining({
            title: 'Updated Quiz Title',
            description: 'Updated description'
          }),
          filter: { id: 'quiz-123', user_id: 'user-123' }
        });
      });

      expect(mockMCPUpdate).toHaveBeenCalledWith({
        tableName: 'questions',
        data: expect.objectContaining({
          question_text: 'Updated question',
          explanation: 'Updated explanation'
        }),
        filter: { id: 'q1' }
      });
    });

    it('should delete a quiz', async () => {
      const user = userEvent.setup();

      mockUseParams.mockReturnValue({ folderId: 'folder-123' });

      // Mock folder and quiz data
      mockMCPSelect.mockResolvedValueOnce([{
        id: 'folder-123',
        name: 'Test Folder',
        user_id: 'user-123'
      }]);

      mockMCPSelect.mockResolvedValueOnce([{
        id: 'quiz-123',
        title: 'Quiz to Delete',
        description: 'This quiz will be deleted',
        folder_id: 'folder-123',
        user_id: 'user-123',
        settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }]);

      // Mock deletion
      mockMCPDelete.mockResolvedValueOnce({ success: true });

      renderWithRouter(<FolderView />);

      await waitFor(() => {
        expect(screen.getByText('Quiz to Delete')).toBeInTheDocument();
      });

      // Open quiz options menu
      const optionsButton = screen.getByLabelText('Quiz options');
      await user.click(optionsButton);

      // Click delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Delete Quiz');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockMCPDelete).toHaveBeenCalledWith({
          tableName: 'quizzes',
          filter: { id: 'quiz-123', user_id: 'user-123' }
        });
      });

      // Verify quiz is removed from list
      await waitFor(() => {
        expect(screen.queryByText('Quiz to Delete')).not.toBeInTheDocument();
      });
    });
  });

  describe('Quiz History and Analytics Workflow', () => {
    it('should view quiz attempt history', async () => {
      const user = userEvent.setup();

      mockUseParams.mockReturnValue({ quizId: 'quiz-123' });

      // Mock quiz data
      mockMCPSelect.mockResolvedValueOnce([{
        id: 'quiz-123',
        title: 'History Test Quiz',
        folder_id: 'folder-123',
        user_id: 'user-123'
      }]);

      // Mock attempt history
      const mockAttempts = [
        {
          id: 'attempt-1',
          quiz_id: 'quiz-123',
          user_id: 'user-123',
          score: 85,
          completed_at: '2024-01-01T00:05:00Z',
          time_taken: 300,
          answers: '[]'
        },
        {
          id: 'attempt-2',
          quiz_id: 'quiz-123',
          user_id: 'user-123',
          score: 92,
          completed_at: '2024-01-02T00:05:00Z',
          time_taken: 250,
          answers: '[]'
        }
      ];

      mockMCPExecuteSQL.mockResolvedValueOnce({ data: mockAttempts });

      renderWithRouter(<QuizTaking />);

      await waitFor(() => {
        expect(screen.getByText('History Test Quiz')).toBeInTheDocument();
      });

      // View history
      const historyButton = screen.getByText('View History');
      await user.click(historyButton);

      await waitFor(() => {
        expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
          query: expect.stringContaining('SELECT * FROM quiz_attempts'),
          params: ['quiz-123', 'user-123']
        });
      });

      // Verify attempts are displayed
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('Best Score: 92%')).toBeInTheDocument();
      expect(screen.getByText('Total Attempts: 2')).toBeInTheDocument();
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock network error
      mockMCPSelect.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<CreateQuiz />);

      await waitFor(() => {
        expect(screen.getByText(/error loading/i)).toBeInTheDocument();
      });

      // Retry button should be available
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      // Should attempt to reload
      expect(mockMCPSelect).toHaveBeenCalledTimes(2);
    });

    it('should handle validation errors during quiz creation', async () => {
      const user = userEvent.setup();

      renderWithRouter(<CreateQuiz />);

      // Try to create quiz without title
      const saveButton = screen.getByText('Create Quiz');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Quiz title is required')).toBeInTheDocument();
      });

      // Should not call API
      expect(mockMCPInsert).not.toHaveBeenCalled();
    });
  });
});