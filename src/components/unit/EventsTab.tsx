import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Trash2, Clock } from "lucide-react";
import { format, formatDistanceToNow, isAfter, isToday, isTomorrow, isYesterday } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  created_at: string;
  created_by: string;
  profiles: {
    full_name: string;
    profile_picture_url: string;
  };
}

interface EventsTabProps {
  unitId: string;
  profile: any;
}

export function EventsTab({ unitId, profile }: EventsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: ""
  });

  useEffect(() => {
    fetchEvents();
  }, [unitId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url
          )
        `)
        .eq('unit_id', unitId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      if (!formData.title || !formData.description || !formData.event_date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);

      const { error } = await supabase
        .from('events')
        .insert({
          unit_id: unitId,
          title: formData.title,
          description: formData.description,
          event_date: formData.event_date,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully.",
      });

      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: ""
    });
  };

  const canManage = (event: Event) => {
    return event.created_by === user?.id || 
           ['lecturer', 'admin', 'super_admin'].includes(profile?.role);
  };

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const eventDateObj = new Date(eventDate);
    
    if (isAfter(now, eventDateObj)) {
      return { status: 'past', color: 'bg-gray-100 text-gray-800', icon: 'Past' };
    } else if (isToday(eventDateObj)) {
      return { status: 'today', color: 'bg-blue-100 text-blue-800', icon: 'Today' };
    } else if (isTomorrow(eventDateObj)) {
      return { status: 'tomorrow', color: 'bg-yellow-100 text-yellow-800', icon: 'Tomorrow' };
    } else {
      return { status: 'upcoming', color: 'bg-green-100 text-green-800', icon: 'Upcoming' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Create an event (exam, CAT, etc.) for this unit.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Midterm Exam, CAT 1, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the event details"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="event_date">Event Date & Time *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => {
              const eventStatus = getEventStatus(event.event_date);
              
              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={event.profiles.profile_picture_url} />
                          <AvatarFallback>
                            {event.profiles.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{event.title}</h3>
                            <Badge className={eventStatus.color}>
                              {eventStatus.icon}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            by {event.profiles.full_name} • {format(new Date(event.created_at), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm mt-2">{event.description}</p>
                        </div>
                      </div>
                      {canManage(event) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(event.event_date), 'EEEE, MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(event.event_date), 'HH:mm')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({formatDistanceToNow(new Date(event.event_date), { addSuffix: true })})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {events.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground">
                  Events (exams, CATs, etc.) will appear here when created.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
