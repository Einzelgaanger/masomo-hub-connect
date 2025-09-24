import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Login = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'lookup' | 'confirm' | 'signin'>('lookup');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

  // Set initial mode based on URL parameter
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signin') {
      setMode('signin');
    } else if (urlMode === 'lookup') {
      setMode('lookup');
    }
  }, [searchParams]);
  
  // Lookup form
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  
  // Confirm form
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [confirmedName, setConfirmedName] = useState('');
  
  // Signin form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();


  const handleStudentLookup = async () => {
    if (!country || !university || !admissionNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes!inner(
            university_id,
            universities!inner(
              name,
              countries!inner(name)
            )
          )
        `)
        .eq('admission_number', admissionNumber)
        .eq('classes.universities.countries.name', country)
        .eq('classes.universities.name', university)
        .single();

      if (error || !data) {
        toast({
          title: "Student not found",
          description: "No student found with the provided information. Please check your details or contact your administrator.",
          variant: "destructive",
        });
        return;
      }

      setStudentData(data);
      setConfirmedName(data.full_name);
      setConfirmedEmail(data.email);
      setMode('confirm');
    } catch (error) {
      console.error('Lookup error:', error);
      toast({
        title: "Error",
        description: "An error occurred while looking up your information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStudent = async () => {
    if (!studentData) {
      toast({
        title: "Error",
        description: "Student data not found.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user already has an auth account
      if (studentData.user_id) {
        toast({
          title: "Account Already Exists",
          description: "This student already has an account. Please use the sign-in option.",
          variant: "destructive",
        });
        setMode('signin');
        setEmail(studentData.email);
        return;
      }

      // Call the register-student Edge Function to create auth user and send email
      const { data, error } = await supabase.functions.invoke('register-student', {
        body: {
          email: studentData.email,
          fullName: studentData.full_name,
          admissionNumber: studentData.admission_number,
          profileId: studentData.id
        }
      });

      if (error) {
        console.error('Registration error:', error);
        toast({
          title: "Error",
          description: "Failed to create account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        console.error('Registration error:', data.error);
        toast({
          title: "Error",
          description: data.error || "Failed to create account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Success - show message about email
      toast({
        title: "Account Created Successfully!",
        description: data.emailSent 
          ? "Your account has been created and login credentials have been sent to your email."
          : `Your account has been created! Your password is: ${data.password}. Please save this password.`,
      });
      
      // Move to sign-in mode
      setMode('signin');
      setEmail(studentData.email);

    } catch (error) {
      console.error('Confirmation error:', error);
      toast({
        title: "Error",
        description: "Failed to confirm account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
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

      <div className="relative z-10 min-h-screen flex flex-col justify-start px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-20">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
          </Link>
        </div>

        {/* Main Card */}
        <div className="max-w-sm mx-auto w-full">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 fredoka-bold">
                  {mode === 'lookup' && "Find Your Account"}
                  {mode === 'confirm' && "Confirm Details"}
                  {mode === 'signin' && "Welcome Back"}
                </h1>
                <p className="text-sm text-gray-600 fredoka-medium">
                  {mode === 'lookup' && "Enter your university details to find your account"}
                  {mode === 'confirm' && "Please confirm your information below"}
                  {mode === 'signin' && "Sign in to continue your learning journey"}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              {mode === 'lookup' && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 fredoka-medium">Country</label>
                      <Input
                        placeholder="e.g., Kenya, Uganda, Tanzania"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 fredoka-medium">University</label>
                      <Input
                        placeholder="e.g., University of Nairobi"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 fredoka-medium">Admission Number</label>
                      <Input
                        placeholder="e.g., ADM001"
                        value={admissionNumber}
                        onChange={(e) => setAdmissionNumber(e.target.value)}
                        className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleStudentLookup} 
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold text-base rounded-lg transition-all duration-300 hover:scale-105" 
                    disabled={loading}
                  >
                    {loading ? "Looking up..." : "Find My Account"}
                  </Button>
                  
                  <div className="text-center pt-4">
                    <Button 
                      variant="link" 
                      onClick={() => setMode('signin')}
                      className="text-sm text-blue-600 hover:text-blue-700 fredoka-medium"
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>
                </>
              )}

              {mode === 'confirm' && studentData && (
                <>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2 fredoka-semibold">Student Found!</h3>
                      <p className="text-sm text-green-700 fredoka-medium">
                        Please confirm your details below. A password will be sent to your email.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 fredoka-medium">Full Name</label>
                        <Input
                          value={studentData.full_name}
                          readOnly
                          className="h-10 bg-gray-50 border-2 border-gray-200 rounded-lg fredoka-medium"
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 fredoka-medium">Email Address</label>
                        <Input
                          type="email"
                          value={studentData.email}
                          readOnly
                          className="h-10 bg-gray-50 border-2 border-gray-200 rounded-lg fredoka-medium"
                          placeholder="Your email address"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 fredoka-medium">Admission Number</label>
                        <Input
                          value={studentData.admission_number}
                          readOnly
                          className="h-10 bg-gray-50 border-2 border-gray-200 rounded-lg fredoka-medium"
                          placeholder="Your admission number"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold fredoka-semibold mb-2">Next Steps:</p>
                          <ul className="space-y-1 fredoka-medium">
                            <li>1. Click "Confirm Account" to activate your account</li>
                            <li>2. A password will be sent to your email</li>
                            <li>3. Use your email and the password to sign in</li>
                            <li>4. You can change your password after logging in</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setMode('lookup')}
                      className="flex-1 h-10 border-2 border-gray-300 hover:border-gray-400 fredoka-medium"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleConfirmStudent} 
                      className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 fredoka-semibold"
                      disabled={loading}
                    >
                      {loading ? "Confirming..." : "Confirm Account"}
                    </Button>
                  </div>
                </>
              )}

              {mode === 'signin' && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 fredoka-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 fredoka-medium">Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg fredoka-medium pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSignIn} 
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white fredoka-semibold text-base rounded-lg transition-all duration-300 hover:scale-105" 
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="text-center space-y-3 pt-4">
                    <Button 
                      variant="link" 
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-700 fredoka-medium"
                      disabled={loading}
                    >
                      Forgot your password?
                    </Button>
                    <br />
                    <Button 
                      variant="link" 
                      onClick={() => setMode('lookup')}
                      className="text-sm text-gray-600 hover:text-gray-700 fredoka-medium"
                    >
                      New student? Find your account
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Login;