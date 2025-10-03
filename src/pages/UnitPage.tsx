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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Clock,
  CheckCircle2,
  FileText,
  Video,
  Download,
  Plus,
  Users,
  MessageSquare,
  Settings,
  Star,
  Award
} from "lucide-react";

interface UnitDetails {
  id: string;
  name: string;
  description: string;
  order_index: number;
  created_at: string;
  class_id: string;
  class_name: string;
  class_description: string;
  role: 'creator' | 'member';
}

interface UnitMaterial {
  id: string;
  title: string;
  description: string;
  material_type: 'document' | 'video' | 'link' | 'assignment';
  file_url?: string;
  file_name?: string;
  external_url?: string;
  created_at: string;
  is_required: boolean;
  order_index: number;
}

interface UnitAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  points: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  created_at: string;
}

export default function UnitPage() {
  const { classId, unitId } = useParams<{ classId: string; unitId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [unitDetails, setUnitDetails] = useState<UnitDetails | null>(null);
  const [materials, setMaterials] = useState<UnitMaterial[]>([]);
  const [assignments, setAssignments] = useState<UnitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (classId && unitId) {
      fetchUnitDetails();
      fetchMaterials();
      fetchAssignments();
    }
  }, [classId, unitId]);

  const fetchUnitDetails = async () => {
    try {
      // First check if user has access to the class
      const { data: memberData, error: memberError } = await supabase
        .from('class_members')
        .select(`
          role,
          classes(
            id,
            name,
            description
          )
        `)
        .eq('class_id', classId)
        .eq('user_id', user?.id)
        .single();

      if (memberError) throw memberError;

      if (!memberData || !memberData.classes) {
        toast({
          title: "Access Denied",
          description: "You are not a member of this class.",
          variant: "destructive",
        });
        navigate(`/class/${classId}`);
        return;
      }

      // Fetch unit details
      const { data: unitData, error: unitError } = await supabase
        .from('class_units')
        .select('*')
        .eq('id', unitId)
        .eq('class_id', classId)
        .single();

      if (unitError) throw unitError;

      setUnitDetails({
        id: unitData.id,
        name: unitData.name,
        description: unitData.description,
        order_index: unitData.order_index,
        created_at: unitData.created_at,
        class_id: classId,
        class_name: memberData.classes.name,
        class_description: memberData.classes.description,
        role: memberData.role
      });
    } catch (error) {
      console.error('Error fetching unit details:', error);
      toast({
        title: "Error",
        description: "Failed to load unit details.",
        variant: "destructive",
      });
      navigate(`/class/${classId}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      // For now, we'll create some mock materials since we don't have a materials table yet
      const mockMaterials: UnitMaterial[] = [
        {
          id: '1',
          title: 'Introduction to Unit Concepts',
          description: 'Overview of key concepts covered in this unit',
          material_type: 'document',
          file_name: 'unit-intro.pdf',
          created_at: new Date().toISOString(),
          is_required: true,
          order_index: 1
        },
        {
          id: '2',
          title: 'Video Lecture: Core Principles',
          description: 'Detailed explanation of core principles',
          material_type: 'video',
          file_url: 'https://example.com/video.mp4',
          created_at: new Date().toISOString(),
          is_required: true,
          order_index: 2
        },
        {
          id: '3',
          title: 'Additional Resources',
          description: 'Links to external resources for deeper learning',
          material_type: 'link',
          external_url: 'https://example.com/resources',
          created_at: new Date().toISOString(),
          is_required: false,
          order_index: 3
        }
      ];

      setMaterials(mockMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      // For now, we'll create some mock assignments
      const mockAssignments: UnitAssignment[] = [
        {
          id: '1',
          title: 'Unit Quiz',
          description: 'Test your understanding of unit concepts',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          points: 100,
          status: 'not_started',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Practical Exercise',
          description: 'Apply concepts learned in this unit',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          points: 150,
          status: 'in_progress',
          created_at: new Date().toISOString()
        }
      ];

      setAssignments(mockAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'link': return <Download className="h-5 w-5" />;
      case 'assignment': return <Award className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!unitDetails) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full py-12">
          <h2 className="text-2xl font-bold mb-4">Unit Not Found</h2>
          <p className="text-muted-foreground mb-6">The unit you are looking for does not exist or you do not have access.</p>
          <Button onClick={() => navigate(`/class/${classId}`)}>Back to Class</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(`/class/${classId}`)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {unitDetails.class_name}
          </Button>
          {unitDetails.role === 'creator' && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Unit Settings
            </Button>
          )}
        </div>

        {/* Unit Header */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">{unitDetails.name}</CardTitle>
                <p className="text-muted-foreground mt-1">{unitDetails.description}</p>
              </div>
              <Badge variant="outline" className="text-sm">
                Unit {unitDetails.order_index}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Created {formatDate(unitDetails.created_at)}</span>
            </div>
          </CardHeader>
        </Card>

        {/* Unit Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="discussion" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Discussion</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Unit Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{materials.length}</p>
                      <p className="text-sm text-muted-foreground">Materials</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Award className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{assignments.length}</p>
                      <p className="text-sm text-muted-foreground">Assignments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">2-3</p>
                      <p className="text-sm text-muted-foreground">Hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Understand core concepts and principles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Apply knowledge through practical exercises</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Demonstrate understanding through assessments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Learning Materials</h3>
              {unitDetails.role === 'creator' && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              )}
            </div>
            
            <div className="grid gap-4">
              {materials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getMaterialIcon(material.material_type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{material.title}</h4>
                          <p className="text-sm text-muted-foreground">{material.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {material.is_required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(material.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {materials.length === 0 && (
                <Card className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Materials Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Learning materials will appear here when they're added.
                  </p>
                  {unitDetails.role === 'creator' && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Material
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Assignments</h3>
              {unitDetails.role === 'creator' && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              )}
            </div>
            
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Due {formatDate(assignment.due_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{assignment.points} points</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {assignments.length === 0 && (
                <Card className="text-center py-12">
                  <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Assignments will appear here when they're created.
                  </p>
                  {unitDetails.role === 'creator' && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Assignment
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Discussion Tab */}
          <TabsContent value="discussion" className="space-y-4">
            <Card className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unit Discussion</h3>
              <p className="text-muted-foreground mb-4">
                Discussion features will be available here soon.
              </p>
              <Button variant="outline" size="sm" disabled>
                <MessageSquare className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}