import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  alt = "Zoomed image"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black bg-opacity-90 backdrop-blur-sm overflow-auto"
          onClick={onClose}
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Close button - positioned at top right of full screen */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-6 right-6 z-[10000] bg-white bg-opacity-20 text-white hover:bg-white hover:bg-opacity-30 rounded-full p-3 shadow-lg"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image container - centered with limited width and scrollable */}
          <div className="w-full min-h-full flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageUrl}
                alt={alt}
                className="max-w-[85vw] max-h-[85vh] h-auto object-contain rounded-lg shadow-2xl"
                style={{
                  width: 'auto',
                  height: 'auto'
                }}
              />
            </motion.div>
          </div>


        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageZoomModal;
