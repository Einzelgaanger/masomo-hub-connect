import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, isAfter, startOfDay } from "date-fns";

export function UpcomingSection() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcoming();
    }
  }, [user]);

  const fetchUpcoming = async () => {
    try {
      const now = new Date().toISOString();
      
      // Fetch upcoming assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          units(name, classes(id))
        `)
        .gte('deadline', now)
        .order('deadline', { ascending: true })
        .limit(5);

      // Fetch upcoming events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          units(name, classes(id))
        `)
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(5);

      if (assignmentsError) throw assignmentsError;
      if (eventsError) throw eventsError;

      // Combine and sort by date
      const combined = [
        ...(assignments || []).map(item => ({ ...item, type: 'assignment', date: item.deadline })),
        ...(events || []).map(item => ({ ...item, type: 'event', date: item.event_date }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setUpcoming(combined);
    } catch (error) {
      console.error('Error fetching upcoming items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'assignment' ? 'bg-blue-500' : 'bg-green-500';
  };

  const getTypeIcon = (type: string) => {
    return type === 'assignment' ? FileText : Calendar;
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
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Upcoming Assignments & Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming items</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((item) => {
              const Icon = getTypeIcon(item.type);
              const isOverdue = isAfter(new Date(), new Date(item.date));
              
              return (
                <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {item.units?.name}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
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