import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JoinRequest {
  id: string;
  user_id: string;
  requester_name: string;
  requester_email: string;
  request_message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

interface ClassJoinRequestBadgeProps {
  classId: string;
  className: string;
  onRequestProcessed?: () => void;
}

export function ClassJoinRequestBadge({ classId, className, onRequestProcessed }: ClassJoinRequestBadgeProps) {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchJoinRequests();
  }, [classId]);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_join_requests')
        .select('*')
        .eq('class_id', classId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setJoinRequests(data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      setJoinRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    try {
      setProcessing(requestId);
      
      // Update the request status
      const { error: updateError } = await supabase
        .from('class_join_requests')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add user to class members
      const { error: memberError } = await supabase
        .from('class_members')
        .insert({
          class_id: classId,
          user_id: userId,
          role: 'member'
        });

      if (memberError) throw memberError;

      toast({
        title: "Request Approved",
        description: "User has been added to the class.",
      });

      // Refresh the requests
      fetchJoinRequests();
      onRequestProcessed?.();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId: string, reason?: string) => {
    try {
      setProcessing(requestId);
      
      const { error } = await supabase
        .from('class_join_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: reason || 'Request rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "Join request has been rejected.",
      });

      // Refresh the requests
      fetchJoinRequests();
      onRequestProcessed?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const pendingRequests = joinRequests.filter(req => req.status === 'pending');
  const requestCount = pendingRequests.length;

  if (loading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Users className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  if (requestCount === 0) {
    return null; // Don't show badge if no requests
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600">
          <Users className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
          >
            {requestCount}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Requests for {className}
            <Badge variant="secondary">{requestCount} pending</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {request.requester_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{request.requester_name}</h4>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {request.requester_email}
                  </p>
                  
                  {request.request_message && (
                    <p className="text-sm text-muted-foreground mb-3">
                      "{request.request_message}"
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Requested {new Date(request.requested_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(request.id, request.user_id)}
                    disabled={processing === request.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {processing === request.id ? "Processing..." : "Approve"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={processing === request.id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {processing === request.id ? "Processing..." : "Reject"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {pendingRequests.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending join requests</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
