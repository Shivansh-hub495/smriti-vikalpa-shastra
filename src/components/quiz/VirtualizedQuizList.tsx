/**
 * @fileoverview Virtualized Quiz List Component for Performance
 * @description Efficiently renders large lists of quizzes using virtualization
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
// useResizeObserver is defined at the bottom of this file
import QuizCard from '@/components/QuizCard';
import { QuizCardSkeleton } from './LazyQuizComponents';
import type { QuizListItem } from '@/types/quiz';

interface VirtualizedQuizListProps {
  quizzes: QuizListItem[];
  onDelete: (quizId: string, quizTitle: string) => void;
  loading?: boolean;
  className?: string;
  minItemWidth?: number;
  itemHeight?: number;
  gap?: number;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    quizzes: QuizListItem[];
    columnsPerRow: number;
    onDelete: (quizId: string, quizTitle: string) => void;
    gap: number;
  };
}

const GridItem: React.FC<GridItemProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { quizzes, columnsPerRow, onDelete, gap } = data;
  const index = rowIndex * columnsPerRow + columnIndex;
  const quiz = quizzes[index];

  if (!quiz) {
    return null;
  }

  const itemStyle: React.CSSProperties = {
    ...style,
    left: (style.left as number) + gap / 2,
    top: (style.top as number) + gap / 2,
    width: (style.width as number) - gap,
    height: (style.height as number) - gap,
  };

  return (
    <div style={itemStyle}>
      <QuizCard quiz={quiz} onDelete={onDelete} />
    </div>
  );
};

const LoadingGridItem: React.FC<GridItemProps> = ({ style, data }) => {
  const itemStyle: React.CSSProperties = {
    ...style,
    left: (style.left as number) + data.gap / 2,
    top: (style.top as number) + data.gap / 2,
    width: (style.width as number) - data.gap,
    height: (style.height as number) - data.gap,
  };

  return (
    <div style={itemStyle}>
      <QuizCardSkeleton />
    </div>
  );
};

export const VirtualizedQuizList: React.FC<VirtualizedQuizListProps> = ({
  quizzes,
  onDelete,
  loading = false,
  className = '',
  minItemWidth = 280,
  itemHeight = 320,
  gap = 24,
}) => {
  const [containerRef, { width: containerWidth, height: containerHeight }] = useResizeObserver<HTMLDivElement>();

  // Calculate grid dimensions
  const { columnsPerRow, rowCount, columnWidth } = useMemo(() => {
    if (!containerWidth) {
      return { columnsPerRow: 1, rowCount: 0, columnWidth: minItemWidth };
    }

    const availableWidth = containerWidth - gap;
    const cols = Math.max(1, Math.floor(availableWidth / (minItemWidth + gap)));
    const colWidth = (availableWidth - (cols - 1) * gap) / cols;
    const rows = Math.ceil(quizzes.length / cols);

    return {
      columnsPerRow: cols,
      rowCount: rows,
      columnWidth: colWidth,
    };
  }, [containerWidth, minItemWidth, gap, quizzes.length]);

  // Grid data for react-window
  const gridData = useMemo(() => ({
    quizzes,
    columnsPerRow,
    onDelete,
    gap,
  }), [quizzes, columnsPerRow, onDelete, gap]);

  // Loading grid data
  const loadingGridData = useMemo(() => ({
    quizzes: Array(12).fill(null), // Show 12 loading skeletons
    columnsPerRow,
    onDelete: () => {},
    gap,
  }), [columnsPerRow, gap]);

  const handleItemsRendered = useCallback(({
    visibleRowStartIndex,
    visibleRowStopIndex,
    visibleColumnStartIndex,
    visibleColumnStopIndex,
  }: {
    visibleRowStartIndex: number;
    visibleRowStopIndex: number;
    visibleColumnStartIndex: number;
    visibleColumnStopIndex: number;
  }) => {
    // Optional: Track visible items for analytics or prefetching
    const startIndex = visibleRowStartIndex * columnsPerRow + visibleColumnStartIndex;
    const endIndex = visibleRowStopIndex * columnsPerRow + visibleColumnStopIndex;
    
    // Could be used for prefetching quiz details or images
    console.debug(`Visible quiz items: ${startIndex} to ${endIndex}`);
  }, [columnsPerRow]);

  // Fallback for small screens or no data
  if (!containerWidth || containerWidth < minItemWidth) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <QuizCardSkeleton key={index} />
            ))
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300">No quizzes found</p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} onDelete={onDelete} />
            ))
          )}
        </div>
      </div>
    );
  }

  const gridHeight = Math.min(
    containerHeight || 600,
    Math.max(400, rowCount * (itemHeight + gap) + gap)
  );

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {loading ? (
        <Grid
          columnCount={columnsPerRow}
          columnWidth={columnWidth}
          height={gridHeight}
          rowCount={Math.ceil(12 / columnsPerRow)}
          rowHeight={itemHeight + gap}
          width={containerWidth}
          itemData={loadingGridData}
          onItemsRendered={handleItemsRendered}
        >
          {LoadingGridItem}
        </Grid>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">No quizzes found</p>
        </div>
      ) : (
        <Grid
          columnCount={columnsPerRow}
          columnWidth={columnWidth}
          height={gridHeight}
          rowCount={rowCount}
          rowHeight={itemHeight + gap}
          width={containerWidth}
          itemData={gridData}
          onItemsRendered={handleItemsRendered}
          overscanRowCount={2} // Render 2 extra rows for smoother scrolling
          overscanColumnCount={1} // Render 1 extra column for smoother scrolling
        >
          {GridItem}
        </Grid>
      )}
    </div>
  );
};

// Hook for resize observer
function useResizeObserver<T extends HTMLElement>(): [
  React.RefObject<T>,
  { width: number; height: number }
] {
  const ref = React.useRef<T>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return [ref, dimensions];
}

export default VirtualizedQuizList;