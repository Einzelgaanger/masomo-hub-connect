import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Plus, 
  Briefcase, 
  MapPin, 
  Clock, 
  User, 
  Building, 
  DollarSign, 
  Calendar,
  ExternalLink,
  Filter,
  Search,
  Globe,
  Users
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  job_type: string; // 'full_time', 'part_time', 'internship', 'contract'
  location: string;
  salary_range?: string;
  application_deadline?: string;
  application_url?: string;
  contact_email?: string;
  requirements: string;
  benefits?: string;
  created_at: string;
  created_by: string;
  visibility: 'university' | 'country' | 'global';
  target_countries?: string[];
  profiles?: {
    full_name: string;
    profile_picture_url: string;
  };
  universities?: {
    name: string;
    countries?: {
      name: string;
    };
  };
  classes?: {
    course_name: string;
  };
}

interface Country {
  country_id: string;
  country_name: string;
}

// Helper functions
function getJobTypeColor(jobType: string) {
  switch (jobType) {
    case 'full_time': return 'bg-green-100 text-green-800';
    case 'part_time': return 'bg-blue-100 text-blue-800';
    case 'internship': return 'bg-purple-100 text-purple-800';
    case 'contract': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getJobTypeLabel(jobType: string) {
  switch (jobType) {
    case 'full_time': return 'Full Time';
    case 'part_time': return 'Part Time';
    case 'internship': return 'Internship';
    case 'contract': return 'Contract';
    default: return jobType;
  }
}

function isDeadlineUrgent(deadline: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
}

// JobCard component
function JobCard({ job }: { job: JobPosting }) {
  const hasDeadline = !!job.application_deadline;
  const isUrgent = hasDeadline && isDeadlineUrgent(job.application_deadline!);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg mb-2 line-clamp-2">{job.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium truncate">{job.company}</span>
            </div>
          </div>
          <Badge className={getJobTypeColor(job.job_type)}>
            {getJobTypeLabel(job.job_type)}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          {job.salary_range && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.salary_range}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {job.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Posted by {job.profiles?.full_name}</span>
            <span className="text-muted-foreground">
              • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* University and Course Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building className="h-3 w-3" />
            <span>{job.universities?.name}</span>
            <span>•</span>
            <span>{job.classes?.course_name}</span>
            {job.universities?.countries && (
              <>
                <span>•</span>
                <span>{job.universities.countries.name}</span>
              </>
            )}
          </div>

          {/* Visibility Info */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {job.visibility === 'university' && <Building className="h-3 w-3" />}
            {job.visibility === 'country' && <Users className="h-3 w-3" />}
            {job.visibility === 'global' && <Globe className="h-3 w-3" />}
            <span>
              {job.visibility === 'university' && 'My University'}
              {job.visibility === 'country' && 'Selected Countries'}
              {job.visibility === 'global' && 'All Countries'}
            </span>
          </div>

          {hasDeadline && (
            <div className={`flex items-center gap-2 text-sm ${isUrgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
              <Calendar className="h-4 w-4" />
              <span>
                Deadline: {format(new Date(job.application_deadline!), 'MMM dd, yyyy')}
                {isUrgent && ' (Urgent!)'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex gap-2">
            {job.application_url && (
              <Button size="sm" className="flex-1" asChild>
                <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Apply
                </a>
              </Button>
            )}
            {job.contact_email && (
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <a href={`mailto:${job.contact_email}`}>
                  Contact
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Ajira() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [myUniversityJobs, setMyUniversityJobs] = useState<JobPosting[]>([]);
  const [allJobs, setAllJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    job_type: "",
    location: "",
    salary_range: "",
    application_deadline: "",
    application_url: "",
    contact_email: "",
    requirements: "",
    benefits: "",
    visibility: "university" as 'university' | 'country' | 'global',
    target_countries: [] as string[]
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");

  const fetchJobPostings = useCallback(async () => {
    try {
      // First get the current user's university
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          classes!inner(
            university_id
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      // Fetch job postings from my university only
      const { data: myUniJobs, error: myUniError } = await (supabase as any)
        .from('job_postings')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url,
            classes!inner(
              course_name,
              university_id,
              universities!inner(
                name,
                countries!inner(name)
              )
            )
          )
        `)
        .eq('profiles.classes.university_id', userProfile.classes.university_id)
        .order('created_at', { ascending: false });

      // Fetch all job postings (global, country, and university)
      const { data: allJobsData, error: allJobsError } = await (supabase as any)
        .from('job_postings')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url,
            classes!inner(
              course_name,
              university_id,
              universities!inner(
                name,
                countries!inner(name)
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (myUniError) throw myUniError;
      if (allJobsError) throw allJobsError;

      setMyUniversityJobs((myUniJobs as any[]) || []);
      setAllJobs((allJobsData as any[]) || []);
      setJobPostings((myUniJobs as any[]) || []); // Default to university jobs
    } catch (error) {
      console.error('Error fetching job postings:', error);
      toast({
        title: "Error",
        description: "Failed to load job postings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const fetchAvailableCountries = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('get_available_countries');
      if (error) throw error;
      setAvailableCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const filterJobs = useCallback(() => {
    let filtered = jobPostings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by job type
    if (jobTypeFilter !== "all") {
      filtered = filtered.filter(job => job.job_type === jobTypeFilter);
    }

    setFilteredJobs(filtered);
  }, [jobPostings, searchTerm, jobTypeFilter]);

  const handleCreateJob = async () => {
    try {
      if (!formData.title || !formData.company || !formData.description || !formData.job_type || !formData.location || !formData.requirements) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);

      const { error } = await (supabase as any)
        .from('job_postings')
        .insert({
          title: formData.title,
          company: formData.company,
          description: formData.description,
          job_type: formData.job_type,
          location: formData.location,
          salary_range: formData.salary_range || null,
          application_deadline: formData.application_deadline || null,
          application_url: formData.application_url || null,
          contact_email: formData.contact_email || null,
          requirements: formData.requirements,
          benefits: formData.benefits || null,
          created_by: user?.id,
          visibility: formData.visibility,
          target_countries: formData.visibility === 'country' ? formData.target_countries : null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job posting created successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchJobPostings();
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast({
        title: "Error",
        description: "Failed to create job posting.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      description: "",
      job_type: "",
      location: "",
      salary_range: "",
      application_deadline: "",
      application_url: "",
      contact_email: "",
      requirements: "",
      benefits: "",
      visibility: "university",
      target_countries: []
    });
  };

  useEffect(() => {
    fetchJobPostings();
    fetchAvailableCountries();
  }, [fetchJobPostings]);

  useEffect(() => {
    filterJobs();
  }, [filterJobs]);
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job opportunities...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Ajira</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Discover job opportunities and internships in your student community
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a Job Opportunity</DialogTitle>
                <DialogDescription>
                  Share job opportunities, internships, or career openings with students.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Software Developer, Marketing Intern"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., Tech Corp, Startup Inc"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and what makes this opportunity special..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_type">Job Type *</Label>
                    <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Nairobi, Remote, Hybrid"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salary_range">Salary Range (Optional)</Label>
                    <Input
                      id="salary_range"
                      value={formData.salary_range}
                      onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                      placeholder="e.g., $50,000 - $70,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="application_deadline">Application Deadline (Optional)</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="application_url">Application URL (Optional)</Label>
                    <Input
                      id="application_url"
                      value={formData.application_url}
                      onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                      placeholder="https://company.com/careers"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Contact Email (Optional)</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="hr@company.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="requirements">Requirements *</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="List the skills, qualifications, and requirements for this position..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="benefits">Benefits (Optional)</Label>
                  <Textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    placeholder="Describe the benefits, perks, and what makes this opportunity attractive..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="visibility">Who can see this job posting?</Label>
                  <select
                    id="visibility"
                    value={formData.visibility}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      visibility: e.target.value as 'university' | 'country' | 'global',
                      target_countries: e.target.value === 'country' ? formData.target_countries : []
                    })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    title="Select visibility level for your job posting"
                    aria-label="Select visibility level for your job posting"
                  >
                    <option value="university">My University Only</option>
                    <option value="country">Specific Countries</option>
                    <option value="global">All Countries</option>
                  </select>
                </div>

                {formData.visibility === 'country' && (
                  <div>
                    <Label htmlFor="countries">Select Countries</Label>
                    <div className="max-h-32 overflow-y-auto border border-input rounded-md p-2">
                      {availableCountries.map((country) => (
                        <label key={country.country_id} className="flex items-center space-x-2 p-1">
                          <input
                            type="checkbox"
                            checked={formData.target_countries.includes(country.country_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  target_countries: [...formData.target_countries, country.country_id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  target_countries: formData.target_countries.filter(id => id !== country.country_id)
                                });
                              }
                            }}
                          />
                          <span className="text-sm">{country.country_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob} disabled={isCreating}>
                  {isCreating ? "Posting..." : "Post Job"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Job Postings Tabs */}
        <Tabs defaultValue="my-campus" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-campus" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Building className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">My Campus</span>
              <span className="xs:hidden">Campus</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              All
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-campus" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {myUniversityJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {myUniversityJobs.length === 0 && (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No campus jobs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to post a job opportunity for your campus!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post First Campus Job
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {allJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {allJobs.length === 0 && (
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No global jobs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to post a global job opportunity!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post First Global Job
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}