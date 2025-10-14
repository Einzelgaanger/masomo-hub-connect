import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, GraduationCap, Shield, CheckCircle, Users, BookOpen, Zap } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'bunifu.world' // Custom domain hint
          },
          scopes: 'openid email profile'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to authenticate with Google.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Balls - 8 Different Sizes */}
      <div className="absolute inset-0">
        {/* Original 4 balls */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue-400/40 rounded-full animate-float blur-sm"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-orange-400/40 rounded-full animate-float animation-delay-300 blur-sm"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-green-400/40 rounded-full animate-float animation-delay-600 blur-sm"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-purple-400/40 rounded-full animate-float animation-delay-900 blur-sm"></div>
        
        {/* 4 Additional balls with different sizes */}
        <div className="absolute top-60 left-1/4 w-12 h-12 bg-pink-400/40 rounded-full animate-float animation-delay-200 blur-sm"></div>
        <div className="absolute top-10 right-1/3 w-32 h-32 bg-cyan-400/40 rounded-full animate-float animation-delay-500 blur-sm"></div>
        <div className="absolute bottom-60 right-1/4 w-18 h-18 bg-yellow-400/40 rounded-full animate-float animation-delay-800 blur-sm"></div>
        <div className="absolute bottom-10 left-1/3 w-14 h-14 bg-red-400/40 rounded-full animate-float animation-delay-1100 blur-sm"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-start px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-20">

        {/* Logo Section - Mobile and Desktop */}
        <div className="text-center mb-0 sm:mb-1 animate-fade-in">
          {/* Mobile: Custom Layout */}
          <div className="block sm:hidden mb-6">
            <div className="flex items-start gap-3 mb-4">
              {/* Owl Icon */}
              <div className="flex-shrink-0">
                <img src="/logo.svg" alt="Bunifu Logo" className="h-28 w-28" />
              </div>
              
              {/* Name and Tagline to the right */}
              <div className="flex-1 min-w-0 text-left">
                <h1 className="text-4xl font-bold fredoka-bold text-gray-900 leading-tight mb-1 text-left">Bunifu</h1>
                <p className="text-xl fredoka-medium text-gray-600 leading-tight text-left">Where learning meets creativity</p>
              </div>
            </div>
          </div>
          
          {/* Desktop: Logo Component */}
          <div className="hidden sm:flex justify-center mb-6">
            <Logo size="xl" showText={true} className="scale-125 sm:scale-150" />
          </div>
          
        </div>

        {/* Auth Card */}
        <div className="max-w-md mx-auto w-full animate-slide-up animation-delay-400">
          <Card className="border-2 border-blue-100 shadow-none bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                  Welcome to Bunifu
                </h2>
              <p className="text-sm text-gray-600 fredoka-medium">
                  Sign in with your school email to continue
              </p>
            </div>
          </CardHeader>
            <CardContent className="px-6 pb-6">
              {/* School Email Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-amber-800 fredoka-medium">
                      Important: Use Your School Email
                    </h3>
                    <p className="text-xs text-amber-700 fredoka-medium">
                      Please make sure to use your official school email address (e.g., student@university.edu) 
                      when signing in with Google. This is required for account verification and access to your classes.
                    </p>
                  </div>
                </div>
                </div>

                {/* Google OAuth Button */}
                <Button
                type="button"
                  variant="outline"
                className="w-full h-12 border-2 border-gray-200 hover:scale-105 transition-transform duration-200 mb-6 hover:bg-white hover:border-gray-200 hover:text-gray-900"
                onClick={handleGoogleAuth}
                  disabled={loading}
                >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  </svg>
                <span className="font-semibold text-base">
                  {loading ? "Signing in..." : "Continue with Google"}
                </span>
                </Button>

              {/* Back Button */}
            <div className="text-center">
              <Link
                to="/"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Homepage
              </Link>
            </div>

              {/* Security Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 fredoka-medium mb-1">
                      Your Privacy Matters
                    </h4>
                    <p className="text-xs text-blue-700 fredoka-medium">
                      Your school email is only used for verification and will not be shared with third parties. 
                      We respect your privacy and academic data.
                    </p>
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

          {/* Footer */}
          <div className="text-center mt-6 animate-slide-up animation-delay-600">
            <p className="text-xs text-gray-500 fredoka-medium">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

