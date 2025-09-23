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
import { Plus, Edit, Trash2, BookOpen, Users, Calendar, ArrowLeft, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Class {
  id: string;
  course_name: string;
  course_year: number;
  semester: number;
  course_group: string;
  created_at: string;
  universities: {
    name: string;
    countries: {
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

export function ClassManagementSection() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  // Filtering states
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Student creation states
  const [isCreateStudentDialogOpen, setIsCreateStudentDialogOpen] = useState(false);
  const [isBulkStudentDialogOpen, setIsBulkStudentDialogOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    full_name: "",
    email: "",
    admission_number: "",
    role: "student"
  });
  const [bulkStudentData, setBulkStudentData] = useState("");

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
      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          universities(
            name,
            countries(name)
          ),
          units(*)
        `)
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;
      setClasses(classesData || []);
      setFilteredClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
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
    }
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
        classItem.course_group.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    setFilteredClasses(filtered);
  }, [classes, countryFilter, universityFilter, searchFilter]);

  // Get unique countries and universities for filters
  const uniqueCountries = Array.from(new Set(classes.map(c => c.universities.countries.name))).sort();
  const uniqueUniversities = Array.from(new Set(classes.map(c => c.universities.name))).sort();

  const handleClassClick = async (classItem: Class) => {
    setSelectedClass(classItem);
    await fetchStudents(classItem.id);
  };

  const handleBackToList = () => {
    setSelectedClass(null);
    setStudents([]);
  };

  const handleEditUnit = async (unitId: string, name: string, description: string) => {
    try {
      const { error } = await supabase
        .from('units')
        .update({ name, description })
        .eq('id', unitId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unit updated successfully.",
      });

      // Refresh the selected class data
      if (selectedClass) {
        const updatedClass = { ...selectedClass };
        const unitIndex = updatedClass.units.findIndex(u => u.id === unitId);
        if (unitIndex !== -1) {
          updatedClass.units[unitIndex] = { ...updatedClass.units[unitIndex], name, description };
          setSelectedClass(updatedClass);
        }
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      toast({
        title: "Error",
        description: "Failed to update unit.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
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
        const updatedClass = { ...selectedClass };
        updatedClass.units = updatedClass.units.filter(u => u.id !== unitId);
        setSelectedClass(updatedClass);
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

  const handleCreateStudent = async () => {
    if (!selectedClass) return;

    try {
      if (!studentFormData.full_name || !studentFormData.email || !studentFormData.admission_number) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Generate a random password
      const generatedPassword = Math.random().toString(36).slice(-8);

      // Create auth user with the generated password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: studentFormData.email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: studentFormData.full_name
        }
      });

      if (authError) {
        // If auth user creation fails, fall back to profile-only creation
        console.warn('Auth user creation failed, creating profile only:', authError);
        
        const userId = crypto.randomUUID();
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            user_id: null,
            full_name: studentFormData.full_name,
            email: studentFormData.email,
            admission_number: studentFormData.admission_number,
            role: studentFormData.role,
            class_id: selectedClass.id,
            points: 0,
            rank: 'bronze'
          });

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Student profile created. Student can register using their admission number.",
        });
      } else {
        // Create profile linked to auth user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: studentFormData.full_name,
            email: studentFormData.email,
            admission_number: studentFormData.admission_number,
            role: studentFormData.role,
            class_id: selectedClass.id,
            points: 0,
            rank: 'bronze'
          });

        if (profileError) throw profileError;

        // Send email with password
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
            body: JSON.stringify({
              to: studentFormData.email,
              subject: 'Bunifu - Your Account Credentials',
              template: 'welcome',
              context: {
                fullName: studentFormData.full_name,
                password: generatedPassword,
                loginUrl: window.location.origin + '/login'
              }
            }),
          });

          if (emailError || (emailData && emailData.error)) {
            console.warn('Email sending failed:', emailError || emailData.error);
            toast({
              title: "Success with Warning",
              description: `Student created successfully! Password: ${generatedPassword}. Email sending failed - please share this password manually.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success",
              description: "Student created successfully! Login credentials have been sent to their email.",
            });
          }
        } catch (emailError) {
          console.warn('Email sending failed:', emailError);
          toast({
            title: "Success with Warning",
            description: `Student created successfully! Password: ${generatedPassword}. Email sending failed - please share this password manually.`,
            variant: "destructive",
          });
        }
      }

      // Reset form and refresh students
      setStudentFormData({
        full_name: "",
        email: "",
        admission_number: "",
        role: "student"
      });
      setIsCreateStudentDialogOpen(false);
      await fetchStudents(selectedClass.id);
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Error",
        description: "Failed to create student.",
        variant: "destructive",
      });
    }
  };

  const handleBulkCreateStudents = async () => {
    if (!selectedClass || !bulkStudentData.trim()) return;

    try {
      const lines = bulkStudentData.trim().split('\n');
      const students = lines.map(line => {
        const [full_name, email, admission_number] = line.split(',').map(s => s.trim());
        return { full_name, email, admission_number };
      });

      let successCount = 0;
      let emailSuccessCount = 0;
      const passwords: { email: string; password: string }[] = [];

      for (const student of students) {
        if (!student.full_name || !student.email || !student.admission_number) continue;

        try {
          // Generate a random password
          const generatedPassword = Math.random().toString(36).slice(-8);

          // Try to create auth user first
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: student.email,
            password: generatedPassword,
            email_confirm: true,
            user_metadata: {
              full_name: student.full_name
            }
          });

          if (authError) {
            // Fall back to profile-only creation
            const userId = crypto.randomUUID();
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                user_id: null,
                full_name: student.full_name,
                email: student.email,
                admission_number: student.admission_number,
                role: 'student',
                class_id: selectedClass.id,
                points: 0,
                rank: 'bronze'
              });

            if (profileError) {
              console.error(`Error creating profile for ${student.email}:`, profileError);
            } else {
              successCount++;
            }
          } else {
            // Create profile linked to auth user
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                user_id: authData.user.id,
                full_name: student.full_name,
                email: student.email,
                admission_number: student.admission_number,
                role: 'student',
                class_id: selectedClass.id,
                points: 0,
                rank: 'bronze'
              });

            if (profileError) {
              console.error(`Error creating profile for ${student.email}:`, profileError);
            } else {
              successCount++;
              passwords.push({ email: student.email, password: generatedPassword });
            }
          }
        } catch (error) {
          console.error(`Error processing ${student.email}:`, error);
        }
      }

      // Send emails for successfully created auth users
      for (const { email, password } of passwords) {
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
            body: JSON.stringify({
              to: email,
              subject: 'Bunifu - Your Account Credentials',
              template: 'welcome',
              context: {
                fullName: students.find(s => s.email === email)?.full_name || 'Student',
                password: password,
                loginUrl: window.location.origin + '/login'
              }
            }),
          });

          if (!emailError && (!emailData || !emailData.error)) {
            emailSuccessCount++;
          }
        } catch (emailError) {
          console.warn(`Email sending failed for ${email}:`, emailError);
        }
      }

      let message = `Created ${successCount} out of ${students.length} student profiles.`;
      if (emailSuccessCount > 0) {
        message += ` Sent login credentials to ${emailSuccessCount} students.`;
      }
      if (passwords.length > emailSuccessCount) {
        message += ` Some emails failed - check console for manual password sharing.`;
      }

      toast({
        title: "Success",
        description: message,
      });

      setBulkStudentData("");
      setIsBulkStudentDialogOpen(false);
      await fetchStudents(selectedClass.id);
    } catch (error) {
      console.error('Error bulk creating students:', error);
      toast({
        title: "Error",
        description: "Failed to create students.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStudentRole = async (studentId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
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

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This will also delete all associated units and data.")) {
      return;
    }

    try {
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
    const updatedUnits = [...units];
    updatedUnits[index][field] = value;
    setUnits(updatedUnits);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <Badge variant="secondary">
              Year {selectedClass.course_year}, Sem {selectedClass.semester}
            </Badge>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="units" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="units" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Units ({selectedClass.units.length})
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({students.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="units" className="space-y-4">
                <div className="grid gap-4">
                  {selectedClass.units.map((unit) => (
                    <UnitEditCard
                      key={unit.id}
                      unit={unit}
                      onEdit={handleEditUnit}
                      onDelete={handleDeleteUnit}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="students" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Students ({students.length})</h3>
                  <div className="flex gap-2">
                    <Dialog open={isBulkStudentDialogOpen} onOpenChange={setIsBulkStudentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          Bulk Import
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Import Students</DialogTitle>
                          <DialogDescription>
                            Import multiple students at once. Format: Name, Email, Admission Number (one per line)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="bulk-students">Student Data</Label>
                            <textarea
                              id="bulk-students"
                              className="w-full h-32 p-3 border rounded-md"
                              placeholder="John Doe, john.doe@example.com, ADM001&#10;Jane Smith, jane.smith@example.com, ADM002"
                              value={bulkStudentData}
                              onChange={(e) => setBulkStudentData(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsBulkStudentDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleBulkCreateStudents}>
                            Import Students
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isCreateStudentDialogOpen} onOpenChange={setIsCreateStudentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Student</DialogTitle>
                          <DialogDescription>
                            Add a new student to this class.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="student-name">Full Name *</Label>
                            <Input
                              id="student-name"
                              value={studentFormData.full_name}
                              onChange={(e) => setStudentFormData({ ...studentFormData, full_name: e.target.value })}
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <Label htmlFor="student-email">Email *</Label>
                            <Input
                              id="student-email"
                              type="email"
                              value={studentFormData.email}
                              onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                              placeholder="john.doe@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="student-admission">Admission Number *</Label>
                            <Input
                              id="student-admission"
                              value={studentFormData.admission_number}
                              onChange={(e) => setStudentFormData({ ...studentFormData, admission_number: e.target.value })}
                              placeholder="ADM001"
                            />
                          </div>
                          <div>
                            <Label htmlFor="student-role">Role</Label>
                            <Select value={studentFormData.role} onValueChange={(value) => setStudentFormData({ ...studentFormData, role: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="lecturer">Lecturer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateStudentDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateStudent}>
                            Create Student
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <StudentsTable students={students} onUpdateRole={handleUpdateStudentRole} />
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
                      onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                      placeholder="e.g., Kenya, Uganda, Tanzania"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="university_name">University *</Label>
                    <Input
                      id="university_name"
                      value={formData.university_name}
                      onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="course_group">Course Group</Label>
                    <Input
                      id="course_group"
                      value={formData.course_group}
                      onChange={(e) => setFormData({ ...formData, course_group: e.target.value })}
                      placeholder="e.g., Group A, Section 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_year">Course Year</Label>
                    <Input
                      id="course_year"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.course_year}
                      onChange={(e) => setFormData({ ...formData, course_year: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Input
                      id="semester"
                      type="number"
                      min="1"
                      max="2"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
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
                  
                  {units.map((unit, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="Unit name (e.g., Introduction to Programming)"
                        value={unit.name}
                        onChange={(e) => updateUnit(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={unit.description}
                        onChange={(e) => updateUnit(index, 'description', e.target.value)}
                      />
                      {units.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeUnit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Year & Semester</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Created</TableHead>
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
                    <Badge variant="secondary">
                      Year {classItem.course_year}, Sem {classItem.semester}
                    </Badge>
                  </TableCell>
                  <TableCell>{classItem.course_group || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {classItem.units?.length || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(classItem.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(classItem);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
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
        </CardContent>
      </Card>
    </div>
  );
}

// Unit Edit Card Component
function UnitEditCard({ 
  unit, 
  onEdit, 
  onDelete 
}: { 
  unit: { id: string; name: string; description: string }; 
  onEdit: (id: string, name: string, description: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(unit.name);
  const [editDescription, setEditDescription] = useState(unit.description);

  const handleSave = () => {
    onEdit(unit.id, editName, editDescription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(unit.name);
    setEditDescription(unit.description);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor={`unit-name-${unit.id}`}>Unit Name</Label>
              <Input
                id={`unit-name-${unit.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`unit-description-${unit.id}`}>Description</Label>
              <Input
                id={`unit-description-${unit.id}`}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{unit.name}</h3>
            <p className="text-sm text-muted-foreground">{unit.description}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(unit.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Students Table Component
function StudentsTable({ students, onUpdateRole }: { students: Student[]; onUpdateRole: (studentId: string, newRole: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Admission Number</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Rank</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.full_name}</TableCell>
            <TableCell>{student.email}</TableCell>
            <TableCell>{student.admission_number}</TableCell>
            <TableCell>
              <Badge variant={student.user_id ? "default" : "secondary"}>
                {student.user_id ? "Registered" : "Pending"}
              </Badge>
            </TableCell>
            <TableCell>
              <Select value={student.role} onValueChange={(value) => onUpdateRole(student.id, value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{student.points}</TableCell>
            <TableCell>
              <Badge variant="outline">{student.rank}</Badge>
            </TableCell>
            <TableCell>{format(new Date(student.created_at), 'MMM dd, yyyy')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}