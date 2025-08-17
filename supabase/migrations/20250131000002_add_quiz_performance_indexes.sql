-- Migration: Add performance indexes for quiz system
-- Description: Optimize database queries with proper indexing for quiz operations
-- Author: Quiz System Implementation
-- Version: 1.0.0

-- Indexes for quizzes table
CREATE INDEX IF NOT EXISTS idx_quizzes_folder_user_created 
ON quizzes(folder_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quizzes_user_updated 
ON quizzes(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_quizzes_title_search 
ON quizzes USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Indexes for questions table
CREATE INDEX IF NOT EXISTS idx_questions_quiz_order 
ON questions(quiz_id, order_index);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_type 
ON questions(quiz_id, question_type);

-- Indexes for quiz_attempts table
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user_completed 
ON quiz_attempts(quiz_id, user_id, completed_at DESC) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_completed 
ON quiz_attempts(user_id, completed_at DESC) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_score 
ON quiz_attempts(quiz_id, score DESC) 
WHERE completed_at IS NOT NULL AND score IS NOT NULL;

-- Composite index for quiz statistics queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_stats 
ON quiz_attempts(quiz_id, user_id, score, completed_at, time_taken) 
WHERE completed_at IS NOT NULL;

-- Index for pagination queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_pagination 
ON quiz_attempts(quiz_id, user_id, completed_at DESC, id) 
WHERE completed_at IS NOT NULL;

-- Partial indexes for active quizzes (not deleted)
CREATE INDEX IF NOT EXISTS idx_quizzes_active_folder 
ON quizzes(folder_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Add deleted_at column if it doesn't exist (for soft deletes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quizzes' AND column_name = 'deleted_at') THEN
        ALTER TABLE quizzes ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Index for soft-deleted quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_deleted 
ON quizzes(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Analyze tables to update statistics for query planner
ANALYZE quizzes;
ANALYZE questions;
ANALYZE quiz_attempts;

-- Add comments for documentation
COMMENT ON INDEX idx_quizzes_folder_user_created IS 'Optimizes folder view quiz listing queries';
COMMENT ON INDEX idx_quizzes_user_updated IS 'Optimizes user quiz dashboard queries';
COMMENT ON INDEX idx_quizzes_title_search IS 'Enables full-text search on quiz titles and descriptions';
COMMENT ON INDEX idx_questions_quiz_order IS 'Optimizes question ordering within quizzes';
COMMENT ON INDEX idx_questions_quiz_type IS 'Optimizes question type filtering';
COMMENT ON INDEX idx_quiz_attempts_quiz_user_completed IS 'Optimizes quiz attempt history queries';
COMMENT ON INDEX idx_quiz_attempts_user_completed IS 'Optimizes user attempt history queries';
COMMENT ON INDEX idx_quiz_attempts_quiz_score IS 'Optimizes leaderboard and scoring queries';
COMMENT ON INDEX idx_quiz_attempts_stats IS 'Optimizes quiz statistics calculations';
COMMENT ON INDEX idx_quiz_attempts_pagination IS 'Optimizes paginated attempt history queries';
COMMENT ON INDEX idx_quizzes_active_folder IS 'Optimizes active quiz queries in folders';
COMMENT ON INDEX idx_quizzes_deleted IS 'Optimizes soft-deleted quiz cleanup queries';