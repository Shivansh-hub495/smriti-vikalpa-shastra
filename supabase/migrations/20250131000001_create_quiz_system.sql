-- Create quiz system tables and policies
-- Migration: 20250131000001_create_quiz_system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    folder_id UUID NOT NULL,
    user_id UUID NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT quizzes_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT quizzes_settings_valid CHECK (jsonb_typeof(settings) = 'object')
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_data JSONB NOT NULL DEFAULT '{}',
    explanation TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT questions_type_valid CHECK (
        question_type IN ('mcq', 'fill_blank', 'true_false', 'match_following')
    ),
    CONSTRAINT questions_text_not_empty CHECK (LENGTH(TRIM(question_text)) > 0),
    CONSTRAINT questions_data_valid CHECK (jsonb_typeof(question_data) = 'object'),
    CONSTRAINT questions_order_positive CHECK (order_index >= 0)
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score DECIMAL(5,2),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    time_taken INTEGER, -- in seconds
    answers JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT quiz_attempts_score_valid CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    CONSTRAINT quiz_attempts_total_positive CHECK (total_questions > 0),
    CONSTRAINT quiz_attempts_correct_valid CHECK (
        correct_answers >= 0 AND correct_answers <= total_questions
    ),
    CONSTRAINT quiz_attempts_time_positive CHECK (time_taken IS NULL OR time_taken >= 0),
    CONSTRAINT quiz_attempts_answers_valid CHECK (jsonb_typeof(answers) = 'array'),
    CONSTRAINT quiz_attempts_completion_logic CHECK (
        (completed_at IS NULL AND score IS NULL) OR 
        (completed_at IS NOT NULL AND score IS NOT NULL)
    )
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_folder_id ON quizzes(folder_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, order_index);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(score DESC) WHERE score IS NOT NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON quizzes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes table
CREATE POLICY "Users can view their own quizzes" ON quizzes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create quizzes" ON quizzes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quizzes" ON quizzes
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own quizzes" ON quizzes
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for questions table
CREATE POLICY "Users can view questions from their quizzes" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = questions.quiz_id 
            AND quizzes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create questions for their quizzes" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = questions.quiz_id 
            AND quizzes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update questions in their quizzes" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = questions.quiz_id 
            AND quizzes.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = questions.quiz_id 
            AND quizzes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete questions from their quizzes" ON questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = questions.quiz_id 
            AND quizzes.user_id = auth.uid()
        )
    );

-- RLS Policies for quiz_attempts table
CREATE POLICY "Users can view their own quiz attempts" ON quiz_attempts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz attempts" ON quiz_attempts
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own quiz attempts" ON quiz_attempts
    FOR DELETE USING (user_id = auth.uid());

-- Quiz owners can view attempts on their quizzes (for analytics)
CREATE POLICY "Quiz owners can view attempts on their quizzes" ON quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE quizzes.id = quiz_attempts.quiz_id 
            AND quizzes.user_id = auth.uid()
        )
    );