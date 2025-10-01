import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Globe, GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import { AppLayout } from '@/components/layout/AppLayout';

interface Country {
  id: string;
  name: string;
  code: string | null;
}

interface University {
  id: string;
  name: string;
  country_id: string;
  description: string | null;
  website: string | null;
  countries?: {
    name: string;
  };
}

interface Course {
  id: string;
  name: string;
  university_id: string;
  description: string | null;
  universities?: {
    name: string;
  };
}

export default function AdminUniversityManagement() {
  const { toast } = useToast();
  
  // Countries state
  const [countries, setCountries] = useState<Country[]>([]);
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(false);
  
  // Universities state
  const [universities, setUniversities] = useState<University[]>([]);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [newUniversityCountry, setNewUniversityCountry] = useState('');
  const [newUniversityDescription, setNewUniversityDescription] = useState('');
  const [newUniversityWebsite, setNewUniversityWebsite] = useState('');
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  
  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [bulkCourses, setBulkCourses] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    fetchCountries();
    fetchUniversities();
    fetchCourses();
  }, []);

  // Fetch Countries
  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCountries(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Fetch Universities
  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*, countries(name)')
        .order('name');
      
      if (error) throw error;
      setUniversities(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, universities(name)')
        .order('name');
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Add Country
  const handleAddCountry = async () => {
    if (!newCountryName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a country name',
        variant: 'destructive',
      });
      return;
    }

    setLoadingCountries(true);
    try {
      const { error } = await supabase
        .from('countries')
        .insert({
          name: newCountryName.trim(),
          code: newCountryCode.trim() || null,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Country added successfully',
      });
      
      setNewCountryName('');
      setNewCountryCode('');
      fetchCountries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingCountries(false);
    }
  };

  // Delete Country
  const handleDeleteCountry = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all universities and courses in this country.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Country deleted successfully',
      });
      
      fetchCountries();
      fetchUniversities();
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Add University
  const handleAddUniversity = async () => {
    if (!newUniversityName.trim() || !newUniversityCountry) {
      toast({
        title: 'Error',
        description: 'Please enter university name and select a country',
        variant: 'destructive',
      });
      return;
    }

    setLoadingUniversities(true);
    try {
      const { error } = await supabase
        .from('universities')
        .insert({
          name: newUniversityName.trim(),
          country_id: newUniversityCountry,
          description: newUniversityDescription.trim() || null,
          website: newUniversityWebsite.trim() || null,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'University added successfully',
      });
      
      setNewUniversityName('');
      setNewUniversityDescription('');
      setNewUniversityWebsite('');
      fetchUniversities();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingUniversities(false);
    }
  };

  // Delete University
  const handleDeleteUniversity = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all courses in this university.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('universities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'University deleted successfully',
      });
      
      fetchUniversities();
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Bulk Add Courses
  const handleBulkAddCourses = async () => {
    if (!selectedUniversity) {
      toast({
        title: 'Error',
        description: 'Please select a university',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkCourses.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter course names (one per line)',
        variant: 'destructive',
      });
      return;
    }

    setLoadingCourses(true);
    try {
      // Split by newlines and filter empty lines
      const courseNames = bulkCourses
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Create course objects
      const coursesToInsert = courseNames.map(name => ({
        name,
        university_id: selectedUniversity,
        description: courseDescription.trim() || null,
      }));

      const { error } = await supabase
        .from('courses')
        .insert(coursesToInsert);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Successfully added ${courseNames.length} courses`,
      });
      
      setBulkCourses('');
      setCourseDescription('');
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });
      
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminGuard>
      <AppLayout>
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">University Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage countries, universities, and courses for the platform
            </p>
          </div>

          <Tabs defaultValue="countries" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="countries">
                <Globe className="h-4 w-4 mr-2" />
                Countries
              </TabsTrigger>
              <TabsTrigger value="universities">
                <GraduationCap className="h-4 w-4 mr-2" />
                Universities
              </TabsTrigger>
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </TabsTrigger>
            </TabsList>

            {/* COUNTRIES TAB */}
            <TabsContent value="countries" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Country</CardTitle>
                  <CardDescription>Add a new country to the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="country-name">Country Name *</Label>
                      <Input
                        id="country-name"
                        placeholder="e.g., Kenya"
                        value={newCountryName}
                        onChange={(e) => setNewCountryName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country-code">Country Code</Label>
                      <Input
                        id="country-code"
                        placeholder="e.g., KE"
                        value={newCountryCode}
                        onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddCountry} 
                    disabled={loadingCountries}
                    className="w-full md:w-auto"
                  >
                    {loadingCountries ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                    ) : (
                      <><Plus className="mr-2 h-4 w-4" /> Add Country</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Countries ({countries.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countries.map((country) => (
                      <div
                        key={country.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{country.name}</p>
                          {country.code && (
                            <p className="text-sm text-muted-foreground">{country.code}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCountry(country.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {countries.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No countries added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* UNIVERSITIES TAB */}
            <TabsContent value="universities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add New University</CardTitle>
                  <CardDescription>Add a new university to a country</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="uni-country">Country *</Label>
                      <Select
                        value={newUniversityCountry}
                        onValueChange={setNewUniversityCountry}
                      >
                        <SelectTrigger id="uni-country">
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
                      <Label htmlFor="uni-name">University Name *</Label>
                      <Input
                        id="uni-name"
                        placeholder="e.g., University of Nairobi"
                        value={newUniversityName}
                        onChange={(e) => setNewUniversityName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="uni-description">Description</Label>
                    <Input
                      id="uni-description"
                      placeholder="Brief description (optional)"
                      value={newUniversityDescription}
                      onChange={(e) => setNewUniversityDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="uni-website">Website</Label>
                    <Input
                      id="uni-website"
                      type="url"
                      placeholder="https://example.com (optional)"
                      value={newUniversityWebsite}
                      onChange={(e) => setNewUniversityWebsite(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleAddUniversity} 
                    disabled={loadingUniversities}
                    className="w-full md:w-auto"
                  >
                    {loadingUniversities ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                    ) : (
                      <><Plus className="mr-2 h-4 w-4" /> Add University</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Universities ({universities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {universities.map((university) => (
                      <div
                        key={university.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{university.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {university.countries?.name}
                          </p>
                          {university.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {university.description}
                            </p>
                          )}
                          {university.website && (
                            <a
                              href={university.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {university.website}
                            </a>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUniversity(university.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {universities.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No universities added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* COURSES TAB */}
            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Add Courses</CardTitle>
                  <CardDescription>
                    Add multiple courses at once - paste one course name per line
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="course-university">University *</Label>
                    <Select
                      value={selectedUniversity}
                      onValueChange={setSelectedUniversity}
                    >
                      <SelectTrigger id="course-university">
                        <SelectValue placeholder="Select a university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.id} value={university.id}>
                            {university.name} ({university.countries?.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bulk-courses">
                      Course Names * (one per line)
                    </Label>
                    <Textarea
                      id="bulk-courses"
                      placeholder={`Computer Science\nBusiness Administration\nMechanical Engineering\nMedicine and Surgery\n...`}
                      rows={10}
                      value={bulkCourses}
                      onChange={(e) => setBulkCourses(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste hundreds of course names here - one per line
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="course-description">
                      Default Description (optional)
                    </Label>
                    <Input
                      id="course-description"
                      placeholder="Will be applied to all courses"
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleBulkAddCourses} 
                    disabled={loadingCourses}
                    className="w-full md:w-auto"
                  >
                    {loadingCourses ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                    ) : (
                      <><Plus className="mr-2 h-4 w-4" /> Add All Courses</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Courses ({courses.length})</CardTitle>
                  <CardDescription>
                    Filter by typing in the search box below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{course.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.universities?.name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {courses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No courses added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

