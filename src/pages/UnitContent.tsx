import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  BookOpen,
  FileText,
  Calendar,
  Upload,
  Users,
  Clock
} from "lucide-react";

// Import existing components (we'll adapt them)
import { NotesTab } from "@/components/unit/NotesTab";
import { AssignmentsTab } from "@/components/unit/AssignmentsTab";
import { PastPapersTab } from "@/components/unit/PastPapersTab";
import { EventsTab } from "@/components/unit/EventsTab";

interface ClassInfo {
  id: string;
  name: string;
  description: string;
  class_code: string;
}

interface UnitInfo {
  id: string;
  name: string;
  description: string;
  class_id: string;
  created_at: string;
}

interface UserRole {
  role: 'creator' | 'student';
}

const UnitContent = () => {
  const { classId, unitId } = useParams<{ classId: string; unitId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [unitInfo, setUnitInfo] = useState<UnitInfo | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');

  useEffect(() => {
    if (user && classId && unitId) {
      fetchClassInfo();
      fetchUnitInfo();
      fetchUserRole();
    }
  }, [user, classId, unitId]);

  const fetchClassInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, description, class_code')
        .eq('id', classId)
        .single();

      if (error) throw error;
      setClassInfo(data);
    } catch (error) {
      console.error('Error fetching class info:', error);
      toast({
        title: "Error",
        description: "Failed to load class information.",
        variant: "destructive",
      });
    }
  };

  const fetchUnitInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('class_units')
        .select('*')
        .eq('id', unitId)
        .eq('class_id', classId)
        .single();

      if (error) throw error;
      setUnitInfo(data);
    } catch (error) {
      console.error('Error fetching unit info:', error);
      toast({
        title: "Error",
        description: "Failed to load unit information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', classId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserRole(data);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading unit content...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!classInfo || !unitInfo) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Unit Not Found</h2>
          <p className="text-muted-foreground mb-6">The unit you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate(`/class/${classId}/units`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Units
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/class/${classId}/units`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Units
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">{unitInfo.name}</h1>
                <Badge variant="outline">{classInfo.class_code}</Badge>
              </div>
              <p className="text-muted-foreground">
                {classInfo.name} • {unitInfo.description}
              </p>
            </div>
          </div>
          <Badge variant={userRole?.role === 'creator' ? 'default' : 'outline'}>
            {userRole?.role === 'creator' ? 'Creator' : 'Member'}
          </Badge>
        </div>

        {/* Unit Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-lg font-bold">Notes</p>
                  <p className="text-xs text-muted-foreground">Study materials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-lg font-bold">Assignments</p>
                  <p className="text-xs text-muted-foreground">Tasks & projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-lg font-bold">Past Papers</p>
                  <p className="text-xs text-muted-foreground">Exam resources</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="text-lg font-bold">Events</p>
                  <p className="text-xs text-muted-foreground">Schedules & dates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Unit Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Assignments
                </TabsTrigger>
                <TabsTrigger value="past-papers" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Past Papers
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="notes" className="space-y-4">
                  <NotesTab 
                    unitId={unitId!} 
                    classId={classId!}
                    userRole={userRole?.role || 'student'}
                  />
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                  <AssignmentsTab 
                    unitId={unitId!} 
                    classId={classId!}
                    userRole={userRole?.role || 'student'}
                  />
                </TabsContent>

                <TabsContent value="past-papers" className="space-y-4">
                  <PastPapersTab 
                    unitId={unitId!} 
                    classId={classId!}
                    userRole={userRole?.role || 'student'}
                  />
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                  <EventsTab 
                    unitId={unitId!} 
                    classId={classId!}
                    userRole={userRole?.role || 'student'}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UnitContent;
