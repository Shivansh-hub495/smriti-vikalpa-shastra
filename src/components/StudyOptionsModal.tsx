import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Shuffle, Hash, X } from "lucide-react";

interface StudyOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStudy: (options: StudyOptions) => void;
  deckName: string;
  totalCards: number;
}

export interface StudyOptions {
  mode: 'normal' | 'shuffle' | 'startFrom';
  startFromCard?: number;
}

const StudyOptionsModal: React.FC<StudyOptionsModalProps> = ({
  isOpen,
  onClose,
  onStartStudy,
  deckName,
  totalCards
}) => {
  const [selectedMode, setSelectedMode] = useState<'normal' | 'shuffle' | 'startFrom'>('normal');
  const [startFromCard, setStartFromCard] = useState<number | string>(1);

  const handleStartStudy = () => {
    let finalStartFromCard = undefined;

    if (selectedMode === 'startFrom') {
      const cardNumber = typeof startFromCard === 'string' ? parseInt(startFromCard) : startFromCard;
      // If empty or invalid, default to 1
      finalStartFromCard = isNaN(cardNumber) || cardNumber < 1 || cardNumber > totalCards ? 1 : cardNumber;
    }

    const options: StudyOptions = {
      mode: selectedMode,
      startFromCard: finalStartFromCard
    };
    onStartStudy(options);
  };

  const handleStartFromCardChange = (value: string) => {
    // Allow empty string so user can clear and type new number
    if (value === '') {
      setStartFromCard(''); // Keep empty instead of resetting to 1
      return;
    }

    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= totalCards) {
      setStartFromCard(num);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 mx-4 w-full max-w-md"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Start Study Session</h2>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-semibold">{deckName}</span>
              <br />
              <span className="text-sm">{totalCards} cards available</span>
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* Normal Mode */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'normal'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => setSelectedMode('normal')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMode === 'normal' ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'
                }`}>
                  <Play className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Normal</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Study cards in order</p>
                </div>
              </div>
            </motion.div>

            {/* Shuffle Mode */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'shuffle'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => setSelectedMode('shuffle')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMode === 'shuffle' ? 'bg-purple-500' : 'bg-gray-400 dark:bg-gray-600'
                }`}>
                  <Shuffle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Shuffle</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Study cards in random order</p>
                </div>
              </div>
            </motion.div>

            {/* Start From Mode */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'startFrom'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => setSelectedMode('startFrom')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMode === 'startFrom' ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
                }`}>
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Start From</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Begin from a specific card</p>
                  {selectedMode === 'startFrom' && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="startCard" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Card #:
                      </Label>
                      <Input
                        id="startCard"
                        type="number"
                        min="1"
                        max={totalCards}
                        value={startFromCard}
                        placeholder="1"
                        onChange={(e) => handleStartFromCardChange(e.target.value)}
                        className="w-20 h-8 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.target.select()}
                      />
                      <span className="text-sm text-gray-500">of {totalCards}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartStudy}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Study
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudyOptionsModal;
