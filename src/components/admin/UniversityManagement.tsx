import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  Globe, 
  Building, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Country {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

interface University {
  id: string;
  name: string;
  country_id: string;
  website?: string;
  created_at: string;
  countries?: {
    name: string;
  };
}

interface Course {
  id: string;
  name: string;
  university_id: string;
  created_at: string;
  universities?: {
    name: string;
    countries?: {
      name: string;
    };
  };
}

const UniversityManagement = () => {
  const { toast } = useToast();

  // Smart course parsing function
  const parseCoursesInput = (input: string): string[] => {
    if (!input.trim()) return [];
    
    // Check if input contains commas (comma-separated format)
    if (input.includes(',')) {
      return input
        .split(',')
        .map(course => course.trim().replace(/^["']|["']$/g, '')) // Remove quotes
        .filter(course => course.length > 0);
    }
    
    // Otherwise, treat as line-separated format
    return input
      .split('\n')
      .map(course => course.trim())
      .filter(course => course.length > 0);
  };

  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isAddingCountry, setIsAddingCountry] = useState(false);
  const [isAddingUniversity, setIsAddingUniversity] = useState(false);
  const [isEditingUniversity, setIsEditingUniversity] = useState(false);
  const [editingUniversityId, setEditingUniversityId] = useState<string>('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  
  const [countryForm, setCountryForm] = useState({
    name: '',
    code: ''
  });
  
  const [universityForm, setUniversityForm] = useState({
    name: '',
    website: '',
    country_id: '',
    courses: ''
  });
  
  const [courseForm, setCourseForm] = useState({
    name: '',
    university_id: ''
  });
  
  const [bulkCourses, setBulkCourses] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (countriesError) {
        console.error('UniversityManagement: Error fetching countries:', countriesError);
        throw countriesError;
      }
      setCountries(countriesData || []);
      
      // Fetch universities
      const { data: universitiesData, error: universitiesError } = await supabase
        .from('universities')
        .select('*')
        .order('name');
      
      if (universitiesError) {
        console.error('UniversityManagement: Error fetching universities:', universitiesError);
        throw universitiesError;
      }
      
      // Combine with country data
      const universitiesWithCountries = (universitiesData || []).map(university => {
        const country = countriesData?.find(c => c.id === university.country_id);
        return {
          ...university,
          countries: country ? { name: country.name } : null
        };
      });
      
      setUniversities(universitiesWithCountries);
      
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (coursesError) {
        console.error('UniversityManagement: Error fetching courses:', coursesError);
        throw coursesError;
      }
      
      // Combine with university and country data
      const coursesWithDetails = (coursesData || []).map(course => {
        const university = universitiesWithCountries.find(u => u.id === course.university_id);
        return {
          ...course,
          universities: university ? {
            name: university.name,
            countries: university.countries
          } : null
        };
      });
      
      setCourses(coursesWithDetails);
      
    } catch (error) {
      console.error('UniversityManagement: Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = async () => {
    if (!countryForm.name || !countryForm.code) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('countries')
        .insert({
          name: countryForm.name,
          code: countryForm.code.toUpperCase()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Country added successfully.",
      });

      setCountryForm({ name: '', code: '' });
      setIsAddingCountry(false);
      fetchData();
    } catch (error) {
      console.error('Error adding country:', error);
      toast({
        title: "Error",
        description: "Failed to add country.",
        variant: "destructive",
      });
    }
  };

  const handleAddUniversity = async () => {
    if (!universityForm.name || !universityForm.country_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, create the university
      const { data: universityData, error: universityError } = await supabase
        .from('universities')
        .insert({
          name: universityForm.name,
          country_id: universityForm.country_id,
          website: universityForm.website || null
        })
        .select()
        .single();

      if (universityError) throw universityError;

      // Then, create courses if provided
      if (universityForm.courses.trim()) {
        const courseNames = parseCoursesInput(universityForm.courses);

        if (courseNames.length > 0) {
          const coursesToInsert = courseNames.map(name => ({
            name,
            university_id: universityData.id
          }));

          const { error: coursesError } = await supabase
            .from('courses')
            .insert(coursesToInsert);

          if (coursesError) throw coursesError;
        }
      }

      toast({
        title: "Success",
        description: `University added successfully${universityForm.courses.trim() ? ' with courses' : ''}.`,
      });

      setUniversityForm({ name: '', website: '', country_id: '', courses: '' });
      setIsAddingUniversity(false);
      fetchData();
    } catch (error) {
      console.error('Error adding university:', error);
      toast({
        title: "Error",
        description: "Failed to add university.",
        variant: "destructive",
      });
    }
  };

  const handleEditUniversity = (university: University) => {
    setEditingUniversityId(university.id);
    setUniversityForm({
      name: university.name,
      website: university.website || '',
      country_id: university.country_id,
      courses: '' // Will be populated with existing courses
    });
    
    // Get existing courses for this university
    const universityCourses = courses
      .filter(course => course.university_id === university.id)
      .map(course => course.name)
      .join(', ');
    
    setUniversityForm(prev => ({
      ...prev,
      courses: universityCourses
    }));
    
    setIsEditingUniversity(true);
  };

  const handleUpdateUniversity = async () => {
    if (!universityForm.name || !universityForm.country_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update university
      const { error: universityError } = await supabase
        .from('universities')
        .update({
          name: universityForm.name,
          country_id: universityForm.country_id,
          website: universityForm.website || null
        })
        .eq('id', editingUniversityId);

      if (universityError) throw universityError;

      // Handle courses update
      if (universityForm.courses.trim()) {
        const newCourseNames = parseCoursesInput(universityForm.courses);
        
        // Delete existing courses for this university
        const { error: deleteError } = await supabase
          .from('courses')
          .delete()
          .eq('university_id', editingUniversityId);

        if (deleteError) throw deleteError;

        // Insert new courses
        if (newCourseNames.length > 0) {
          const coursesToInsert = newCourseNames.map(name => ({
            name,
            university_id: editingUniversityId
          }));

          const { error: coursesError } = await supabase
            .from('courses')
            .insert(coursesToInsert);

          if (coursesError) throw coursesError;
        }
      } else {
        // If no courses provided, delete all existing courses
        const { error: deleteError } = await supabase
          .from('courses')
          .delete()
          .eq('university_id', editingUniversityId);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Success",
        description: "University updated successfully.",
      });

      setUniversityForm({ name: '', website: '', country_id: '', courses: '' });
      setIsEditingUniversity(false);
      setEditingUniversityId('');
      fetchData();
    } catch (error) {
      console.error('Error updating university:', error);
      toast({
        title: "Error",
        description: "Failed to update university.",
        variant: "destructive",
      });
    }
  };

  const handleAddCourse = async () => {
    if (!courseForm.name || !courseForm.university_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          name: courseForm.name,
          university_id: courseForm.university_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course added successfully.",
      });

      setCourseForm({ name: '', university_id: '' });
      setIsAddingCourse(false);
      fetchData();
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "Error",
        description: "Failed to add course.",
        variant: "destructive",
      });
    }
  };

  const handleBulkImportCourses = async () => {
    if (!bulkCourses.trim() || !selectedUniversity) {
      toast({
        title: "Error",
        description: "Please select a university and enter course names.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkImporting(true);
    try {
      const courseNames = parseCoursesInput(bulkCourses);

      if (courseNames.length === 0) {
        toast({
          title: "Error",
          description: "No valid course names found.",
          variant: "destructive",
        });
        return;
      }

      const coursesToInsert = courseNames.map(name => ({
        name,
        university_id: selectedUniversity
      }));

      const { error } = await supabase
        .from('courses')
        .insert(coursesToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${courseNames.length} courses added successfully.`,
      });

      setBulkCourses('');
      setSelectedUniversity('');
      setIsBulkImportDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error bulk importing courses:', error);
      toast({
        title: "Error",
        description: "Failed to import courses.",
        variant: "destructive",
      });
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleDeleteCountry = async (countryId: string) => {
    if (!confirm('Are you sure you want to delete this country? This will also delete all associated universities and courses.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', countryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Country deleted successfully.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting country:', error);
      toast({
        title: "Error",
        description: "Failed to delete country.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUniversity = async (universityId: string) => {
    if (!confirm('Are you sure you want to delete this university? This will also delete all associated courses.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('universities')
        .delete()
        .eq('id', universityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "University deleted successfully.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting university:', error);
      toast({
        title: "Error",
        description: "Failed to delete university.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">University Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <Download className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="countries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="countries">Countries ({countries.length})</TabsTrigger>
          <TabsTrigger value="universities">Universities ({universities.length})</TabsTrigger>
          <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Countries
                </CardTitle>
                <Button onClick={() => setIsAddingCountry(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Country
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {countries.map((country) => (
                  <div key={country.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{country.code}</Badge>
                      <span className="font-medium">{country.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCountry(country.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Universities Tab */}
        <TabsContent value="universities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Universities
                </CardTitle>
                <Button onClick={() => setIsAddingUniversity(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add University & Courses
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {universities.map((university) => (
                  <div key={university.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="font-medium">{university.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {university.countries?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUniversity(university)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUniversity(university.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Courses
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddingCourse(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                  <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="font-medium">{course.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {course.universities?.name} - {course.universities?.countries?.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Country Dialog */}
      <Dialog open={isAddingCountry} onOpenChange={setIsAddingCountry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Country</DialogTitle>
            <DialogDescription>
              Add a new country to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="country-name">Country Name</Label>
              <Input
                id="country-name"
                value={countryForm.name}
                onChange={(e) => setCountryForm({...countryForm, name: e.target.value})}
                placeholder="e.g., United States"
              />
            </div>
            <div>
              <Label htmlFor="country-code">Country Code</Label>
              <Input
                id="country-code"
                value={countryForm.code}
                onChange={(e) => setCountryForm({...countryForm, code: e.target.value})}
                placeholder="e.g., US"
                maxLength={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCountry} className="flex-1">
                Add Country
              </Button>
              <Button variant="outline" onClick={() => setIsAddingCountry(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add University Dialog */}
      <Dialog open={isAddingUniversity} onOpenChange={setIsAddingUniversity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add University & Courses</DialogTitle>
            <DialogDescription>
              Add a new university to the system and optionally include its courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="university-name">University Name</Label>
              <Input
                id="university-name"
                value={universityForm.name}
                onChange={(e) => setUniversityForm({...universityForm, name: e.target.value})}
                placeholder="e.g., Harvard University"
              />
            </div>
            <div>
              <Label htmlFor="university-country">Country</Label>
              <Select 
                value={universityForm.country_id} 
                onValueChange={(value) => setUniversityForm({...universityForm, country_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="university-website">Website (Optional)</Label>
              <Input
                id="university-website"
                value={universityForm.website}
                onChange={(e) => setUniversityForm({...universityForm, website: e.target.value})}
                placeholder="https://university.edu"
              />
            </div>
            <div>
              <Label htmlFor="university-courses">Courses (Optional)</Label>
              <Textarea
                id="university-courses"
                value={universityForm.courses}
                onChange={(e) => setUniversityForm({...universityForm, courses: e.target.value})}
                placeholder="Enter courses separated by commas or one per line:&#10;Computer Science, Business Administration, Engineering&#10;OR&#10;Computer Science&#10;Business Administration&#10;Engineering"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter courses separated by commas (e.g., "Course 1", "Course 2") or one per line.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddUniversity} className="flex-1">
                Add University & Courses
              </Button>
              <Button variant="outline" onClick={() => setIsAddingUniversity(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit University Dialog */}
      <Dialog open={isEditingUniversity} onOpenChange={setIsEditingUniversity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit University & Courses</DialogTitle>
            <DialogDescription>
              Update university information and manage its courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-university-name">University Name</Label>
              <Input
                id="edit-university-name"
                value={universityForm.name}
                onChange={(e) => setUniversityForm({...universityForm, name: e.target.value})}
                placeholder="e.g., Harvard University"
              />
            </div>
            <div>
              <Label htmlFor="edit-university-country">Country</Label>
              <Select 
                value={universityForm.country_id} 
                onValueChange={(value) => setUniversityForm({...universityForm, country_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-university-website">Website (Optional)</Label>
              <Input
                id="edit-university-website"
                value={universityForm.website}
                onChange={(e) => setUniversityForm({...universityForm, website: e.target.value})}
                placeholder="https://university.edu"
              />
            </div>
            <div>
              <Label htmlFor="edit-university-courses">Courses</Label>
              <Textarea
                id="edit-university-courses"
                value={universityForm.courses}
                onChange={(e) => setUniversityForm({...universityForm, courses: e.target.value})}
                placeholder="Enter courses separated by commas or one per line:&#10;Computer Science, Business Administration, Engineering&#10;OR&#10;Computer Science&#10;Business Administration&#10;Engineering"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter courses separated by commas (e.g., "Course 1", "Course 2") or one per line. This will replace all existing courses.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateUniversity} className="flex-1">
                Update University & Courses
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditingUniversity(false);
                setEditingUniversityId('');
                setUniversityForm({ name: '', website: '', country_id: '', courses: '' });
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Course Dialog */}
      <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>
              Add a new course to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-name">Course Name</Label>
              <Input
                id="course-name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="course-university">University</Label>
              <Select 
                value={courseForm.university_id} 
                onValueChange={(value) => setCourseForm({...courseForm, university_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((university) => (
                    <SelectItem key={university.id} value={university.id}>
                      {university.name} - {university.countries?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCourse} className="flex-1">
                Add Course
              </Button>
              <Button variant="outline" onClick={() => setIsAddingCourse(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Courses</DialogTitle>
            <DialogDescription>
              Import multiple courses for a university. Enter one course name per line.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-university">University</Label>
              <Select 
                value={selectedUniversity} 
                onValueChange={setSelectedUniversity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((university) => (
                    <SelectItem key={university.id} value={university.id}>
                      {university.name} - {university.countries?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bulk-courses">Course Names</Label>
              <Textarea
                id="bulk-courses"
                value={bulkCourses}
                onChange={(e) => setBulkCourses(e.target.value)}
                placeholder="Enter courses separated by commas or one per line:&#10;Computer Science, Business Administration, Medicine&#10;OR&#10;Computer Science&#10;Business Administration&#10;Medicine"
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter courses separated by commas (e.g., "Course 1", "Course 2") or one per line.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleBulkImportCourses} 
                disabled={isBulkImporting}
                className="flex-1"
              >
                {isBulkImporting ? "Importing..." : "Import Courses"}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsBulkImportDialogOpen(false);
                setSelectedUniversity('');
                setBulkCourses('');
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UniversityManagement;
