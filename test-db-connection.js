// Simple test to verify database connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: List tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
      return;
    }
    
    console.log('Available tables:', tables?.map(t => t.table_name));
    
    // Test 2: Get quiz data
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, title')
      .limit(5);
    
    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError);
      return;
    }
    
    console.log('Available quizzes:', quizzes);
    
    // Test 3: Get specific quiz
    const testQuizId = '10d4028f-ea9f-4fe8-88d0-09480ac0f548';
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', testQuizId)
      .single();
    
    if (quizError) {
      console.error('Error fetching specific quiz:', quizError);
      return;
    }
    
    console.log('Test quiz data:', quiz);
    
    // Test 4: Get questions for the quiz
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', testQuizId)
      .order('order_index', { ascending: true });
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }
    
    console.log('Questions for test quiz:', questions);
    
    console.log('✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

testConnection();