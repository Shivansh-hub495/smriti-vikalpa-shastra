import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Edit, Trash2, GripVertical, AlertCircle, Plus } from 'lucide-react';
import type { QuestionFormData } from '@/types/quiz';

interface QuestionListProps {
  questions: QuestionFormData[];
  onAddQuestion: () => void;
  onEditQuestion: (questionIndex: number) => void;
  onDeleteQuestion: (questionIndex: number) => void;
  onReorderQuestions: (questions: QuestionFormData[]) => void;
  readOnly?: boolean;
}

interface QuestionListItemProps {
  question: QuestionFormData;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

const QuestionListItem: React.FC<QuestionListItemProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  readOnly = false
}) => {
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'fill_blank':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'true_false':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'match_following':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Drag Handle */}
            {!readOnly && (
              <div className="mt-1 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 sm:mb-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Question {index + 1}
                </Badge>
                <Badge variant="secondary" className={`text-xs ${getQuestionTypeColor(question.question_type)}`}>
                  {getQuestionTypeDisplay(question.question_type)}
                </Badge>
              </div>
              
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                {question.question_text ? truncateText(question.question_text) : 'Untitled Question'}
              </p>
              
              {question.explanation && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Explanation:</span> {truncateText(question.explanation, 80)}
                </p>
              )}
              
              {/* Question Data Preview */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {question.question_type === 'mcq' && question.question_data?.options && (
                  <span>{question.question_data.options.length} options</span>
                )}
                {question.question_type === 'fill_blank' && question.question_data?.correctAnswers && (
                  <span>{question.question_data.correctAnswers.length} correct answer(s)</span>
                )}
                {question.question_type === 'true_false' && (
                  <span>Correct: {question.question_data?.correctAnswer ? 'True' : 'False'}</span>
                )}
                {question.question_type === 'match_following' && question.question_data?.leftItems && (
                  <span>{question.question_data.leftItems.length} pairs to match</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {!readOnly && (
            <div className="flex items-center gap-2 sm:ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyQuestionState: React.FC<{ onAddQuestion: () => void }> = ({ onAddQuestion }) => (
  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertCircle className="h-8 w-8 opacity-50" />
    </div>
    <h3 className="text-lg font-medium mb-2">No questions yet</h3>
    <p className="text-sm mb-6 max-w-md mx-auto">
      Start building your quiz by adding your first question. You can create multiple choice, 
      fill-in-the-blank, true/false, or matching questions.
    </p>
    <Button 
      onClick={onAddQuestion}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add First Question
    </Button>
  </div>
);

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onReorderQuestions,
  readOnly = false
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || readOnly) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order indices
    const reorderedQuestions = items.map((q, i) => ({ ...q, order_index: i }));
    onReorderQuestions(reorderedQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    const question = questions[index];
    const questionText = question.question_text || 'Untitled Question';
    
    if (confirm(`Are you sure you want to delete "${questionText}"? This action cannot be undone.`)) {
      onDeleteQuestion(index);
    }
  };

  if (questions.length === 0) {
    return <EmptyQuestionState onAddQuestion={onAddQuestion} />;
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-3 transition-colors ${
                snapshot.isDraggingOver ? 'bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2' : ''
              }`}
            >
              {questions.map((question, index) => (
                <Draggable
                  key={`question-${index}`}
                  draggableId={`question-${index}`}
                  index={index}
                  isDragDisabled={readOnly}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`transition-all ${
                        snapshot.isDragging 
                          ? 'shadow-lg rotate-2 scale-105' 
                          : 'hover:shadow-sm'
                      }`}
                    >
                      <QuestionListItem
                        question={question}
                        index={index}
                        onEdit={() => onEditQuestion(index)}
                        onDelete={() => handleDeleteQuestion(index)}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* Add Question Button at Bottom */}
      {!readOnly && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-purple-400 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <Button
                onClick={onAddQuestion}
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
              >
                <Plus className="h-4 w-4" />
                Add Another Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Floating Add Button */}
      {!readOnly && (
        <div className="sm:hidden fixed bottom-20 right-4 z-30">
          <Button onClick={onAddQuestion} className="rounded-full h-12 w-12 p-0 shadow-lg">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionList;