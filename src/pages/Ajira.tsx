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

function isJobExpired(deadline: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return deadlineDate < now;
}

// JobCard component
function JobCard({ job }: { job: JobPosting }) {
  const hasDeadline = !!job.application_deadline;
  const isUrgent = hasDeadline && isDeadlineUrgent(job.application_deadline!);
  const isExpired = hasDeadline && isJobExpired(job.application_deadline!);

  return (
    <Card className={`transition-shadow duration-200 h-full flex flex-col ${
      isExpired ? 'opacity-60 bg-gray-50' : 'hover:shadow-lg'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg mb-2 line-clamp-2">{job.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium truncate">{job.company}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getJobTypeColor(job.job_type)}>
              {getJobTypeLabel(job.job_type)}
            </Badge>
            {isExpired && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                Expired
              </Badge>
            )}
          </div>
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
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {job.profiles?.profile_picture_url ? (
                  <img 
                    src={job.profiles.profile_picture_url} 
                    alt={job.profiles.full_name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-3 w-3 text-gray-500" />
                )}
              </div>
              <span className="font-medium">{job.profiles?.full_name || 'Unknown User'}</span>
            </div>
            <span className="text-muted-foreground">
              • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* University and Country Info */}
          {(job.profiles?.universities?.name || job.profiles?.universities?.countries?.name) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              {job.profiles?.universities?.name && (
                <>
                  <span>{job.profiles.universities.name}</span>
                  {job.profiles?.universities?.countries?.name && <span>•</span>}
                </>
              )}
              {job.profiles?.universities?.countries?.name && (
                <span>{job.profiles.universities.countries.name}</span>
              )}
            </div>
          )}

          {/* Visibility Info */}
          {job.visibility && (
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
          )}

          {hasDeadline && (
            <div className={`flex items-center gap-2 text-sm ${
              isExpired ? 'text-red-600 font-medium' : 
              isUrgent ? 'text-red-600 font-medium' : 
              'text-muted-foreground'
            }`}>
              <Calendar className="h-4 w-4" />
              <span>
                Deadline: {format(new Date(job.application_deadline!), 'MMM dd, yyyy')}
                {isExpired && ' (Expired)'}
                {isUrgent && !isExpired && ' (Urgent!)'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex gap-2">
            {job.application_url && !isExpired && (
              <Button size="sm" className="flex-1" asChild>
                <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Apply
                </a>
              </Button>
            )}
            {isExpired && (
              <Button size="sm" disabled className="flex-1">
                <ExternalLink className="h-4 w-4 mr-1" />
                Expired
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
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

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
  const [locationFilter, setLocationFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, expired, urgent
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchJobPostings = useCallback(async () => {
    try {
      // First get the current user's university
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          university_id,
          country_id
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
          profiles!inner(
            full_name,
            profile_picture_url,
            university_id,
            country_id,
            universities!fk_profiles_university(
              name,
              countries!inner(name)
            )
          )
        `)
        .eq('profiles.university_id', userProfile.university_id)
        .order('created_at', { ascending: false });

      // Fetch all job postings (global, country, and university)
      const { data: allJobsData, error: allJobsError } = await (supabase as any)
        .from('job_postings')
        .select(`
          *,
          profiles!inner(
            full_name,
            profile_picture_url,
            university_id,
            country_id,
            universities!fk_profiles_university(
              name,
              countries!inner(name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (myUniError) throw myUniError;
      if (allJobsError) throw allJobsError;

      const myUniId = userProfile.university_id;
      
      // Sort jobs by priority: recent first, then by deadline urgency
      const sortJobsByPriority = (jobs: any[]) => {
        return jobs.sort((a, b) => {
          const aDeadline = a.application_deadline ? new Date(a.application_deadline) : null;
          const bDeadline = b.application_deadline ? new Date(b.application_deadline) : null;
          const now = new Date();
          
          // Check if jobs are expired
          const aExpired = aDeadline && aDeadline < now;
          const bExpired = bDeadline && bDeadline < now;
          
          // Check if jobs are urgent (deadline within 7 days)
          const aUrgent = aDeadline && !aExpired && (aDeadline.getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          const bUrgent = bDeadline && !bExpired && (bDeadline.getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          
          // Priority order: urgent jobs first, then recent jobs, then expired jobs
          if (aUrgent && !bUrgent) return -1;
          if (!aUrgent && bUrgent) return 1;
          
          // If both are urgent or both are not urgent, sort by creation date (most recent first)
          const aCreated = new Date(a.created_at);
          const bCreated = new Date(b.created_at);
          return bCreated.getTime() - aCreated.getTime();
        });
      };
      
      const sortedMyUniJobs = sortJobsByPriority((myUniJobs as any[]) || []);
      setMyUniversityJobs(sortedMyUniJobs);
      
      // Exclude anything from my own university from the All tab to avoid repetition
      const filteredAll = ((allJobsData as any[]) || []).filter((job: any) => job?.profiles?.university_id !== myUniId);
      const sortedAllJobs = sortJobsByPriority(filteredAll);
      setAllJobs(sortedAllJobs);
      setJobPostings(sortedMyUniJobs); // Default to university jobs
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

    // Enhanced search functionality - searches through title, company, description, location, and requirements
    if (searchTerm) {
      filtered = filtered.filter(job => {
        const searchLower = searchTerm.toLowerCase();
        return (
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
          job.location.toLowerCase().includes(searchLower) ||
          (job.requirements && job.requirements.toLowerCase().includes(searchLower)) ||
          (job.benefits && job.benefits.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filter by job type
    if (jobTypeFilter !== "all") {
      filtered = filtered.filter(job => job.job_type === jobTypeFilter);
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Filter by salary range
    if (salaryFilter) {
      filtered = filtered.filter(job => {
        if (!job.salary_range) return false;
        return job.salary_range.toLowerCase().includes(salaryFilter.toLowerCase());
      });
    }

    // Filter by status (active, expired, urgent)
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => {
        if (!job.application_deadline) return statusFilter === "active";
        
        const deadline = new Date(job.application_deadline);
        const now = new Date();
        const isExpired = deadline < now;
        const isUrgent = !isExpired && (deadline.getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        
        switch (statusFilter) {
          case "active":
            return !isExpired;
          case "expired":
            return isExpired;
          case "urgent":
            return isUrgent;
          default:
            return true;
        }
      });
    }

    setFilteredJobs(filtered);
  }, [jobPostings, searchTerm, jobTypeFilter, locationFilter, salaryFilter, statusFilter]);

  const handleCreateJob = async () => {
    try {
      if (!formData.title || !formData.company || !formData.description || !formData.job_type || !formData.location || !formData.requirements || !formData.application_deadline) {
        toast({
          title: "Error",
          description: "Please fill in all required fields including the application deadline.",
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
          application_deadline: formData.application_deadline,
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

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search jobs by title, company, description, requirements, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t">
                <div>
                  <Label htmlFor="job-type-filter">Job Type</Label>
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location-filter">Location</Label>
                  <Input
                    id="location-filter"
                    placeholder="e.g., Nairobi, Remote"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="salary-filter">Salary Range</Label>
                  <Input
                    id="salary-filter"
                    placeholder="e.g., 50k, 100k+"
                    value={salaryFilter}
                    onChange={(e) => setSalaryFilter(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Jobs</SelectItem>
                      <SelectItem value="urgent">Urgent (≤7 days)</SelectItem>
                      <SelectItem value="expired">Expired Jobs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Clear Filters Button */}
            {(searchTerm || jobTypeFilter !== "all" || locationFilter || salaryFilter || statusFilter !== "all") && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setJobTypeFilter("all");
                    setLocationFilter("");
                    setSalaryFilter("");
                    setStatusFilter("all");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
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
                <div key={job.id} onClick={() => setSelectedJob(job)} className="cursor-pointer">
                  <JobCard job={job} />
                </div>
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
                <div key={job.id} onClick={() => setSelectedJob(job)} className="cursor-pointer">
                  <JobCard job={job} />
                </div>
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

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Posted by {selectedJob?.profiles?.full_name} • {selectedJob?.company}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{selectedJob.company}</span>
                </div>
                {selectedJob.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedJob.location}</span>
                  </div>
                )}
                {selectedJob.salary_range && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{selectedJob.salary_range}</span>
                  </div>
                )}
                {selectedJob.application_deadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {format(new Date(selectedJob.application_deadline), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedJob.requirements}</p>
              </div>

              {selectedJob.benefits && (
                <div>
                  <h4 className="font-semibold mb-2">Benefits</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedJob.benefits}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {selectedJob.application_url && (
                  <Button className="flex-1" asChild>
                    <a href={selectedJob.application_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </a>
                  </Button>
                )}
                {selectedJob.contact_email && (
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`mailto:${selectedJob.contact_email}`}>
                      Contact Recruiter
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedJob(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}