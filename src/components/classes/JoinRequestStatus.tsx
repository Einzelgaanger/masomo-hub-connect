import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  User,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface JoinRequestStatus {
  id: string;
  class_id: string;
  class_name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  requested_at: string;
  processed_at?: string;
}

export function JoinRequestStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequestStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchJoinRequests();
    }
  }, [user]);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_join_requests')
        .select(`
          id,
          class_id,
          status,
          rejection_reason,
          requested_at,
          processed_at,
          classes!inner(
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = data?.map(req => ({
        id: req.id,
        class_id: req.class_id,
        class_name: req.classes?.name || 'Unknown Class',
        status: req.status,
        rejection_reason: req.rejection_reason,
        requested_at: req.requested_at,
        processed_at: req.processed_at
      })) || [];

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast({
        title: "Error",
        description: "Failed to load join request status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJoinRequests();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Join request status updated.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'pending':
        return 50;
      case 'approved':
        return 100;
      case 'rejected':
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Join Request Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading your requests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Join Request Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Join Requests</h3>
            <p className="text-muted-foreground">
              You haven't submitted any join requests yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Join Request Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{request.class_name}</h4>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{getStatusText(request.status)}</span>
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{getProgressValue(request.status)}%</span>
                  </div>
                  <Progress 
                    value={getProgressValue(request.status)} 
                    className="h-2"
                  />
                </div>

                {/* Status Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Requested</p>
                      <p className="font-medium">
                        {new Date(request.requested_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {request.processed_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Processed</p>
                        <p className="font-medium">
                          {new Date(request.processed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                {request.status === 'rejected' && request.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                        <p className="text-sm text-red-700 mt-1">{request.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {request.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Under Review</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your request is being reviewed by the class creator. You'll be notified once a decision is made.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Request Approved!</p>
                        <p className="text-sm text-green-700 mt-1">
                          Congratulations! You've been added to the class. You can now access all class materials and participate in discussions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
