import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Bell,
  X,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  class_id: string;
  class_name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  requested_at: string;
  processed_at?: string;
  is_new: boolean;
}

export function JoinRequestNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
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
        .order('processed_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedNotifications = data?.map(req => ({
        id: req.id,
        class_id: req.class_id,
        class_name: req.classes?.name || 'Unknown Class',
        status: req.status,
        rejection_reason: req.rejection_reason,
        requested_at: req.requested_at,
        processed_at: req.processed_at,
        is_new: req.processed_at ? 
          new Date(req.processed_at).getTime() > Date.now() - 24 * 60 * 60 * 1000 : false
      })) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
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
        return <Bell className="h-4 w-4 text-gray-500" />;
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
        return 'Approved!';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const handleViewDetails = (notification: Notification) => {
    // Navigate to the class or show more details
    toast({
      title: "Viewing Details",
      description: `Opening details for ${notification.class_name}`,
    });
  };

  const newNotifications = notifications.filter(n => n.is_new);
  const hasNewNotifications = newNotifications.length > 0;

  if (loading) {
    return null;
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="space-y-2">
        {notifications.slice(0, 3).map((notification) => (
          <Card 
            key={notification.id} 
            className={`border-l-4 ${
              notification.status === 'approved' ? 'border-l-green-500' :
              notification.status === 'rejected' ? 'border-l-red-500' :
              'border-l-yellow-500'
            } shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(notification.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {notification.class_name}
                    </h4>
                    <Badge className={getStatusColor(notification.status)}>
                      {getStatusText(notification.status)}
                    </Badge>
                    {notification.is_new && (
                      <Badge variant="destructive" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  
                  {notification.status === 'approved' && (
                    <p className="text-sm text-green-700 mb-2">
                      🎉 Congratulations! You've been approved to join this class.
                    </p>
                  )}
                  
                  {notification.status === 'rejected' && notification.rejection_reason && (
                    <p className="text-sm text-red-700 mb-2">
                      Reason: {notification.rejection_reason}
                    </p>
                  )}
                  
                  {notification.status === 'pending' && (
                    <p className="text-sm text-yellow-700 mb-2">
                      Your request is being reviewed by the class creator.
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {notification.processed_at ? 
                        `Processed ${new Date(notification.processed_at).toLocaleDateString()}` :
                        `Requested ${new Date(notification.requested_at).toLocaleDateString()}`
                      }
                    </p>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(notification)}
                        className="h-6 px-2 text-xs"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {notifications.length > 3 && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  +{notifications.length - 3} more notifications
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="h-6 px-2 text-xs"
                >
                  {showNotifications ? 'Hide' : 'Show All'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
