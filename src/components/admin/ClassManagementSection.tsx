import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, BookOpen, Users, Calendar } from "lucide-react";
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

interface Country {
  id: string;
  name: string;
}

interface University {
  id: string;
  name: string;
  country_id: string;
}

export function ClassManagementSection() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    course_name: "",
    course_year: 1,
    semester: 1,
    course_group: "",
    university_id: ""
  });

  const [units, setUnits] = useState<Array<{ name: string; description: string }>>([
    { name: "", description: "" }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchUniversities(selectedCountry);
    }
  }, [selectedCountry]);

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

      // Fetch countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (classesError) throw classesError;
      if (countriesError) throw countriesError;

      setClasses(classesData || []);
      setCountries(countriesData || []);
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

  const fetchUniversities = async (countryId: string) => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('country_id', countryId)
        .order('name');

      if (error) throw error;
      setUniversities(data || []);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const handleCreateClass = async () => {
    try {
      if (!formData.university_id || !formData.course_name) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Create class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert({
          university_id: formData.university_id,
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
      course_name: "",
      course_year: 1,
      semester: 1,
      course_group: "",
      university_id: ""
    });
    setUnits([{ name: "", description: "" }]);
    setSelectedCountry("");
    setSelectedUniversity("");
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
                    <Label htmlFor="country">Country *</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
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
                    <Label htmlFor="university">University *</Label>
                    <Select 
                      value={formData.university_id} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, university_id: value });
                        setSelectedUniversity(value);
                      }}
                      disabled={!selectedCountry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.id} value={university.id}>
                            {university.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      placeholder="e.g., Group A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_year">Course Year</Label>
                    <Select 
                      value={formData.course_year.toString()} 
                      onValueChange={(value) => setFormData({ ...formData, course_year: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select 
                      value={formData.semester.toString()} 
                      onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2].map((semester) => (
                          <SelectItem key={semester} value={semester.toString()}>
                            Semester {semester}
                          </SelectItem>
                        ))}
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
                  
                  {units.map((unit, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="Unit name"
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
              {classes.map((classItem) => (
                <TableRow key={classItem.id}>
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
                        onClick={() => {
                          setEditingClass(classItem);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClass(classItem.id)}
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
