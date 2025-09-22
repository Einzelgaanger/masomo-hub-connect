import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap } from "lucide-react";

const Login = () => {
  const [mode, setMode] = useState<'lookup' | 'signin'>('lookup');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  
  // Lookup form
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  
  // Signin form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStudentLookup = async () => {
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
          description: "Please check your country, university, and admission number.",
          variant: "destructive",
        });
        return;
      }

      setStudentData(data);
      setEmail(data.email);
      setMode('signin');
      
      toast({
        title: "Student found!",
        description: "Please confirm your details and sign in.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Masomo Hub
            </h1>
          </div>
          <p className="text-muted-foreground">Where learning meets creativity</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <BookOpen className="h-5 w-5" />
              {mode === 'lookup' ? 'Student Lookup' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              {mode === 'lookup' 
                ? 'Enter your details to find your account'
                : 'Sign in to your account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'lookup' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Tanzania">Tanzania</SelectItem>
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">University</label>
                  <Input
                    placeholder="Enter your university name"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admission Number</label>
                  <Input
                    placeholder="Enter your admission number"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleStudentLookup} 
                  className="w-full"
                  disabled={loading || !country || !university || !admissionNumber}
                >
                  {loading ? 'Looking up...' : 'Find My Account'}
                </Button>
              </>
            ) : (
              <>
                {studentData && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm"><strong>Name:</strong> {studentData.full_name}</p>
                    <p className="text-sm"><strong>Email:</strong> {studentData.email}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Is this correct? If yes, use your registered email and password to sign in.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!studentData}
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
                  disabled={loading || !email || !password}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => setMode('lookup')} 
                  className="w-full"
                >
                  Back to Lookup
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;