import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ModernSignupFormProps {
  onToggleMode: () => void;
}

const ModernSignupForm: React.FC<ModernSignupFormProps> = ({ onToggleMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signUp } = useAuth();

  // For 3D card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const validateForm = () => {
    const newErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName.trim());
      if (error) {
        console.error('Signup error:', error);
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-md relative"
    >
      <div
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        >
        <div className="relative group">
          {/* Card glow effect */}
          <motion.div
            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 10px 2px rgba(147, 51, 234, 0.1)",
                "0 0 20px 5px rgba(147, 51, 234, 0.2)",
                "0 0 10px 2px rgba(147, 51, 234, 0.1)"
              ],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut", 
              repeatType: "mirror" 
            }}
          />

          {/* Traveling light beam effect */}
          <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute top-0 left-0 h-[2px] w-[30%] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-70"
              animate={{ 
                left: ["-30%", "100%"],
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
            
            <motion.div 
              className="absolute top-0 right-0 h-[30%] w-[2px] bg-gradient-to-b from-transparent via-pink-400 to-transparent opacity-70"
              animate={{ 
                top: ["-30%", "100%"],
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatDelay: 1,
                delay: 0.75
              }}
            />
            
            <motion.div 
              className="absolute bottom-0 right-0 h-[2px] w-[30%] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-70"
              animate={{ 
                right: ["-30%", "100%"],
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatDelay: 1,
                delay: 1.5
              }}
            />
            
            <motion.div 
              className="absolute bottom-0 left-0 h-[30%] w-[2px] bg-gradient-to-b from-transparent via-pink-400 to-transparent opacity-70"
              animate={{ 
                bottom: ["-30%", "100%"],
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity,
                repeatDelay: 1,
                delay: 2.25
              }}
            />
          </div>

          {/* Card border glow */}
          <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-pink-400/20 via-pink-500/30 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          {/* Glass card background */}
          <div className="relative bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 dark:border-gray-700/50 shadow-2xl overflow-hidden z-10">
            {/* Subtle card inner patterns */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                backgroundSize: '30px 30px'
              }}
            />

            {/* Logo and header */}
            <div className="text-center space-y-2 mb-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden shadow-lg p-2"
              >
                <img
                  src="/logo.png"
                  alt="Smriti Logo"
                  className="w-full h-full object-contain relative z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                Create Account
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400 text-sm"
              >
                Join Smriti and start your learning journey
              </motion.p>
            </div>

            {/* Signup form */}
            <form onSubmit={handleSubmit} className="space-y-4 relative z-20">
              <motion.div className="space-y-4">
                {/* Full Name input */}
                <motion.div 
                  className={`relative ${focusedInput === "fullName" ? 'z-10' : ''}`}
                  whileFocus={{ scale: 1.02 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="absolute -inset-[0.5px] bg-gradient-to-r from-pink-400/20 via-pink-500/10 to-pink-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "fullName" ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400'
                    }`} />
                    
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setFocusedInput("fullName")}
                      onBlur={() => setFocusedInput(null)}
                      className={cn(
                        "w-full bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400 h-11 transition-all duration-300 pl-10 pr-3",
                        errors.fullName && "border-red-500"
                      )}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                  )}
                </motion.div>

                {/* Email input */}
                <motion.div 
                  className={`relative ${focusedInput === "email" ? 'z-10' : ''}`}
                  whileFocus={{ scale: 1.02 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="absolute -inset-[0.5px] bg-gradient-to-r from-purple-400/20 via-purple-500/10 to-purple-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "email" ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                    }`} />
                    
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      className={cn(
                        "w-full bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 h-11 transition-all duration-300 pl-10 pr-3",
                        errors.email && "border-red-500"
                      )}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </motion.div>

                {/* Password input */}
                <motion.div 
                  className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                  whileFocus={{ scale: 1.02 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="absolute -inset-[0.5px] bg-gradient-to-r from-purple-400/20 via-purple-500/10 to-purple-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "password" ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                    }`} />
                    
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      className={cn(
                        "w-full bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 h-11 transition-all duration-300 pl-10 pr-10",
                        errors.password && "border-red-500"
                      )}
                    />
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                  )}
                </motion.div>

                {/* Confirm Password input */}
                <motion.div 
                  className={`relative ${focusedInput === "confirmPassword" ? 'z-10' : ''}`}
                  whileFocus={{ scale: 1.02 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="absolute -inset-[0.5px] bg-gradient-to-r from-pink-400/20 via-pink-500/10 to-pink-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                      focusedInput === "confirmPassword" ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400'
                    }`} />
                    
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedInput("confirmPassword")}
                      onBlur={() => setFocusedInput(null)}
                      className={cn(
                        "w-full bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400 h-11 transition-all duration-300 pl-10 pr-10",
                        errors.confirmPassword && "border-red-500"
                      )}
                    />
                    
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </motion.div>
              </motion.div>

              {/* Sign up button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full relative group/button mt-6"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-70 group-hover/button:opacity-100 transition-opacity duration-300" />
                
                <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold h-11 rounded-xl transition-all duration-300 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="button-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        Create Account
                        <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-300" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

              {/* Sign in link */}
              <motion.p 
                className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition-colors duration-200 cursor-pointer relative z-10 inline-block"
                >
                  Sign in
                </button>
              </motion.p>
            </form>
          </div>
        </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ModernSignupForm;