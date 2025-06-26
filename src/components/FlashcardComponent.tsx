import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Star, StarOff, Expand, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageZoomModal from './ImageZoomModal';
import TextExpandModal from './TextExpandModal';
import { useLongPress } from '@/hooks/useLongPress';

interface FlashcardProps {
  id: string;
  frontContent: string;
  backContent: string;
  frontContentHtml?: string;
  backContentHtml?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  isFlipped: boolean;
  onFlip: () => void;
  onStar?: (id: string, isStarred: boolean) => void;
  onEdit?: (id: string) => void;
  isStarred?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onModalStateChange?: (isModalOpen: boolean) => void;
}

const FlashcardComponent: React.FC<FlashcardProps> = ({
  id,
  frontContent,
  backContent,
  frontContentHtml,
  backContentHtml,
  frontImageUrl,
  backImageUrl,
  isFlipped,
  onFlip,
  onStar,
  onEdit,
  isStarred = false,
  className = '',
  style = {},
  onModalStateChange
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageZoomModal, setImageZoomModal] = useState<{ isOpen: boolean; imageUrl: string; alt: string }>({
    isOpen: false,
    imageUrl: '',
    alt: ''
  });
  const [textExpandModal, setTextExpandModal] = useState<{ isOpen: boolean; content: string; contentHtml?: string; title: string }>({
    isOpen: false,
    content: '',
    contentHtml: '',
    title: ''
  });

  // Helper function to check if text needs truncation based on image presence
  const needsTruncation = (text: string, html?: string, hasImage: boolean = false, isBack: boolean = false) => {
    const content = html || text;

    if (hasImage) {
      // Show view more when image is present - more generous text allowance
      return content.length > 200 || (content.match(/\n/g) || []).length > 3;
    } else {
      // Much more generous when no image - use maximum card space
      const charThreshold = isBack ? 600 : 700;  // Increased significantly
      const lineThreshold = isBack ? 8 : 10;     // More lines allowed

      const charCount = content.length;
      const lineCount = (content.match(/\n/g) || []).length;

      return charCount > charThreshold || lineCount > lineThreshold;
    }
  };

  // Helper function to truncate text for display only when needed
  const getTruncatedText = (text: string, html?: string, isBack: boolean = false, hasImage: boolean = false) => {
    const needsTrunc = needsTruncation(text, html, hasImage, isBack);

    if (!needsTrunc) {
      return { text, html, isTruncated: false };
    }

    // Adjust max length based on image presence
    let maxLength: number;
    if (hasImage) {
      maxLength = isBack ? 180 : 200;  // Much more generous when image present
    } else {
      maxLength = isBack ? 500 : 600;  // Much longer when no image - use full space
    }

    const content = html || text;

    if (html) {
      // For HTML content, truncate and add ellipsis
      const truncated = content.substring(0, maxLength) + '...';
      return { text: text.substring(0, maxLength) + '...', html: truncated, isTruncated: true };
    } else {
      // For plain text
      return { text: text.substring(0, maxLength) + '...', html: undefined, isTruncated: true };
    }
  };

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

  const handleStarToggle = () => {
    if (onStar) {
      onStar(id, !isStarred);
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(id);
    }
  };

  // Long press handlers for images
  const frontImageLongPress = useLongPress({
    onLongPress: () => {
      if (frontImageUrl) {
        setImageZoomModal({
          isOpen: true,
          imageUrl: frontImageUrl,
          alt: 'Flashcard front image'
        });
        onModalStateChange?.(true);
      }
    }
  });

  const backImageLongPress = useLongPress({
    onLongPress: () => {
      if (backImageUrl) {
        setImageZoomModal({
          isOpen: true,
          imageUrl: backImageUrl,
          alt: 'Flashcard back image'
        });
        onModalStateChange?.(true);
      }
    }
  });

  // Text expand handlers
  const handleExpandFrontText = () => {
    setTextExpandModal({
      isOpen: true,
      content: frontContent,
      contentHtml: frontContentHtml,
      title: 'Front Content'
    });
    onModalStateChange?.(true);
  };

  const handleExpandBackText = () => {
    setTextExpandModal({
      isOpen: true,
      content: backContent,
      contentHtml: backContentHtml,
      title: 'Back Content'
    });
    onModalStateChange?.(true);
  };

  return (
    <div 
      className={`relative w-full h-full perspective-1000 ${className}`}
      style={style}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ 
          duration: 0.6, 
          ease: "easeInOut",
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        onClick={onFlip}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl shadow-2xl border border-gray-100"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
          <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative">
            {/* Top Controls */}
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(frontContent);
                }}
                disabled={isSpeaking}
              >
                <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isSpeaking ? 'text-blue-600' : 'text-gray-600'}`} />
              </Button>

              <div className="flex space-x-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick();
                    }}
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </Button>
                )}

                {onStar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarToggle();
                    }}
                  >
                    {isStarred ? (
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Front Image */}
            {frontImageUrl && (
              <div className="flex-shrink-0 mb-3 sm:mb-4 relative">
                {(() => {
                  const hasLongText = needsTruncation(frontContent, frontContentHtml, true, false);
                  const imageHeight = hasLongText
                    ? "max-h-24 sm:max-h-28 md:max-h-32" // Smaller when text is long
                    : "max-h-32 sm:max-h-40 md:max-h-48"; // Normal size

                  return (
                    <img
                      {...frontImageLongPress}
                      src={frontImageUrl}
                      alt="Flashcard front"
                      className={`w-full ${imageHeight} object-contain rounded-xl cursor-pointer hover:opacity-90 transition-opacity`}
                    />
                  );
                })()}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                  Long press to zoom
                </div>
              </div>
            )}

            {/* Front Content */}
            <div className="flex-1 flex flex-col justify-between relative px-2 sm:px-4 min-h-0">
              <div className="text-center w-full flex-1 flex flex-col justify-center">
                {(() => {
                  const truncated = getTruncatedText(frontContent, frontContentHtml, false, !!frontImageUrl);
                  return (
                    <>
                      <div className="flex-1 flex items-center justify-center">
                        {truncated.html ? (
                          <div
                            className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 leading-relaxed font-['Montserrat',sans-serif] prose prose-sm sm:prose-base md:prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: truncated.html }}
                          />
                        ) : (
                          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 leading-relaxed font-['Montserrat',sans-serif] break-words">
                            {truncated.text}
                          </p>
                        )}
                      </div>

                      {/* View More button - always visible at bottom */}
                      {truncated.isTruncated && (
                        <div className="flex-shrink-0 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 touch-manipulation text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpandFrontText();
                            }}
                          >
                            <Expand className="h-3 w-3 mr-1" />
                            <span>View More</span>
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Tap Instruction */}
            <div className="flex-shrink-0 text-center mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Tap the card to flip
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back Side */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-2xl border border-blue-100"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative">
            {/* Top Controls */}
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(backContent);
                }}
                disabled={isSpeaking}
              >
                <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isSpeaking ? 'text-blue-600' : 'text-blue-700'}`} />
              </Button>

              <div className="flex space-x-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 sm:p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick();
                    }}
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                  </Button>
                )}

                {onStar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 sm:p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarToggle();
                    }}
                  >
                    {isStarred ? (
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Back Image */}
            {backImageUrl && (
              <div className="flex-shrink-0 mb-3 sm:mb-4 relative">
                {(() => {
                  const hasLongText = needsTruncation(backContent, backContentHtml, true, true);
                  const imageHeight = hasLongText
                    ? "max-h-24 sm:max-h-28 md:max-h-32" // Smaller when text is long
                    : "max-h-32 sm:max-h-40 md:max-h-48"; // Normal size

                  return (
                    <img
                      {...backImageLongPress}
                      src={backImageUrl}
                      alt="Flashcard back"
                      className={`w-full ${imageHeight} object-contain rounded-xl cursor-pointer hover:opacity-90 transition-opacity`}
                    />
                  );
                })()}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                  Long press to zoom
                </div>
              </div>
            )}

            {/* Back Content */}
            <div className="flex-1 flex flex-col justify-between relative px-2 sm:px-4 min-h-0">
              <div className="text-center w-full flex-1 flex flex-col justify-center">
                {(() => {
                  const truncated = getTruncatedText(backContent, backContentHtml, true, !!backImageUrl); // Pass true for back content and image presence
                  return (
                    <>
                      <div className="flex-1 flex items-center justify-center">
                        {truncated.html ? (
                          <div
                            className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed font-['Montserrat',sans-serif] prose prose-sm sm:prose-base md:prose-lg max-w-none text-left"
                            dangerouslySetInnerHTML={{ __html: truncated.html }}
                          />
                        ) : (
                          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed font-['Montserrat',sans-serif] break-words text-left">
                            {truncated.text}
                          </p>
                        )}
                      </div>

                      {/* View More button - always visible at bottom */}
                      {truncated.isTruncated && (
                        <div className="flex-shrink-0 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 touch-manipulation text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpandBackText();
                            }}
                          >
                            <Expand className="h-3 w-3 mr-1" />
                            <span>View More</span>
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>


          </div>
        </motion.div>
      </motion.div>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        isOpen={imageZoomModal.isOpen}
        onClose={() => {
          setImageZoomModal({ isOpen: false, imageUrl: '', alt: '' });
          onModalStateChange?.(false);
        }}
        imageUrl={imageZoomModal.imageUrl}
        alt={imageZoomModal.alt}
      />

      {/* Text Expand Modal */}
      <TextExpandModal
        isOpen={textExpandModal.isOpen}
        onClose={() => {
          setTextExpandModal({ isOpen: false, content: '', contentHtml: '', title: '' });
          onModalStateChange?.(false);
        }}
        content={textExpandModal.content}
        contentHtml={textExpandModal.contentHtml}
        title={textExpandModal.title}
      />
    </div>
  );
};

export default FlashcardComponent;
