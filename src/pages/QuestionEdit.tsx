import React, { useState, useEffect, useDeferredValue } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Eye, EyeOff, AlertTriangle, CheckCircle, Keyboard, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizRouteGuard } from '@/hooks/useQuizRouteGuard';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useFolderInfo } from '@/hooks/useFolderInfo';
import { useQuestionCount } from '@/hooks/useQuestionCount';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useFormKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQuestionTypeMemory } from '@/hooks/useQuestionTypeMemory';
import { LoadingPage } from '@/components/LoadingStates';
import QuestionManager from '@/components/QuestionManager';
import QuestionPreview from '@/components/QuestionPreview';
// Removed legacy header in favor of a new hero header
import QuestionBreadcrumb from '@/components/QuestionBreadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader as SheetHdr, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { validateQuestionData } from '@/lib/quiz-service';
import type { QuestionFormData, Question } from '@/types/quiz';

const QuestionEdit: React.FC = () => {
  const { quizId, questionId } = useParams<{ quizId: string; questionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Use route guard to check quiz access and ownership
  const { quiz, isLoading: guardLoading, hasAccess, isOwner } = useQuizRouteGuard({
    requireOwnership: true,
    redirectPath: '/'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalQuestion, setOriginalQuestion] = useState<QuestionFormData | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Enhanced hooks for form efficiency
  const { getTypeDisplayName, getTypeColorClass } = useQuestionTypeMemory();
  
  const {
    errors,
    warnings,
    hasErrors,
    hasWarnings,
    validateField,
    clearFieldErrors,
    clearAllErrors,
    getFieldError,
    hasFieldError
  } = useFormValidation({
    validateOnChange: true,
    validateOnBlur: true,
    debounceDelay: 500
  });

  // Get question count for breadcrumb context
  const { count: questionCount } = useQuestionCount(quizId);
  
  // Get folder info for breadcrumb context
  const { folder } = useFolderInfo(quiz?.folder_id);

  // Handle unsaved changes navigation
  const { navigateToWithConfirmation } = useUnsavedChangesWarning({
    hasUnsavedChanges,
    warningMessage: 'You have unsaved changes. Are you sure you want to leave without saving?',
    enableBrowserWarning: true
  });

  // Initialize question form data
  const [questionData, setQuestionData] = useState<QuestionFormData>({
    question_text: '',
    question_type: 'mcq',
    question_data: {
      options: ['', ''],
      correctAnswer: 0
    },
    explanation: '',
    order_index: 0
  });

  // Auto-save functionality for edits
  const autoSaveKey = `question_edit_${questionId}`;
  const { clearAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: questionData,
    delay: 3000, // 3 seconds
    enabled: hasUnsavedChanges,
    onAutoSave: () => {
      console.log('Question edit auto-saved');
    },
    onAutoSaveError: (error) => {
      console.warn('Auto-save failed:', error);
    }
  });

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (quiz && questionId) {
      loadQuestion();
    }
    // Ignore questionData changes to avoid reloading during typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, questionId]);

  const loadQuestion = async () => {
    if (!quiz || !questionId) return;

    setLoading(true);
    try {
      // Load existing question data from Supabase
      const { data: question, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .eq('quiz_id', quizId!)
        .single();

      if (error) {
        throw error;
      }

      if (!question) {
        throw new Error('Question not found');
      }

      // Convert database question to form data
      const questionFormData: QuestionFormData = {
        question_text: question.question_text,
        question_type: question.question_type as any,
        question_data: question.question_data as any,
        explanation: question.explanation || '',
        order_index: question.order_index
      };
      
      setQuestionData(questionFormData);
      setOriginalQuestion(questionFormData);
    } catch (error) {
      console.error('Error loading question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load question. Please try again.",
        variant: "destructive",
      });
      // Navigate back to quiz edit if question not found
      navigate(`/quiz/${quizId}/edit`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: QuestionFormData) => {
    if (!quiz || !user || !questionId) return;

    // Validate question data
    try {
      validateQuestionData(data.question_type, data.question_data);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Invalid question data",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Update the question in the database
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: data.question_text,
          question_type: data.question_type,
          question_data: data.question_data as any,
          explanation: data.explanation || null,
          order_index: data.order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .eq('quiz_id', quizId!);

      if (error) {
        throw error;
      }
      
      setOriginalQuestion(data);
      setHasUnsavedChanges(false);
      clearAutoSave();
      clearAllErrors();
      
      toast({
        title: "Question updated",
        description: "Question has been updated successfully.",
      });
      
      // Navigate back to quiz edit page
      navigate(`/quiz/${quizId}/edit`);
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigateToWithConfirmation(`/quiz/${quizId}/edit`);
  };

  const handleBackToQuiz = () => {
    navigateToWithConfirmation(`/quiz/${quizId}/edit`);
  };

  // Check for unsaved changes
  useEffect(() => {
    if (originalQuestion && questionData) {
      const hasChanges = JSON.stringify(originalQuestion) !== JSON.stringify(questionData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [originalQuestion, questionData]);

  // Real-time validation (watch only specific fields to avoid extra renders)
  useEffect(() => {
    if (questionData.question_text.trim().length > 0) {
      validateField('question_text', questionData.question_text, questionData);
    }
  }, [questionData.question_text, validateField]);

  useEffect(() => {
    if (questionData.explanation.trim().length > 0) {
      validateField('explanation', questionData.explanation, questionData);
    }
  }, [questionData.explanation, validateField]);

  // Enhanced keyboard shortcuts
  const canSave = !saving && questionData.question_text.trim().length > 0 && !hasErrors && hasUnsavedChanges;

  // Live preview should update instantly
  const deferredQuestionData = questionData;
  useFormKeyboardShortcuts({
    onSave: () => canSave && handleSave(questionData),
    onCancel: handleCancel,
    canSave,
    canReset: false, // No reset in edit mode
    enabled: true
  });

  // Note: Browser warning is handled by useUnsavedChangesWarning hook

  if (guardLoading || loading) {
    return <LoadingPage message={loading ? "Loading question..." : "Loading quiz information..."} />;
  }

  if (!hasAccess || !isOwner) {
    return null; // Route guard will handle redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Breadcrumb Navigation (hide on mobile) */}
        {quiz && (
          <div className="hidden sm:block">
            <QuestionBreadcrumb
              quiz={quiz}
              mode="edit"
              totalQuestions={questionCount}
              folderTitle={folder?.name}
              className="mb-4"
            />
          </div>
        )}

        {/* Headers: compact on mobile, gradient on desktop */}
        {quiz && (
          <>
            {/* Mobile top bar */}
            <div className="sm:hidden sticky top-0 z-30 -mx-2 px-2 py-2 bg-white/95 dark:bg-gray-900/90 backdrop-blur border-b">
              <div className="max-w-7xl mx-auto flex items-center justify-between h-11">
                <Button variant="ghost" size="sm" onClick={handleBackToQuiz}
                  className="text-gray-700 dark:text-gray-200">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div className="text-sm font-semibold">Edit Question</div>
                <Button variant="ghost" size="sm" onClick={() => setMobilePreviewOpen(true)} aria-label="Preview">
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Desktop gradient header */}
            <div className="hidden sm:block sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-rose-500/90 text-white backdrop-blur shadow-sm">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={handleBackToQuiz} className="bg-white/15 hover:bg-white/25">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <span className="text-xl font-semibold">Edit Question</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {getTypeDisplayName(questionData.question_type)}
                  </Badge>
                  {hasUnsavedChanges && (
                    <Badge variant="secondary" className="bg-yellow-400/20 border-yellow-300/40 text-yellow-100">Unsaved</Badge>
                  )}
                </div>
                <Button onClick={() => handleSave(questionData)} disabled={saving || !canSave} className="bg-white text-purple-700 hover:bg-white/90">
                  <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-7xl mx-auto">Press Ctrl+S to save. Created {new Date(quiz.created_at).toLocaleDateString()} • Modified {new Date(quiz.updated_at).toLocaleDateString()}</p>
            </div>
          </>
        )}

        {/* Mobile segmented layout */}
        <div className="sm:hidden">
          <Tabs value={activeMobileTab} onValueChange={(v) => setActiveMobileTab(v as any)}>
            <TabsList className="w-full overflow-x-auto flex-nowrap">
              <TabsTrigger className="flex-1 min-w-[50%]" value="edit">Edit</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[50%]" value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-3">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-semibold">Question Details</CardTitle>
                      {hasUnsavedChanges && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Modified
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showShortcutsHelp && (
                    <Alert>
                      <Keyboard className="h-4 w-4" />
                      <AlertDescription>
                        <div className="text-sm space-y-1">
                          <div><strong>Ctrl+S:</strong> Save changes</div>
                          <div><strong>Escape:</strong> Cancel editing</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {(hasErrors || hasWarnings) && (
                    <div className="space-y-2">
                      {hasErrors && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please fix the validation errors before saving.
                          </AlertDescription>
                        </Alert>
                      )}
                      {hasWarnings && !hasErrors && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            There are some warnings about your question content.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {!hasErrors && !hasWarnings && hasUnsavedChanges && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Changes are ready to save!
                      </AlertDescription>
                    </Alert>
                  )}

                  <QuestionManager
                    initialQuestions={[questionData]}
                    onChange={(questions) => {
                      const newData = questions[0] || questionData;
                      setQuestionData(newData);
                      if (newData.question_text !== questionData.question_text) {
                        clearFieldErrors('question_text');
                      }
                      if (newData.explanation !== questionData.explanation) {
                        clearFieldErrors('explanation');
                      }
                    }}
                    maxQuestions={1}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="mt-3">
              <div>
                <QuestionPreview
                  questionData={questionData}
                  visible={true}
                  onToggleVisibility={() => setShowPreview(!showPreview)}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Preview Bottom Sheet */}
        <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-0">
            <SheetHdr className="px-4 py-3">
              <SheetTitle>Live Preview</SheetTitle>
            </SheetHdr>
            <div className="p-4">
              <QuestionPreview
                questionData={questionData}
                visible={true}
                onToggleVisibility={() => setMobilePreviewOpen(false)}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl"
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop content */}
        <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* Question Form (desktop) */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl transition-all duration-200 hover:shadow-2xl">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <CardTitle className="text-base sm:text-lg font-semibold">Question Details</CardTitle>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Modified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                    className="flex items-center gap-2"
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                  {/* Preview toggle kept minimal for edit desktop */}
                  <div className="hidden sm:block" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showShortcutsHelp && (
                <Alert>
                  <Keyboard className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm space-y-1">
                      <div><strong>Ctrl+S:</strong> Save changes</div>
                      <div><strong>Escape:</strong> Cancel editing</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {(hasErrors || hasWarnings) && (
                <div className="space-y-2">
                  {hasErrors && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please fix the validation errors before saving.
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasWarnings && !hasErrors && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        There are some warnings about your question content.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {!hasErrors && !hasWarnings && hasUnsavedChanges && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Changes are ready to save!
                  </AlertDescription>
                </Alert>
              )}

              <QuestionManager
                initialQuestions={[questionData]}
                onChange={(questions) => {
                  const newData = questions[0] || questionData;
                  setQuestionData(newData);
                  if (newData.question_text !== questionData.question_text) {
                    clearFieldErrors('question_text');
                  }
                  if (newData.explanation !== questionData.explanation) {
                    clearFieldErrors('explanation');
                  }
                }}
                maxQuestions={1}
              />
              
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  aria-label="Cancel editing and return to quiz"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={() => handleSave(questionData)}
                  disabled={saving || !canSave}
                  className={`focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                    canSave 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`}
                  title={!canSave ? (hasErrors ? 'Fix validation errors to save' : 'No changes to save') : 'Save Changes (Ctrl+S)'}
                  aria-label={saving ? 'Saving changes...' : hasUnsavedChanges ? 'Save question changes' : 'No changes to save'}
                  aria-busy={saving}
                >
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
                  </span>
                  <span className="sm:hidden">
                    {saving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'No Changes'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview (desktop) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <QuestionPreview
              questionData={questionData}
              visible={showPreview}
              onToggleVisibility={() => setShowPreview(!showPreview)}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl"
            />
          </div>
        </div>
        {/* Sticky bottom action bar on mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t p-3 flex items-center justify-between z-40">
          <Button variant="outline" onClick={handleCancel} disabled={saving} className="h-10">Cancel</Button>
          <Button onClick={() => handleSave(questionData)} disabled={saving || !canSave} className="h-10">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEdit;