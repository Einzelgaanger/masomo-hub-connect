import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, User, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Concern {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'addressed';
  admin_notes?: string;
  profiles: {
    full_name: string;
    profile_picture_url?: string;
    email: string;
  };
}

export default function AdminConcerns() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingConcern, setEditingConcern] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchConcerns();
  }, [statusFilter]);

  const fetchConcerns = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('concerns')
        .select(`
          *,
          profiles!inner(full_name, profile_picture_url, email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConcerns(data || []);
    } catch (error) {
      console.error('Error fetching concerns:', error);
      toast({
        title: "Error",
        description: "Failed to load concerns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConcern = async (concernId: string) => {
    try {
      const { error } = await supabase
        .from('concerns')
        .update({
          status: newStatus as 'pending' | 'reviewed' | 'addressed',
          admin_notes: adminNotes.trim() || null
        })
        .eq('id', concernId);

      if (error) throw error;

      toast({
        title: "Concern updated",
        description: "The concern has been updated successfully",
      });

      setEditingConcern(null);
      setAdminNotes('');
      setNewStatus('');
      fetchConcerns();
    } catch (error) {
      console.error('Error updating concern:', error);
      toast({
        title: "Error",
        description: "Failed to update concern",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'reviewed':
        return <Clock className="h-4 w-4" />;
      case 'addressed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'addressed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredConcerns = concerns.filter(concern => {
    if (statusFilter === 'all') return true;
    return concern.status === statusFilter;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              User Concerns & Feedback
            </h1>
            <p className="text-muted-foreground mt-2">
              Review and manage user concerns, feedback, and ideas
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Concerns</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="addressed">Addressed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchConcerns} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredConcerns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No concerns found</h3>
              <p className="text-muted-foreground text-center">
                {statusFilter === 'all' 
                  ? "No concerns have been submitted yet."
                  : `No concerns with status "${statusFilter}" found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredConcerns.map((concern) => (
              <Card key={concern.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={concern.profiles.profile_picture_url} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{concern.profiles.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{concern.profiles.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(concern.status)}>
                        {getStatusIcon(concern.status)}
                        <span className="ml-1 capitalize">{concern.status}</span>
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingConcern(concern.id);
                          setAdminNotes(concern.admin_notes || '');
                          setNewStatus(concern.status);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(concern.created_at), 'PPP p')}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">User's Concern:</h4>
                      <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                        {concern.message}
                      </p>
                    </div>
                    
                    {concern.admin_notes && (
                      <div>
                        <h4 className="font-medium mb-2">Admin Notes:</h4>
                        <p className="text-sm bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                          {concern.admin_notes}
                        </p>
                      </div>
                    )}
                    
                    {editingConcern === concern.id && (
                      <div className="space-y-3 pt-4 border-t">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Status:</label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="addressed">Addressed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Admin Notes:</label>
                          <Textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add notes about this concern..."
                            className="min-h-20"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingConcern(null);
                              setAdminNotes('');
                              setNewStatus('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateConcern(concern.id)}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
