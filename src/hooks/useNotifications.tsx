import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationCounts {
  masomo: number;
  ukumbi: number;
  inbox: number;
  ajira: number;
  tukio: number;
  alumni: number;
  units: { [unitId: string]: number };
  unitTabs: { [unitId: string]: { notes: number; assignments: number; events: number; pastPapers: number } };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationCounts>({
    masomo: 0,
    ukumbi: 0,
    inbox: 0,
    ajira: 0,
    tukio: 0,
    alumni: 0,
    units: {},
    unitTabs: {}
  });
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's profile to access class and university info
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          classes(
            *,
            units(*)
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const newNotifications: NotificationCounts = {
        masomo: 0,
        ukumbi: 0,
        inbox: 0,
        ajira: 0,
        tukio: 0,
        alumni: 0,
        units: {},
        unitTabs: {}
      };

      // Get user's last visit timestamp for each section
      const lastVisits = JSON.parse(localStorage.getItem('lastVisits') || '{}');

      // 1. Fetch Masomo notifications (uploads, assignments, events)
      if (profile.classes?.units) {
        for (const unit of profile.classes.units) {
          const unitLastVisit = lastVisits[`unit_${unit.id}`] || new Date().toISOString();
          const tabsLastVisit = lastVisits[`unit_${unit.id}_tabs`] || {};

          // Notes notifications
          const { count: notesCount } = await supabase
            .from('uploads')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unit.id)
            .eq('upload_type', 'notes')
            .gt('created_at', tabsLastVisit.notes || unitLastVisit);

          // Past Papers notifications
          const { count: pastPapersCount } = await supabase
            .from('uploads')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unit.id)
            .eq('upload_type', 'past_papers')
            .gt('created_at', tabsLastVisit.pastPapers || unitLastVisit);

          // Assignments notifications
          const { count: assignmentsCount } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unit.id)
            .gt('created_at', tabsLastVisit.assignments || unitLastVisit);

          // Events notifications
          const { count: eventsCount } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unit.id)
            .gt('created_at', tabsLastVisit.events || unitLastVisit);

          const unitTabCounts = {
            notes: notesCount || 0,
            assignments: assignmentsCount || 0,
            events: eventsCount || 0,
            pastPapers: pastPapersCount || 0
          };

          const unitTotal = unitTabCounts.notes + unitTabCounts.assignments + unitTabCounts.events + unitTabCounts.pastPapers;

          newNotifications.unitTabs[unit.id] = unitTabCounts;
          newNotifications.units[unit.id] = unitTotal;
          newNotifications.masomo += unitTotal;
        }
      }

      // 2. Fetch Ukumbi notifications
      const ukumbiLastVisit = lastVisits.ukumbi || new Date().toISOString();
      const { count: ukumbiCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('university_id', profile.classes?.university_id)
        .neq('user_id', user.id) // Exclude user's own messages
        .gt('created_at', ukumbiLastVisit);
      newNotifications.ukumbi = ukumbiCount || 0;

      // 3. Fetch Inbox notifications (unread messages)
      const { count: inboxCount } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      newNotifications.inbox = inboxCount || 0;

      // 4. Fetch Ajira notifications
      const ajiraLastVisit = lastVisits.ajira || new Date().toISOString();
      const { count: ajiraCount } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .neq('created_by', user.id) // Exclude user's own posts
        .gt('created_at', ajiraLastVisit);
      newNotifications.ajira = ajiraCount || 0;

      // 5. Fetch Tukio notifications
      const tukioLastVisit = lastVisits.tukio || new Date().toISOString();
      const { count: tukioCount } = await supabase
        .from('public_events')
        .select('*', { count: 'exact', head: true })
        .neq('created_by', user.id) // Exclude user's own posts
        .gt('created_at', tukioLastVisit);
      newNotifications.tukio = tukioCount || 0;

      // 6. Fetch Alumni notifications
      const alumniLastVisit = lastVisits.alumni || new Date().toISOString();
      
      try {
        const alumniNotifications = await Promise.all([
          supabase
            .from('alumni_events')
            .select('*', { count: 'exact', head: true })
            .neq('created_by', user.id)
            .gt('created_at', alumniLastVisit),
          supabase
            .from('alumni_success_stories')
            .select('*', { count: 'exact', head: true })
            .neq('alumni_id', user.id)
            .gt('created_at', alumniLastVisit)
        ]);
        
        newNotifications.alumni = (alumniNotifications[0].count || 0) + (alumniNotifications[1].count || 0);
      } catch (error) {
        console.warn('Alumni notifications query failed:', error);
        newNotifications.alumni = 0;
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (section: string, unitId?: string, tab?: string) => {
    const now = new Date().toISOString();
    const lastVisits = JSON.parse(localStorage.getItem('lastVisits') || '{}');

    if (unitId && tab) {
      // Mark specific unit tab as read
      if (!lastVisits[`unit_${unitId}_tabs`]) {
        lastVisits[`unit_${unitId}_tabs`] = {};
      }
      lastVisits[`unit_${unitId}_tabs`][tab] = now;
    } else if (unitId) {
      // Mark entire unit as read
      lastVisits[`unit_${unitId}`] = now;
    } else {
      // Mark section as read
      lastVisits[section] = now;
    }

    localStorage.setItem('lastVisits', JSON.stringify(lastVisits));
    fetchNotifications(); // Refresh notifications
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscriptions for live updates
    const subscriptions: any[] = [];

    if (user) {
      // Subscribe to uploads
      const uploadsSubscription = supabase
        .channel('uploads_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'uploads'
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      // Subscribe to assignments
      const assignmentsSubscription = supabase
        .channel('assignments_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'assignments'
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      // Subscribe to events
      const eventsSubscription = supabase
        .channel('events_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      // Subscribe to messages
      const messagesSubscription = supabase
        .channel('messages_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      // Subscribe to direct messages
      const directMessagesSubscription = supabase
        .channel('direct_messages_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      subscriptions.push(
        uploadsSubscription,
        assignmentsSubscription,
        eventsSubscription,
        messagesSubscription,
        directMessagesSubscription
      );
    }

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [user]);

  return {
    notifications,
    loading,
    markAsRead,
    refreshNotifications: fetchNotifications
  };
}
