import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Eye, RotateCcw, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import QuestionEditor from './QuestionEditor';
import { useDebounce } from '@/hooks/usePerformanceOptimization';
import type { QuestionFormData, QuestionType } from '@/types/quiz';
import { validateQuestionData } from '@/lib/quiz-service';

interface QuestionManagerProps {
  /** Initial questions data */
  initialQuestions?: QuestionFormData[];
  /** Callback when questions change */
  onChange: (questions: QuestionFormData[]) => void;
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
  /** Maximum number of questions allowed */
  maxQuestions?: number;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({
  initialQuestions = [],
  onChange,
  readOnly = false,
  maxQuestions = 50
}) => {
  const [questions, setQuestions] = useState<QuestionFormData[]>(initialQuestions);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const isDirtyRef = useRef(false);
  const onChangeDebounced = useDebounce((qs: QuestionFormData[]) => onChange(qs), 150);

  // Sync from props only before user edits (avoid resets on every keystroke)
  useEffect(() => {
    if (!isDirtyRef.current) {
      setQuestions(initialQuestions);
      setValidationErrors({});
    }
  }, [initialQuestions]);

  // Update parent when questions change
  const updateQuestions = useCallback((newQuestions: QuestionFormData[]) => {
    setQuestions(newQuestions);
    onChangeDebounced(newQuestions);
  }, [onChangeDebounced]);

  // Add a new question
  const addQuestion = (questionType: QuestionType = 'mcq') => {
    isDirtyRef.current = true;
    if (questions.length >= maxQuestions) return;

    let defaultData;
    switch (questionType) {
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

    const newQuestion: QuestionFormData = {
      question_text: '',
      question_type: questionType,
      question_data: defaultData,
      explanation: '',
      order_index: questions.length
    };

    updateQuestions([...questions, newQuestion]);
  };

  // Update a specific question
  const updateQuestion = (index: number, questionData: QuestionFormData) => {
    isDirtyRef.current = true;
    const newQuestions = [...questions];
    newQuestions[index] = { ...questionData, order_index: index };
    updateQuestions(newQuestions);
  };

  // Delete a question
  const deleteQuestion = (index: number) => {
    isDirtyRef.current = true;
    const newQuestions = questions.filter((_, i) => i !== index);
    // Update order indices
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order_index: i }));
    updateQuestions(reorderedQuestions);
    
    // Remove validation errors for deleted question
    const newErrors = { ...validationErrors };
    delete newErrors[index];
    // Shift error indices down
    Object.keys(newErrors).forEach(key => {
      const keyNum = parseInt(key);
      if (keyNum > index) {
        newErrors[keyNum - 1] = newErrors[keyNum];
        delete newErrors[keyNum];
      }
    });
    setValidationErrors(newErrors);
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    isDirtyRef.current = true;
    if (!result.destination || readOnly) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order indices
    const reorderedQuestions = items.map((q, i) => ({ ...q, order_index: i }));
    updateQuestions(reorderedQuestions);
  };

  // Validate all questions
  const validateAllQuestions = () => {
    const errors: Record<number, string[]> = {};
    
    questions.forEach((question, index) => {
      const questionErrors: string[] = [];
      
      if (!question.question_text.trim()) {
        questionErrors.push('Question text is required');
      }
      
      try {
        validateQuestionData(question.question_type, question.question_data);
      } catch (error) {
        if (error instanceof Error) {
          questionErrors.push(error.message);
        }
      }
      
      if (questionErrors.length > 0) {
        errors[index] = questionErrors;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Get question type display name
  const getQuestionTypeDisplay = (type: QuestionType) => {
    switch (type) {
      case 'mcq':
        return 'Multiple Choice';
      case 'fill_blank':
        return 'Fill in the Blank';
      case 'true_false':
        return 'True/False';
      case 'match_following':
        return 'Match the Following';
      default:
        return 'Unknown';
    }
  };

  // Get question type color
  const getQuestionTypeColor = (type: QuestionType) => {
    switch (type) {
      case 'mcq':
        return 'bg-blue-100 text-blue-800';
      case 'fill_blank':
        return 'bg-green-100 text-green-800';
      case 'true_false':
        return 'bg-purple-100 text-purple-800';
      case 'match_following':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Questions ({questions.length}/{maxQuestions})
          </h3>
          <p className="text-sm text-gray-600">
            Add and manage questions for your quiz
          </p>
        </div>
        
        {!readOnly && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={validateAllQuestions}
              className="flex items-center space-x-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Validate All</span>
            </Button>
            
            <Button
              onClick={() => addQuestion()}
              disabled={questions.length >= maxQuestions}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </Button>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      {hasValidationErrors && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Validation Errors Found</span>
            </div>
            <p className="text-sm text-red-700">
              {Object.keys(validationErrors).length} question(s) have validation errors. 
              Please fix them before saving the quiz.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No questions yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start building your quiz by adding your first question
            </p>
            {!readOnly && (
              <div className="flex justify-center space-x-2">
                <Button onClick={() => addQuestion('mcq')} variant="outline">
                  Multiple Choice
                </Button>
                <Button onClick={() => addQuestion('fill_blank')} variant="outline">
                  Fill in the Blank
                </Button>
                <Button onClick={() => addQuestion('true_false')} variant="outline">
                  True/False
                </Button>
                <Button onClick={() => addQuestion('match_following')} variant="outline">
                  Match Following
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {questions.map((question, index) => (
                  <Draggable
                    key={index}
                    draggableId={index.toString()}
                    index={index}
                    isDragDisabled={readOnly}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        } transition-shadow`}
                      >
                        <div className="relative">
                          {/* Question Type Badge */}
                          <div className="absolute -top-2 left-4 z-10">
                            <Badge className={getQuestionTypeColor(question.question_type)}>
                              {getQuestionTypeDisplay(question.question_type)}
                            </Badge>
                          </div>
                          
                          {/* Validation Error Indicator */}
                          {validationErrors[index] && (
                            <div className="absolute -top-2 right-4 z-10">
                              <Badge variant="destructive">
                                {validationErrors[index].length} Error(s)
                              </Badge>
                            </div>
                          )}
                          
                          <QuestionEditor
                            initialData={question}
                            onChange={(data) => updateQuestion(index, data)}
                            onDelete={readOnly ? undefined : () => deleteQuestion(index)}
                            questionIndex={index}
                            isNew={false}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add Question Button (Bottom) */}
      {!readOnly && questions.length > 0 && questions.length < maxQuestions && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <Button
                onClick={() => addQuestion()}
                variant="ghost"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Plus className="h-5 w-5" />
                <span>Add Another Question</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {questions.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  Total Questions: <span className="font-medium">{questions.length}</span>
                </span>
                <span className="text-gray-600">
                  Valid Questions: <span className="font-medium text-green-600">
                    {questions.length - Object.keys(validationErrors).length}
                  </span>
                </span>
                {hasValidationErrors && (
                  <span className="text-gray-600">
                    Errors: <span className="font-medium text-red-600">
                      {Object.keys(validationErrors).length}
                    </span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {Object.entries(
                  questions.reduce((acc, q) => {
                    acc[q.question_type] = (acc[q.question_type] || 0) + 1;
                    return acc;
                  }, {} as Record<QuestionType, number>)
                ).map(([type, count]) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={getQuestionTypeColor(type as QuestionType)}
                  >
                    {getQuestionTypeDisplay(type as QuestionType)}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionManager;