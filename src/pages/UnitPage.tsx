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

const UnitPage = () => {
  const { unitId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
        .select(`
          *,
          classes(
            *,
            universities(
              *,
              countries(*)
            ),
            units(*)
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Check if user has access to this unit
      const userUnitIds = profileData?.classes?.units?.map((u: any) => u.id) || [];
      if (!userUnitIds.includes(unitId)) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this unit.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Fetch unit details
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select(`
          *,
          classes(
            course_name,
            course_year,
            semester,
            course_group,
            universities(
              name,
              countries(name)
            )
          )
        `)
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Unit Not Found</h1>
          <p className="text-muted-foreground mb-4">The unit you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
             {/* Unit Header */}
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => navigate("/units")}
                   className="flex items-center gap-2"
                 >
                   <ArrowLeft className="h-4 w-4" />
                   Back to Units
                 </Button>
                 <div>
                   <h1 className="text-3xl font-bold">{unit.name}</h1>
                   <p className="text-muted-foreground">
                     {unit.classes.course_name} - {unit.classes.universities.name}
                   </p>
                   {unit.description && (
                     <p className="text-sm text-muted-foreground mt-2">{unit.description}</p>
                   )}
                 </div>
               </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Year {unit.classes.course_year}, Semester {unit.classes.semester}
                </p>
                {unit.classes.course_group && (
                  <p className="text-sm text-muted-foreground">
                    Group: {unit.classes.course_group}
                  </p>
                )}
              </div>
            </div>

            {/* Unit Tabs */}
            <Tabs defaultValue="notes" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="past-papers" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Past Papers
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Assignments
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-6">
                <NotesTab unitId={unitId!} />
              </TabsContent>

              <TabsContent value="past-papers" className="space-y-6">
                <PastPapersTab unitId={unitId!} />
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6">
                <AssignmentsTab unitId={unitId!} />
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <EventsTab unitId={unitId!} />
              </TabsContent>
            </Tabs>
    </AppLayout>
  );
};

export default UnitPage;
