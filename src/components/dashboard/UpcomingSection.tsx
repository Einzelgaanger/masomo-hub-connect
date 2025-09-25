import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Building, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, isAfter, startOfDay } from "date-fns";

export function UpcomingSection() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'university' | 'global'>('university');

  useEffect(() => {
    if (user) {
      fetchUpcoming();
    }
  }, [user, viewMode]);

  const fetchUpcoming = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      if (viewMode === 'university') {
        // First get the current user's university
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            classes!inner(
              university_id
            )
          `)
          .eq('user_id', user?.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Error fetching user profile:', profileError);
          return;
        }

        // Fetch upcoming assignments from user's university
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            units(name, classes!inner(id, university_id))
          `)
          .eq('units.classes.university_id', userProfile.classes.university_id)
          .gte('deadline', now)
          .order('deadline', { ascending: true })
          .limit(10);

        // Fetch upcoming events from user's university
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            units(name, classes!inner(id, university_id))
          `)
          .eq('units.classes.university_id', userProfile.classes.university_id)
          .gte('event_date', now)
          .order('event_date', { ascending: true })
          .limit(10);

        if (assignmentsError) throw assignmentsError;
        if (eventsError) throw eventsError;

        // Combine and sort by date
        const combined = [
          ...(assignments || []).map(item => ({ ...item, type: 'assignment', date: item.deadline })),
          ...(events || []).map(item => ({ ...item, type: 'event', date: item.event_date }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
         .slice(0, 10);

        setUpcoming(combined);
      } else {
        // Global mode - fetch global public events
        const { data: globalEvents, error: globalEventsError } = await (supabase as any)
          .from('public_events')
          .select(`
            *,
            profiles(
              full_name,
              classes!inner(
                course_name,
                universities!inner(name)
              )
            )
          `)
          .gte('event_date', now)
          .order('event_date', { ascending: true })
          .limit(10);

        if (globalEventsError) throw globalEventsError;

        // Transform global events to match the expected format
        const transformedEvents = (globalEvents || []).map(item => ({
          ...item,
          type: 'global_event',
          title: item.title,
          date: item.event_date,
          description: item.description,
          location: item.location
        }));

        setUpcoming(transformedEvents);
      }
    } catch (error) {
      console.error('Error fetching upcoming items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment': return 'bg-blue-500';
      case 'event': return 'bg-green-500';
      case 'global_event': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment': return FileText;
      case 'event': return Calendar;
      case 'global_event': return Globe;
      default: return Calendar;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Upcoming
          </CardTitle>
          <div className="flex gap-1 w-full sm:w-auto">
            <Button
              variant={viewMode === 'university' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('university')}
              className="flex items-center gap-1 flex-1 sm:flex-none"
            >
              <Building className="h-3 w-3" />
              <span className="hidden xs:inline">My Uni</span>
              <span className="xs:hidden">Uni</span>
            </Button>
            <Button
              variant={viewMode === 'global' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('global')}
              className="flex items-center gap-1 flex-1 sm:flex-none"
            >
              <Globe className="h-3 w-3" />
              Global
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming items</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
            {upcoming.map((item) => {
              const Icon = getTypeIcon(item.type);
              const isOverdue = isAfter(new Date(), new Date(item.date));
              
              return (
                <div key={`${item.type}-${item.id}`} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${getTypeColor(item.type)} text-white flex-shrink-0`}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h4 className="font-medium text-xs sm:text-sm truncate">{item.title}</h4>
                      <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs w-fit">
                        {item.type === 'assignment' ? 'Assignment' : 
                         item.type === 'event' ? 'Event' : 
                         item.type === 'global_event' ? 'Global Event' : item.type}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1 sm:mb-2 truncate">
                      {item.type === 'global_event' 
                        ? `${item.profiles?.classes?.course_name} • ${item.profiles?.classes?.universities?.name}`
                        : item.units?.name}
                    </p>
                    
                    {item.type === 'global_event' && item.location && (
                      <p className="text-xs text-muted-foreground mb-1 sm:mb-2 truncate">
                        📍 {item.location}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className={isOverdue ? "text-destructive" : "text-muted-foreground"}>
                        {isOverdue ? 'Overdue' : formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}