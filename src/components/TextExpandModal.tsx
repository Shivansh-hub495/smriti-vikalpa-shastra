import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextExpandModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  contentHtml?: string;
  title?: string;
}

const TextExpandModal: React.FC<TextExpandModalProps> = ({
  isOpen,
  onClose,
  content,
  contentHtml,
  title = "Full Text"
}) => {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      // Set voice properties
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[80vh] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 font-['Montserrat',sans-serif]">
                {title}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(content);
                  }}
                  disabled={isSpeaking}
                >
                  <Volume2 className={`h-5 w-5 ${isSpeaking ? 'text-blue-600' : 'text-gray-600'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {contentHtml ? (
                <div
                  className="text-lg leading-relaxed text-gray-800 font-['Montserrat',sans-serif] prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              ) : (
                <p className="text-lg leading-relaxed text-gray-800 font-['Montserrat',sans-serif]">
                  {content}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TextExpandModal;
