import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send } from 'lucide-react';

const ChatbotAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
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
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  const [messages, setMessages] = useState([
    { text: "Hi! I'm your study assistant. How can I help you today?", sender: "assistant" }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSend = () => {
    if (inputMessage.trim() === "") return;
    
    // Add user message
    const newMessages = [...messages, { text: inputMessage, sender: "user" }];
    setMessages(newMessages);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Get and add assistant response
    const response = getResponse(inputMessage);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: response, sender: "assistant" }]);
    }, 600);
    
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <button
          ref={buttonRef}
          className="relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 group"
          onClick={toggleChat}
          aria-label="Open chat"
        >
          <Bot className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
          {/* Pulse animation */}
          <span className="absolute -inset-1 bg-purple-600 rounded-full opacity-30 animate-ping"></span>
        </button>
      </div>

      {isOpen && (
        <div ref={chatRef} className="fixed bottom-20 right-4 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-800 dark:text-white text-lg">Study Assistant</h3>
            </div>
            <button
              onClick={toggleChat}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="h-80 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
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
                <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-2.5 rounded-full transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={inputMessage.trim() === ""}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotAssistant;