import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBadge } from "@/components/ui/NotificationBadge";
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Users, 
  FileText,
  Clock,
  ChevronRight,
  GraduationCap,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";

interface Unit {
  id: string;
  name: string;
  description: string;
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
  uploads_count?: number;
  assignments_count?: number;
  events_count?: number;
}

export default function Units() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [application, setApplication] = useState<any>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnits();
      fetchApplicationStatus();
    }
  }, [user]);

  useEffect(() => {
    filterUnits();
  }, [units, searchQuery, selectedSemester, selectedYear]);

  const fetchApplicationStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching application status:', error);
        return;
      }

      setApplication(data);
    } catch (error) {
      console.error('Error fetching application status:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      // Use simple query to avoid complex join issues
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setUnits([]);
        return;
      }

      if (!profileData.class_id) {
        console.log('User has no class_id, cannot fetch units');
        setUnits([]);
        return;
      }

      // Fetch units separately with simpler query
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select(`
          *,
          classes(
            id,
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
        .eq('class_id', profileData.class_id);

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        setUnits([]);
        return;
      }

      // Process the units data
      const unitsWithStats = (unitsData || []).map(unit => ({
        ...unit,
        classes: unit.classes,
        uploads_count: 0,
        assignments_count: 0,
        events_count: 0
      }));

      setUnits(unitsWithStats);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUnits = () => {
    let filtered = units;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(unit =>
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Semester filter
    if (selectedSemester !== "all") {
      filtered = filtered.filter(unit => unit.classes.semester === parseInt(selectedSemester));
    }

    // Year filter
    if (selectedYear !== "all") {
      filtered = filtered.filter(unit => unit.classes.course_year === parseInt(selectedYear));
    }

    setFilteredUnits(filtered);
  };

  const getUniqueYears = () => {
    const years = [...new Set(units.map(unit => unit.classes.course_year))];
    return years.sort((a, b) => b - a);
  };

  const getUniqueSemesters = () => {
    const semesters = [...new Set(units.map(unit => unit.classes.semester))];
    return semesters.sort((a, b) => a - b);
  };

  const getTotalContent = (unit: Unit) => {
    return unit.uploads_count + unit.assignments_count + unit.events_count;
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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
              <BookOpen className="h-8 w-8 text-primary" />
              My Units
            </h1>
            <p className="text-muted-foreground mt-2">
              {units.length > 0 ? `All your units from ${units[0]?.classes?.universities?.name} • ${units[0]?.classes?.universities?.countries?.name}` : 'No units available'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {units.length} Units
            </Badge>
            {units.length > 0 && (
              <Badge variant="outline" className="text-sm">
                {units[0]?.classes?.course_name} - Year {units[0]?.classes?.course_year}
              </Badge>
            )}
          </div>
        </div>

        {/* Application Status */}
        {application && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Application Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {application.status === 'pending' && 'Your application is under review'}
                      {application.status === 'approved' && 'Your application has been approved!'}
                      {application.status === 'rejected' && 'Your application was not approved'}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={application.status === 'approved' ? 'default' : 
                          application.status === 'pending' ? 'secondary' : 'destructive'}
                  className="text-sm"
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
              {application.status === 'rejected' && application.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">
                    <strong>Reason:</strong> {application.rejection_reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Units - Apply Button */}
        {units.length === 0 && !application && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Units Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You need to apply for your class to access units and course materials.
                </p>
                <Button 
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply for Your Class
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {units.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search units..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="all">All Semesters</option>
                  {getUniqueSemesters().map(semester => (
                    <option key={semester} value={semester}>Semester {semester}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Units Grid */}
        {filteredUnits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map((unit) => (
              <Card
                key={unit.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/unit/${unit.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {unit.name}
                        </CardTitle>
                        <NotificationBadge count={notifications.units[unit.id] || 0} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          Year {unit.classes.course_year}, Sem {unit.classes.semester}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {unit.classes.course_group}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {unit.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {unit.description}
                    </p>
                  )}
                  
                  {/* Content Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{unit.uploads_count} notes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{unit.assignments_count} assignments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{unit.events_count} events</span>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created {format(new Date(unit.created_at), 'MMM dd, yyyy')}</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{getTotalContent(unit)} total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {units.length > 0 && filteredUnits.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No units found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Application Form Modal */}
        {showApplicationForm && (
          <ApplicationForm 
            onClose={() => setShowApplicationForm(false)}
            onSuccess={() => {
              setShowApplicationForm(false);
              fetchApplicationStatus();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Application Form Component
interface ApplicationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function ApplicationForm({ onClose, onSuccess }: ApplicationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
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

  const fetchClasses = async (universityId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('university_id', universityId)
        .order('course_name');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedClass || !fullName.trim() || !admissionNumber.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select your class.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          email: user.email,
          class_id: selectedClass,
          full_name: fullName.trim(),
          admission_number: admissionNumber.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your application has been sent to the admin for approval. You will be notified once it's reviewed.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Apply for Your Class</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admission Number</label>
                <Input
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="Enter your admission number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedUniversity('');
                  setSelectedClass('');
                  if (e.target.value) {
                    fetchUniversities(e.target.value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">University</label>
              <select
                value={selectedUniversity}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value);
                  setSelectedClass('');
                  if (e.target.value) {
                    fetchClasses(e.target.value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                disabled={!selectedCountry}
              >
                <option value="">Select University</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                disabled={!selectedUniversity}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.course_name} - Year {cls.course_year}, Sem {cls.semester} ({cls.course_group})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}