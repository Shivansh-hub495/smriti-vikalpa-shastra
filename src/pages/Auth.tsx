import React, { useState } from 'react';
import { BookOpen, GraduationCap, Brain, Target, Users, Trophy, Zap, Shield, Star, CheckCircle, ArrowRight } from 'lucide-react';
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
      description: "AI-powered spaced repetition algorithm adapts to your learning pace",
      highlight: "Advanced AI"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and achieve your learning goals with detailed progress tracking",
      highlight: "Progress Analytics"
    },
    {
      icon: GraduationCap,
      title: "Exam Preparation",
      description: "Specialized decks for CA, NEET, UPSC, and other competitive exams",
      highlight: "Exam Ready"
    },
    {
      icon: BookOpen,
      title: "Rich Content",
      description: "Create flashcards with text, images, and multimedia content",
      highlight: "Multimedia Support"
    },
    {
      icon: Users,
      title: "Collaborative Learning",
      description: "Share decks with friends and study together in groups",
      highlight: "Team Study"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely with enterprise-grade security",
      highlight: "Bank-level Security"
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "CA Student",
      content: "Smriti helped me clear CA Finals with 95% marks. The spaced repetition is game-changing!",
      rating: 5
    },
    {
      name: "Rahul Kumar",
      role: "NEET Aspirant",
      content: "Best flashcard app for medical entrance prep. Improved my retention by 80%.",
      rating: 5
    },
    {
      name: "Anita Patel",
      role: "UPSC Candidate",
      content: "The goal tracking feature kept me motivated throughout my UPSC journey.",
      rating: 5
    }
  ];

  const achievements = [
    { icon: Trophy, title: "Award Winning", desc: "Best EdTech App 2024" },
    { icon: Zap, title: "Lightning Fast", desc: "Sub-second response time" },
    { icon: CheckCircle, title: "Proven Results", desc: "95% success rate" }
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        {/* Left Side - Portfolio Content (Scrollable) */}
        <div className="hidden lg:flex lg:w-2/3 flex-col">
          <div className="h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent portfolio-scroll">
            <div className="px-12 py-8 space-y-12">
              {/* Hero Section */}
              <div className="pt-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="Smriti Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Smriti
                    </h1>
                    <p className="text-sm text-purple-600 font-medium">Intelligent Learning Platform</p>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Master any subject with intelligent flashcards designed for serious learners
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Join thousands of students who have transformed their learning experience with our AI-powered spaced repetition system.
                </p>

                {/* Achievement Badges */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-100">
                      <achievement.icon className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">{achievement.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Trusted by Students Worldwide</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">10K+</div>
                    <div className="text-sm text-gray-600 font-medium">Active Learners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">50K+</div>
                    <div className="text-sm text-gray-600 font-medium">Flashcards Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">95%</div>
                    <div className="text-sm text-gray-600 font-medium">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* Dashboard Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Dashboard</h3>

                <div className="flex justify-end px-8 py-12">
                  <div className="relative w-full max-w-5xl mr-8">
                    {/* Back Image - img2 (Dark Mode) - Positioned behind and to the right */}
                    <div className="absolute -top-8 -right-10 w-96 md:w-[500px] lg:w-[600px] xl:w-[700px] rounded-2xl shadow-2xl overflow-hidden transform rotate-3 z-10">
                      <img
                        src="/images/img2.png"
                        alt="Smriti Dashboard Dark Mode"
                        className="w-full h-auto object-cover"
                      />
                    </div>

                    {/* Front Image - img1 (Light Mode) - Main focus */}
                    <div className="relative w-96 md:w-[500px] lg:w-[600px] xl:w-[700px] rounded-2xl shadow-2xl overflow-hidden z-20 bg-gradient-to-br from-white to-gray-50">
                      <img
                        src="/images/img1.png"
                        alt="Smriti Dashboard Light Mode"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <p className="text-gray-600 text-sm">
                    Experience both light and dark mode interfaces
                  </p>
                </div>
              </div>

              {/* Features Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Smriti?</h3>
                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <div key={index} className="group bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/60 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <feature.icon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                            <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-medium">
                              {feature.highlight}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonials Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8">What Our Students Say</h3>
                <div className="space-y-6">
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                      <div className="flex items-center space-x-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-purple-600">{testimonial.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Learning?</h3>
                <p className="text-purple-100 mb-6">Join thousands of successful students and start your journey today.</p>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">Free to start • No credit card required</span>
                </div>
              </div>

              <div className="pb-8"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms (Fixed) */}
        <div className="w-full lg:w-1/3 flex items-center justify-center px-4 py-8 lg:h-screen lg:overflow-hidden">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Smriti Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
