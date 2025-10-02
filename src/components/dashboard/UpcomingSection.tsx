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
        // First get the current user's university with fallback
        // Use simple query to avoid inner join issues
        const { data: simpleProfile, error: simpleError } = await supabase
          .from('profiles')
          .select('class_id')
          .eq('user_id', user?.id)
          .single();

        if (simpleError || !simpleProfile) {
          console.error('Error fetching user profile:', simpleError);
          setUpcoming([]);
          return;
        }

        if (!simpleProfile.class_id) {
          console.log('User has no class_id, showing global upcoming events');
          // Switch to global view if user has no class
          setViewMode('global');
          return;
        }

        // In the new system, we'll show class-specific upcoming items
        console.log('Using class-based upcoming for class:', simpleProfile.class_id);

        // Use simplified queries to avoid complex joins
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .gte('deadline', now)
          .order('deadline', { ascending: true })
          .limit(10);

        // For university mode, get both unit events and university-specific public events
        const { data: unitEvents, error: unitEventsError } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', now)
          .order('event_date', { ascending: true })
          .limit(10);

        // Get university-specific public events (visibility = 'university')
        const { data: universityEvents, error: universityEventsError } = await supabase
          .from('public_events')
          .select('*')
          .eq('visibility', 'university')
          .gte('event_date', now)
          .order('event_date', { ascending: true })
          .limit(10);

        // Combine unit events and university events
        const events = [...(unitEvents || []), ...(universityEvents || [])];
        const eventsError = unitEventsError || universityEventsError;

        if (assignmentsError || eventsError) {
          console.warn('Full queries failed, trying simplified queries:', { assignmentsError, eventsError });
          
          // Simplified queries
          const { data: simpleAssignments } = await supabase
            .from('assignments')
            .select('*')
            .gte('deadline', now)
            .order('deadline', { ascending: true })
            .limit(10);

          const { data: simpleUnitEvents } = await supabase
            .from('events')
            .select('*')
            .gte('event_date', now)
            .order('event_date', { ascending: true })
            .limit(10);

          const { data: simpleUniversityEvents } = await supabase
            .from('public_events')
            .select('*')
            .eq('visibility', 'university')
            .gte('event_date', now)
            .order('event_date', { ascending: true })
            .limit(10);

          const simpleEvents = [...(simpleUnitEvents || []), ...(simpleUniversityEvents || [])];

          // Manually fetch unit data for each item
          const assignmentsWithUnits = await Promise.all(
            (simpleAssignments || []).map(async (assignment) => {
              const { data: unitData } = await supabase
                .from('units')
                .select('name')
                .eq('id', assignment.unit_id)
                .single();
              return { ...assignment, units: unitData };
            })
          );

          const eventsWithUnits = await Promise.all(
            (simpleEvents || []).map(async (event) => {
              const { data: unitData } = await supabase
                .from('units')
                .select('name')
                .eq('id', event.unit_id)
                .single();
              return { ...event, units: unitData };
            })
          );

          // Combine and sort by date
          const combined = [
            ...assignmentsWithUnits.map(item => ({ ...item, type: 'assignment', date: item.deadline })),
            ...eventsWithUnits.map(item => ({ ...item, type: 'event', date: item.event_date }))
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
           .slice(0, 10);

          setUpcoming(combined);
        } else {
          // Combine and sort by date
          const combined = [
            ...(assignments || []).map(item => ({ ...item, type: 'assignment', date: item.deadline })),
            ...(events || []).map(item => ({ ...item, type: 'event', date: item.event_date }))
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
           .slice(0, 10);

          setUpcoming(combined);
        }
      } else {
        // Global mode - only show events with 'global' visibility
        const { data: globalEvents, error: globalEventsError } = await supabase
          .from('public_events')
          .select('*')
          .eq('visibility', 'global')
          .gte('event_date', now)
          .order('event_date', { ascending: true })
          .limit(10);

        if (globalEventsError) {
          console.warn('Full global query failed, trying simplified query:', globalEventsError);
          const { data: simpleGlobalEvents } = await supabase
            .from('public_events')
            .select('*')
            .eq('visibility', 'global')
            .gte('event_date', now)
            .order('event_date', { ascending: true })
            .limit(10);

          setUpcoming((simpleGlobalEvents || []).map(item => ({ ...item, type: 'event', date: item.event_date })));
        } else {
          setUpcoming((globalEvents || []).map(item => ({ ...item, type: 'event', date: item.event_date })));
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming items:', error);
      setUpcoming([]);
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (item: any) => {
    switch (item.type) {
      case 'assignment':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getItemColor = (item: any) => {
    const daysUntil = Math.ceil((new Date(item.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 1) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntil <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (daysUntil <= 7) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const formatItemDate = (date: string) => {
    const itemDate = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil((itemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil < 7) return `In ${daysUntil} days`;
    return formatDistanceToNow(itemDate, { addSuffix: true });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming
          </CardTitle>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'university' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('university')}
              className="h-8 px-3"
            >
              <Building className="h-3 w-3 mr-1" />
              University
            </Button>
            <Button
              variant={viewMode === 'global' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('global')}
              className="h-8 px-3"
            >
              <Globe className="h-3 w-3 mr-1" />
              Global
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming items</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getItemColor(item)} transition-colors hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getItemIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {item.title || item.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {item.type === 'assignment' ? 'Assignment' : 'Event'}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatItemDate(item.date)}</span>
                      </div>
                      {item.units?.name && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span className="truncate">{item.units.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}