import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Clock, 
  HelpCircle,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import type { Quiz, Question } from '@/types/quiz';

interface QuizPreviewModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
}

const QuizPreviewModal: React.FC<QuizPreviewModalProps> = ({
  quiz,
  isOpen,
  onClose
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswers(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswers(false);
    }
  };

  const getQuestionTypeDisplay = (type: string) => {
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

  const getQuestionTypeColor = (type: string) => {
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

  const renderQuestionPreview = (question: Question) => {
    switch (question.question_type) {
      case 'mcq':
        const mcqData = question.question_data as any;
        return (
          <div className="space-y-3">
            {mcqData.options.map((option: string, index: number) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  showAnswers && index === mcqData.correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center">
                    {showAnswers && index === mcqData.correctAnswer && (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'fill_blank':
        const fillData = question.question_data as any;
        return (
          <div className="space-y-3">
            <div className="p-3 border rounded-lg bg-gray-50">
              <input
                type="text"
                placeholder="Type your answer here..."
                className="w-full bg-transparent border-none outline-none"
                disabled
              />
            </div>
            {showAnswers && (
              <div className="p-3 border border-green-500 rounded-lg bg-green-50">
                <div className="text-sm font-medium text-green-800 mb-2">
                  Correct Answers:
                </div>
                <div className="flex flex-wrap gap-2">
                  {fillData.correctAnswers.map((answer: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-white">
                      {answer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'true_false':
        const tfData = question.question_data as any;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`p-4 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  showAnswers && tfData.correctAnswer === true
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">True</span>
              </button>
              <button
                className={`p-4 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  showAnswers && tfData.correctAnswer === false
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled
              >
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">False</span>
              </button>
            </div>
          </div>
        );

      case 'match_following':
        const matchData = question.question_data as any;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-3">Left Column</div>
                <div className="space-y-2">
                  {matchData.leftItems.map((item: string, index: number) => (
                    <div key={index} className="p-3 border rounded-lg bg-blue-50">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-3">Right Column</div>
                <div className="space-y-2">
                  {matchData.rightItems.map((item: string, index: number) => (
                    <div key={index} className="p-3 border rounded-lg bg-green-50">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {showAnswers && (
              <div className="p-3 border border-green-500 rounded-lg bg-green-50">
                <div className="text-sm font-medium text-green-800 mb-2">
                  Correct Matches:
                </div>
                <div className="space-y-1">
                  {matchData.correctPairs.map((pair: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span>{matchData.leftItems[pair.left]}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{matchData.rightItems[pair.right]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Unknown question type</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Quiz Preview</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quiz Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{quiz.title}</span>
                <div className="flex items-center space-x-2">
                  {quiz.settings?.timeLimit && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{quiz.settings.timeLimit} min</span>
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardTitle>
              {quiz.description && (
                <p className="text-gray-600">{quiz.description}</p>
              )}
            </CardHeader>
          </Card>

          {questions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Questions Yet
                </h3>
                <p className="text-gray-600">
                  Add some questions to see the quiz preview
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Question Navigation */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-4">
                  <Badge className={getQuestionTypeColor(currentQuestion.question_type)}>
                    {getQuestionTypeDisplay(currentQuestion.question_type)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswers(!showAnswers)}
                  >
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Current Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentQuestion.question_text}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderQuestionPreview(currentQuestion)}
                  
                  {currentQuestion.explanation && showAnswers && (
                    <>
                      <Separator className="my-4" />
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-1">
                          Explanation:
                        </div>
                        <p className="text-sm text-blue-700">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Question Progress */}
              <div className="flex space-x-1 overflow-x-auto -mx-2 px-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setShowAnswers(false);
                    }}
                    className={`h-2 flex-1 min-w-6 rounded ${
                      index === currentQuestionIndex
                        ? 'bg-purple-500'
                        : index < currentQuestionIndex
                        ? 'bg-purple-300'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Quiz Settings Summary */}
          {Object.keys(quiz.settings || {}).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {quiz.settings?.shuffleQuestions && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Shuffle Questions</span>
                    </div>
                  )}
                  {quiz.settings?.allowRetakes && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Allow Retakes</span>
                    </div>
                  )}
                  {quiz.settings?.showResults && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Show Results</span>
                    </div>
                  )}
                  {quiz.settings?.timeLimit && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{quiz.settings.timeLimit} min limit</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizPreviewModal;