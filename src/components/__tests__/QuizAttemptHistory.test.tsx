/**
 * @fileoverview Tests for QuizAttemptHistory component
 * @description Unit tests for quiz attempt history display and functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuizAttemptHistory from '../QuizAttemptHistory';
import type { Quiz } from '@/types/quiz';

// Mock the hooks and utilities
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/utils/quizUtils', () => ({
  formatTime: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
  calculateQuizStats: () => ({
    totalAttempts: 0,
    bestScore: undefined,
    lastScore: undefined,
    averageScore: undefined,
    averageTime: undefined,
    hasPassed: undefined
  })
}));

// Mock window MCP functions
const mockExecuteSQL = vi.fn().mockResolvedValue({ data: [] });
Object.defineProperty(window, 'mcp_supabase_execute_sql', {
  value: mockExecuteSQL,
  writable: true
});

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'A test quiz',
  folder_id: 'folder-1',
  user_id: 'user-1',
  settings: {
    passingScore: 70
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('QuizAttemptHistory', () => {
  it('renders no attempts message when there are no attempts', async () => {
    mockExecuteSQL.mockResolvedValue({ data: [] });
    
    render(
      <QuizAttemptHistory
        quiz={mockQuiz}
        userId="user-1"
      />
    );

    // Wait for loading to complete and check for no attempts message
    expect(await screen.findByText('No Attempts Yet', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("You haven't taken this quiz yet.")).toBeInTheDocument();
  });

  it('renders quiz title in performance summary', async () => {
    mockExecuteSQL.mockResolvedValue({ data: [] });
    
    render(
      <QuizAttemptHistory
        quiz={mockQuiz}
        userId="user-1"
      />
    );

    // Should show performance summary section
    expect(await screen.findByText('Performance Summary', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('shows retake button when onRetake is provided', async () => {
    const mockOnRetake = vi.fn();
    mockExecuteSQL.mockResolvedValue({ data: [] });
    
    render(
      <QuizAttemptHistory
        quiz={mockQuiz}
        userId="user-1"
        onRetake={mockOnRetake}
      />
    );

    expect(await screen.findByText('Take Quiz', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});