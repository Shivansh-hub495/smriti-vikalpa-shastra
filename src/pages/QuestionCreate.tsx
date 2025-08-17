import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Plus, Eye, EyeOff, AlertTriangle, RefreshCw, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizRouteGuard } from '@/hooks/useQuizRouteGuard';
import { useFolderInfo } from '@/hooks/useFolderInfo';
import { useQuestionCount } from '@/hooks/useQuestionCount';
import { useQuestionTypeMemory } from '@/hooks/useQuestionTypeMemory';
import { LoadingPage } from '@/components/LoadingStates';
import QuestionEditor from '@/components/QuestionEditor';
import QuestionPreview from '@/components/QuestionPreview';
// Replace legacy header with a new hero header
import QuestionBreadcrumb from '@/components/QuestionBreadcrumb';
// Removed segmented tabs in favor of a single-column editor
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { validateQuestionData } from '@/lib/quiz-service';
import type { QuestionFormData, QuestionType } from '@/types/quiz';

const QuestionCreate: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Use route guard to check quiz access and ownership
  const { quiz, isLoading: guardLoading, hasAccess, isOwner } = useQuizRouteGuard({
    requireOwnership: true,
    redirectPath: '/'
  });

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [saveError, setSaveError] = useState<Error | null>(null);
  
  // Ref for auto-focus functionality
  const questionManagerRef = useRef<HTMLDivElement>(null);

  // Simplified hooks for form efficiency
  const { 
    lastUsedType, 
    updateLastUsedType, 
    getDefaultQuestionData,
    getTypeDisplayName,
    getTypeColorClass 
  } = useQuestionTypeMemory();

  // Get question count for breadcrumb context
  const { count: questionCount, refreshCount } = useQuestionCount(quizId);
  
  // Get folder info for breadcrumb context
  const { folder } = useFolderInfo(quiz?.folder_id);

  // Initialize blank question form data
  const [questionData, setQuestionData] = useState<QuestionFormData>({
    question_text: '',
    question_type: lastUsedType,
    question_data: getDefaultQuestionData(lastUsedType),
    explanation: '',
    order_index: 0
  });
  
  // Key to force component recreation on reset
  const [componentKey, setComponentKey] = useState(0);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update question type when lastUsedType changes
  useEffect(() => {
    setQuestionData(prev => ({
      ...prev,
      question_type: lastUsedType,
      question_data: getDefaultQuestionData(lastUsedType)
    }));
  }, [lastUsedType, getDefaultQuestionData]);

  // Define functions
  const handleBackToQuiz = () => {
    navigate(`/quiz/${quizId}/edit`);
  };

  const resetForm = () => {
    const newQuestionData = {
      question_text: '',
      question_type: lastUsedType,
      question_data: getDefaultQuestionData(lastUsedType),
      explanation: '',
      order_index: 0
    };

    setQuestionData(newQuestionData);
    setSaveError(null);

    // Force component recreation to ensure complete reset
    setComponentKey(prev => prev + 1);

    // Smooth scroll to top so the next entry starts at the beginning
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_) {
      window.scrollTo(0, 0);
    }

    // Auto-focus on question text field after reset
    setTimeout(() => {
      const questionTextInput = document.querySelector('textarea[placeholder*="question"]') as HTMLTextAreaElement;
      if (questionTextInput) {
        questionTextInput.focus();
      }
    }, 150);
  };

  // Basic validation - only check required fields
  const isFormValid = () => {
    if (!questionData.question_text.trim()) {
      return false;
    }

    // Basic question type specific validation
    switch (questionData.question_type) {
      case 'mcq':
        const mcqData = questionData.question_data as any;
        const options = mcqData?.options || [];
        const correctAnswer = mcqData?.correctAnswer;
        return options.length >= 2 &&
               options.every((opt: string) => opt.trim().length > 0) &&
               correctAnswer !== undefined && correctAnswer !== null;
      
      case 'fill_blank':
        const fillData = questionData.question_data as any;
        const answers = fillData?.correctAnswers || [];
        return answers.length > 0 && answers.some((answer: string) => answer.trim().length > 0);
      
      case 'true_false':
        const tfData = questionData.question_data as any;
        return tfData?.correctAnswer !== undefined &&
               tfData?.correctAnswer !== null;
      
      case 'match_following':
        const matchData = questionData.question_data as any;
        const leftItems = matchData?.leftItems || [];
        const rightItems = matchData?.rightItems || [];
        return leftItems.length >= 2 && rightItems.length >= 2 &&
               leftItems.every((item: string) => item.trim().length > 0) &&
               rightItems.every((item: string) => item.trim().length > 0);
      
      default:
        return true;
    }
  };

  const handleSave = async (data: QuestionFormData) => {
    if (!quiz || !user) return;

    // Clear previous errors
    setSaveError(null);

    // Basic validation
    if (!isFormValid()) {
      setSaveError(new Error('Please fill in all required fields correctly.'));
      return;
    }

    setSaving(true);
    
    try {
      // Validate question data using existing validation
      try {
        validateQuestionData(data.question_type, data.question_data);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Invalid question data");
      }

      // Save the question to database
      const { error } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizId!,
          question_text: data.question_text,
          question_type: data.question_type,
          question_data: data.question_data as any,
          explanation: data.explanation || null,
          order_index: questionCount
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Success - update state and UI
      updateLastUsedType(data.question_type);
      refreshCount();
      
      toast({
        title: "Question saved",
        description: "Question has been added to the quiz successfully.",
      });

      // Reset form for "Save & Add Another" functionality
      resetForm();
      
      // Return true to indicate success
      return true;
      
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Unknown save error');
      setSaveError(saveError);
      
      toast({
        title: "Error saving question",
        description: saveError.message,
        variant: "destructive",
      });
      
      // Return false to indicate failure
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndAddAnother = async (data: QuestionFormData) => {
    const success = await handleSave(data);
    // Form reset is already handled inside handleSave if successful
  };

  const handleSaveAndReturn = async (data: QuestionFormData) => {
    const success = await handleSave(data);
    if (success) {
      navigate(`/quiz/${quizId}/edit`);
    }
  };

  // Check if form can be saved
  const canSave = !saving && isFormValid();
  // Live preview updates instantly with current data (no deferral)
  const deferredQuestionData = questionData;

  if (guardLoading) {
    return <LoadingPage message="Loading quiz information..." />;
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
              mode="create"
              questionNumber={questionCount + 1}
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
                  Back
                </Button>
                <div className="text-sm font-semibold">Create Question</div>
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
                    Back
                  </Button>
                  <span className="text-xl font-semibold">Create Question</span>
                  <Badge className={getTypeColorClass(questionData.question_type)}>
                    {getTypeDisplayName(questionData.question_type)}
                  </Badge>
                </div>
                <Button onClick={() => handleSaveAndReturn(questionData)} disabled={!canSave || saving} className="bg-white text-purple-700 hover:bg-white/90">
                  <Save className="h-4 w-4 mr-2" /> Save
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Mobile editor (single-column) */}
        <div className="sm:hidden mt-3">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold">Question Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{saveError.message}</AlertDescription>
                </Alert>
              )}

              <QuestionEditor
                key={componentKey}
                initialData={questionData}
                questionIndex={0}
                isNew
                onChange={(newData) => {
                  setQuestionData(prev => (prev === newData ? prev : newData));
                  if (saveError) setSaveError(null);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Mobile Preview Bottom Sheet */}
        <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-0">
            <div className="px-4 py-3 font-medium">Live Preview</div>
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
          {/* Question Form */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl transition-all duration-200 hover:shadow-2xl">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <CardTitle className="text-base sm:text-lg font-semibold">Question Details</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                {/* Preview toggle removed for cleaner UI; preview always visible on desktop */}
                <div className="hidden sm:block" />
              </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{saveError.message}</AlertDescription>
                </Alert>
              )}

              <QuestionEditor
                key={componentKey}
                initialData={questionData}
                questionIndex={0}
                isNew
                onChange={(newData) => {
                  setQuestionData(prev => (prev === newData ? prev : newData));
                  if (saveError) setSaveError(null);
                }}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleBackToQuiz}
                  disabled={saving}
                  className="focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  aria-label="Cancel and return to quiz"
                >
                  Cancel
                </Button>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleSaveAndAddAnother(questionData)}
                    disabled={!canSave}
                    className={`focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                      canSave 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                        : 'bg-gray-400'
                    }`}
                    title={!canSave ? 'Please fill in all required fields' : 'Save & Add Another'}
                    aria-label={saving ? 'Saving question...' : 'Save question and add another'}
                    aria-busy={saving}
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {saving ? 'Saving...' : 'Save & Add Another'}
                    </span>
                    <span className="sm:hidden">
                      {saving ? 'Saving...' : 'Save & Add'}
                    </span>
                  </Button>
                  
                  <Button
                    onClick={() => handleSaveAndReturn(questionData)}
                    disabled={!canSave}
                    variant="outline"
                    className="focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    title={!canSave ? 'Please fill in all required fields' : 'Save & Return'}
                    aria-label={saving ? 'Saving question...' : 'Save question and return to quiz'}
                    aria-busy={saving}
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {saving ? 'Saving...' : 'Save & Return'}
                    </span>
                    <span className="sm:hidden">
                      {saving ? 'Saving...' : 'Save'}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
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
          <Button variant="outline" onClick={handleBackToQuiz} disabled={saving} className="h-10">Cancel</Button>
          <div className="flex items-center gap-2">
            <Button onClick={() => handleSaveAndAddAnother(questionData)} disabled={!canSave || saving} className="h-10">Save & Add</Button>
            <Button onClick={() => handleSaveAndReturn(questionData)} disabled={!canSave || saving} variant="outline" className="h-10">Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCreate;