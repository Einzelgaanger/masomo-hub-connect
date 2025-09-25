import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Eye, EyeOff, UserPlus } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Login = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  // Set initial mode based on URL parameter
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    const provider = searchParams.get('provider');
    const emailParam = searchParams.get('email');
    
    if (urlMode === 'signup') {
      setMode('signup');
    } else {
      setMode('signin');
    }

    // If provider is google and we have an email, auto-trigger Google OAuth
    if (provider === 'google' && emailParam) {
      setEmail(emailParam);
      handleGoogleSignUp();
    } else if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);
  
  // Signin form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      // Set flag to indicate this is a fresh login
      sessionStorage.setItem('fresh_login', 'true');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?source=google`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign up error:', error);
      toast({
        title: "Error",
        description: "Failed to sign up with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Set flag to indicate this is a fresh login
      sessionStorage.setItem('fresh_login', 'true');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has a profile (basic check for account activation)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        toast({
          title: "Account Not Found",
          description: "Your account profile was not found. Please sign up first.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      // Check if user has any applications and their status
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications' as any)
        .select('id, status')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (applicationError && applicationError.code !== 'PGRST116') {
        console.error('Application check error:', applicationError);
      }

      // Redirect based on user state
      if (profileData.role === 'admin' || profileData.role === 'super_admin') {
        toast({
          title: "Welcome Back, Admin!",
          description: "You have been signed in successfully.",
        });
        navigate('/admin');
      } else if (applicationData && (applicationData as any).status === 'approved') {
        toast({
          title: "Welcome Back!",
          description: "You have been signed in successfully.",
        });
        navigate('/dashboard');
      } else if (applicationData && (applicationData as any).status === 'pending') {
        toast({
          title: "Application Pending",
          description: "Your application is being reviewed. Please check back later.",
        });
        // Stay on login page or redirect to a waiting page
        return;
      } else if (applicationData && (applicationData as any).status === 'rejected') {
        toast({
          title: "Application Rejected",
          description: "Your application was rejected. Please try again with correct details.",
          variant: "destructive",
        });
        navigate('/class-selection');
      } else {
        // User has signed up but hasn't submitted an application yet
        toast({
          title: "Complete Your Registration",
          description: "Please complete your class selection and application.",
        });
        navigate('/class-selection');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user with Supabase's built-in email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?source=email`
        }
      });

      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        // Send custom branded email after Supabase creates the user
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            email: signupEmail,
            type: 'email_confirmation',
            name: signupEmail.split('@')[0]
          }
        });

        if (emailError) {
          console.error('Custom email sending failed:', emailError);
          // Don't fail signup if custom email fails - Supabase email will still be sent
        }

        toast({
          title: "Check Your Email!",
          description: "Please check your email and click the confirmation link to continue. Make sure to use your school email address.",
        });
        
        // Don't navigate - wait for email confirmation
        setMode('signin'); // Switch to sign-in mode
      } else if (data.user && data.user.email_confirmed_at) {
        // Email already confirmed (shouldn't happen in normal flow)
        navigate('/class-selection');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
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

      <div className="relative z-10 min-h-screen flex flex-col justify-start px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-20">
        {/* Header with Logo */}
        <div className="text-center mb-4">
          <Link to="/" className="inline-block">
            <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
          </Link>
        </div>

        <div className="max-w-sm mx-auto w-full">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                {mode === 'signin' ? 'Welcome Back' : 'Join Bunifu'}
              </h1>
              <p className="text-sm text-gray-600 fredoka-medium">
                {mode === 'signin' 
                  ? 'Sign in to your account to continue learning'
                  : 'Create your account to start your academic journey'
                }
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-700 fredoka-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10 border border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700 fredoka-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 h-10 border border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Google OAuth Button */}
                <Button
                  onClick={handleGoogleSignUp}
                  variant="outline"
                  className="w-full h-10 border-2 border-gray-300 hover:border-gray-400"
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-sm font-semibold text-gray-700 fredoka-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 h-10 border border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-sm font-semibold text-gray-700 fredoka-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pr-10 h-10 border border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </div>
            )}

            <div className="text-center mt-8 mb-6">
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Homepage
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
