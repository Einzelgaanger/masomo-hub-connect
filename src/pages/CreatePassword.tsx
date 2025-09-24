import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";

const CreatePassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
      checks: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers
      }
    };
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters with uppercase, lowercase, and numbers.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (token) {
        // Use token-based password reset
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) throw error;
      } else if (email) {
        // Admin-based password reset
        const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
        
        if (userError || !userData.user) {
          toast({
            title: "Error",
            description: "User not found with this email address.",
            variant: "destructive",
          });
          return;
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
          password: password
        });

        if (updateError) throw updateError;
      } else {
        throw new Error("No token or email provided");
      }

      setSuccess(true);
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully updated. You can now login with your new password.",
      });

    } catch (error: any) {
      console.error('Create password error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Balls */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue-400/25 rounded-full animate-float blur-sm"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-orange-400/25 rounded-full animate-float animation-delay-300 blur-sm"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-green-400/25 rounded-full animate-float animation-delay-600 blur-sm"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-purple-400/25 rounded-full animate-float animation-delay-900 blur-sm"></div>
        <div className="absolute top-60 left-1/4 w-12 h-12 bg-pink-400/25 rounded-full animate-float animation-delay-200 blur-sm"></div>
        <div className="absolute top-10 right-1/3 w-32 h-32 bg-cyan-400/25 rounded-full animate-float animation-delay-500 blur-sm"></div>
        <div className="absolute bottom-60 right-1/4 w-18 h-18 bg-yellow-400/25 rounded-full animate-float animation-delay-800 blur-sm"></div>
        <div className="absolute bottom-10 left-1/3 w-14 h-14 bg-red-400/25 rounded-full animate-float animation-delay-1100 blur-sm"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-start px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-20">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
          </Link>
        </div>

        {/* Create Password Card */}
        <div className="max-w-sm mx-auto w-full">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                    {success ? "Password Created!" : "Create New Password"}
                  </h1>
                  <p className="text-sm text-gray-600 fredoka-medium">
                    {success 
                      ? "Your password has been successfully updated" 
                      : "Enter your new secure password"
                    }
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-5 pb-5">
              {!success ? (
                <form onSubmit={handleCreatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 fredoka-medium">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {/* Password Requirements */}
                    {password && (
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${passwordValidation.checks.minLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${passwordValidation.checks.hasUpperCase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          One uppercase letter
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${passwordValidation.checks.hasLowerCase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          One lowercase letter
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${passwordValidation.checks.hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${passwordValidation.checks.hasNumbers ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          One number
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 fredoka-medium">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600 fredoka-medium">Passwords do not match</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-600 fredoka-medium">Passwords match ✓</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold text-base rounded-lg transition-all duration-300 hover:scale-105" 
                    disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
                  >
                    {loading ? "Creating..." : "Create Password"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800 fredoka-semibold">
                          Password Successfully Created!
                        </p>
                        <p className="text-xs text-green-700 fredoka-medium">
                          You can now login with your new password
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold"
                  >
                    Go to Login
                  </Button>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 fredoka-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePassword;
