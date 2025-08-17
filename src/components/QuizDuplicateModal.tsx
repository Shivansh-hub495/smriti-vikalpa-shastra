import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, FileQuestion } from 'lucide-react';
import type { Quiz } from '@/types/quiz';

interface QuizDuplicateModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (title: string, description?: string) => Promise<void>;
}

const QuizDuplicateModal: React.FC<QuizDuplicateModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onDuplicate
}) => {
  const [title, setTitle] = useState(`${quiz.title} (Copy)`);
  const [description, setDescription] = useState(quiz.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Quiz title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onDuplicate(title.trim(), description.trim() || undefined);
      onClose();
      // Reset form
      setTitle(`${quiz.title} (Copy)`);
      setDescription(quiz.description || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle(`${quiz.title} (Copy)`);
    setDescription(quiz.description || '');
    setError('');
    onClose();
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

  const questionTypeCounts = (quiz.questions || []).reduce((acc, question) => {
    acc[question.question_type] = (acc[question.question_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Duplicate Quiz</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Quiz Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-pink-100 rounded-full">
                  <FileQuestion className="h-5 w-5 text-pink-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Original Quiz: {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {quiz.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{quiz.questions?.length || 0} questions</span>
                    <span>•</span>
                    <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                  {Object.keys(questionTypeCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(questionTypeCounts).map(([type, count]) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className={`text-xs ${getQuestionTypeColor(type)}`}
                        >
                          {getQuestionTypeDisplay(type)}: {count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Quiz Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-title">New Quiz Title *</Label>
              <Input
                id="duplicate-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter title for the duplicated quiz"
                className={error ? 'border-red-500' : ''}
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duplicate-description">Description</Label>
              <Textarea
                id="duplicate-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description for the duplicated quiz (optional)"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* What will be duplicated */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                What will be duplicated:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All {quiz.questions?.length || 0} questions and their content</li>
                <li>• Question types and answer options</li>
                <li>• Question explanations</li>
                <li>• Quiz settings and configuration</li>
                <li>• Question order</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                Note: Quiz attempts and statistics will not be copied.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isSubmitting ? 'Duplicating...' : 'Duplicate Quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizDuplicateModal;