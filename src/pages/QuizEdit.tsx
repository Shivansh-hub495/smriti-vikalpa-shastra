import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Eye, Trash2, Settings, Plus, AlertCircle, Copy, Edit } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuestionManager from '@/components/QuestionManager';
import QuestionList from '@/components/QuestionList';
import QuizPreviewModal from '@/components/QuizPreviewModal';
import QuizSettingsModal from '@/components/QuizSettingsModal';
import QuizDuplicateModal from '@/components/QuizDuplicateModal';
import QuizBreadcrumb from '@/components/QuizBreadcrumb';
import { useQuizRouteGuard } from '@/hooks/useQuizRouteGuard';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import type { Quiz, QuestionFormData, QuizSettings } from '@/types/quiz';
import { validateQuizData } from '@/lib/quiz-service';
import { 
  saveQuizFormState, 
  loadQuizFormState, 
  clearQuizFormState, 
  hasQuizFormState,
  cleanupExpiredFormStates 
} from '@/utils/quizFormState';

const QuizEdit: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Use route guard to check quiz access and ownership
  const { quiz: guardedQuiz, isLoading: guardLoading, hasAccess, isOwner } = useQuizRouteGuard({
    requireOwnership: true, // Only quiz owner can edit
    redirectPath: '/'
  });

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState<QuizSettings>({});
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeMobileTab, setActiveMobileTab] = useState<'info' | 'questions' | 'settings'>('questions');

  // Handle unsaved changes navigation
  const { navigateToWithConfirmation } = useUnsavedChangesWarning({
    hasUnsavedChanges,
    warningMessage: 'You have unsaved changes. Are you sure you want to leave without saving?',
    enableBrowserWarning: true
  });

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (quizId && user) {
      loadQuiz();
    }
  }, [quizId, user]);

  // Clean up expired form states on component mount
  useEffect(() => {
    cleanupExpiredFormStates();
  }, []);

  useEffect(() => {
    // Track unsaved changes
    if (quiz) {
      const hasChanges = 
        title !== quiz.title ||
        description !== (quiz.description || '') ||
        JSON.stringify(settings) !== JSON.stringify(quiz.settings) ||
        questions.length !== (quiz.questions?.length || 0);
      
      setHasUnsavedChanges(hasChanges);
      
      // Save form state when there are changes
      if (hasChanges && quizId) {
        saveQuizFormState(quizId, title, description, settings);
      }
    }
  }, [title, description, settings, questions, quiz, quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      
      // Import Supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Fetch quiz details and questions in parallel
      const [quizResult, questionsResult] = await Promise.all([
        supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('user_id', user?.id)
          .single(),
        supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_index', { ascending: true })
      ]);

      if (quizResult.error) {
        console.error('Error loading quiz:', quizResult.error);
        toast({
          title: "Error",
          description: "Quiz not found or you don't have permission to edit it",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      const quizDataItem = quizResult.data;
      
      if (questionsResult.error) {
        console.error('Error loading questions:', questionsResult.error);
        toast({
          title: "Error",
          description: "Failed to load quiz questions",
          variant: "destructive",
        });
        return;
      }

      const questionsData = questionsResult.data || [];
      
      // Transform questions data
      const formattedQuestions: QuestionFormData[] = questionsData.map((q: any) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        question_data: q.question_data,
        explanation: q.explanation || '',
        order_index: q.order_index
      }));

      const fullQuiz: Quiz = {
        ...quizDataItem,
        settings: quizDataItem.settings as any,
        questions: questionsData as any
      };

      setQuiz(fullQuiz);
      
      // Check for saved form state and restore if available (only once)
      const savedState = loadQuizFormState(quizId!);
      if (savedState) {
        setTitle(savedState.title);
        setDescription(savedState.description);
        setSettings(savedState.settings);
        
        // Only show toast once when form state is actually restored
        toast({
          title: "Form state restored",
          description: "Your unsaved changes have been restored.",
          duration: 3000,
        });
        
        // Clear the saved state after restoration to prevent repeated notifications
        clearQuizFormState(quizId!);
      } else {
        setTitle(quizDataItem.title);
        setDescription(quizDataItem.description || '');
        setSettings((quizDataItem.settings as any) || {});
      }
      
      setQuestions(formattedQuestions);
      
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz data",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const validateQuiz = () => {
    const errors: string[] = [];
    
    // Validate basic quiz data
    const quizValidation = validateQuizData({ title, description, settings });
    if (!quizValidation.isValid) {
      errors.push(...quizValidation.errors);
    }

    // Validate questions
    if (questions.length === 0) {
      errors.push('Quiz must have at least one question');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const saveQuiz = async () => {
    if (!validateQuiz()) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Import Supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Update quiz metadata
      const { error: quizUpdateError } = await supabase
        .from('quizzes')
        .update({
          title,
          description,
          settings: settings as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId)
        .eq('user_id', user?.id);

      if (quizUpdateError) {
        throw new Error(`Failed to update quiz: ${quizUpdateError.message}`);
      }

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteError) {
        throw new Error(`Failed to delete existing questions: ${deleteError.message}`);
      }

      // Insert updated questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((question, index) => ({
          quiz_id: quizId,
          question_text: question.question_text,
          question_type: question.question_type,
          question_data: question.question_data as any,
          explanation: question.explanation || null,
          order_index: index
        }));

        const { error: insertError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (insertError) {
          throw new Error(`Failed to insert questions: ${insertError.message}`);
        }
      }

      toast({
        title: "Success! 🎉",
        description: "Quiz saved successfully",
      });

      setHasUnsavedChanges(false);
      
      // Clear saved form state since changes are now saved
      if (quizId) {
        clearQuizFormState(quizId);
      }
      
      // Reload quiz data
      await loadQuiz();
      
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const duplicateQuiz = async (newTitle: string, newDescription?: string) => {
    try {
      // Import Supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Create new quiz
      const { data: newQuizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: newTitle,
          description: newDescription || null,
          folder_id: quiz?.folder_id,
          user_id: user?.id,
          settings: settings as any
        })
        .select()
        .single();

      if (quizError) {
        throw new Error(`Failed to create quiz: ${quizError.message}`);
      }

      const newQuizId = newQuizData.id;

      // Duplicate questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((question, index) => ({
          quiz_id: newQuizId,
          question_text: question.question_text,
          question_type: question.question_type,
          question_data: question.question_data as any,
          explanation: question.explanation || null,
          order_index: index
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) {
          throw new Error(`Failed to duplicate questions: ${questionsError.message}`);
        }
      }

      toast({
        title: "Success! 🎉",
        description: `Quiz duplicated as "${newTitle}"`,
      });

      // Navigate to the new quiz
      navigate(`/quiz/${newQuizId}/edit`);
      
    } catch (error) {
      console.error('Error duplicating quiz:', error);
      throw new Error('Failed to duplicate quiz');
    }
  };

  const deleteQuiz = async () => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Import Supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('user_id', user?.id);

      if (error) {
        throw new Error(`Failed to delete quiz: ${error.message}`);
      }

      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });

      navigate('/');
      
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigateToWithConfirmation('/');
  };

  // Navigation functions for question management
  const handleAddQuestion = () => {
    navigate(`/quiz/${quizId}/question/create`);
  };

  const handleEditQuestion = (questionIndex: number) => {
    // For now, we'll use the question index since we don't have real question IDs
    // In a real implementation, you'd store question IDs with the questions
    const questionId = quiz?.questions?.[questionIndex]?.id;
    if (questionId) {
      navigate(`/quiz/${quizId}/question/${questionId}/edit`);
    } else {
      toast({
        title: "Cannot edit question",
        description: "Please save the quiz first before editing individual questions.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    const newQuestions = questions.filter((_, i) => i !== questionIndex);
    // Update order indices
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order_index: i }));
    setQuestions(reorderedQuestions);
  };

  const handleReorderQuestions = (reorderedQuestions: QuestionFormData[]) => {
    setQuestions(reorderedQuestions);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Quiz not found</h1>
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <QuizBreadcrumb
          quizTitle={quiz.title}
          folderId={quiz.folder_id}
          quizId={quiz.id}
          currentPage="edit"
          className="mb-2 sm:mb-4"
        />

        {/* Mobile Header removed per design simplification */}
        {/* Mobile Segmented Tabs */}
        <div className="sm:hidden">
          <Tabs value={activeMobileTab} onValueChange={(v) => setActiveMobileTab(v as any)}>
            <TabsList className="w-full overflow-x-auto flex-nowrap">
              <TabsTrigger className="flex-1 min-w-[33%]" value="info">Info</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[33%]" value="questions">Questions</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[33%]" value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-3 space-y-4">
              {validationErrors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Validation Errors</span>
                    </div>
                    <ul className="text-xs text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Quiz Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Quiz Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter quiz title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quiz Statistics</Label>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                      <span>{questions.length} questions</span>
                      <span>•</span>
                      <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Modified {new Date(quiz.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter quiz description (optional)"
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="mt-3 space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Questions ({questions.length})</CardTitle>
                    <Button size="sm" onClick={handleAddQuestion} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <QuestionList
                    questions={questions}
                    onAddQuestion={handleAddQuestion}
                    onEditQuestion={handleEditQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onReorderQuestions={handleReorderQuestions}
                    readOnly={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-3 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Open full settings to configure time limits, scoring, shuffling, and more.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowPreview(true)}>
                      <Eye className="h-4 w-4 mr-2" /> Preview
                    </Button>
                    <Button className="flex-1" variant="secondary" onClick={() => setShowSettings(true)}>
                      <Settings className="h-4 w-4 mr-2" /> Open Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors" />
              <Button variant="ghost" onClick={handleBack} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                Edit Quiz
                {hasUnsavedChanges && <Badge variant="secondary" className="ml-2">Unsaved Changes</Badge>}
              </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Modify your quiz content and settings
              </p>
            </div>
          </div>

            <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDuplicate(true)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>

            <Button
              onClick={saveQuiz}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Quiz'}
            </Button>

            <Button
              variant="destructive"
              onClick={deleteQuiz}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-800 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Validation Errors</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Quiz Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Quiz Statistics</Label>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                  <span>{questions.length} questions</span>
                  <span>•</span>
                  <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Modified {new Date(quiz.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quiz description (optional)"
                  className="min-h-[80px] sm:min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Questions Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Questions ({questions.length})</CardTitle>
              <Button 
                onClick={handleAddQuestion}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <QuestionList
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onEditQuestion={handleEditQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onReorderQuestions={handleReorderQuestions}
              readOnly={false}
            />
          </CardContent>
        </Card>
        </div>

        {/* Sticky Mobile Bottom Bar */}
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            {activeMobileTab === 'questions' && (
              <Button onClick={handleAddQuestion} variant="outline" className="flex-1">
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            )}
            <Button onClick={handleBack} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={saveQuiz} disabled={saving || !hasUnsavedChanges} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Modals */}
        {showPreview && (
          <QuizPreviewModal
            quiz={{
              ...quiz,
              title,
              description,
              settings,
              questions: questions.map((q, index) => ({
                id: `temp-${index}`,
                quiz_id: quiz.id,
                question_text: q.question_text,
                question_type: q.question_type,
                question_data: q.question_data as any,
                explanation: q.explanation,
                order_index: q.order_index,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }))
            }}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
          />
        )}

        {showSettings && (
          <QuizSettingsModal
            settings={settings}
            onChange={setSettings}
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showDuplicate && quiz && (
          <QuizDuplicateModal
            quiz={quiz}
            isOpen={showDuplicate}
            onClose={() => setShowDuplicate(false)}
            onDuplicate={duplicateQuiz}
          />
        )}
      </div>
    </div>
  );
};

export default QuizEdit;