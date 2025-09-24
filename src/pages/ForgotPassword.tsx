import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, admission_number')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        toast({
          title: "Email Not Found",
          description: "No account found with this email address. Please check your email or contact your administrator.",
          variant: "destructive",
        });
        return;
      }

      // Get user from auth
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (userError || !userData.user) {
        toast({
          title: "Account Not Activated",
          description: "This email is registered but the account hasn't been activated yet. Please contact your administrator.",
          variant: "destructive",
        });
        return;
      }

      // Generate new password
      const newPassword = generatePassword();

      // Update user password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
        password: newPassword
      });

      if (updateError) throw updateError;

      // Send password reset email via Edge Function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          email: email,
          type: 'password_reset',
          name: profileData.full_name,
          password: newPassword,
          admissionNumber: profileData.admission_number
        }
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        toast({
          title: "Password Reset!",
          description: `Your new password is: ${newPassword}. Please save this and login. (Email service error)`,
        });
      } else if (emailData && emailData.error) {
        console.error('Email service error:', emailData.error);
        toast({
          title: "Password Reset!",
          description: `Your new password is: ${newPassword}. Please save this and login. (Email service error)`,
        });
      } else {
        toast({
          title: "Password Reset Sent!",
          description: `A new password has been sent to ${email}. Please check your email and login with the new password.`,
        });
      }
      setEmailSent(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again or contact your administrator.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

        {/* Forgot Password Card */}
        <div className="max-w-sm mx-auto w-full">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                  {emailSent ? "Check Your Email" : "Forgot Password"}
                </h1>
                <p className="text-sm text-gray-600 fredoka-medium">
                  {emailSent 
                    ? "We've sent you a new password" 
                    : "Enter your email to receive a new password"
                  }
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="px-5 pb-5">
              {!emailSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 fredoka-medium">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold text-base rounded-lg transition-all duration-300 hover:scale-105" 
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send New Password"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800 fredoka-semibold">
                          Password Reset Complete!
                        </p>
                        <p className="text-xs text-green-700 fredoka-medium">
                          Check your email for the new password
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/login')}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold"
                    >
                      Back to Login
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                      className="w-full h-10 border-2 border-gray-300 hover:border-gray-400 fredoka-medium"
                    >
                      Reset Another Password
                    </Button>
                  </div>
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

export default ForgotPassword;
