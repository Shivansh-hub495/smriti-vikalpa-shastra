/**
 * @fileoverview Integration tests for keyboard shortcuts and accessibility
 * @description Tests for keyboard navigation, shortcuts, and accessibility features
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
    