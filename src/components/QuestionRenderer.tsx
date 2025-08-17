/**
 * @fileoverview QuestionRenderer component for displaying different question types
 * @description Renders questions based on type with appropriate input controls
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, Check, X, HelpCircle, Lightbulb } from 'lucide-react';
import type { Question, QuestionAnswer, AnswerData } from '@/types/quiz';

interface QuestionRendererProps {
  /** The question to render */
  question: Question;
  /** Current answer for this question */
  answer?: QuestionAnswer;
  /** Callback when answer changes */
  onAnswerChange: (answer: AnswerData) => void;
  /** Whether the question is disabled (quiz completed) */
  disabled?: boolean;
  /** Callback to show explanation */
  onShowExplanation?: (show: boolean) => void;
}

/**
 * QuestionRenderer component for displaying different question types
 */
const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onAnswerChange,
  disabled = false
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const renderQuestion = () => {
    switch (question.question_type) {
      case 'mcq':
        return <MCQRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} onShowExplanation={setShowExplanation} />;
      case 'fill_blank':
        return <FillBlankRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} onShowExplanation={setShowExplanation} />;
      case 'true_false':
        return <TrueFalseRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} onShowExplanation={setShowExplanation} />;
      case 'match_following':
        return <MatchFollowingRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} />;
      default:
        return <div className="text-center text-muted-foreground">Unsupported question type</div>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Enhanced Question Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-line break-words">
              {question.question_text}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0"
              >
                {question.question_type.replace('_', ' ').toUpperCase()}
              </Badge>
              {question.points && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                >
                  {question.points} {question.points === 1 ? 'point' : 'points'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

      {/* Enhanced Question Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-6"
      >
        {renderQuestion()}
      </motion.div>

      {/* Enhanced Explanation */}
      <AnimatePresence>
        {question.explanation && answer && showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">
                    Explanation
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line break-words">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * MCQ Question Renderer
 */
const MCQRenderer: React.FC<QuestionRendererProps> = ({ question, answer, onAnswerChange, disabled, onShowExplanation }) => {
  const mcqData = question.question_data as any;
  
  // Safety check for question data
  if (!mcqData || !mcqData.options || !Array.isArray(mcqData.options)) {
    return <div className="text-center text-red-500">Invalid MCQ question data</div>;
  }
  const [selectedOption, setSelectedOption] = useState<number | null>(
    answer?.answer.type === 'mcq' ? answer.answer.selectedOption : null
  );
  const [showResult, setShowResult] = useState(false);

  const handleOptionSelect = (optionIndex: number) => {
    if (disabled || showResult) return;
    setSelectedOption(optionIndex);
    setShowResult(true);
    onShowExplanation?.(true); // Show explanation immediately for MCQ
    onAnswerChange({
      type: 'mcq',
      selectedOption: optionIndex
    });
  };

  const isCorrect = (optionIndex: number) => {
    return optionIndex === mcqData.correctAnswer;
  };

  const getOptionStyle = (optionIndex: number) => {
    if (!showResult) {
      return selectedOption === optionIndex
        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-500 shadow-lg transform scale-[1.02]'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600';
    }

    if (selectedOption === optionIndex) {
      return isCorrect(optionIndex)
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-500 shadow-lg'
        : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-500 shadow-lg';
    }

    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60';
  };

  const getOptionIconStyle = (optionIndex: number) => {
    if (!showResult) {
      return selectedOption === optionIndex
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }

    if (selectedOption === optionIndex) {
      return isCorrect(optionIndex)
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white';
    }

    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {mcqData.options.map((option: string, index: number) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="group"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              onClick={() => handleOptionSelect(index)}
              className={`flex-1 cursor-pointer p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 group-hover:shadow-md ${getOptionStyle(index)} ${
                disabled || showResult ? 'cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-bold mr-3 sm:mr-4 flex-shrink-0 ${getOptionIconStyle(index)}`}>
                  {showResult && selectedOption === index ? (
                    isCorrect(index) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>
                <span className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                  {option}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Fill in the Blank Question Renderer
 */
const FillBlankRenderer: React.FC<QuestionRendererProps> = ({ question, answer, onAnswerChange, disabled, onShowExplanation }) => {
  const fillData = question.question_data as any;
  
  // Safety check for question data
  if (!fillData || !fillData.correctAnswers || !Array.isArray(fillData.correctAnswers)) {
    return <div className="text-center text-red-500">Invalid Fill-in-the-blank question data</div>;
  }
  const [userAnswer, setUserAnswer] = useState(
    answer?.answer.type === 'fill_blank' ? answer.answer.answer : ''
  );
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswerChange = (value: string) => {
    if (disabled) return;
    setUserAnswer(value);
    setShowResult(false); // Reset result when answer changes
    onShowExplanation?.(false); // Hide explanation when answer changes
    onAnswerChange({
      type: 'fill_blank',
      answer: value
    });
  };

  const handleCheck = () => {
    if (!userAnswer.trim()) return;
    
    const userText = fillData.caseSensitive 
      ? userAnswer.trim()
      : userAnswer.toLowerCase().trim();
    
    const correct = fillData.correctAnswers.some((correctAnswer: string) => 
      fillData.caseSensitive 
        ? correctAnswer.trim() === userAnswer.trim()
        : correctAnswer.toLowerCase().trim() === userText
    );
    
    setIsCorrect(correct);
    setShowResult(true);
    onShowExplanation?.(true); // Show explanation only after checking
  };

  const getInputStyle = () => {
    if (!showResult) {
      return "text-lg h-14 px-6 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200";
    }
    
    return isCorrect
      ? "text-lg h-14 px-6 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200"
      : "text-lg h-14 px-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800 transition-all duration-200";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <Label 
          htmlFor="fill-blank-input" 
          className="text-base font-medium text-gray-700 dark:text-gray-300"
        >
          Your Answer:
        </Label>
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Input
              id="fill-blank-input"
              value={userAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              disabled={disabled}
              className={`${getInputStyle()} text-base sm:text-lg h-12 sm:h-14 px-4 sm:px-6`}
            />
          </div>
          <Button
            onClick={handleCheck}
            disabled={disabled || !userAnswer.trim() || showResult}
            variant="outline"
            size="lg"
            className="h-12 sm:h-14 px-4 sm:px-6 rounded-xl"
          >
            Check
          </Button>
        </div>
        
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge 
              variant="secondary" 
              className={`text-sm px-4 py-2 ${
                isCorrect 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </Badge>
          </motion.div>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        {!fillData.caseSensitive && (
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0">
            Case insensitive
          </Badge>
        )}
        {fillData.acceptMultiple && (
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
            Multiple answers accepted
          </Badge>
        )}
      </div>
    </motion.div>
  );
};

/**
 * True/False Question Renderer
 */
const TrueFalseRenderer: React.FC<QuestionRendererProps> = ({ question, answer, onAnswerChange, disabled, onShowExplanation }) => {
  const tfData = question.question_data as any;
  
  // Safety check for question data
  if (!tfData || typeof tfData.correctAnswer !== 'boolean') {
    return <div className="text-center text-red-500">Invalid True/False question data</div>;
  }
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(
    answer?.answer.type === 'true_false' ? answer.answer.answer : null
  );
  const [showResult, setShowResult] = useState(false);

  const handleAnswerSelect = (value: boolean) => {
    if (disabled || showResult) return;
    setSelectedAnswer(value);
    setShowResult(true);
    onShowExplanation?.(true); // Show explanation immediately for True/False
    onAnswerChange({
      type: 'true_false',
      answer: value
    });
  };

  const isCorrect = (value: boolean) => {
    return value === tfData.correctAnswer;
  };

  const getButtonStyle = (value: boolean) => {
    if (!showResult) {
      if (selectedAnswer === value) {
        return value
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg border-0'
          : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg border-0';
      }
      return value
        ? 'border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
        : 'border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20';
    }

    if (selectedAnswer === value) {
      return isCorrect(value)
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg border-0'
        : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg border-0';
    }

    return 'border-2 border-gray-200 dark:border-gray-700 opacity-60';
  };

  const getIconStyle = (value: boolean) => {
    if (!showResult) {
      return selectedAnswer === value 
        ? 'bg-white/20' 
        : value 
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-red-100 dark:bg-red-900/30';
    }

    if (selectedAnswer === value) {
      return 'bg-white/20';
    }

    return value 
      ? 'bg-green-100 dark:bg-green-900/30'
      : 'bg-red-100 dark:bg-red-900/30';
  };

  const getIconColor = (value: boolean) => {
    if (!showResult) {
      return selectedAnswer === value 
        ? 'text-white' 
        : value 
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400';
    }

    if (selectedAnswer === value) {
      return 'text-white';
    }

    return value 
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          whileHover={{ scale: disabled || showResult ? 1 : 1.02 }}
          whileTap={{ scale: disabled || showResult ? 1 : 0.98 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleAnswerSelect(true)}
            disabled={disabled || showResult}
            className={`w-full h-16 sm:h-20 text-lg sm:text-xl font-semibold rounded-xl transition-all duration-200 ${getButtonStyle(true)}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${getIconStyle(true)}`}>
                {showResult && selectedAnswer === true ? (
                  isCorrect(true) ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <X className="h-6 w-6 text-white" />
                  )
                ) : (
                  <Check className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor(true)}`} />
                )}
              </div>
              <span>True</span>
            </div>
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: disabled || showResult ? 1 : 1.02 }}
          whileTap={{ scale: disabled || showResult ? 1 : 0.98 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleAnswerSelect(false)}
            disabled={disabled || showResult}
            className={`w-full h-16 sm:h-20 text-lg sm:text-xl font-semibold rounded-xl transition-all duration-200 ${getButtonStyle(false)}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${getIconStyle(false)}`}>
                {showResult && selectedAnswer === false ? (
                  isCorrect(false) ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <X className="h-6 w-6 text-white" />
                  )
                ) : (
                  <X className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor(false)}`} />
                )}
              </div>
              <span>False</span>
            </div>
          </Button>
        </motion.div>
      </div>
      
      {showResult && selectedAnswer !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Badge 
            variant="secondary" 
            className={`text-sm px-4 py-2 ${
              isCorrect(selectedAnswer) 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {isCorrect(selectedAnswer) ? 'Correct!' : 'Incorrect'}
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Match the Following Question Renderer
 */
const MatchFollowingRenderer: React.FC<QuestionRendererProps> = ({ question, answer, onAnswerChange, disabled }) => {
  const matchData = question.question_data as any;
  
  // Safety check for question data
  if (!matchData || !matchData.leftItems || !matchData.rightItems || 
      !Array.isArray(matchData.leftItems) || !Array.isArray(matchData.rightItems)) {
    return <div className="text-center text-red-500">Invalid Match Following question data</div>;
  }
  const [rightItems, setRightItems] = useState(() => {
    // Initialize with shuffled right items if shuffle is enabled
    const items = [...matchData.rightItems];
    if (matchData.shuffleItems) {
      return items.sort(() => Math.random() - 0.5);
    }
    return items;
  });
  
  const [matches, setMatches] = useState<Array<{ left: number; right: number }>>(() => {
    if (answer?.answer.type === 'match_following') {
      return answer.answer.pairs;
    }
    return [];
  });

  const handleDragEnd = (result: DropResult) => {
    if (disabled || !result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === 'right-items' && destination.droppableId.startsWith('left-')) {
      const leftIndex = parseInt(destination.droppableId.split('-')[1]);
      const rightIndex = parseInt(result.draggableId.split('-')[1]);
      
      // Remove any existing match for this left item
      const newMatches = matches.filter(match => match.left !== leftIndex);
      
      // Add new match
      newMatches.push({ left: leftIndex, right: rightIndex });
      
      setMatches(newMatches);
      onAnswerChange({
        type: 'match_following',
        pairs: newMatches
      });
    }
  };

  const removeMatch = (leftIndex: number) => {
    if (disabled) return;
    const newMatches = matches.filter(match => match.left !== leftIndex);
    setMatches(newMatches);
    onAnswerChange({
      type: 'match_following',
      pairs: newMatches
    });
  };

  const getMatchedRightItem = (leftIndex: number) => {
    const match = matches.find(m => m.left === leftIndex);
    return match ? rightItems[match.right] : null;
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Drag items from the right column to match with items on the left.
      </p>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {/* Left column */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Match these items:</h4>
            {matchData.leftItems.map((item: string, index: number) => (
              <Droppable key={index} droppableId={`left-${index}`}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/10 border-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item}</span>
                        {getMatchedRightItem(index) && (
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getMatchedRightItem(index)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMatch(index)}
                              disabled={disabled}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            ))}
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Drag from here:</h4>
            <Droppable droppableId="right-items">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {rightItems.map((item: string, index: number) => {
                    const isUsed = matches.some(match => match.right === index);
                    return (
                      <Draggable
                        key={`right-${index}`}
                        draggableId={`right-${index}`}
                        index={index}
                        isDragDisabled={disabled || isUsed}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`transition-colors cursor-move ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            } ${isUsed ? 'opacity-50' : ''}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-2">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className={isUsed ? 'line-through' : ''}>{item}</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
      
      <div className="text-sm text-muted-foreground">
        Matched: {matches.length} of {matchData.leftItems.length}
      </div>
    </div>
  );
};

export default QuestionRenderer;