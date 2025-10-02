import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  ArrowLeft,
  ArrowRight,
  FileText,
  Calendar,
  Upload
} from "lucide-react";

interface ClassInfo {
  id: string;
  name: string;
  description: string;
  class_code: string;
  creator_id: string;
  members_count: number;
  created_at: string;
}

interface ClassUnit {
  id: string;
  name: string;
  description: string;
  class_id: string;
  created_at: string;
}

interface UserRole {
  role: 'creator' | 'student';
}

const ClassUnits = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && classId) {
      fetchClassInfo();
      fetchUnits();
      fetchUserRole();
    }
  }, [user, classId]);

  const fetchClassInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          class_code,
          creator_id,
          created_at
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;

      // Get members count
      const { count: membersCount } = await supabase
        .from('class_members')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      setClassInfo({
        ...data,
        members_count: membersCount || 0
      });
    } catch (error) {
      console.error('Error fetching class info:', error);
      toast({
        title: "Error",
        description: "Failed to load class information.",
        variant: "destructive",
      });
    }
  };

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('class_units')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Error",
        description: "Failed to load class units.",
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

  const handleUnitClick = (unitId: string) => {
    navigate(`/class/${classId}/unit/${unitId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading class units...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!classInfo) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Class Not Found</h2>
          <p className="text-muted-foreground mb-6">The class you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/masomo')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
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
              onClick={() => navigate('/masomo')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{classInfo.name}</h1>
              <p className="text-muted-foreground">{classInfo.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{classInfo.class_code}</Badge>
            <Badge variant={userRole?.role === 'creator' ? 'default' : 'outline'}>
              {userRole?.role === 'creator' ? 'Creator' : 'Member'}
            </Badge>
          </div>
        </div>

        {/* Class Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{units.length}</p>
                  <p className="text-sm text-muted-foreground">Units</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{classInfo.members_count}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-bold">
                    {new Date(classInfo.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Created</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Units Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Class Units</h2>
          {units.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Units Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {userRole?.role === 'creator' 
                    ? "Create your first unit to get started with this class."
                    : "The class creator hasn't added any units yet."
                  }
                </p>
                {userRole?.role === 'creator' && (
                  <Button>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Add First Unit
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <Card 
                  key={unit.id} 
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleUnitClick(unit.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {unit.name}
                      </CardTitle>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">{unit.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>Notes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Upload className="h-4 w-4" />
                          <span>Assignments</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Events</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ClassUnits;
