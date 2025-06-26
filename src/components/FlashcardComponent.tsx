import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Star, StarOff, Expand, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageZoomModal from './ImageZoomModal';
import TextExpandModal from './TextExpandModal';
import { useLongPress } from '@/hooks/useLongPress';
import { ANIMATION_DURATIONS, EASING, CONTENT_THRESHOLDS, UI_SIZES, COLORS, A11Y } from '@/constants/study';

/**
 * @fileoverview Optimized FlashcardComponent with performance best practices
 * @description Enhanced flashcard component with React.memo, optimized event handlers, and accessibility
 * @author StudySession Refactor
 * @version 2.0.0
 */

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

interface ModalState {
  isOpen: boolean;
  imageUrl: string;
  alt: string;
}

interface TextModalState {
  isOpen: boolean;
  content: string;
  contentHtml?: string;
  title: string;
}

/**
 * Optimized FlashcardComponent with React.memo for performance
 * Prevents unnecessary re-renders when props haven't changed
 */
const FlashcardComponent: React.FC<FlashcardProps> = memo(({
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
  // Optimized state with proper initial values
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageZoomModal, setImageZoomModal] = useState<ModalState>(() => ({
    isOpen: false,
    imageUrl: '',
    alt: ''
  }));
  const [textExpandModal, setTextExpandModal] = useState<TextModalState>(() => ({
    isOpen: false,
    content: '',
    contentHtml: '',
    title: ''
  }));

  // Memoized responsive content thresholds
  const contentThresholds = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < CONTENT_THRESHOLDS.CHARACTERS.MOBILE;
    return {
      characters: isMobile ? CONTENT_THRESHOLDS.CHARACTERS.MOBILE : CONTENT_THRESHOLDS.CHARACTERS.DESKTOP,
      lines: isMobile ? CONTENT_THRESHOLDS.LINES.MOBILE : CONTENT_THRESHOLDS.LINES.DESKTOP,
    };
  }, []);

  // Memoized helper function to check if text needs truncation
  const needsTruncation = useCallback((text: string, html?: string, hasImage: boolean = false, isBack: boolean = false) => {
    const content = html || text;

    if (hasImage) {
      // Show view more when image is present - more conservative
      return content.length > 150 || (content.match(/\n/g) || []).length > 2;
    } else {
      // Use more conservative thresholds to avoid partial words
      const charThreshold = isBack ? contentThresholds.characters * 1.2 : contentThresholds.characters * 1.5;
      const lineThreshold = isBack ? contentThresholds.lines + 2 : contentThresholds.lines + 3;

      const charCount = content.length;
      const lineCount = (content.match(/\n/g) || []).length;

      return charCount > charThreshold || lineCount > lineThreshold;
    }
  }, [contentThresholds]);

  // Memoized helper function to truncate text for display
  const getTruncatedText = useCallback((text: string, html?: string, isBack: boolean = false, hasImage: boolean = false) => {
    const needsTrunc = needsTruncation(text, html, hasImage, isBack);

    if (!needsTrunc) {
      return { text, html, isTruncated: false };
    }

    // Responsive max length based on screen size and image presence - more conservative
    const baseLength = hasImage ? 150 : contentThresholds.characters * 1.5;
    const maxLength = isBack ? baseLength * 0.8 : baseLength;

    const content = html || text;

    // Helper function to truncate at word boundary - ALWAYS truncate at complete words
    const truncateAtWordBoundary = (str: string, maxLen: number) => {
      if (str.length <= maxLen) return str;

      let truncated = str.substring(0, maxLen);
      const lastSpaceIndex = truncated.lastIndexOf(' ');

      // ALWAYS truncate at word boundary - never show partial words
      if (lastSpaceIndex > 0) {
        truncated = truncated.substring(0, lastSpaceIndex);
      } else {
        // If no space found, find the first word and use that
        const firstSpaceIndex = str.indexOf(' ');
        if (firstSpaceIndex > 0 && firstSpaceIndex < maxLen * 1.5) {
          truncated = str.substring(0, firstSpaceIndex);
        } else {
          // Fallback: use a much smaller length to ensure we get complete words
          truncated = str.substring(0, Math.floor(maxLen * 0.7));
          const fallbackSpaceIndex = truncated.lastIndexOf(' ');
          if (fallbackSpaceIndex > 0) {
            truncated = truncated.substring(0, fallbackSpaceIndex);
          }
        }
      }

      return truncated;
    };

    if (html) {
      // For HTML content, truncate at word boundary and add ellipsis
      const truncatedHtml = truncateAtWordBoundary(content, maxLength);
      const truncatedText = truncateAtWordBoundary(text, maxLength);

      return {
        text: truncatedText + '...',
        html: truncatedHtml + '...',
        isTruncated: true
      };
    } else {
      // For plain text, truncate at word boundary
      const truncatedText = truncateAtWordBoundary(text, maxLength);

      return {
        text: truncatedText + '...',
        html: undefined,
        isTruncated: true
      };
    }
  }, [needsTruncation, contentThresholds]);

  // Optimized speech synthesis handler with error handling
  const handleSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsSpeaking(false);
      };

      // Optimized voice properties
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in speech synthesis:', error);
      setIsSpeaking(false);
    }
  }, []);

  // Optimized event handlers with useCallback for stable references
  const handleStarToggle = useCallback(() => {
    if (onStar) {
      onStar(id, !isStarred);
    }
  }, [onStar, id, isStarred]);

  const handleEditClick = useCallback(() => {
    if (onEdit) {
      onEdit(id);
    }
  }, [onEdit, id]);

  // Optimized modal handlers
  const handleImageZoomOpen = useCallback((imageUrl: string, alt: string) => {
    setImageZoomModal({
      isOpen: true,
      imageUrl,
      alt
    });
    onModalStateChange?.(true);
  }, [onModalStateChange]);

  const handleImageZoomClose = useCallback(() => {
    setImageZoomModal(prev => ({ ...prev, isOpen: false }));
    onModalStateChange?.(false);
  }, [onModalStateChange]);

  const handleTextExpandOpen = useCallback((content: string, contentHtml: string | undefined, title: string) => {
    setTextExpandModal({
      isOpen: true,
      content,
      contentHtml,
      title
    });
    onModalStateChange?.(true);
  }, [onModalStateChange]);

  const handleTextExpandClose = useCallback(() => {
    setTextExpandModal(prev => ({ ...prev, isOpen: false }));
    onModalStateChange?.(false);
  }, [onModalStateChange]);

  // Memoized long press handlers for images
  const frontImageLongPress = useLongPress({
    onLongPress: useCallback(() => {
      if (frontImageUrl) {
        handleImageZoomOpen(frontImageUrl, 'Flashcard front image');
      }
    }, [frontImageUrl, handleImageZoomOpen])
  });

  const backImageLongPress = useLongPress({
    onLongPress: useCallback(() => {
      if (backImageUrl) {
        handleImageZoomOpen(backImageUrl, 'Flashcard back image');
      }
    }, [backImageUrl, handleImageZoomOpen])
  });

  // Optimized text expand handlers
  const handleExpandFrontText = useCallback(() => {
    handleTextExpandOpen(frontContent, frontContentHtml, 'Front Content');
  }, [frontContent, frontContentHtml, handleTextExpandOpen]);

  const handleExpandBackText = useCallback(() => {
    handleTextExpandOpen(backContent, backContentHtml, 'Back Content');
  }, [backContent, backContentHtml, handleTextExpandOpen]);

  // Memoized content processing for performance
  const processedContent = useMemo(() => {
    const frontHasImage = !!frontImageUrl;
    const backHasImage = !!backImageUrl;

    return {
      front: {
        ...getTruncatedText(frontContent, frontContentHtml, false, frontHasImage),
        hasImage: frontHasImage,
        needsViewMore: needsTruncation(frontContent, frontContentHtml, frontHasImage, false)
      },
      back: {
        ...getTruncatedText(backContent, backContentHtml, true, backHasImage),
        hasImage: backHasImage,
        needsViewMore: needsTruncation(backContent, backContentHtml, backHasImage, true)
      }
    };
  }, [frontContent, frontContentHtml, frontImageUrl, backContent, backContentHtml, backImageUrl, getTruncatedText, needsTruncation]);

  // Memoized animation variants for performance
  const animationVariants = useMemo(() => ({
    cardFlip: {
      duration: ANIMATION_DURATIONS.CARD_FLIP / 1000,
      ease: EASING.CARD_FLIP_SPRING.type,
      ...EASING.CARD_FLIP_SPRING
    },
    entrance: {
      initial: { scale: 0.8, opacity: 0, y: 50 },
      animate: { scale: 1, opacity: 1, y: 0 },
      transition: {
        duration: ANIMATION_DURATIONS.CARD_ENTRANCE / 1000,
        ...EASING.SPRING
      }
    }
  }), []);

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
          <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative overflow-hidden">
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
            <div className="flex-1 flex flex-col justify-between relative px-2 sm:px-4 min-h-0 max-h-full overflow-hidden">
              <div className="text-center w-full flex-1 flex flex-col justify-center min-h-0 max-h-full overflow-hidden">
                <>
                  <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
                    <div className="w-full overflow-hidden">
                      {processedContent.front.html ? (
                        <div
                          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 leading-relaxed font-['Montserrat',sans-serif] prose prose-sm sm:prose-base md:prose-lg max-w-none overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: processedContent.front.html }}
                        />
                      ) : (
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 leading-relaxed font-['Montserrat',sans-serif] break-words overflow-hidden">
                          {processedContent.front.text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View More button - guaranteed to stay within card */}
                  {processedContent.front.isTruncated && (
                    <div className="flex-shrink-0 mt-1 pb-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700 touch-manipulation text-xs sm:text-sm h-6 px-2"
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
          <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative overflow-hidden">
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
            <div className="flex-1 flex flex-col justify-between relative px-2 sm:px-4 min-h-0 max-h-full overflow-hidden">
              <div className="text-center w-full flex-1 flex flex-col justify-center min-h-0 max-h-full overflow-hidden">
                <>
                  <div className={`flex-1 flex ${processedContent.back.isTruncated ? 'items-start' : 'items-center'} justify-center overflow-hidden min-h-0`}>
                    <div className="w-full overflow-hidden">
                      {processedContent.back.html ? (
                        <div
                          className={`text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed font-['Montserrat',sans-serif] prose prose-sm sm:prose-base md:prose-lg max-w-none ${processedContent.back.isTruncated ? 'text-left' : 'text-center'} overflow-hidden`}
                          dangerouslySetInnerHTML={{ __html: processedContent.back.html }}
                        />
                      ) : (
                        <p className={`text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed font-['Montserrat',sans-serif] break-words ${processedContent.back.isTruncated ? 'text-left' : 'text-center'} overflow-hidden`}>
                          {processedContent.back.text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View More button - guaranteed to stay within card */}
                  {processedContent.back.isTruncated && (
                    <div className="flex-shrink-0 mt-1 pb-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 touch-manipulation text-xs sm:text-sm h-6 px-2"
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
              </div>
            </div>


          </div>
        </motion.div>
      </motion.div>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        isOpen={imageZoomModal.isOpen}
        onClose={handleImageZoomClose}
        imageUrl={imageZoomModal.imageUrl}
        alt={imageZoomModal.alt}
      />

      {/* Text Expand Modal */}
      <TextExpandModal
        isOpen={textExpandModal.isOpen}
        onClose={handleTextExpandClose}
        content={textExpandModal.content}
        contentHtml={textExpandModal.contentHtml}
        title={textExpandModal.title}
      />
    </div>
  );
});

// Display name for debugging
FlashcardComponent.displayName = 'FlashcardComponent';

export default FlashcardComponent;
