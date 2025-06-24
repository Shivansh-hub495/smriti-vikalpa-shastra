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
  const [startFromCard, setStartFromCard] = useState<number>(1);

  const handleStartStudy = () => {
    const options: StudyOptions = {
      mode: selectedMode,
      startFromCard: selectedMode === 'startFrom' ? startFromCard : undefined
    };
    onStartStudy(options);
  };

  const handleStartFromCardChange = (value: string) => {
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
          className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mx-4 w-full max-w-md"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Study Session</h2>
            <p className="text-gray-600">
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
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMode('normal')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMode === 'normal' ? 'bg-blue-500' : 'bg-gray-400'
                }`}>
                  <Play className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Normal</h3>
                  <p className="text-sm text-gray-600">Study cards in order</p>
                </div>
              </div>
            </motion.div>

            {/* Shuffle Mode */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'shuffle'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMode('shuffle')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMode === 'shuffle' ? 'bg-purple-500' : 'bg-gray-400'
                }`}>
                  <Shuffle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Shuffle</h3>
                  <p className="text-sm text-gray-600">Study cards in random order</p>
                </div>
              </div>
            </motion.div>

            {/* Start From Mode */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'startFrom'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMode('startFrom')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMode === 'startFrom' ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Start From</h3>
                  <p className="text-sm text-gray-600 mb-2">Begin from a specific card</p>
                  {selectedMode === 'startFrom' && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="startCard" className="text-sm font-medium">
                        Card #:
                      </Label>
                      <Input
                        id="startCard"
                        type="number"
                        min="1"
                        max={totalCards}
                        value={startFromCard}
                        onChange={(e) => handleStartFromCardChange(e.target.value)}
                        className="w-20 h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
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
