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
import { Plus, Calendar, Trash2, Clock, ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { format, formatDistanceToNow, isAfter, isToday, isTomorrow, isYesterday } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  created_at: string;
  created_by: string;
  profiles?: {
    full_name: string;
    profile_picture_url: string;
  };
  upload_reactions: Array<{
    user_id: string;
    reaction_type: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    commented_by: string;
    profiles?: {
      full_name: string;
      profile_picture_url: string;
    };
  }>;
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
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

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
      // Fetch events without foreign key relationships
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('unit_id', unitId)
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        return;
      }

      // Fetch profiles for event creators
      const creatorIds = [...new Set(eventsData.map(event => event.created_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', creatorIds);

      // Fetch reactions for all events
      const eventIds = eventsData.map(event => event.id);
      const { data: reactionsData } = await supabase
        .from('upload_reactions')
        .select('upload_id, user_id, reaction_type')
        .in('upload_id', eventIds);

      // Fetch comments for all events
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id, upload_id, content, created_at, commented_by')
        .in('upload_id', eventIds);

      // Get commenter profiles
      const commenterIds = commentsData ? [...new Set(commentsData.map(comment => comment.commented_by))] : [];
      const { data: commenterProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', commenterIds);

      // Combine the data
      const eventsWithData = eventsData.map(event => {
        const profile = profilesData?.find(p => p.user_id === event.created_by);
        const reactions = reactionsData?.filter(r => r.upload_id === event.id) || [];
        const comments = commentsData?.filter(c => c.upload_id === event.id) || [];
        
        const commentsWithProfiles = comments.map(comment => ({
          ...comment,
          profiles: commenterProfiles?.find(p => p.user_id === comment.commented_by)
        }));

        return {
          ...event,
          profiles: profile,
          upload_reactions: reactions,
          comments: commentsWithProfiles
        };
      });

      setEvents(eventsWithData as unknown as Event[]);
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

  const getUserReaction = (event: Event) => {
    return event.upload_reactions.find(r => r.user_id === user?.id)?.reaction_type;
  };

  const getLikesCount = (event: Event) => {
    return event.upload_reactions.filter(r => r.reaction_type === 'like').length;
  };

  const getDislikesCount = (event: Event) => {
    return event.upload_reactions.filter(r => r.reaction_type === 'dislike').length;
  };

  const handleReaction = async (eventId: string, reactionType: 'like' | 'dislike') => {
    try {
      const existingReaction = await supabase
        .from('upload_reactions')
        .select('id')
        .eq('upload_id', eventId)
        .eq('user_id', user?.id)
        .single();

      if (existingReaction.data) {
        // Update existing reaction
        await supabase
          .from('upload_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.data.id);
      } else {
        // Create new reaction
        await supabase
          .from('upload_reactions')
          .insert({
            upload_id: eventId,
            user_id: user?.id,
            reaction_type: reactionType
          });
      }

      // Update like/dislike counts
      const pointsChange = reactionType === 'like' ? 2 : -1;
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: pointsChange
      });

      fetchEvents();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleAddComment = async (eventId: string) => {
    try {
      if (!newComment.trim()) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          upload_id: eventId,
          content: newComment.trim(),
          commented_by: user?.id
        });

      if (error) throw error;

      // Award points for commenting
      await supabase.rpc('update_user_points', {
        user_uuid: user?.id,
        points_change: 3
      });

      setNewComment("");
      fetchEvents();
    } catch (error) {
      console.error('Error adding comment:', error);
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
                    <div className="mb-4">
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
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <Button
                        variant={getUserReaction(event) === 'like' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleReaction(event.id, 'like')}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {getLikesCount(event)}
                      </Button>
                      <Button
                        variant={getUserReaction(event) === 'dislike' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleReaction(event.id, 'dislike')}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {getDislikesCount(event)}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {event.comments.length} Comments
                      </Button>
                    </div>

                    {expandedEvent === event.id && (
                      <div className="border-t pt-4">
                        <div className="space-y-3 mb-4">
                          {event.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profiles?.profile_picture_url} />
                                <AvatarFallback>
                                  {comment.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-sm">{comment.content}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {comment.profiles?.full_name} • {format(new Date(comment.created_at), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(event.id)}
                          />
                          <Button onClick={() => handleAddComment(event.id)}>
                            Comment
                          </Button>
                        </div>
                      </div>
                    )}
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
