import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileQuestion, MoreVertical, Play, Edit, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QUIZ_ROUTES, navigateToQuizRoute } from '@/utils/routeUtils';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  folder_id: string;
  user_id: string;
  settings: any;
  created_at: string;
  updated_at: string;
  question_count?: number;
  last_attempt?: {
    score: number;
    completed_at: string;
  };
  attempt_count?: number;
}

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (quizId: string, quizTitle: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onDelete }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="w-full max-w-full min-w-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group overflow-hidden"
      style={{ maxWidth: '100%', minWidth: '0' }}
      role="article"
      aria-label={`Quiz: ${quiz.title}`}
    >
      <CardContent className="p-4 md:p-6 min-w-0">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="p-2 md:p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full group-hover:bg-pink-200 dark:group-hover:bg-pink-800/40 transition-colors flex-shrink-0">
            <FileQuestion className="h-5 w-5 md:h-6 md:w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 flex-shrink-0"
                aria-label={`Quiz actions for ${quiz.title}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigateToQuizRoute(navigate, QUIZ_ROUTES.QUIZ_TAKE(quiz.id))}>
                <Play className="h-4 w-4 mr-2" />
                Take Quiz
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToQuizRoute(navigate, QUIZ_ROUTES.QUIZ_EDIT(quiz.id))}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Quiz
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToQuizRoute(navigate, QUIZ_ROUTES.QUIZ_HISTORY(quiz.id))}>
                <Settings className="h-4 w-4 mr-2" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(quiz.id, quiz.title)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="min-w-0 mb-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors break-words leading-tight">
            {quiz.title}
          </h3>
        </div>

        {quiz.description && (
          <div className="min-w-0 mb-4">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 break-words overflow-hidden">
              {quiz.description}
            </p>
          </div>
        )}

        <div className="min-w-0 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
            <span className="truncate flex-shrink-0">{quiz.question_count || 0} questions</span>
            <span className="text-xs truncate">{new Date(quiz.created_at).toLocaleDateString()}</span>
          </div>
          {quiz.last_attempt && (
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2 mt-1">
              <span className="truncate flex-shrink-0">Best: {quiz.last_attempt.score}%</span>
              <span className="text-xs truncate">{quiz.attempt_count} attempts</span>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <Button
            onClick={() => navigateToQuizRoute(navigate, QUIZ_ROUTES.QUIZ_TAKE(quiz.id))}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm min-w-0"
            data-tour="take-quiz-button"
            aria-label={`Start taking ${quiz.title} quiz`}
          >
            <Play className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Take Quiz</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizCard;