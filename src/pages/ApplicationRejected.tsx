import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { XCircle, Clock, Home } from "lucide-react";
import Logo from "@/components/ui/Logo";

const ApplicationRejected = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [canReapply, setCanReapply] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    // Check if user can reapply (1 week has passed since rejection)
    const checkReapplyStatus = () => {
      if (!user) return;

      const rejectionData = localStorage.getItem(`rejection_${user.id}`);
      if (rejectionData) {
        const { rejectedAt } = JSON.parse(rejectionData);
        const rejectionTime = new Date(rejectedAt);
        const now = new Date();
        const timeDiff = now.getTime() - rejectionTime.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        const hoursDiff = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
        
        if (daysDiff >= 7) {
          setCanReapply(true);
        } else {
          const remainingDays = 7 - daysDiff;
          const remainingHours = 24 - hoursDiff;
          setTimeRemaining(`${remainingDays} days and ${remainingHours} hours`);
        }
      } else {
        // If no rejection data found, allow reapplication
        setCanReapply(true);
      }
    };

    checkReapplyStatus();
    
    // Update countdown every hour
    const interval = setInterval(checkReapplyStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Balls */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-24 h-24 bg-red-400/25 rounded-full animate-float blur-sm"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-orange-400/25 rounded-full animate-float animation-delay-300 blur-sm"></div>
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-yellow-400/25 rounded-full animate-float animation-delay-600 blur-sm"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-pink-400/25 rounded-full animate-float animation-delay-900 blur-sm"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" showText={true} className="scale-125 sm:scale-150" />
        </div>

        <div className="max-w-md mx-auto w-full">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Application Not Approved
                  </h1>
                  <p className="text-sm text-gray-600">
                    Your application has been reviewed and unfortunately was not approved at this time.
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                {!canReapply ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Reapplication Cooldown
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You can submit a new application in:
                      </p>
                      <p className="text-lg font-bold text-orange-600">
                        {timeRemaining}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Please note:</strong> You can only submit one application per week. 
                        This helps us ensure fair processing for all applicants.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Ready to Try Again
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Your reapplication cooldown period has ended. You can now submit a new application.
                      </p>
                    </div>
                    <Button 
                      onClick={handleGoHome}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go to Homepage
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationRejected;
