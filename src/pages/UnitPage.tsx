import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Calendar, ClipboardList, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotesTab } from "@/components/unit/NotesTab";
import { PastPapersTab } from "@/components/unit/PastPapersTab";
import { AssignmentsTab } from "@/components/unit/AssignmentsTab";
import { EventsTab } from "@/components/unit/EventsTab";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBadge } from "@/components/ui/NotificationBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const UnitPage = () => {
  const { unitId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const [profile, setProfile] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && unitId) {
      fetchData();
    }
  }, [user, unitId]);

  const fetchData = async () => {
    try {
      // Fetch profile with units
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Check if user has access to this unit (simplified check)
      if (!profileData.class_id) {
        toast({
          title: "Access Denied",
          description: "You don't have access to any units.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Fetch unit details
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();

      if (unitError) throw unitError;

      setProfile(profileData);
      setUnit(unitData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load unit data.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading unit..." variant="fullscreen" />;
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Unit Not Found</h1>
          <p className="text-muted-foreground mb-4">The unit you're looking for doesn't exist.</p>
          <BackButton fallbackPath="/dashboard">
            Back to Dashboard
          </BackButton>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
             {/* Unit Header */}
             <div className="space-y-4 mb-6">
               {/* Unit Title and Info */}
               <div className="space-y-3">
                 <div>
                   <h1 className="text-2xl sm:text-3xl font-bold mb-2">{unit.name}</h1>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                     <span className="font-medium">{unit.course_name}</span>
                     <span className="hidden sm:inline">•</span>
                     <span>{unit.universities.name}</span>
                     <span className="hidden sm:inline">•</span>
                     <span>Year {unit.year}, Sem {unit.semester}</span>
                     {unit.course_group && (
                       <>
                         <span className="hidden sm:inline">•</span>
                         <span>Group {unit.course_group}</span>
                       </>
                     )}
                   </div>
                 </div>

                 {unit.description && (
                   <p className="text-sm text-muted-foreground leading-relaxed">
                     {unit.description}
                   </p>
                 )}
               </div>
             </div>

            {/* Unit Tabs */}
            <Tabs defaultValue="notes" className="space-y-6">
              <div className="border-b border-gray-200">
                <TabsList className="h-auto p-0 bg-transparent w-full justify-start space-x-0">
                  <TabsTrigger 
                    value="notes" 
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none"
                  >
                    <div className="relative">
                      <FileText className="h-4 w-4" />
                      <NotificationBadge 
                        count={notifications.unitTabs[unitId || '']?.notes || 0} 
                        onClick={() => setActiveTab('notes')}
                      />
                    </div>
                    <span>Notes</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="past-papers" 
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none"
                  >
                    <div className="relative">
                      <BookOpen className="h-4 w-4" />
                      <NotificationBadge 
                        count={notifications.unitTabs[unitId || '']?.pastPapers || 0} 
                        onClick={() => setActiveTab('past-papers')}
                      />
                    </div>
                    <span>Past Papers</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assignments" 
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none"
                  >
                    <div className="relative">
                      <ClipboardList className="h-4 w-4" />
                      <NotificationBadge 
                        count={notifications.unitTabs[unitId || '']?.assignments || 0} 
                        onClick={() => setActiveTab('assignments')}
                      />
                    </div>
                    <span>Assignments</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="events" 
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none"
                  >
                    <div className="relative">
                      <Calendar className="h-4 w-4" />
                      <NotificationBadge 
                        count={notifications.unitTabs[unitId || '']?.events || 0} 
                        onClick={() => setActiveTab('events')}
                      />
                    </div>
                    <span>Events</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="pt-6">
                <TabsContent value="notes" className="mt-0">
                  <NotesTab unitId={unitId!} />
                </TabsContent>

                <TabsContent value="past-papers" className="mt-0">
                  <PastPapersTab unitId={unitId!} />
                </TabsContent>

                <TabsContent value="assignments" className="mt-0">
                  <AssignmentsTab unitId={unitId!} />
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  <EventsTab unitId={unitId!} />
                </TabsContent>
              </div>
            </Tabs>
    </AppLayout>
  );
};

export default UnitPage;
