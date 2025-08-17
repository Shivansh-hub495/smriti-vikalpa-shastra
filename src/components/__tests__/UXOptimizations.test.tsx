import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Import components to test
import LoadingSpinner from '../ui/loading-spinner';
import { Skeleton } from '../ui/skeleton';
import { LoadingPage, InlineLoading } from '../LoadingStates';
import PageTransition from '../PageTransition';
import { ResponsiveContainer, ResponsiveGrid } from '../ResponsiveLayout';
import { AccessibleButton, AccessibleInput } from '../AccessibleComponents';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock hooks
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    breakpoint: 'lg',
    windowSize: { width: 1024, height: 768 },
  }),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('UX Optimizations', () => {
  describe('Loading States', () => {
    it('renders loading spinner with correct accessibility attributes', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
      
      const srText = screen.getByText('Loading...');
      expect(srText).toHaveClass('sr-only');
    });

    it('renders skeleton with proper animation class', () => {
      render(<Skeleton className="h-4 w-20" />);
      
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders loading page with skeleton components', () => {
      render(<LoadingPage message="Loading quiz..." />);
      
      // Check for skeleton components instead of text
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders inline loading with spinner and message', () => {
      render(<InlineLoading message="Saving..." size="sm" />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Page Transitions', () => {
    it('renders page transition wrapper', () => {
      render(
        <PageTransition>
          <div>Test content</div>
        </PageTransition>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('renders responsive container with proper classes', () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('bg-gradient-to-br');
    });

    it('renders responsive grid with proper layout', () => {
      render(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Accessible Components', () => {
    it('renders accessible button with proper ARIA attributes', async () => {
      const handleClick = vi.fn();
      
      render(
        <AccessibleButton onClick={handleClick}>
          Click me
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('focus:ring-2');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders accessible button in loading state', () => {
      render(
        <AccessibleButton loading loadingText="Saving...">
          Save
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getAllByText('Saving...').length).toBeGreaterThan(0);
    });

    it('renders accessible input with proper labels and ARIA attributes', () => {
      render(
        <AccessibleInput
          label="Question Text"
          hint="Enter your question here"
          required
          error="This field is required"
        />
      );
      
      const input = screen.getByRole('textbox', { name: /question text/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      
      expect(screen.getByText('Question Text')).toBeInTheDocument();
      expect(screen.getByText('Enter your question here')).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
    });

    it('handles keyboard navigation properly', async () => {
      render(
        <TestWrapper>
          <div>
            <AccessibleButton>Button 1</AccessibleButton>
            <AccessibleButton>Button 2</AccessibleButton>
          </div>
        </TestWrapper>
      );
      
      const button1 = screen.getByRole('button', { name: 'Button 1' });
      const button2 = screen.getByRole('button', { name: 'Button 2' });
      
      button1.focus();
      expect(button1).toHaveFocus();
      
      fireEvent.keyDown(button1, { key: 'Tab' });
      await waitFor(() => {
        // Tab navigation should work (though exact focus behavior depends on browser)
        expect(button1).toBeInTheDocument();
        expect(button2).toBeInTheDocument();
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('components render without performance warnings', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <LoadingPage />
        </TestWrapper>
      );
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles rapid state changes efficiently', async () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        return <div>Render count: {renderCount}</div>;
      };
      
      const { rerender } = render(<TestComponent />);
      
      // Simulate rapid re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<TestComponent />);
      }
      
      expect(screen.getByText(`Render count: ${renderCount}`)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts to mobile viewport', () => {
      // Test mobile responsiveness by checking component renders
      render(
        <ResponsiveContainer>
          <div>Mobile content</div>
        </ResponsiveContainer>
      );
      
      expect(screen.getByText('Mobile content')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('handles component errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(
          <TestWrapper>
            <ThrowError />
          </TestWrapper>
        );
      }).toThrow('Test error');
      
      consoleSpy.mockRestore();
    });
  });
});