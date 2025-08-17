/**
 * @fileoverview Tests for QuizCreationModal component
 * @description Tests for quiz creation form validation and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizCreationModal from '../QuizCreationModal';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the quiz service
vi.mock('@/lib/quiz-service', () => ({
  validateQuizData: vi.fn(() => ({ isValid: true, errors: [] }))
}));

describe('QuizCreationModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    folderId: 'test-folder-id',
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<QuizCreationModal {...defaultProps} />);
    
    expect(screen.getByText('Create New Quiz')).toBeInTheDocument();
    expect(screen.getByLabelText(/quiz title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<QuizCreationModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Create New Quiz')).not.toBeInTheDocument();
  });

  it('shows validation error for empty title', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create quiz/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/quiz title is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for title that is too long', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/quiz title/i);
    const longTitle = 'a'.repeat(300); // Exceeds 255 character limit
    
    await user.type(titleInput, longTitle);
    
    const submitButton = screen.getByRole('button', { name: /create quiz/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/quiz title must be 255 characters or less/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for description that is too long', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/quiz title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const longDescription = 'a'.repeat(1100); // Exceeds 1000 character limit
    
    await user.type(titleInput, 'Valid Title');
    await user.type(descriptionInput, longDescription);
    
    const submitButton = screen.getByRole('button', { name: /create quiz/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/description must be 1000 characters or less/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<QuizCreationModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/quiz title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(titleInput, 'Test Quiz');
    await user.type(descriptionInput, 'Test Description');
    
    const submitButton = screen.getByRole('button', { name: /create quiz/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Quiz',
        description: 'Test Description',
        settings: {}
      });
    });
  });

  it('toggles advanced settings', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const advancedToggle = screen.getByRole('button', { name: /show advanced settings/i });
    await user.click(advancedToggle);
    
    expect(screen.getByText(/advanced settings/i)).toBeInTheDocument();
    expect(screen.getByText(/show correct answers/i)).toBeInTheDocument();
    expect(screen.getByText(/show explanations/i)).toBeInTheDocument();
  });

  it('handles time limit toggle', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const timeLimitToggle = screen.getByRole('switch', { name: /time limit/i });
    await user.click(timeLimitToggle);
    
    expect(screen.getByLabelText(/time limit \(minutes\)/i)).toBeInTheDocument();
  });

  it('handles passing score toggle', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const advancedToggle = screen.getByRole('button', { name: /show advanced settings/i });
    await user.click(advancedToggle);
    
    const passingScoreToggle = screen.getByRole('switch', { name: /passing score/i });
    await user.click(passingScoreToggle);
    
    expect(screen.getByLabelText(/passing score \(%\)/i)).toBeInTheDocument();
  });

  it('shows max retakes input when retakes are allowed', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    // Retakes should be enabled by default
    expect(screen.getByLabelText(/maximum retakes/i)).toBeInTheDocument();
    
    // Disable retakes
    const retakesToggle = screen.getByRole('switch', { name: /allow retakes/i });
    await user.click(retakesToggle);
    
    expect(screen.queryByLabelText(/maximum retakes/i)).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables form when loading', () => {
    render(<QuizCreationModal {...defaultProps} loading={true} />);
    
    const titleInput = screen.getByLabelText(/quiz title/i);
    const submitButton = screen.getByRole('button', { name: /creating.../i });
    
    expect(titleInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('handles form submission error', async () => {
    const user = userEvent.setup();
    const error = new Error('Submission failed');
    mockOnSubmit.mockRejectedValue(error);
    
    render(<QuizCreationModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/quiz title/i);
    await user.type(titleInput, 'Test Quiz');
    
    const submitButton = screen.getByRole('button', { name: /create quiz/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    
    // The error should be handled by the component's error handling
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('validates time limit range', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/quiz title/i);
    await user.type(titleInput, 'Test Quiz');
    
    // Enable time limit
    const timeLimitToggle = screen.getByRole('switch', { name: /time limit/i });
    await user.click(timeLimitToggle);
    
    const timeLimitInput = screen.getByLabelText(/time limit \(minutes\)/i);
    await user.clear(timeLimitInput);
    await user.type(timeLimitInput, '0'); // Invalid value
    
    const submitButton = screen.getByRole('button', { name: /create quiz/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/time limit must be at least 1 minute/i)).toBeInTheDocument();
    });
  });

  it('validates passing score range', async () => {
    const user = userEvent.setup();
    render(<QuizCreationModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/quiz title/i);
    await user.type(titleInput, 'Test Quiz');
    
    // Show advanced settings
    const advancedToggle = screen.getByRole('button', { name: /show advanced settings/i });
    await user.click(advancedToggle);
    
    // Enable passing score
    const passingScoreToggle = screen.getByRole('switch', { name: /passing score/i });
    await user.click(passingScoreToggle);
    
    const passingScoreInput = screen.getByLabelText(/passing score \(%\)/i);
    await user.clear(passingScoreInput);
    await user.type(passingScoreInput, '150'); // Invalid value
    
    const submitButton = screen.getByRole('button', { name: /create quiz/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/passing score cannot exceed 100/i)).toBeInTheDocument();
    });
  });
});