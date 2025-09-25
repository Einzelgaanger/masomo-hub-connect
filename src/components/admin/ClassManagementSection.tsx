import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, BookOpen, Users, Calendar, ArrowLeft, Search, Filter, CheckCircle, XCircle, Clock, GraduationCap } from "lucide-react";
import { format } from "date-fns";

interface Class {
  id: string;
  course_name: string;
  course_year: number;
  semester: number;
  course_group: string;
  universities: {
    id: string;
    name: string;
    countries: {
      id: string;
      name: string;
    };
  };
  units: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  admission_number: string;
  role: string;
  points: number;
  rank: string;
  created_at: string;
}

interface Application {
  id: string;
  user_id: string;
  full_name: string;
  admission_number: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export function ClassManagementSection() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Applications state
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  // Unit management states
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<{ id?: string; name: string; description: string } | null>(null);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  
  // Filtering states
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Form state - now with text inputs instead of selects
  const [formData, setFormData] = useState({
    country_name: "",
    university_name: "",
    course_name: "",
    course_year: 1,
    semester: 1,
    course_group: ""
  });

  const [units, setUnits] = useState<Array<{ name: string; description: string }>>([
    { name: "", description: "" }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          course_name,
          course_year,
          semester,
          course_group,
          universities (
            id,
            name,
            countries (
              id,
              name
            )
          ),
          units (
            id,
            name,
            description
          )
        `)
        .order('course_name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          admission_number,
          role,
          points,
          rank,
          created_at
        `)
        .eq('class_id', classId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students.",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchApplications = async (classId: string) => {
    setLoadingApplications(true);
    try {
      // Temporarily disable applications until types are updated
      console.log('Applications feature temporarily disabled - types not yet updated');
      setApplications([]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications.",
        variant: "destructive",
      });
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      // Check if admin is logged in (using sessionStorage)
      const adminSession = sessionStorage.getItem('admin_session');
      if (!adminSession) {
        toast({
          title: "Error",
          description: "Admin authentication required.",
          variant: "destructive",
        });
        return;
      }

      // Admin authentication verified via sessionStorage

      // Applications feature temporarily disabled
      toast({
        title: "Feature Unavailable",
        description: "Application management is being updated.",
        variant: "destructive",
      });
      return;


      // Map action to correct status values
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      // Update the application status
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (action === 'approve') {
        updateData.approved_at = new Date().toISOString();
        // Don't set approved_by since we don't have a real admin user in auth system
      } else {
        updateData.rejected_at = new Date().toISOString();
        // Don't set rejected_by since we don't have a real admin user in auth system
        updateData.rejection_reason = 'Application rejected by admin';
      }

      // Applications update temporarily disabled
      return;


      // If approved, create or update the student profile
      if (action === 'approve') {
        try {
          // Check if profile already exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
              .eq('user_id', 'temp-disabled')
            .single();

          if (!existingProfile) {
            // Create new profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                user_id: 'temp-disabled',
                full_name: 'temp',
                email: 'temp@temp.com',
                admission_number: 'temp',
                class_id: 'temp-disabled',
                role: 'student',
                points: 0,
                rank: 'bronze',
                created_from_application: true
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              // Don't fail the approval if profile creation fails
            }
          } else {
            // Update existing profile with class_id
            const { error: updateProfileError } = await supabase
              .from('profiles')
              .update({
                class_id: 'temp-disabled',
                created_from_application: true
              })
              .eq('user_id', 'temp-disabled');

            if (updateProfileError) {
              console.error('Profile update error:', updateProfileError);
            }
          }
        } catch (profileError) {
          console.error('Profile handling error:', profileError);
          // Don't fail the approval if profile handling fails
        }
      }

      toast({
        title: action === 'approve' ? "Application Approved" : "Application Rejected",
        description: action === 'approve' 
          ? "Student has been approved and can now access the class."
          : "Application has been rejected.",
      });

      // Refresh applications and students
      if (selectedClass) {
        await fetchApplications(selectedClass.id);
        await fetchStudents(selectedClass.id);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing application:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} application.`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStudentRole = async (studentId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as 'student' | 'lecturer' | 'admin' | 'super_admin' })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student role updated successfully.",
      });

      // Refresh students
      if (selectedClass) {
        await fetchStudents(selectedClass.id);
      }
    } catch (error) {
      console.error('Error updating student role:', error);
      toast({
        title: "Error",
        description: "Failed to update student role.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student deleted successfully.",
      });

      // Refresh students
      if (selectedClass) {
        await fetchStudents(selectedClass.id);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student.",
        variant: "destructive",
      });
    }
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      country_name: classItem.universities.countries.name,
      university_name: classItem.universities.name,
      course_name: classItem.course_name,
      course_year: classItem.course_year,
      semester: classItem.semester,
      course_group: classItem.course_group
    });
    setUnits(classItem.units.map(unit => ({ name: unit.name, description: unit.description })));
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    try {
      if (!editingClass || !formData.country_name || !formData.university_name || !formData.course_name) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Get or create country
      let { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('id')
        .eq('name', formData.country_name)
        .single();

      if (countryError && countryError.code === 'PGRST116') {
        const { data: newCountry, error: newCountryError } = await supabase
          .from('countries')
          .insert({ name: formData.country_name })
          .select('id')
          .single();

        if (newCountryError) throw newCountryError;
        countryData = newCountry;
      } else if (countryError) {
        throw countryError;
      }

      // Get or create university
      let { data: universityData, error: universityError } = await supabase
        .from('universities')
        .select('id')
        .eq('name', formData.university_name)
        .eq('country_id', countryData.id)
        .single();

      if (universityError && universityError.code === 'PGRST116') {
        const { data: newUniversity, error: newUniversityError } = await supabase
          .from('universities')
          .insert({ 
            name: formData.university_name,
            country_id: countryData.id
          })
          .select('id')
          .single();

        if (newUniversityError) throw newUniversityError;
        universityData = newUniversity;
      } else if (universityError) {
        throw universityError;
      }

      // Update class
      const { error: classError } = await supabase
        .from('classes')
        .update({
          university_id: universityData.id,
          course_name: formData.course_name,
          course_year: formData.course_year,
          semester: formData.semester,
          course_group: formData.course_group
        })
        .eq('id', editingClass.id);

      if (classError) throw classError;

      // Delete existing units
      const { error: deleteUnitsError } = await supabase
        .from('units')
        .delete()
        .eq('class_id', editingClass.id);

      if (deleteUnitsError) throw deleteUnitsError;

      // Create new units
      const validUnits = units.filter(unit => unit.name.trim());
      if (validUnits.length > 0) {
        const { error: unitsError } = await supabase
          .from('units')
          .insert(
            validUnits.map(unit => ({
              class_id: editingClass.id,
              name: unit.name,
              description: unit.description
            }))
          );

        if (unitsError) throw unitsError;
      }

      toast({
        title: "Success",
        description: "Class updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingClass(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Error",
        description: "Failed to update class.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This will also delete all units and remove students from the class.')) {
      return;
    }

    try {
      // First, remove all students from this class
      await supabase
        .from('profiles')
        .update({ class_id: null })
        .eq('class_id', classId);

      // Delete units (cascade should handle this, but let's be explicit)
      await supabase
        .from('units')
        .delete()
        .eq('class_id', classId);

      // Delete the class
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deleted successfully.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: "Failed to delete class.",
        variant: "destructive",
      });
    }
  };

  // Unit management functions
  const handleAddUnit = () => {
    setEditingUnit({ name: "", description: "" });
    setIsAddingUnit(true);
    setIsUnitDialogOpen(true);
  };

  const handleEditUnit = (unit: { id: string; name: string; description: string }) => {
    setEditingUnit({ id: unit.id, name: unit.name, description: unit.description });
    setIsAddingUnit(false);
    setIsUnitDialogOpen(true);
  };

  const handleSaveUnit = async () => {
    if (!selectedClass || !editingUnit || !editingUnit.name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the unit name.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isAddingUnit) {
        // Add new unit
        const { error } = await supabase
          .from('units')
          .insert({
            class_id: selectedClass.id,
            name: editingUnit.name,
            description: editingUnit.description
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Unit added successfully.",
        });
      } else {
        // Update existing unit
        const { error } = await supabase
          .from('units')
          .update({
            name: editingUnit.name,
            description: editingUnit.description
          })
          .eq('id', editingUnit.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Unit updated successfully.",
        });
      }

      setIsUnitDialogOpen(false);
      setEditingUnit(null);
      setIsAddingUnit(false);
      
      // Refresh the selected class data
      if (selectedClass) {
        await fetchClassDetails(selectedClass.id);
      }
    } catch (error) {
      console.error('Error saving unit:', error);
      toast({
        title: "Error",
        description: "Failed to save unit.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit? This will also delete all uploads and assignments for this unit.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unit deleted successfully.",
      });

      // Refresh the selected class data
      if (selectedClass) {
        await fetchClassDetails(selectedClass.id);
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast({
        title: "Error",
        description: "Failed to delete unit.",
        variant: "destructive",
      });
    }
  };

  const handleGraduateClass = async (classId: string) => {
    if (!confirm('Are you sure you want to graduate this class? This will:\n\n• Mark all students as alumni\n• Create alumni profiles for all students\n• Remove their access to current student features\n• This action cannot be undone')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('graduate_class', {
        class_id_param: classId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class graduated successfully! All students are now alumni.",
      });

      // Refresh data
      fetchData();
      if (selectedClass) {
        await fetchClassDetails(selectedClass.id);
      }
    } catch (error) {
      console.error('Error graduating class:', error);
      toast({
        title: "Error",
        description: "Failed to graduate class.",
        variant: "destructive",
      });
    }
  };

  const fetchClassDetails = async (classId: string) => {
    try {
      const { data: classData, error } = await supabase
        .from('classes')
        .select(`
          *,
          universities!inner (
            id,
            name,
            countries!inner (
              id,
              name
            )
          ),
          units (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;

      if (classData) {
        // Sort units by created_at descending (most recent first)
        const sortedClassData = {
          ...classData,
          units: classData.units.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        };
        setSelectedClass(sortedClassData as Class);
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  };


  const handleCreateClass = async () => {
    try {
      if (!formData.country_name || !formData.university_name || !formData.course_name) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // First, create or get country
      let { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('id')
        .eq('name', formData.country_name)
        .single();

      if (countryError && countryError.code === 'PGRST116') {
        // Country doesn't exist, create it
        const { data: newCountry, error: newCountryError } = await supabase
          .from('countries')
          .insert({ name: formData.country_name })
          .select('id')
          .single();

        if (newCountryError) throw newCountryError;
        countryData = newCountry;
      } else if (countryError) {
        throw countryError;
      }

      // Then, create or get university
      let { data: universityData, error: universityError } = await supabase
        .from('universities')
        .select('id')
        .eq('name', formData.university_name)
        .eq('country_id', countryData.id)
        .single();

      if (universityError && universityError.code === 'PGRST116') {
        // University doesn't exist, create it
        const { data: newUniversity, error: newUniversityError } = await supabase
          .from('universities')
          .insert({ 
            name: formData.university_name,
            country_id: countryData.id
          })
          .select('id')
          .single();

        if (newUniversityError) throw newUniversityError;
        universityData = newUniversity;
      } else if (universityError) {
        throw universityError;
      }

      // Create class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert({
          university_id: universityData.id,
          course_name: formData.course_name,
          course_year: formData.course_year,
          semester: formData.semester,
          course_group: formData.course_group
        })
        .select()
        .single();

      if (classError) throw classError;

      // Create units
      const validUnits = units.filter(unit => unit.name.trim());
      if (validUnits.length > 0) {
        const { error: unitsError } = await supabase
          .from('units')
          .insert(
            validUnits.map(unit => ({
              class_id: classData.id,
              name: unit.name,
              description: unit.description
            }))
          );

        if (unitsError) throw unitsError;
      }

      toast({
        title: "Success",
        description: "Class created successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: "Error",
        description: "Failed to create class.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      country_name: "",
      university_name: "",
      course_name: "",
      course_year: 1,
      semester: 1,
      course_group: ""
    });
    setUnits([{ name: "", description: "" }]);
  };

  const addUnit = () => {
    setUnits([...units, { name: "", description: "" }]);
  };

  const removeUnit = (index: number) => {
    if (units.length > 1) {
      setUnits(units.filter((_, i) => i !== index));
    }
  };

  const updateUnit = (index: number, field: 'name' | 'description', value: string) => {
    const updatedUnits = units.map((unit, i) => 
      i === index ? { ...unit, [field]: value } : unit
    );
    setUnits(updatedUnits);
  };

  // Filter classes based on selected filters
  useEffect(() => {
    let filtered = classes;

    if (countryFilter !== "all") {
      filtered = filtered.filter(classItem => 
        classItem.universities.countries.name === countryFilter
      );
    }

    if (universityFilter !== "all") {
      filtered = filtered.filter(classItem => 
        classItem.universities.name === universityFilter
      );
    }

    if (searchFilter) {
      filtered = filtered.filter(classItem => 
        classItem.course_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        classItem.universities.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        classItem.universities.countries.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    setFilteredClasses(filtered);
  }, [classes, countryFilter, universityFilter, searchFilter]);

  // Get unique countries and universities for filters
  const uniqueCountries = Array.from(new Set(classes.map(c => c.universities.countries.name))).sort();
  const uniqueUniversities = Array.from(new Set(classes.map(c => c.universities.name))).sort();

  const handleClassClick = async (classItem: Class) => {
    setSelectedClass(classItem);
    await Promise.all([
      fetchStudents(classItem.id),
      fetchApplications(classItem.id)
    ]);
  };

  const handleBackToList = () => {
    setSelectedClass(null);
    setStudents([]);
    setApplications([]);
  };

  // Show class detail view when a class is selected
  if (selectedClass) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
              <div>
                <CardTitle>{selectedClass.course_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedClass.universities.name} • {selectedClass.universities.countries.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                Year {selectedClass.course_year}, Sem {selectedClass.semester}
              </Badge>
              {!selectedClass.is_graduated && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGraduateClass(selectedClass.id)}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Graduate Class
                </Button>
              )}
              {selectedClass.is_graduated && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Graduated {selectedClass.graduation_year}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="units" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="units" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Units ({selectedClass.units.length})
                </TabsTrigger>
                <TabsTrigger value="applications" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Applications ({applications.filter(app => app.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({students.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="units" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Units ({selectedClass.units.length})</h3>
                  <Button onClick={handleAddUnit} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {selectedClass.units.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No units yet</h3>
                      <p className="text-gray-600 mb-4">Add units to organize course content.</p>
                      <Button onClick={handleAddUnit}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Unit
                      </Button>
                    </div>
                  ) : (
                    selectedClass.units.map((unit) => (
                      <Card key={unit.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{unit.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{unit.description || 'No description'}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUnit(unit)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUnit(unit.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="applications" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Pending Applications ({applications.filter(app => app.status === 'pending').length})</h3>
                  </div>
                  
                  {loadingApplications ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading applications...</p>
                    </div>
                  ) : applications.filter(app => app.status === 'pending').length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
                      <p className="text-gray-600">No students have applied for this class yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.filter(app => app.status === 'pending').map((application) => (
                        <Card key={application.id} className="border-l-4 border-l-yellow-500">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Applied {format(new Date(application.created_at), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-lg">{application.full_name}</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>Email:</strong> {application.email || 'Not provided'}</p>
                                  <p><strong>Admission Number:</strong> {application.admission_number}</p>
                                  <p><strong>User ID:</strong> {application.user_id}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApplicationAction(application.id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApplicationAction(application.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="students" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Approved Students ({students.length})</h3>
                    <p className="text-sm text-gray-600">Students who have been approved and have access to this class</p>
                  </div>
                  
                  {loadingStudents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading students...</p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                      <p className="text-gray-600">No students have been approved for this class yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {students.map((student) => (
                        <Card key={student.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {student.role}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Joined {format(new Date(student.created_at), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-lg">{student.full_name}</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>Email:</strong> {student.email}</p>
                                  <p><strong>Admission Number:</strong> {student.admission_number}</p>
                                  <p><strong>Points:</strong> {student.points} • <strong>Rank:</strong> {student.rank}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStudentRole(student.id, student.role === 'student' ? 'lecturer' : 'student')}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  {student.role === 'student' ? 'Make Lecturer' : 'Make Student'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteStudent(student.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show classes list view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Management</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Create a new class with units for students to enroll in.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country_name">Country *</Label>
                    <Input
                      id="country_name"
                      value={formData.country_name}
                      onChange={(e) => setFormData({...formData, country_name: e.target.value})}
                      placeholder="e.g., Kenya"
                    />
                  </div>
                  <div>
                    <Label htmlFor="university_name">University *</Label>
                    <Input
                      id="university_name"
                      value={formData.university_name}
                      onChange={(e) => setFormData({...formData, university_name: e.target.value})}
                      placeholder="e.g., University of Nairobi"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_name">Course Name *</Label>
                    <Input
                      id="course_name"
                      value={formData.course_name}
                      onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div>
                    <Label htmlFor="course_group">Course Group</Label>
                    <Input
                      id="course_group"
                      value={formData.course_group}
                      onChange={(e) => setFormData({...formData, course_group: e.target.value})}
                      placeholder="e.g., Group A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_year">Course Year</Label>
                    <Select value={formData.course_year.toString()} onValueChange={(value) => setFormData({...formData, course_year: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                        <SelectItem value="5">Year 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select value={formData.semester.toString()} onValueChange={(value) => setFormData({...formData, semester: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Units</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addUnit}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Unit
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {units.map((unit, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            placeholder="Unit name"
                            value={unit.name}
                            onChange={(e) => updateUnit(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Unit description"
                            value={unit.description}
                            onChange={(e) => updateUnit(index, 'description', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeUnit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClass}>
                  Create Class
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Class Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Class</DialogTitle>
                <DialogDescription>
                  Update class details and manage units.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-country">Country</Label>
                    <Input
                      id="edit-country"
                      value={formData.country_name}
                      onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                      placeholder="e.g., Kenya"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-university">University</Label>
                    <Input
                      id="edit-university"
                      value={formData.university_name}
                      onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                      placeholder="e.g., University of Nairobi"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-course">Course Name</Label>
                  <Input
                    id="edit-course"
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-year">Course Year</Label>
                    <Input
                      id="edit-year"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.course_year}
                      onChange={(e) => setFormData({ ...formData, course_year: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-semester">Semester</Label>
                    <Input
                      id="edit-semester"
                      type="number"
                      min="1"
                      max="3"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-group">Course Group (Optional)</Label>
                    <Input
                      id="edit-group"
                      value={formData.course_group}
                      onChange={(e) => setFormData({ ...formData, course_group: e.target.value })}
                      placeholder="e.g., A, B, C"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Units</Label>
                  <div className="space-y-2">
                    {units.map((unit, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <Input
                          value={unit.name}
                          onChange={(e) => {
                            const newUnits = [...units];
                            newUnits[index].name = e.target.value;
                            setUnits(newUnits);
                          }}
                          placeholder="Unit name"
                        />
                        <Input
                          value={unit.description}
                          onChange={(e) => {
                            const newUnits = [...units];
                            newUnits[index].description = e.target.value;
                            setUnits(newUnits);
                          }}
                          placeholder="Unit description"
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUnits([...units, { name: "", description: "" }])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unit
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateClass}>
                  Update Class
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Unit Dialog */}
          <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isAddingUnit ? 'Add New Unit' : 'Edit Unit'}
                </DialogTitle>
                <DialogDescription>
                  {isAddingUnit 
                    ? 'Add a new unit to this class.' 
                    : 'Update unit details.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit-name">Unit Name</Label>
                  <Input
                    id="unit-name"
                    value={editingUnit?.name || ''}
                    onChange={(e) => setEditingUnit({ 
                      ...editingUnit!, 
                      name: e.target.value 
                    })}
                    placeholder="e.g., Introduction to Programming"
                  />
                </div>
                <div>
                  <Label htmlFor="unit-description">Description</Label>
                  <Input
                    id="unit-description"
                    value={editingUnit?.description || ''}
                    onChange={(e) => setEditingUnit({ 
                      ...editingUnit!, 
                      description: e.target.value 
                    })}
                    placeholder="Brief description of the unit"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUnitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUnit}>
                  {isAddingUnit ? 'Add Unit' : 'Update Unit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search classes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={universityFilter} onValueChange={setUniversityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {uniqueUniversities.map((university) => (
                    <SelectItem key={university} value={university}>
                      {university}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Classes Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading classes...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No classes found</h3>
              <p className="text-muted-foreground">Create your first class to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Year/Semester</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classItem) => (
                  <TableRow 
                    key={classItem.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleClassClick(classItem)}
                  >
                    <TableCell className="font-medium">{classItem.course_name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{classItem.universities.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {classItem.universities.countries.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      Year {classItem.course_year}, Sem {classItem.semester}
                      {classItem.course_group && (
                        <div className="text-sm text-muted-foreground">
                          Group {classItem.course_group}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{classItem.units.length} units</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClassClick(classItem);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClass(classItem);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(classItem.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
