import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, GripVertical, Check, X, AlertTriangle, CheckCircle } from 'lucide-react';
import type { QuestionType, QuestionData, QuestionFormData } from '@/types/quiz';
import { validateQuestionData } from '@/lib/quiz-service';
import { validateQuestion } from '@/lib/quiz-validation';
import { getErrorHandler, ValidationQuizError } from '@/lib/error-handling';
import { ErrorBoundary, InlineErrorFallback } from '@/components/ui/error-boundary';
import { LoadingOverlay } from '@/components/ui/loading-states';
import MCQEditor from './MCQEditor';
import FillBlankEditor from './FillBlankEditor';
import TrueFalseEditor from './TrueFalseEditor';
import MatchFollowingEditor from './MatchFollowingEditor';

interface QuestionEditorProps {
  /** Initial question data for editing (undefined for new question) */
  initialData?: QuestionFormData;
  /** Callback when question data changes */
  onChange: (data: QuestionFormData) => void;
  /** Callback when question is deleted */
  onDelete?: () => void;
  /** Whether this is a new question being created */
  isNew?: boolean;
  /** Question index for display */
  questionIndex: number;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  initialData,
  onChange,
  onDelete,
  isNew = false,
  questionIndex
}) => {
  const [questionData, setQuestionData] = useState<QuestionFormData>(
    initialData || {
      question_text: '',
      question_type: 'mcq',
      question_data: { options: ['', ''], correctAnswer: 0 },
      explanation: '',
      order_index: questionIndex
    }
  );

  const [validationErrors, setValidationErrors] = useState<ValidationQuizError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationQuizError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const errorHandler = getErrorHandler();


  // Update parent when data changes (debounced to avoid flicker)
  useEffect(() => {
    const id = setTimeout(() => onChange(questionData), 150);
    return () => clearTimeout(id);
  }, [questionData, onChange]);

  // Enhanced validation with comprehensive error handling
  const performValidation = async () => {
    setIsValidating(true);
    
    try {
      const errors = validateQuestion(questionData);
      const validationErrors = errors.filter(err => err.severity !== 'low');
      const warnings = errors.filter(err => err.severity === 'low');
      
      setValidationErrors(validationErrors);
      setValidationWarnings(warnings);
      setIsValid(validationErrors.length === 0);
      
      return validationErrors.length === 0;
    } catch (error) {
      errorHandler.handleError(error as Error, {
        customMessage: 'Error during question validation'
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuestionTextChange = (text: string) => {
    setQuestionData(prev => ({ ...prev, question_text: text }));
    // Clear validation errors when user starts typing
    if (validationErrors.some(err => err.field === 'question_text')) {
      setValidationErrors(prev => prev.filter(err => err.field !== 'question_text'));
    }
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    let defaultData: QuestionData;
    
    switch (type) {
      case 'mcq':
        defaultData = { options: ['', ''], correctAnswer: 0 };
        break;
      case 'fill_blank':
        defaultData = { correctAnswers: [''], caseSensitive: false };
        break;
      case 'true_false':
        defaultData = { correctAnswer: true };
        break;
      case 'match_following':
        defaultData = { 
          leftItems: [''], 
          rightItems: [''], 
          correctPairs: [{ left: 0, right: 0 }] 
        };
        break;
      default:
        defaultData = { options: ['', ''], correctAnswer: 0 };
    }

    setQuestionData(prev => ({
      ...prev,
      question_type: type,
      question_data: defaultData
    }));
    
    // Clear validation errors when question type changes
    setValidationErrors([]);
    setValidationWarnings([]);
    setIsValid(false);
  };

  const handleExplanationChange = (explanation: string) => {
    setQuestionData(prev => ({ ...prev, explanation }));
  };

  const renderQuestionTypeEditor = () => {
    switch (questionData.question_type) {
      case 'mcq':
        return <MCQEditor data={questionData.question_data as any} onChange={(data) =>
          setQuestionData(prev => ({ ...prev, question_data: data }))
        } />;
      case 'fill_blank':
        return <FillBlankEditor data={questionData.question_data as any} onChange={(data) =>
          setQuestionData(prev => ({ ...prev, question_data: data }))
        } />;
      case 'true_false':
        return <TrueFalseEditor data={questionData.question_data as any} onChange={(data) =>
          setQuestionData(prev => ({ ...prev, question_data: data }))
        } />;
      case 'match_following':
        return <MatchFollowingEditor data={questionData.question_data as any} onChange={(data) =>
          setQuestionData(prev => ({ ...prev, question_data: data }))
        } />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      {/* Compact: hide header on small screens to reduce clutter */}
      <CardHeader className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold">
          Question {questionIndex + 1}
          {isNew && <Badge variant="secondary" className="ml-2">New</Badge>}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="cursor-grab">
            <GripVertical className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Question Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="question-type">Question Type</Label>
          <Select
            value={questionData.question_type}
            onValueChange={handleQuestionTypeChange}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">Multiple Choice</SelectItem>
              <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
              <SelectItem value="true_false">True/False</SelectItem>
              <SelectItem value="match_following">Match the Following</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="question-text">Question Text *</Label>
          <Textarea
            id="question-text"
            placeholder="Enter your question here..."
            value={questionData.question_text}
            onChange={(e) => handleQuestionTextChange(e.target.value)}
            className="min-h-[80px] sm:min-h-[100px]"
          />
        </div>

        {/* Question Type Specific Editor */}
        {renderQuestionTypeEditor()}

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor="explanation">Explanation (Optional)</Label>
          <Textarea
            id="explanation"
            placeholder="Provide an explanation for the correct answer..."
            value={questionData.explanation || ''}
            onChange={(e) => handleExplanationChange(e.target.value)}
            className="min-h-[60px] sm:min-h-[80px]"
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <X className="h-4 w-4" />
              Validation Errors
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validate Button */}
        <Button
          onClick={performValidation}
          variant="outline"
          className="w-full"
        >
          <Check className="h-4 w-4 mr-2" />
          Validate Question
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuestionEditor;