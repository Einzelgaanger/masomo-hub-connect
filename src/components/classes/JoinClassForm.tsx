import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  BookOpen, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Clock,
  X
} from "lucide-react";

interface ClassInfo {
  id: string;
  name: string;
  description: string;
  class_code: string;
  created_at: string;
  units_count: number;
  members_count: number;
  creator_name: string;
}

interface JoinClassFormProps {
  onSuccess: (classData: any) => void;
  onCancel: () => void;
}

const JoinClassForm = ({ onSuccess, onCancel }: JoinClassFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [joinData, setJoinData] = useState({
    name: '',
    message: ''
  });
  const [requestStatus, setRequestStatus] = useState<{
    status: 'none' | 'pending' | 'approved' | 'rejected';
    message?: string;
  }>({ status: 'none' });

  const checkExistingRequest = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_join_requests')
        .select('status, rejection_reason')
        .eq('class_id', classId)
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setRequestStatus({
          status: data.status as 'pending' | 'approved' | 'rejected',
          message: data.rejection_reason || undefined
        });
      } else {
        setRequestStatus({ status: 'none' });
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
      setRequestStatus({ status: 'none' });
    }
  };

  const searchClass = async () => {
    if (!classCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class code.",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      // First check if the code is valid (not expired)
      const { data: isValid, error: validityError } = await supabase.rpc('is_class_code_valid', {
        code: classCode.trim().toUpperCase()
      });

      if (validityError) throw validityError;

      if (!isValid) {
        toast({
          title: "Invalid or Expired Code",
          description: "This class code is either invalid or has expired. Please check with the class creator for a new code.",
          variant: "destructive",
        });
        return;
      }

      // Get the class data
      const { data: classData, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          class_code,
          created_at,
          creator_id,
          code_expires,
          code_expires_at
        `)
        .eq('class_code', classCode.trim().toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Class Not Found",
            description: "No class found with this code. Please check the code and try again.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Get creator profile separately
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', classData.creator_id)
        .single();

      const data = {
        ...classData,
        profiles: creatorProfile
      };

      // Get additional class info
      const [unitsResult, membersResult] = await Promise.all([
        supabase
          .from('class_units')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', data.id),
        supabase
          .from('class_members')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', data.id)
      ]);

      setClassInfo({
        id: data.id,
        name: data.name,
        description: data.description,
        class_code: data.class_code,
        created_at: data.created_at,
        units_count: unitsResult.count || 0,
        members_count: membersResult.count || 0,
        creator_name: data.profiles?.full_name || 'Unknown'
      });

      // Check if user already has a request for this class
      await checkExistingRequest(data.id);

      // Reset join data
      setJoinData({
        name: '',
        message: ''
      });

    } catch (error) {
      console.error('Error searching class:', error);
      toast({
        title: "Error",
        description: "Failed to search for class. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const submitJoinRequest = async () => {
    if (!classInfo) return;

    if (!joinData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('class_join_requests')
        .insert({
          class_id: classInfo.id,
          user_id: user?.id,
          requester_name: joinData.name.trim(),
          requester_email: user?.email || '',
          request_message: joinData.message.trim() || null
        });

      if (error) throw error;

      // Update request status to pending
      setRequestStatus({ status: 'pending' });

      toast({
        title: "Join Request Sent",
        description: "Your request has been sent to the class creator for approval.",
      });
    } catch (error) {
      console.error('Error submitting join request:', error);
      toast({
        title: "Error",
        description: "Failed to submit join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClassCode('');
    setClassInfo(null);
    setJoinData({ name: '', message: '' });
    setRequestStatus({ status: 'none' });
  };

  return (
    <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Join a Class
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6 px-6">
        {/* Class Code Search */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="class-code">Class Code</Label>
            <div className="flex gap-2">
              <Input
                id="class-code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="Enter class code (e.g., ABC123)"
                className="flex-1"
              />
              <Button 
                onClick={searchClass} 
                disabled={searching || !classCode.trim()}
              >
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>

        {/* Class Information */}
        {classInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Class Found!</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-900">{classInfo.name}</h3>
                <Badge variant="outline" className="text-xs">{classInfo.class_code}</Badge>
              </div>
              
              {classInfo.description && (
                <p className="text-sm text-green-700 line-clamp-2">{classInfo.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-green-600">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{classInfo.units_count} units</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{classInfo.members_count} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{classInfo.creator_name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Request Form */}
        {classInfo && (
          <div className="space-y-4">
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="join-name">Your Name *</Label>
                <Input
                  id="join-name"
                  value={joinData.name}
                  onChange={(e) => setJoinData({...joinData, name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="join-message">Message (Optional)</Label>
                <Textarea
                  id="join-message"
                  value={joinData.message}
                  onChange={(e) => setJoinData({...joinData, message: e.target.value})}
                  placeholder="Tell the class creator why you want to join..."
                  rows={3}
                />
              </div>
            </div>

            {/* Request Status Display */}
            {requestStatus.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Request Pending</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Your join request is pending approval from the class creator.
                </p>
              </div>
            )}

            {requestStatus.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <X className="h-4 w-4" />
                  <span className="font-medium">Request Rejected</span>
                </div>
                <p className="text-sm text-red-700">
                  Your join request was rejected.
                  {requestStatus.message && (
                    <>
                      <br />
                      <strong>Reason:</strong> {requestStatus.message}
                    </>
                  )}
                </p>
              </div>
            )}

            {requestStatus.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Request Approved</span>
                </div>
                <p className="text-sm text-green-700">
                  Your join request has been approved! You are now a member of this class.
                </p>
              </div>
            )}

            {requestStatus.status === 'none' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Approval Required</span>
                </div>
                <p className="text-sm text-blue-700">
                  Your join request will be sent to the class creator for approval. 
                  You'll be notified once they respond.
                </p>
              </div>
            )}
          </div>
        )}

      </CardContent>
      
      {/* Action Buttons - Sticky Footer */}
      <div className="flex-shrink-0 p-6 pt-4 border-t bg-background">
        <div className="flex gap-3">
          {classInfo ? (
            <>
              <Button 
                onClick={submitJoinRequest} 
                disabled={loading || !joinData.name.trim() || requestStatus.status === 'pending' || requestStatus.status === 'approved'}
                className="flex-1"
              >
                {loading ? "Sending Request..." : 
                 requestStatus.status === 'pending' ? "Request Pending" :
                 requestStatus.status === 'approved' ? "Already Approved" :
                 requestStatus.status === 'rejected' ? "Send New Request" :
                 "Send Join Request"}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={loading}
              >
                Search Another
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default JoinClassForm;
