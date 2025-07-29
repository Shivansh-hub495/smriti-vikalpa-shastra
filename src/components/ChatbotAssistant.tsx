import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import RobotFace from './RobotFace';

const ChatbotAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [robotExpression, setRobotExpression] = useState<'happy' | 'thinking' | 'neutral' | 'winking' | 'surprised'>('happy');
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your study assistant. How can I help you today?", sender: "assistant" }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Reset input focus state when closing
    if (isOpen) {
      setIsInputFocused(false);
      setRobotExpression('neutral');
    } else {
      // Wink when opening
      setRobotExpression('winking');
      setTimeout(() => setRobotExpression('happy'), 1000);
    }
  };

  // Handle click outside to close chatbot
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        chatRef.current &&
        buttonRef.current &&
        !chatRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsInputFocused(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle mobile keyboard appearance
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleResize = () => {
      if (messagesRef.current && isInputFocused) {
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          messagesRef.current?.scrollTo({
            top: messagesRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isOpen, isInputFocused]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const predefinedResponses = {
    "hello": "Hi there! How can I help you with your studies today?",
    "help": "I can help you with information about using the flashcard system, study tips, or navigating the app.",
    "study tips": "Great question! Try using spaced repetition, take regular breaks, and test yourself frequently.",
    "default": "I'm not sure I understand. I can help with study tips, app navigation, or general questions about flashcards."
  };

  const getResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return predefinedResponses.hello;
    } else if (lowerMessage.includes('help')) {
      return predefinedResponses.help;
    } else if (lowerMessage.includes('study') && lowerMessage.includes('tip')) {
      return predefinedResponses["study tips"];
    } else {
      return predefinedResponses.default;
    }
  };



  const handleSend = () => {
    if (inputMessage.trim() === "") return;

    // Add user message
    const newMessages = [...messages, { text: inputMessage, sender: "user" }];
    setMessages(newMessages);

    // Show typing indicator and thinking expression
    setIsTyping(true);
    setRobotExpression('thinking');

    // Get and add assistant response
    const response = getResponse(inputMessage);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: response, sender: "assistant" }]);
      
      // Show happy expression after responding
      setRobotExpression('happy');
      setTimeout(() => setRobotExpression('neutral'), 2000);
    }, 600);

    setInputMessage("");

    // Blur input on mobile after sending to hide keyboard
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
      setIsInputFocused(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    // Show surprised expression when user starts typing
    if (inputMessage.length === 0) {
      setRobotExpression('surprised');
      setTimeout(() => setRobotExpression('neutral'), 1000);
    }
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  return (
    <>
      <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-50`}>
        <button
          ref={buttonRef}
          className={`relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white ${
            isMobile ? 'p-3 touch-manipulation' : 'p-4'
          } rounded-full shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 active:scale-95 group`}
          onClick={toggleChat}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <RobotFace
            expression={robotExpression}
            className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} transition-transform duration-300 group-hover:rotate-12`}
          />
          {/* Pulse animation */}
          <span className="absolute -inset-1 bg-purple-600 rounded-full opacity-30 animate-ping"></span>
        </button>
      </div>

      {isOpen && (
        <div
          ref={chatRef}
          className={`fixed ${
            isMobile
              ? 'inset-0 rounded-none'
              : 'bottom-24 right-6 w-full max-w-sm rounded-2xl'
          } bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 z-50 ${
            isMobile ? 'animate-slide-up' : 'animate-fade-in'
          } overflow-hidden flex flex-col ${
            isMobile && isInputFocused ? 'pb-safe' : ''
          }`}
          style={{
            height: isMobile
              ? isInputFocused
                ? 'calc(100vh - env(keyboard-inset-height, 0px))'
                : '100vh'
              : '32rem'
          }}
        >
          <div className={`flex items-center justify-between ${
            isMobile ? 'p-3' : 'p-4'
          } border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-800 flex-shrink-0`}>
            <div className="flex items-center gap-2">
              <RobotFace
                expression={isTyping ? 'thinking' : 'neutral'}
                className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-600 dark:text-purple-400`}
              />
              <h3 className={`font-semibold text-gray-800 dark:text-white ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>Study Assistant</h3>
            </div>
            <button
              onClick={toggleChat}
              className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg ${
                isMobile ? 'touch-manipulation' : ''
              }`}
              aria-label="Close chat"
            >
              <X className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </button>
          </div>
          
          <div
            ref={messagesRef}
            className={`${isMobile ? 'p-3' : 'p-4'} overflow-y-auto bg-gray-50 dark:bg-gray-900 flex-1 scroll-smooth custom-scrollbar`}
            style={{
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`${
                    isMobile ? 'max-w-[85%]' : 'max-w-xs'
                  } ${
                    isMobile ? 'px-3 py-2.5' : 'px-4 py-2.5'
                  } rounded-2xl ${
                    isMobile ? 'text-sm' : 'text-sm'
                  } shadow-sm leading-relaxed ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-3">
                <div className={`bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm ${
                  isMobile ? 'px-3 py-2' : 'px-4 py-2.5'
                } flex items-center gap-1`}>
                  <span className={`${
                    isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
                  } bg-gray-400 rounded-full animate-bounce`} style={{animationDelay: '0ms'}}></span>
                  <span className={`${
                    isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
                  } bg-gray-400 rounded-full animate-bounce`} style={{animationDelay: '150ms'}}></span>
                  <span className={`${
                    isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
                  } bg-gray-400 rounded-full animate-bounce`} style={{animationDelay: '300ms'}}></span>
                </div>
              </div>
            )}
          </div>
          
          <div className={`${
            isMobile ? 'p-3' : 'p-4'
          } border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0`}>
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Type a message..."
                className={`flex-1 ${
                  isMobile ? 'px-4 py-3' : 'px-4 py-2.5'
                } border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  isMobile ? 'text-base' : 'text-sm'
                } transition-all resize-none min-h-[44px] touch-manipulation`}
                style={{
                  fontSize: isMobile ? '16px' : '14px' // Prevent zoom on iOS
                }}
              />
              <button
                onClick={handleSend}
                className={`bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white ${
                  isMobile ? 'p-3 touch-manipulation' : 'p-2.5'
                } rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center`}
                disabled={inputMessage.trim() === ""}
                aria-label="Send message"
              >
                <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotAssistant;