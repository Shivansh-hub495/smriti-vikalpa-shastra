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

  // Helper function to calculate available space and determine text limits
  const getAdaptiveTextLimits = (hasImage: boolean, isBack: boolean) => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate card dimensions based on viewport
    let cardHeight = Math.min(viewportHeight * 0.7, 600); // Max 70% of viewport or 600px
    let cardWidth = Math.min(viewportWidth * 0.9, 500);   // Max 90% of viewport or 500px

    // Adjust for desktop
    if (viewportWidth >= 1024) {
      cardHeight = Math.min(viewportHeight * 0.8, 700);
      cardWidth = Math.min(viewportWidth * 0.6, 600);
    }

    // Calculate available text area
    let availableHeight = cardHeight;

    // Subtract space for header/controls (approx 80px)
    availableHeight -= 80;

    // Subtract space for image if present
    if (hasImage) {
      const imageHeight = viewportWidth >= 1024 ? 200 : 150; // Approximate image height
      availableHeight -= imageHeight + 20; // Image + margin
    }

    // Subtract space for "Tap to flip" text (approx 40px)
    availableHeight -= 40;

    // Subtract space for view more button (approx 40px) - always reserve space
    availableHeight -= 40;

    // Calculate approximate lines that can fit
    const lineHeight = isBack ? 28 : 32; // Approximate line height based on font size
    const maxLines = Math.floor(availableHeight / lineHeight);

    // Calculate character limit based on card width and lines
    const charsPerLine = Math.floor(cardWidth / (isBack ? 12 : 16)); // Approximate chars per line
    const charLimit = Math.max(100, maxLines * charsPerLine); // Minimum 100 chars

    return {
      charLimit: Math.min(charLimit, hasImage ? 800 : 1200), // Cap the limits
      lineLimit: Math.max(3, maxLines),
      availableHeight,
      cardWidth
    };
  };

  // Helper function to check if text needs truncation
  const needsTruncation = (text: string, html?: string, hasImage: boolean = false, isBack: boolean = false) => {
    const content = html || text;
    const { charLimit, lineLimit } = getAdaptiveTextLimits(hasImage, isBack);

    const charCount = content.length;
    const lineCount = (content.match(/\n/g) || []).length + 1;

    // More conservative truncation to ensure content stays within bounds
    return charCount > charLimit || lineCount > lineLimit;
  };

  // Helper function to truncate text for display
  const getTruncatedText = (text: string, html?: string, isBack: boolean = false, hasImage: boolean = false) => {
    const needsTrunc = needsTruncation(text, html, hasImage, isBack);

    if (!needsTrunc) {
      return { text, html, isTruncated: false };
    }

    // Get adaptive limits for truncation
    const { charLimit } = getAdaptiveTextLimits(hasImage, isBack);
    const maxLength = Math.floor(charLimit * 0.75); // Use 75% of limit to ensure space for view more

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
          <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative overflow-hidden max-h-full">
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
                  const willShowViewMore = hasLongText;

                  // Adjust image size based on text length and view more button
                  let imageHeight;
                  if (willShowViewMore) {
                    imageHeight = "max-h-20 sm:max-h-24 md:max-h-28"; // Smaller when view more is needed
                  } else if (hasLongText) {
                    imageHeight = "max-h-24 sm:max-h-28 md:max-h-32"; // Medium when text is long but no view more
                  } else {
                    imageHeight = "max-h-28 sm:max-h-36 md:max-h-44"; // Normal size for short text
                  }

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
            <div className="flex-1 flex flex-col relative px-2 sm:px-4 min-h-0 overflow-hidden">
              {(() => {
                const truncated = getTruncatedText(frontContent, frontContentHtml, false, !!frontImageUrl);
                return (
                  <>
                    {/* Text Content Area */}
                    <div className="flex-1 flex items-center justify-center text-center w-full overflow-hidden">
                      {truncated.html ? (
                        <div
                          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 leading-relaxed font-['Montserrat',sans-serif] prose prose-sm sm:prose-base md:prose-lg max-w-none overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: truncated.html }}
                        />
                      ) : (
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 leading-relaxed font-['Montserrat',sans-serif] break-words overflow-hidden">
                          {truncated.text}
                        </p>
                      )}
                    </div>

                    {/* View More button - positioned at bottom when needed */}
                    {truncated.isTruncated && (
                      <div className="flex-shrink-0 flex justify-center mt-2 pb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700 touch-manipulation text-xs sm:text-sm px-3 py-1"
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
          <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 relative overflow-hidden max-h-full">
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
                  const willShowViewMore = hasLongText;

                  // Adjust image size based on text length and view more button
                  let imageHeight;
                  if (willShowViewMore) {
                    imageHeight = "max-h-20 sm:max-h-24 md:max-h-28"; // Smaller when view more is needed
                  } else if (hasLongText) {
                    imageHeight = "max-h-24 sm:max-h-28 md:max-h-32"; // Medium when text is long but no view more
                  } else {
                    imageHeight = "max-h-28 sm:max-h-36 md:max-h-44"; // Normal size for short text
                  }

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
            <div className="flex-1 flex flex-col relative px-2 sm:px-4 min-h-0 overflow-hidden">
              {(() => {
                const truncated = getTruncatedText(backContent, backContentHtml, true, !!backImageUrl);
                return (
                  <>
                    {/* Text Content Area */}
                    <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                      {truncated.html ? (
                        <div
                          className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed font-['Montserrat',sans-serif] prose prose-sm sm:prose-base md:prose-lg max-w-none text-left overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: truncated.html }}
                        />
                      ) : (
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed font-['Montserrat',sans-serif] break-words text-left overflow-hidden">
                          {truncated.text}
                        </p>
                      )}
                    </div>

                    {/* View More button - positioned at bottom when needed */}
                    {truncated.isTruncated && (
                      <div className="flex-shrink-0 flex justify-center mt-2 pb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 touch-manipulation text-xs sm:text-sm px-3 py-1"
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
