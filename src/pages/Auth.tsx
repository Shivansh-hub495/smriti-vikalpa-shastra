import React, { useState } from 'react';
import { BookOpen, GraduationCap, Brain, Target } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import AuthRedirect from '@/components/AuthRedirect';
import ScrollToTop from '@/components/ScrollToTop';

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  const features = [
    {
      icon: Brain,
      title: "Smart Learning",
      description: "AI-powered spaced repetition algorithm adapts to your learning pace"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and achieve your learning goals with detailed progress tracking"
    },
    {
      icon: GraduationCap,
      title: "Exam Preparation",
      description: "Specialized decks for CA, NEET, UPSC, and other competitive exams"
    },
    {
      icon: BookOpen,
      title: "Rich Content",
      description: "Create flashcards with text, images, and multimedia content"
    }
  ];

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            onToggleMode={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot-password')}
          />
        );
      case 'signup':
        return (
          <SignupForm
            onToggleMode={() => setMode('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBack={() => setMode('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AuthRedirect />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex">
      {/* Left Side - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-8">
        <div className="max-w-lg">
          {/* Logo and Brand */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Smriti
              </h1>
            </div>
            <p className="text-xl text-gray-600 leading-relaxed">
              Master any subject with intelligent flashcards designed for serious learners
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">10K+</div>
              <div className="text-sm text-gray-600">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">50K+</div>
              <div className="text-sm text-gray-600">Flashcards Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Smriti
              </h1>
            </div>
            <p className="text-gray-600">
              Intelligent flashcards for serious learners
            </p>
          </div>

          {/* Auth Form */}
          {renderForm()}
        </div>
      </div>
      <ScrollToTop />
    </div>
    </>
  );
};

export default Auth;
