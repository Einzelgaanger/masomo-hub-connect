import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onProfileUpdated: () => void;
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

interface Course {
  id: string;
  name: string;
  university_id: string;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Form data
  const [fullName, setFullName] = useState('');
  const [countryId, setCountryId] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [studentStatus, setStudentStatus] = useState<'student' | 'graduated' | 'alumni'>('student');

  // Dropdown data
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open, profile]);

  useEffect(() => {
    // Filter universities when country changes
    if (countryId) {
      const filtered = universities.filter(uni => uni.country_id === countryId);
      setFilteredUniversities(filtered);
      // Reset university and course if country changed
      if (universityId && !filtered.find(uni => uni.id === universityId)) {
        setUniversityId('');
        setCourseId('');
      }
    } else {
      setFilteredUniversities([]);
    }
  }, [countryId, universities]);

  useEffect(() => {
    // Filter courses when university changes
    if (universityId) {
      const filtered = courses.filter(course => course.university_id === universityId);
      setFilteredCourses(filtered);
      // Reset course if university changed
      if (courseId && !filtered.find(course => course.id === courseId)) {
        setCourseId('');
      }
    } else {
      setFilteredCourses([]);
    }
  }, [universityId, courses]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Fetch countries, universities, and courses
      const [countriesRes, universitiesRes, coursesRes] = await Promise.all([
        supabase.from('countries').select('*').order('name'),
        supabase.from('universities').select('*').order('name'),
        supabase.from('courses').select('*').order('name'),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (universitiesRes.error) throw universitiesRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setCountries(countriesRes.data || []);
      setUniversities(universitiesRes.data || []);
      setCourses(coursesRes.data || []);

      // Set current profile data
      if (profile) {
        setFullName(profile.full_name || '');
        setCountryId(profile.country_id || '');
        setUniversityId(profile.university_id || '');
        setCourseId(profile.course_id || '');
        setYear(profile.year || '');
        setSemester(profile.semester || '');
        setStudentStatus(profile.student_status || 'student');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your full name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          country_id: countryId || null,
          university_id: universityId || null,
          course_id: courseId || null,
          year: year.trim() || null,
          semester: semester.trim() || null,
          student_status: studentStatus,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      onProfileUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. This will be visible to everyone on the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select your country" />
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

          {/* University */}
          <div>
            <Label htmlFor="university">University</Label>
            <Select 
              value={universityId} 
              onValueChange={setUniversityId}
              disabled={!countryId}
            >
              <SelectTrigger id="university">
                <SelectValue placeholder={
                  countryId 
                    ? "Select your university" 
                    : "Select country first"
                } />
              </SelectTrigger>
              <SelectContent>
                {filteredUniversities.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course */}
          <div>
            <Label htmlFor="course">Course/Program</Label>
            <Select 
              value={courseId} 
              onValueChange={setCourseId}
              disabled={!universityId}
            >
              <SelectTrigger id="course">
                <SelectValue placeholder={
                  universityId 
                    ? "Select your course" 
                    : "Select university first"
                } />
              </SelectTrigger>
              <SelectContent>
                {filteredCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div>
            <Label htmlFor="year">Year/Level</Label>
            <Input
              id="year"
              placeholder="e.g., 1, 2, 3rd Year, Final Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter freely: 1, 2, 3, "3rd Year", "Final Year", etc.
            </p>
          </div>

          {/* Semester */}
          <div>
            <Label htmlFor="semester">Semester/Term</Label>
            <Input
              id="semester"
              placeholder="e.g., Fall, Spring, 1, 2"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter freely: "Fall", "Spring", "1", "2", etc.
            </p>
          </div>

          {/* Student Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={studentStatus} onValueChange={(value: any) => setStudentStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

