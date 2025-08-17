import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import QuizEdit from '@/pages/QuizEdit';

// Mock the hooks and components
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  }),
  AuthProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button>Sidebar</button>
}));

vi.mock('@/components/QuestionManager', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="question-manager">
      Question Manager
      <button onClick={() => onChange([])}>Update Questions</button>
    </div>
  )
}));

vi.mock('@/components/QuizPreviewModal', () => ({
  default: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="quiz-preview-modal">
        Quiz Preview Modal
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

vi.mock('@/components/QuizSettingsModal', () => ({
  default: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="quiz-settings-modal">
        Quiz Settings Modal
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ quizId: 'test-quiz-id' }),
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: any) => <div>{children}</div>
  };
});

// Mock MCP tools
const mockExecuteSQL = vi.fn();
Object.defineProperty(window, 'mcp_supabase_execute_sql', {
  value: mockExecuteSQL,
  writable: true
});

describe('QuizEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful quiz loading
    mockExecuteSQL
      .mockResolvedValueOnce({
        data: [{
          id: 'test-quiz-id',
          title: 'Test Quiz',
          description: 'Test Description',
          settings: { timeLimit: 30 },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }]
      })
      .mockResolvedValueOnce({
        data: [{
          id: 'q1',
          quiz_id: 'test-quiz-id',
          question_text: 'Test Question',
          question_type: 'mcq',
          question_data: { options: ['A', 'B'], correctAnswer: 0 },
          explanation: 'Test explanation',
          order_index: 0
        }]
      });
  });

  const renderQuizEdit = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <QuizEdit />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    renderQuizEdit();
    
    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('loads and displays quiz data', async () => {
    renderQuizEdit();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Quiz')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByTestId('question-manager')).toBeInTheDocument();
    });
  });

  it('shows edit quiz header', async () => {
    renderQuizEdit();
    
    await waitFor(() => {
      expect(screen.getByText('Edit Quiz')).toBeInTheDocument();
      expect(screen.getByText('Modify your quiz content and settings')).toBeInTheDocument();
    });
  });

  it('displays action buttons', async () => {
    renderQuizEdit();
    
    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Save Quiz')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('shows quiz statistics', async () => {
    renderQuizEdit();
    
    await waitFor(() => {
      expect(screen.getByText(/Created/)).toBeInTheDocument();
      expect(screen.getByText(/Modified/)).toBeInTheDocument();
    });
  });

  it('handles quiz not found', async () => {
    mockExecuteSQL.mockResolvedValueOnce({ data: [] });
    
    renderQuizEdit();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles loading error', async () => {
    mockExecuteSQL.mockRejectedValueOnce(new Error('Database error'));
    
    renderQuizEdit();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});