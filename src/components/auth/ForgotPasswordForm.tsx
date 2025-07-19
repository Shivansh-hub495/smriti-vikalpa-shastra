import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const { resetPassword } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const { error } = await resetPassword(email);
      if (!error) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Unexpected password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-gray-600">
            We've sent password reset instructions to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">
              If an account with <strong>{email}</strong> exists, you'll receive an email with instructions to reset your password.
            </p>
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              variant="ghost"
              className="w-full text-purple-600 hover:text-purple-700"
            >
              Try Different Email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Reset Password
        </CardTitle>
        <CardDescription className="text-gray-600">
          Enter your email address and we'll send you instructions to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Instructions...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </Button>

            <Button
              type="button"
              onClick={onBack}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-700"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
