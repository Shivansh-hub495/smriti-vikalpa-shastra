import React, { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileQuestion, Settings, Clock, RotateCcw, Trophy, Eye, HelpCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateQuizData } from '@/lib/quiz-service';
import { getErrorHandler, ValidationQuizError } from '@/lib/error-handling';
import { quizCreationSchema } from '@/lib/quiz-validation';
import { withRetry, retryConfigs } from '@/lib/network-retry';
import { LoadingOverlay, InlineLoading } from '@/components/ui/loading-states';
import { ErrorBoundary, InlineErrorFallback } from '@/components/ui/error-boundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { QuizSettings } from '@/types/quiz';


// Using enhanced validation schema from quiz-validation.ts

type QuizCreationFormData = z.infer<typeof quizCreationSchema>;

interface QuizCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuizCreationFormData) => Promise<void>;
  folderId: string;
  loading?: boolean;
}

const QuizCreationModal: React.FC<QuizCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  folderId,
  loading = false
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationQuizError[]>([]);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const errorHandler = getErrorHandler();
  const [activeTab, setActiveTab] = useState<'info' | 'types' | 'settings'>('info');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues
  } = useForm<QuizCreationFormData>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      title: '',
      description: '',
      settings: {
        questionTypes: ['mcq'],
        timeLimit: undefined,
        shuffleQuestions: false,
        showResults: true,
        allowRetakes: true,
        maxRetakes: undefined,
        showCorrectAnswers: true,
        showExplanations: true,
        passingScore: undefined
      }
    }
  });

  // Watch form values for conditional rendering
  const allowRetakes = watch('settings.allowRetakes');
  const hasTimeLimit = watch('settings.timeLimit') !== undefined;
  const hasPassingScore = watch('settings.passingScore') !== undefined;

  const handleFormSubmit = async (data: QuizCreationFormData) => {
    setIsSubmitting(true);
    setNetworkError(null);
    setValidationErrors([]);
    
    try {
      // Enhanced validation using our service
      const validation = validateQuizData(data);
      if (!validation.isValid) {
        const errors = validation.errors.map(err => 
          new ValidationQuizError(err, 'QUIZ_VALIDATION')
        );
        setValidationErrors(errors);
        
        errorHandler.handleError(
          new ValidationQuizError(
            'Quiz validation failed',
            'VALIDATION_ERROR',
            undefined,
            undefined,
            validation.errors
          ),
          { showToast: true }
        );
        return;
      }

      // Clean up settings - remove undefined values
      type QuizCreationSettings = QuizSettings & {
        questionTypes?: ('mcq' | 'fill_blank' | 'true_false' | 'match_following')[]
      };
      const cleanSettings: QuizCreationSettings = {};
      if (data.settings.questionTypes !== undefined) cleanSettings.questionTypes = data.settings.questionTypes;
      if (data.settings.timeLimit !== undefined) cleanSettings.timeLimit = data.settings.timeLimit;
      if (data.settings.shuffleQuestions !== undefined) cleanSettings.shuffleQuestions = data.settings.shuffleQuestions;
      if (data.settings.showResults !== undefined) cleanSettings.showResults = data.settings.showResults;
      if (data.settings.allowRetakes !== undefined) cleanSettings.allowRetakes = data.settings.allowRetakes;
      if (data.settings.maxRetakes !== undefined) cleanSettings.maxRetakes = data.settings.maxRetakes;
      if (data.settings.showCorrectAnswers !== undefined) cleanSettings.showCorrectAnswers = data.settings.showCorrectAnswers;
      if (data.settings.showExplanations !== undefined) cleanSettings.showExplanations = data.settings.showExplanations;
      if (data.settings.passingScore !== undefined) cleanSettings.passingScore = data.settings.passingScore;

      const submitData = {
        ...data,
        settings: cleanSettings
      };

      // Use retry mechanism for network operations
      const submitWithRetry = withRetry(onSubmit, {
        ...retryConfigs.quizData,
        onRetry: (error, attempt) => {
          setNetworkError(`Retrying... (attempt ${attempt})`);
        },
        onMaxRetriesReached: (error) => {
          setNetworkError('Failed to create quiz after multiple attempts');
        }
      });

      await submitWithRetry(submitData);
      
      // Reset form and close modal on success
      reset();
      setShowAdvancedSettings(false);
      setValidationErrors([]);
      setNetworkError(null);
      onClose();
      
      toast({
        title: "Success! 🎉",
        description: `Quiz "${data.title}" created successfully`,
      });
    } catch (error) {
      errorHandler.handleError(error as Error, {
        customMessage: 'Failed to create quiz',
        showToast: true
      });
      
      if (error instanceof Error && error.message.includes('network')) {
        setNetworkError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setShowAdvancedSettings(false);
      setValidationErrors([]);
      setNetworkError(null);
      onClose();
    }
  };

  const toggleTimeLimit = () => {
    const currentValue = getValues('settings.timeLimit');
    setValue('settings.timeLimit', currentValue === undefined ? 30 : undefined);
  };

  const togglePassingScore = () => {
    const currentValue = getValues('settings.passingScore');
    setValue('settings.passingScore', currentValue === undefined ? 70 : undefined);
  };

  return (
    <ErrorBoundary fallback={InlineErrorFallback} context="Quiz Creation Modal">
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <LoadingOverlay isLoading={isSubmitting} text="Creating quiz...">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <FileQuestion className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                Create New Quiz
              </DialogTitle>
            </DialogHeader>

            {/* Error Display */}
            {(validationErrors.length > 0 || networkError) && (
              <div className="space-y-2">
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Validation Errors
                    </div>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {networkError && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      {networkError}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="w-full overflow-x-auto flex-nowrap">
                  <TabsTrigger className="flex-1 min-w-[33%]" value="info">Info</TabsTrigger>
                  <TabsTrigger className="flex-1 min-w-[33%]" value="types">Types</TabsTrigger>
                  <TabsTrigger className="flex-1 min-w-[33%]" value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-3">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">Quiz Title *</Label>
                      <Input id="title" {...register('title')} placeholder="Enter quiz title..." className="w-full" disabled={isSubmitting || loading} />
                      {errors.title && (<p className="text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>)}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                      <Textarea id="description" {...register('description')} placeholder="Enter quiz description (optional)..." rows={3} className="w-full resize-none" disabled={isSubmitting || loading} />
                      {errors.description && (<p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>)}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="types" className="mt-3">
                  <div className="space-y-4" data-tour="question-types">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><FileQuestion className="h-4 w-4" />Question Types</h3>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Select the types of questions you want to include in this quiz:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { value: 'mcq', label: 'Multiple Choice', description: 'Questions with multiple options' },
                          { value: 'fill_blank', label: 'Fill in the Blank', description: 'Questions with text input answers' },
                          { value: 'true_false', label: 'True/False', description: 'Questions with true or false answers' },
                          { value: 'match_following', label: 'Match the Following', description: 'Questions with matching pairs' }
                        ].map((questionType) => (
                          <div key={questionType.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={questionType.value}
                              checked={watch('settings.questionTypes')?.includes(questionType.value as any)}
                              onCheckedChange={(checked) => {
                                const currentTypes = getValues('settings.questionTypes') || [];
                                if (checked) {
                                  setValue('settings.questionTypes', [...currentTypes, questionType.value as any]);
                                } else {
                                  setValue('settings.questionTypes', currentTypes.filter(type => type !== questionType.value));
                                }
                              }}
                              disabled={isSubmitting || loading}
                            />
                            <div className="space-y-1">
                              <Label htmlFor={questionType.value} className="text-sm font-medium cursor-pointer">{questionType.label}</Label>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{questionType.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {errors.settings?.questionTypes && (<p className="text-sm text-red-600 dark:text-red-400">{errors.settings.questionTypes.message}</p>)}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-3">
                  <div className="space-y-4" data-tour="quiz-settings">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Settings className="h-4 w-4" />Quiz Settings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Shuffle Questions</Label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Randomize question order for each attempt</p>
                        </div>
                        <Switch checked={watch('settings.shuffleQuestions')} onCheckedChange={(checked) => setValue('settings.shuffleQuestions', checked)} disabled={isSubmitting || loading} />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-1"><Eye className="h-3 w-3" />Show Results</Label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Display results immediately after completion</p>
                        </div>
                        <Switch checked={watch('settings.showResults')} onCheckedChange={(checked) => setValue('settings.showResults', checked)} disabled={isSubmitting || loading} />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-1"><RotateCcw className="h-3 w-3" />Allow Retakes</Label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Let users retake the quiz</p>
                        </div>
                        <Switch checked={watch('settings.allowRetakes')} onCheckedChange={(checked) => setValue('settings.allowRetakes', checked)} disabled={isSubmitting || loading} />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-1"><Clock className="h-3 w-3" />Time Limit</Label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Set a time limit for the quiz</p>
                        </div>
                        <Switch checked={hasTimeLimit} onCheckedChange={toggleTimeLimit} disabled={isSubmitting || loading} />
                      </div>
                    </div>
                    {hasTimeLimit && (
                      <div className="space-y-2">
                        <Label htmlFor="timeLimit" className="text-sm font-medium">Time Limit (minutes)</Label>
                        <Input id="timeLimit" type="number" {...register('settings.timeLimit', { valueAsNumber: true })} placeholder="30" min="1" max="480" className="w-full sm:w-48" disabled={isSubmitting || loading} />
                        {errors.settings?.timeLimit && (<p className="text-sm text-red-600 dark:text-red-400">{errors.settings.timeLimit.message}</p>)}
                      </div>
                    )}
                    {allowRetakes && (
                      <div className="space-y-2">
                        <Label htmlFor="maxRetakes" className="text-sm font-medium">Maximum Retakes (optional)</Label>
                        <Input id="maxRetakes" type="number" {...register('settings.maxRetakes', { valueAsNumber: true })} placeholder="Unlimited" min="1" max="10" className="w-full sm:w-48" disabled={isSubmitting || loading} />
                        {errors.settings?.maxRetakes && (<p className="text-sm text-red-600 dark:text-red-400">{errors.settings.maxRetakes.message}</p>)}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} disabled={isSubmitting || loading} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        <Settings className="h-4 w-4 mr-1" />{showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
                      </Button>
                    </div>
                    {showAdvancedSettings && (
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Advanced Settings</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium">Show Correct Answers</Label>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Display correct answers in results</p>
                            </div>
                            <Switch checked={watch('settings.showCorrectAnswers')} onCheckedChange={(checked) => setValue('settings.showCorrectAnswers', checked)} disabled={isSubmitting || loading} />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium flex items-center gap-1"><HelpCircle className="h-3 w-3" />Show Explanations</Label>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Display explanations in results</p>
                            </div>
                            <Switch checked={watch('settings.showExplanations')} onCheckedChange={(checked) => setValue('settings.showExplanations', checked)} disabled={isSubmitting || loading} />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium flex items-center gap-1"><Trophy className="h-3 w-3" />Passing Score</Label>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Set a minimum score to pass</p>
                            </div>
                            <Switch checked={hasPassingScore} onCheckedChange={togglePassingScore} disabled={isSubmitting || loading} />
                          </div>
                        </div>
                        {hasPassingScore && (
                          <div className="space-y-2">
                            <Label htmlFor="passingScore" className="text-sm font-medium">Passing Score (%)</Label>
                            <Input id="passingScore" type="number" {...register('settings.passingScore', { valueAsNumber: true })} placeholder="70" min="0" max="100" className="w-full sm:w-48" disabled={isSubmitting || loading} />
                            {errors.settings?.passingScore && (<p className="text-sm text-red-600 dark:text-red-400">{errors.settings.passingScore.message}</p>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Desktop actions */}
              <div className="hidden sm:flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || loading}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || loading} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                  {isSubmitting || loading ? (<InlineLoading text="Creating..." />) : ('Create Quiz')}
                </Button>
              </div>

              {/* Sticky Mobile Bottom Bar */}
              <div className="sm:hidden sticky bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || loading} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSubmitting || loading} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                  {isSubmitting || loading ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </LoadingOverlay>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default QuizCreationModal;