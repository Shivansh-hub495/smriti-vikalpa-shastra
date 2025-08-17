import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import type { QuestionFormData, QuestionType } from '@/types/quiz';

interface QuestionPreviewProps {
  /** Question data to preview */
  questionData: QuestionFormData;
  /** Whether the preview is visible */
  visible: boolean;
  /** Callback to toggle preview visibility */
  onToggleVisibility?: () => void;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

const QuestionPreviewComponent: React.FC<QuestionPreviewProps> = ({
  questionData,
  visible,
  onToggleVisibility,
  compact = false,
  className = ''
}) => {
  if (!visible) {
    return (
      <Card className={`border-dashed border-2 border-gray-300 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EyeOff className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Preview Hidden
          </h3>
          <p className="text-gray-600 mb-4">
            Click to see how your question will appear to quiz takers
          </p>
          {onToggleVisibility && (
            <Button onClick={onToggleVisibility} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Show Preview
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

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

  const renderQuestionPreview = () => {
    if (!questionData.question_text.trim()) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Enter question text to see preview</p>
        </div>
      );
    }

    switch (questionData.question_type) {
      case 'mcq':
        return renderMCQPreview();
      case 'fill_blank':
        return renderFillBlankPreview();
      case 'true_false':
        return renderTrueFalsePreview();
      case 'match_following':
        return renderMatchFollowingPreview();
      default:
        return <div className="text-gray-500">Unsupported question type</div>;
    }
  };

  const renderMCQPreview = () => {
    const data = questionData.question_data as any;
    const options = data.options || [];
    const correctAnswer = data.correctAnswer || 0;

    return (
      <div className="space-y-4">
        <div className="text-base sm:text-lg font-medium text-gray-900 whitespace-pre-line break-words">
          {questionData.question_text}
        </div>
        
        <div className="space-y-2">
          {options.map((option: string, index: number) => (
            <div
              key={index}
              className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                option.trim() 
                  ? 'hover:bg-gray-50 border-gray-200' 
                  : 'border-dashed border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  {index === correctAnswer && option.trim() && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm sm:text-base break-words flex-1 ${option.trim() ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                  {option.trim() || `Option ${index + 1} (empty)`}
                </span>
                {index === correctAnswer && option.trim() && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFillBlankPreview = () => {
    const data = questionData.question_data as any;
    const correctAnswers = data.correctAnswers || [];
    const caseSensitive = data.caseSensitive || false;

    return (
      <div className="space-y-4">
        <div className="text-base sm:text-lg font-medium text-gray-900 whitespace-pre-line break-words">
          {questionData.question_text}
        </div>
        
        <div className="space-y-3">
          <div className="p-2 sm:p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <input
              type="text"
              placeholder="Type your answer here..."
              className="w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
              disabled
            />
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="font-medium">Correct answers:</span>
            </div>
            <div className="ml-6 space-y-1">
              {correctAnswers.length > 0 ? (
                correctAnswers.map((answer: string, index: number) => (
                  <div key={index} className="text-green-700 break-words">
                    • {answer || '(empty answer)'}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic">No correct answers defined</div>
              )}
            </div>
            {caseSensitive && (
              <div className="mt-2 text-xs text-orange-600">
                ⚠️ Case sensitive matching
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTrueFalsePreview = () => {
    const data = questionData.question_data as any;
    const correctAnswer = data.correctAnswer;

    return (
      <div className="space-y-4">
        <div className="text-base sm:text-lg font-medium text-gray-900 whitespace-pre-line break-words">
          {questionData.question_text}
        </div>
        
        <div className="space-y-2">
          <div
            className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
              correctAnswer === true 
                ? 'border-green-200 bg-green-50' 
                : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                {correctAnswer === true && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <span className="text-sm sm:text-base text-gray-900 flex-1">True</span>
              {correctAnswer === true && (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
            </div>
          </div>
          
          <div
            className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
              correctAnswer === false 
                ? 'border-green-200 bg-green-50' 
                : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                {correctAnswer === false && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <span className="text-sm sm:text-base text-gray-900 flex-1">False</span>
              {correctAnswer === false && (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMatchFollowingPreview = () => {
    const data = questionData.question_data as any;
    const leftItems = data.leftItems || [];
    const rightItems = data.rightItems || [];
    const correctPairs = data.correctPairs || [];

    return (
      <div className="space-y-4">
        <div className="text-lg font-medium text-gray-900 whitespace-pre-line break-words">
          {questionData.question_text}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 mb-3 text-sm sm:text-base">Match these items:</h4>
            {leftItems.map((item: string, index: number) => (
              <div
                key={index}
                className="p-2 sm:p-3 border rounded-lg bg-blue-50 border-blue-200"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className={`text-sm sm:text-base ${item.trim() ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {item.trim() || `Item ${index + 1} (empty)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Right Column */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 mb-3 text-sm sm:text-base">With these options:</h4>
            {rightItems.map((item: string, index: number) => (
              <div
                key={index}
                className="p-2 sm:p-3 border rounded-lg bg-green-50 border-green-200"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={`text-sm sm:text-base ${item.trim() ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {item.trim() || `Option ${String.fromCharCode(65 + index)} (empty)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Correct Pairs */}
        {correctPairs.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium text-gray-700 text-sm sm:text-base">Correct matches:</span>
            </div>
            <div className="space-y-1 ml-6">
              {correctPairs.map((pair: any, index: number) => {
                const leftItem = leftItems[pair.left] || `Item ${pair.left + 1}`;
                const rightItem = rightItems[pair.right] || `Option ${String.fromCharCode(65 + pair.right)}`;
                return (
                  <div key={index} className="text-xs sm:text-sm text-green-700 break-words">
                    {pair.left + 1} → {String.fromCharCode(65 + pair.right)}: {leftItem} ↔ {rightItem}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`transition-all duration-300 ease-out hover:shadow-xl motion-reduce:transition-none ${className}`}>
      <CardHeader className="pb-3 transition-all duration-300">
        <div className="flex items-center justify-between opacity-0 translate-y-2 animate-[fade-in_0.25s_ease-out_forwards]">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <CardTitle className="text-base sm:text-lg font-semibold">
              <span className="hidden sm:inline">Live Preview</span>
              <span className="sm:hidden">Preview</span>
            </CardTitle>
            <Badge className={getQuestionTypeColor(questionData.question_type)}>
              <span className="hidden sm:inline">{getQuestionTypeDisplay(questionData.question_type)}</span>
              <span className="sm:hidden">{questionData.question_type.toUpperCase()}</span>
            </Badge>
          </div>
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              aria-label="Hide question preview"
            >
              <EyeOff className="h-4 w-4" />
              <span className="sr-only">Hide preview</span>
            </Button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-600">
          <span className="hidden sm:inline">This is how your question will appear to quiz takers</span>
          <span className="sm:hidden">Quiz taker view</span>
        </p>
      </CardHeader>
      
      <CardContent className={`${compact ? 'p-4' : 'p-6'} opacity-0 translate-y-2 animate-[slide-up_0.25s_ease-out_forwards]`}>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          {renderQuestionPreview()}
          
          {/* Explanation Preview */}
          {questionData.explanation && questionData.explanation.trim() && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-2 mb-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">i</span>
                </div>
                <span className="font-medium text-gray-700 text-sm sm:text-base">Explanation:</span>
              </div>
              <div className="ml-7 text-gray-600 text-xs sm:text-sm break-words">
                {questionData.explanation}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(QuestionPreviewComponent);