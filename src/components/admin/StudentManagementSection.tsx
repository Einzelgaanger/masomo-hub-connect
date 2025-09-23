import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Mail, GraduationCap, Upload } from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  full_name: string;
  email: string;
  admission_number: string;
  role: string;
  points: number;
  rank: string;
  last_login: string;
  created_at: string;
  classes: {
    course_name: string;
    course_year: number;
    semester: number;
    course_group: string;
    universities: {
      name: string;
      countries: {
        name: string;
      };
    };
  };
}

interface Class {
  id: string;
  course_name: string;
  course_year: number;
  semester: number;
  course_group: string;
  universities: {
    name: string;
    countries: {
      name: string;
    };
  };
}

export function StudentManagementSection() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    admission_number: "",
    class_id: "",
    role: "student"
  });

  // Bulk import state
  const [bulkData, setBulkData] = useState("");
  const [bulkClassId, setBulkClassId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
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
        .order('created_at', { ascending: false });

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          universities(
            name,
            countries(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;
      if (classesError) throw classesError;

      setStudents(studentsData || []);
      setClasses(classesData || []);
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

  const handleCreateStudent = async () => {
    try {
      if (!formData.full_name || !formData.email || !formData.admission_number || !formData.class_id) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        toast({
          title: "Error",
          description: "A user with this email already exists.",
          variant: "destructive",
        });
        return;
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: generatePassword(),
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name
        }
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          admission_number: formData.admission_number,
          role: formData.role,
          class_id: formData.class_id
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Student created successfully. Password has been sent to their email.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Error",
        description: "Failed to create student.",
        variant: "destructive",
      });
    }
  };

  const handleBulkImport = async () => {
    try {
      if (!bulkData || !bulkClassId) {
        toast({
          title: "Error",
          description: "Please provide bulk data and select a class.",
          variant: "destructive",
        });
        return;
      }

      const lines = bulkData.trim().split('\n');
      const students = [];

      for (const line of lines) {
        const [full_name, email, admission_number] = line.split(',').map(s => s.trim());
        
        if (full_name && email && admission_number) {
          students.push({
            full_name,
            email,
            admission_number,
            class_id: bulkClassId,
            role: 'student'
          });
        }
      }

      if (students.length === 0) {
        toast({
          title: "Error",
          description: "No valid student data found.",
          variant: "destructive",
        });
        return;
      }

      // Create users in batch
      for (const student of students) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: student.email,
          password: generatePassword(),
          email_confirm: true,
          user_metadata: {
            full_name: student.full_name
          }
        });

        if (!authError && authData.user) {
          await supabase
            .from('profiles')
            .update({
              full_name: student.full_name,
              admission_number: student.admission_number,
              role: student.role,
              class_id: student.class_id
            })
            .eq('user_id', authData.user.id);
        }
      }

      toast({
        title: "Success",
        description: `${students.length} students created successfully. Passwords have been sent to their emails.`,
      });

      setIsBulkDialogOpen(false);
      setBulkData("");
      setBulkClassId("");
      fetchData();
    } catch (error) {
      console.error('Error bulk importing students:', error);
      toast({
        title: "Error",
        description: "Failed to import students.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
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

      setDeleteStudentId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student.",
        variant: "destructive",
      });
    }
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      admission_number: "",
      class_id: "",
      role: "student"
    });
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'bronze': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-blue-100 text-blue-800';
      case 'diamond': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === "all" || student.class_id === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student Management</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
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
                    <Label htmlFor="bulk_class">Class</Label>
                    <Select value={bulkClassId} onValueChange={setBulkClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.course_name} - {classItem.universities.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bulk_data">Student Data</Label>
                    <textarea
                      id="bulk_data"
                      className="w-full h-32 p-2 border rounded-md"
                      placeholder="John Doe, john@example.com, ADM001&#10;Jane Smith, jane@example.com, ADM002"
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImport}>
                    Import Students
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Create a new student account and assign them to a class.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="admission_number">Admission Number *</Label>
                    <Input
                      id="admission_number"
                      value={formData.admission_number}
                      onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                      placeholder="ADM001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="class_id">Class *</Label>
                    <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.course_name} - {classItem.universities.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="lecturer">Lecturer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStudent}>
                    Create Student
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission Number</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Points & Rank</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{student.admission_number}</TableCell>
                  <TableCell>
                    {student.classes ? (
                      <div>
                        <div className="font-medium">{student.classes.course_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.classes.universities.name}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="secondary">No Class</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.role === 'student' ? 'default' : 'secondary'}>
                      {student.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.points}</span>
                      <Badge className={getRankColor(student.rank)}>
                        {student.rank}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.last_login ? format(new Date(student.last_login), 'MMM dd, yyyy') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteStudentId(student.id)}
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

      <AlertDialog open={!!deleteStudentId} onOpenChange={() => setDeleteStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student and all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteStudentId && handleDeleteStudent(deleteStudentId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
