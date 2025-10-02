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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If profile doesn't exist (deleted), ProfileGuard will handle logout
      if (!profile || profileError) {
        setLoading(false);
        return;
      }

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

      // Get last visit times from localStorage
      const lastVisits = JSON.parse(localStorage.getItem('lastVisits') || '{}');
      
      // 1. Fetch Masomo notifications (uploads, assignments, events)
      if (profile.class_id) {
        // Fetch units for this class
        const { data: unitsData } = await supabase
          .from('units')
          .select('*')
          .eq('class_id', profile.class_id);

        if (unitsData) {
          for (const unit of unitsData) {
            const unitLastVisit = lastVisits[`unit_${unit.id}`] || unit.created_at;
            const tabsLastVisit = lastVisits[`unit_${unit.id}_tabs`] || {};

            // Notes notifications
            const { count: notesCount } = await supabase
              .from('uploads')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unit.id)
              .eq('upload_type', 'note')
              .gt('created_at', tabsLastVisit.notes || unitLastVisit);

            // Past Papers notifications
            const { count: pastPapersCount } = await supabase
              .from('uploads')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unit.id)
              .eq('upload_type', 'past_paper')
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

            const unitTotal = (notesCount || 0) + (pastPapersCount || 0) + (assignmentsCount || 0) + (eventsCount || 0);
            newNotifications.units[unit.id] = unitTotal;
            newNotifications.unitTabs[unit.id] = {
              notes: notesCount || 0,
              pastPapers: pastPapersCount || 0,
              assignments: assignmentsCount || 0,
              events: eventsCount || 0
            };
          }
        }
      }

      // 2. Fetch Ukumbi notifications (university-wide messages)
      const ukumbiLastVisit = lastVisits.ukumbi || new Date().toISOString();
      
      if (profile.class_id) {
        // First, let's check if the messages table exists and has the right structure
        const { data: sampleMessages, error: sampleError } = await supabase
          .from('messages')
          .select('*')
          .limit(1);
        
        console.log('Messages table sample:', { sampleMessages, sampleError });
        
        // In the new system, we'll use class-based messaging instead of university-based
        // For now, disable Ukumbi notifications until we implement class chat notifications
        console.log('Ukumbi notifications disabled for new class system');
        newNotifications.ukumbi = 0;
      }

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

      // 6. Calculate total Masomo notifications
      newNotifications.masomo = Object.values(newNotifications.units).reduce((sum, count) => sum + count, 0);

      console.log('Final notifications state:', newNotifications);
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
    
    if (section === 'unit' && unitId) {
      if (tab) {
        lastVisits[`unit_${unitId}_tabs`] = {
          ...lastVisits[`unit_${unitId}_tabs`],
          [tab]: now
        };
      } else {
        lastVisits[`unit_${unitId}`] = now;
      }
    } else {
      lastVisits[section] = now;
    }
    
    localStorage.setItem('lastVisits', JSON.stringify(lastVisits));
    
    // Update notifications state
    setNotifications(prev => {
      const newNotifications = { ...prev };
      
      if (section === 'unit' && unitId) {
        if (tab) {
          newNotifications.unitTabs[unitId] = {
            ...newNotifications.unitTabs[unitId],
            [tab]: 0
          };
          // Recalculate unit total
          const unitTabs = newNotifications.unitTabs[unitId] || {};
          newNotifications.units[unitId] = Object.values(unitTabs).reduce((sum, count) => sum + count, 0);
        } else {
          newNotifications.units[unitId] = 0;
          newNotifications.unitTabs[unitId] = { notes: 0, assignments: 0, events: 0, pastPapers: 0 };
        }
        // Recalculate total masomo
        newNotifications.masomo = Object.values(newNotifications.units).reduce((sum, count) => sum + count, 0);
      } else {
        newNotifications[section as keyof NotificationCounts] = 0;
      }
      
      return newNotifications;
    });
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscriptions for notifications
    const channels = [
      supabase.channel('uploads').on('postgres_changes', { event: '*', schema: 'public', table: 'uploads' }, () => {
        fetchNotifications();
      }),
      supabase.channel('assignments').on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        fetchNotifications();
      }),
      supabase.channel('direct_messages').on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        fetchNotifications();
      }),
      supabase.channel('job_postings').on('postgres_changes', { event: '*', schema: 'public', table: 'job_postings' }, () => {
        fetchNotifications();
      }),
      supabase.channel('public_events').on('postgres_changes', { event: '*', schema: 'public', table: 'public_events' }, () => {
        fetchNotifications();
      })
    ];

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [user]);

  return {
    notifications,
    loading,
    markAsRead,
    refresh: fetchNotifications
  };
}