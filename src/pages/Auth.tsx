import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, GraduationCap, Brain, Target, Users, Trophy, Zap, Shield, Star, CheckCircle, ArrowRight } from 'lucide-react';
import ModernLoginForm from '@/components/auth/ModernLoginForm';
import ModernSignupForm from '@/components/auth/ModernSignupForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import AuthRedirect from '@/components/AuthRedirect';
import ScrollToTop from '@/components/ScrollToTop';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns-1';
import { TiltedScroll } from '@/components/ui/tilted-scroll';
import { motion } from 'framer-motion';

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
      text: "Smriti helped me clear CA Finals with 95% marks. The spaced repetition is game-changing!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      name: "Priya Sharma",
      role: "CA Student"
    },
    {
      text: "Best flashcard app for medical entrance prep. Improved my retention by 80%.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      name: "Rahul Kumar",
      role: "NEET Aspirant"
    },
    {
      text: "The goal tracking feature kept me motivated throughout my UPSC journey.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      name: "Anita Patel",
      role: "UPSC Candidate"
    },
    {
      text: "Amazing UI and the smart algorithm adapts perfectly to my learning pace.",
      image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop",
      name: "Arjun Singh",
      role: "Engineering Student"
    },
    {
      text: "The collaborative features helped our study group stay organized and motivated.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      name: "Sneha Reddy",
      role: "MBA Student"
    },
    {
      text: "From a failing student to topping my class - Smriti made the difference!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      name: "Vikram Mehta",
      role: "JEE Aspirant"
    },
    {
      text: "The multimedia support is perfect for visual learners like me.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
      name: "Kavya Nair",
      role: "Medical Student"
    },
    {
      text: "I love how it tracks my progress and shows me exactly where to focus.",
      image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=150&h=150&fit=crop",
      name: "Rohan Gupta",
      role: "Law Student"
    },
    {
      text: "The best investment I made for my competitive exam preparation!",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop",
      name: "Meera Iyer",
      role: "Banking Aspirant"
    }
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  const achievements = [
    { icon: Trophy, title: "Award Winning", desc: "Best EdTech App 2024" },
    { icon: Zap, title: "Lightning Fast", desc: "Sub-second response time" },
    { icon: CheckCircle, title: "Proven Results", desc: "95% success rate" }
  ];

  // Counting animation hook
  const useCountingAnimation = (endValue: number, duration: number = 2000, suffix: string = '') => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        },
        { threshold: 0.5 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [isVisible]);

    useEffect(() => {
      if (!isVisible) return;

      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentCount = Math.floor(endValue * easeOutQuart);
        
        setCount(currentCount);

        if (progress === 1) {
          clearInterval(timer);
        }
      }, 16); // 60fps

      return () => clearInterval(timer);
    }, [endValue, duration, isVisible]);

    return { count, ref, displayValue: `${count}${suffix}` };
  };

  const activeLearners = useCountingAnimation(10000, 2000, 'K+');
  const flashcardsCreated = useCountingAnimation(50000, 2000, 'K+');
  const successRate = useCountingAnimation(95, 2000, '%');

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <ModernLoginForm
            onToggleMode={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot-password')}
          />
        );
      case 'signup':
        return (
          <ModernSignupForm
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                  Master any subject with intelligent flashcards designed for serious learners
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                  Join thousands of students who have transformed their learning experience with our AI-powered spaced repetition system.
                </p>

                {/* Achievement Badges */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-100 dark:border-purple-900">
                      <achievement.icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{achievement.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Trusted by Students Worldwide</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center" ref={activeLearners.ref}>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {Math.floor(activeLearners.count / 1000)}K+
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Learners</div>
                  </div>
                  <div className="text-center" ref={flashcardsCreated.ref}>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {Math.floor(flashcardsCreated.count / 1000)}K+
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Flashcards Created</div>
                  </div>
                  <div className="text-center" ref={successRate.ref}>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {successRate.count}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* Dashboard Section */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg dashboard-glow">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">Dashboard</h3>

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
                    <div className="relative w-96 md:w-[500px] lg:w-[600px] xl:w-[700px] rounded-2xl shadow-2xl overflow-hidden z-20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                      <img
                        src="/images/img1.png"
                        alt="Smriti Dashboard Light Mode"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Experience both light and dark mode interfaces
                  </p>
                </div>
              </div>

              {/* Features Section with Tilted Scroll */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Why Choose Smriti?</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Experience the power of intelligent learning with features designed to accelerate your success
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <TiltedScroll
                    items={features.map((feature, index) => ({
                      id: `feature-${index}`,
                      text: feature.description,
                      highlight: feature.highlight
                    }))}
                    className="mb-8"
                  />
                </motion.div>
              </div>

              {/* Testimonials Section */}
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10"
                >
                  <div className="flex justify-center">
                    <div className="border border-purple-200 dark:border-purple-800 py-1 px-4 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                      <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">Testimonials</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tighter mt-5">
                    What Our Students Say
                  </h2>
                  <p className="text-center mt-5 text-gray-600 dark:text-gray-400">
                    Join thousands who have transformed their learning journey with Smriti.
                  </p>
                </motion.div>

                <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                  <TestimonialsColumn testimonials={firstColumn} duration={15} />
                  <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                  <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
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
              <p className="text-gray-600 dark:text-gray-400">
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
