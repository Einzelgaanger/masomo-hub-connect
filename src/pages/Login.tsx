import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, ArrowLeft, Mail, User } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Login = () => {
  const [mode, setMode] = useState<'lookup' | 'confirm' | 'signin'>('lookup');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  
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

  const sendWelcomeEmail = async (email: string, name: string, password: string, admissionNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: JSON.stringify({
          to: email,
          subject: 'Bunifu - Your Account Credentials',
          template: 'welcome',
          context: {
            fullName: name,
            password: password,
            loginUrl: window.location.origin + '/login',
            admissionNumber: admissionNumber
          }
        }),
      });

      if (error) {
        console.error('Email sending error:', error);
        return false;
      }

      if (data && data.error) {
        console.error('Email service error:', data.error);
        return false;
      }

      console.log('Welcome email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

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

      // For now, just show a message that the user needs to contact admin
      toast({
        title: "Account Confirmation Required",
        description: "Please contact your administrator to confirm your account. Your account is ready but needs manual activation.",
        variant: "destructive",
      });
      
      // Move to sign-in mode
      setMode('signin');
      setEmail(studentData.email);
      return;

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

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate new password
      const newPassword = generatePassword();

      // Update user password
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
        password: newPassword
      });

      if (updateError) throw updateError;

      // Get user profile for email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, admission_number')
        .eq('email', email)
        .single();

      // Send password reset email
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          type: 'password_reset',
          name: profileData?.full_name || 'Student',
          password: newPassword,
          admissionNumber: profileData?.admission_number || ''
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Password Reset Email Content:', result.emailContent);
        toast({
          title: "Password Reset Sent!",
          description: `A new password has been sent to ${email}. Please check your email and login with the new password.`,
        });
      } else {
        toast({
          title: "Password Reset!",
          description: `Your new password is: ${newPassword}. Please save this and login.`,
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={true} />
          </div>
          <CardDescription>
            {mode === 'lookup' && "Find your student account"}
            {mode === 'confirm' && "Confirm your details"}
            {mode === 'signin' && "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'lookup' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Input
                  placeholder="e.g., Kenya, Uganda, Tanzania"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">University</label>
                <Input
                  placeholder="e.g., University of Nairobi"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Admission Number</label>
                <Input
                  placeholder="e.g., ADM001"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleStudentLookup} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Looking up..." : "Find My Account"}
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  onClick={() => setMode('signin')}
                  className="text-sm"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </>
          )}

          {mode === 'confirm' && studentData && (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Student Found!</h3>
                  <p className="text-sm text-green-700">
                    Please confirm your details below. A password will be sent to your email.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={studentData.full_name}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={studentData.email}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Your email address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admission Number</label>
                  <Input
                    value={studentData.admission_number}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Your admission number"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Next Steps:</p>
                      <p>1. Click "Confirm Account" to activate your account</p>
                      <p>2. A password will be sent to your email</p>
                      <p>3. Use your email and the password to sign in</p>
                      <p>4. You can change your password after logging in</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMode('lookup')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleConfirmStudent} 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Confirming Account..." : "Confirm Account"}
                </Button>
              </div>
            </>
          )}

          {mode === 'signin' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleSignIn} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center space-y-2">
                <Button 
                  variant="link" 
                  onClick={handleForgotPassword}
                  className="text-sm"
                  disabled={loading}
                >
                  Forgot your password?
                </Button>
                <br />
                <Button 
                  variant="link" 
                  onClick={() => setMode('lookup')}
                  className="text-sm"
                >
                  New student? Find your account
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;