import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * Helper function to check if content is truly empty (ignoring empty HTML elements)
 */
const isContentEmpty = (textContent: string, htmlContent?: string): boolean => {
  // Check if plain text content is empty
  if (textContent.trim()) {
    return false;
  }

  // If no HTML content, it's empty
  if (!htmlContent) {
    return true;
  }

  // Create a temporary div to parse HTML and check if it contains actual text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Get text content and check if it's empty (ignoring whitespace and empty elements)
  const textOnly = tempDiv.textContent || tempDiv.innerText || '';
  return textOnly.trim() === '';
};

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

  // Hybrid truncation logic - adaptive to content and layout
  const needsTruncation = useCallback((text: string, html?: string, hasImage: boolean = false, isBack: boolean = false) => {
    const content = html || text;
    const charCount = content.length;
    const lineCount = (content.match(/\n/g) || []).length;

    // Adaptive thresholds based on available space
    let charThreshold, lineThreshold;

    if (hasImage) {
      // Image cards: moderate text allowance
      charThreshold = isBack ? 300 : 350;
      lineThreshold = isBack ? 4 : 5;
    } else {
      // Text-only cards: more generous but not excessive
      charThreshold = isBack ? contentThresholds.characters * 1.3 : contentThresholds.characters * 1.6;
      lineThreshold = isBack ? contentThresholds.lines + 2 : contentThresholds.lines + 3;
    }

    return charCount > charThreshold || lineCount > lineThreshold;
  }, [contentThresholds]);

  // Hybrid text truncation - smart word boundary detection
  const getTruncatedText = useCallback((text: string, html?: string, isBack: boolean = false, hasImage: boolean = false) => {
    const needsTrunc = needsTruncation(text, html, hasImage, isBack);

    if (!needsTrunc) {
      return { text, html, isTruncated: false };
    }

    // Adaptive max length - balanced for both image and text cards
    let baseLength;
    if (hasImage) {
      baseLength = isBack ? 280 : 320; // Moderate for image cards
    } else {
      baseLength = isBack ? contentThresholds.characters * 1.2 : contentThresholds.characters * 1.4; // Conservative for text cards
    }

    const content = html || text;

    // Smart word boundary truncation
    const truncateAtWordBoundary = (str: string, maxLen: number) => {
      if (str.length <= maxLen) return str;

      let truncated = str.substring(0, maxLen);
      const lastSpaceIndex = truncated.lastIndexOf(' ');

      // Always prefer word boundaries, but with reasonable limits
      if (lastSpaceIndex > maxLen * 0.6) {
        // Good word boundary found - use it
        truncated = truncated.substring(0, lastSpaceIndex);
      } else {
        // No good word boundary - find a better cut point
        const betterCutPoint = Math.floor(maxLen * 0.85);
        const betterTruncated = str.substring(0, betterCutPoint);
        const betterSpaceIndex = betterTruncated.lastIndexOf(' ');

        if (betterSpaceIndex > maxLen * 0.5) {
          truncated = betterTruncated.substring(0, betterSpaceIndex);
        } else {
          // Fallback: use original with word boundary if possible
          truncated = lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;
        }
      }

      return truncated;
    };

    if (html) {
      // For HTML content, truncate at word boundary and add ellipsis
      const truncatedHtml = truncateAtWordBoundary(content, baseLength);
      const truncatedText = truncateAtWordBoundary(text, baseLength);

      return {
        text: truncatedText + '...',
        html: truncatedHtml + '...',
        isTruncated: true
      };
    } else {
      // For plain text, truncate at word boundary
      const truncatedText = truncateAtWordBoundary(text, baseLength);

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
    try {
      setImageZoomModal({
        isOpen: true,
        imageUrl,
        alt
      });
      onModalStateChange?.(true);
    } catch (error) {
      console.error('Error opening image zoom modal:', error);
    }
  }, [onModalStateChange]);

  const handleImageZoomClose = useCallback(() => {
    try {
      setImageZoomModal(prev => ({ ...prev, isOpen: false }));
      onModalStateChange?.(false);
    } catch (error) {
      console.error('Error closing image zoom modal:', error);
    }
  }, [onModalStateChange]);

  const handleTextExpandOpen = useCallback((content: string, contentHtml: string | undefined, title: string) => {
    try {
      setTextExpandModal({
        isOpen: true,
        content,
        contentHtml,
        title
      });
      onModalStateChange?.(true);
    } catch (error) {
      console.error('Error opening text expand modal:', error);
    }
  }, [onModalStateChange]);

  const handleTextExpandClose = useCallback(() => {
    try {
      setTextExpandModal(prev => ({ ...prev, isOpen: false }));
      onModalStateChange?.(false);
    } catch (error) {
      console.error('Error closing text expand modal:', error);
    }
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

  // Normalize HTML to ensure intentional blank lines are visible
  const ensureEmptyParagraphsVisible = useCallback((html: string) => {
    if (!html) return html;
    // Convert completely empty paragraphs to a visible break so the user sees blank lines
    return html.replace(/<p(\s[^>]*)?>\s*<\/p>/gi, '<p$1><br></p>');
  }, []);

  const processedContent = useMemo(() => {
    const frontHasImage = !!frontImageUrl;
    const backHasImage = !!backImageUrl;

    const front = getTruncatedText(frontContent, frontContentHtml, false, frontHasImage);
    const back = getTruncatedText(backContent, backContentHtml, true, backHasImage);

    return {
      front: {
        ...front,
        html: front.html ? ensureEmptyParagraphsVisible(front.html) : undefined,
        hasImage: frontHasImage,
        needsViewMore: needsTruncation(frontContent, frontContentHtml, frontHasImage, false)
      },
      back: {
        ...back,
        html: back.html ? ensureEmptyParagraphsVisible(back.html) : undefined,
        hasImage: backHasImage,
        needsViewMore: needsTruncation(backContent, backContentHtml, backHasImage, true)
      }
    };
  }, [frontContent, frontContentHtml, frontImageUrl, backContent, backContentHtml, backImageUrl, getTruncatedText, needsTruncation, ensureEmptyParagraphsVisible]);

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
        role="button"
        tabIndex={0}
        aria-label={`Flashcard: ${isFlipped ? 'showing answer' : 'showing question'}. Press to flip.`}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onFlip();
          }
        }}
      >
        <>
          {/* Front Side */}
          <motion.div
            className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden"
            }}
            aria-hidden={isFlipped}
          >
          {(() => {
            const frontHasText = !isContentEmpty(frontContent, frontContentHtml);
            const isImageOnly = frontImageUrl && !frontHasText;

            if (isImageOnly) {
              // Image-only layout: use full card space with proper centering
              return (
                <div className="relative h-full w-full">
                  {/* Top Controls - Absolute positioned over image */}
                  <div className="absolute top-2 sm:top-4 md:top-6 lg:top-8 left-2 sm:left-4 md:left-6 lg:left-8 right-2 sm:right-4 md:right-6 lg:right-8 flex justify-between items-start z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-colors touch-manipulation shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(frontContent);
                      }}
                      disabled={isSpeaking}
                      aria-label="Read front content aloud"
                    >
                      <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isSpeaking ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`} />
                    </Button>

                    <div className="flex space-x-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-colors touch-manipulation shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick();
                          }}
                          aria-label="Edit this flashcard"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                        </Button>
                      )}

                      {onStar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-colors touch-manipulation shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarToggle();
                          }}
                          aria-label={isStarred ? "Unstar this card" : "Star this card"}
                        >
                          {isStarred ? (
                            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Centered Image Container */}
                  <div className="absolute inset-0 flex items-center justify-center p-1 sm:p-2 md:p-3">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        {...frontImageLongPress}
                        src={frontImageUrl}
                        alt="Flashcard front"
                        className="max-w-[98%] max-h-[92%] sm:max-w-[96%] sm:max-h-[90%] md:max-w-[94%] md:max-h-[88%] object-contain rounded-lg sm:rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                      />
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                        Long press to zoom
                      </div>
                    </div>
                  </div>

                  {/* Bottom instruction */}
                  <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 lg:bottom-8 left-0 right-0 text-center">
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 inline-block shadow-sm">
                      Tap the card to flip
                    </p>
                  </div>
                </div>
              );
            } else {
              // Standard layout with text content
              return (
                <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative overflow-hidden">
                  {/* Top Controls */}
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(frontContent);
                      }}
                      disabled={isSpeaking}
                      aria-label="Read front content aloud"
                    >
                      <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isSpeaking ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`} />
                    </Button>

                    <div className="flex space-x-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick();
                          }}
                          aria-label="Edit this flashcard"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                        </Button>
                      )}

                      {onStar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarToggle();
                          }}
                          aria-label={isStarred ? "Unstar this card" : "Star this card"}
                        >
                          {isStarred ? (
                            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Front Image - only for cards with text */}
                  {frontImageUrl && (
                    <div className="flex-shrink-0 mb-3 sm:mb-4 relative">
                      {(() => {
                        const hasLongText = needsTruncation(frontContent, frontContentHtml, true, false);
                        const imageHeight = hasLongText
                          ? "max-h-40 sm:max-h-48 md:max-h-56" // Larger even when text is long
                          : "max-h-48 sm:max-h-56 md:max-h-64"; // Much larger when text is normal

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
            {(frontContent.trim() || frontContentHtml) && (
              <div className="flex-1 flex flex-col justify-between relative px-2 sm:px-4 min-h-0 max-h-full overflow-hidden">
                <div className="text-center w-full flex-1 flex flex-col justify-center min-h-0 max-h-full overflow-hidden">
                  <>
                    <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
                      <div className="w-full overflow-hidden">
                        {processedContent.front.html ? (
                          <div
                            className="flashcard-prose flashcard-prose-lg flashcard-prose-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-gray-100 max-w-none overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: processedContent.front.html }}
                          />
                        ) : (
                          <p className="flashcard-prose flashcard-prose-lg flashcard-prose-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-gray-100 break-words overflow-hidden">
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
                          aria-label="View full front content"
                        >
                          <Expand className="h-3 w-3 mr-1" />
                          <span>View More</span>
                        </Button>
                      </div>
                    )}
                  </>
                </div>
              </div>
            )}

                  {/* Tap Instruction - only for cards with text */}
                  <div className="flex-shrink-0 text-center mt-4 sm:mt-6">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                      Tap the card to flip
                    </p>
                  </div>
                </div>
              );
            }
          })()}
        </motion.div>

        {/* Back Side */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl shadow-2xl border border-blue-100 dark:border-gray-600"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
          aria-hidden={!isFlipped}
        >
          {(() => {
            const backHasText = !isContentEmpty(backContent, backContentHtml);
            const isImageOnly = backImageUrl && !backHasText;

            if (isImageOnly) {
              // Image-only layout: use full card space with proper centering
              return (
                <div className="relative h-full w-full">
                  {/* Top Controls - Absolute positioned over image */}
                  <div className="absolute top-2 sm:top-4 md:top-6 lg:top-8 left-2 sm:left-4 md:left-6 lg:left-8 right-2 sm:right-4 md:right-6 lg:right-8 flex justify-between items-start z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-colors touch-manipulation shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(backContent);
                      }}
                      disabled={isSpeaking}
                      aria-label="Read back content aloud"
                    >
                      <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isSpeaking ? 'text-blue-600' : 'text-blue-700 dark:text-blue-300'}`} />
                    </Button>

                    <div className="flex space-x-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-colors touch-manipulation shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick();
                          }}
                          aria-label="Edit this flashcard"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 dark:text-blue-300" />
                        </Button>
                      )}

                      {onStar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-colors touch-manipulation shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarToggle();
                          }}
                          aria-label={isStarred ? "Unstar this card" : "Star this card"}
                        >
                          {isStarred ? (
                            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 dark:text-blue-300" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Centered Image Container */}
                  <div className="absolute inset-0 flex items-center justify-center p-1 sm:p-2 md:p-3">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        {...backImageLongPress}
                        src={backImageUrl}
                        alt="Flashcard back"
                        className="max-w-[98%] max-h-[92%] sm:max-w-[96%] sm:max-h-[90%] md:max-w-[94%] md:max-h-[88%] object-contain rounded-lg sm:rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                      />
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                        Long press to zoom
                      </div>
                    </div>
                  </div>


                </div>
              );
            } else {
              // Standard layout with text content
              return (
                <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative overflow-hidden">
                  {/* Top Controls */}
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-gray-700 hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(backContent);
                      }}
                      disabled={isSpeaking}
                      aria-label="Read back content aloud"
                    >
                      <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isSpeaking ? 'text-blue-600' : 'text-blue-700 dark:text-blue-300'}`} />
                    </Button>

                    <div className="flex space-x-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-gray-700 hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick();
                          }}
                          aria-label="Edit this flashcard"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 dark:text-blue-300" />
                        </Button>
                      )}

                      {onStar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white/90 dark:hover:bg-gray-700/90 backdrop-blur-sm transition-colors touch-manipulation shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarToggle();
                          }}
                          aria-label={isStarred ? "Unstar this card" : "Star this card"}
                        >
                          {isStarred ? (
                            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 dark:text-blue-300" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Back Image - only for cards with text */}
                  {backImageUrl && (
                    <div className="flex-shrink-0 mb-3 sm:mb-4 relative">
                      {(() => {
                        const hasLongText = needsTruncation(backContent, backContentHtml, true, true);
                        const imageHeight = hasLongText
                          ? "max-h-40 sm:max-h-48 md:max-h-56" // Larger even when text is long
                          : "max-h-48 sm:max-h-56 md:max-h-64"; // Much larger when text is normal

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
            {(backContent.trim() || backContentHtml) && (
              <div className="flex-1 flex flex-col justify-between relative px-2 sm:px-4 min-h-0 max-h-full overflow-hidden">
                <div className="text-center w-full flex-1 flex flex-col justify-center min-h-0 max-h-full overflow-hidden">
                  <>
                    <div className={`flex-1 flex ${processedContent.back.isTruncated ? 'items-start' : 'items-center'} justify-center overflow-hidden min-h-0`}>
                      <div className="w-full overflow-hidden">
                        {processedContent.back.html ? (
                          <div
                            className={`flashcard-prose flashcard-prose-lg text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 dark:text-gray-100 max-w-none ${processedContent.back.isTruncated ? 'flashcard-prose-left' : 'flashcard-prose-center'} overflow-hidden`}
                            dangerouslySetInnerHTML={{ __html: processedContent.back.html }}
                          />
                        ) : (
                          <p className={`flashcard-prose flashcard-prose-lg text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 dark:text-gray-100 break-words ${processedContent.back.isTruncated ? 'text-left' : 'text-center'} overflow-hidden`}>
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
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 touch-manipulation text-xs sm:text-sm h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandBackText();
                          }}
                          aria-label="View full back content"
                        >
                          <Expand className="h-3 w-3 mr-1" />
                          <span>View More</span>
                        </Button>
                      </div>
                    )}
                  </>
                </div>
              </div>
            )}


                </div>
              );
            }
          })()}
        </motion.div>
        </>
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
