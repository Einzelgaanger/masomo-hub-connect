import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Search
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
  profiles?: {
    full_name: string;
    profile_picture_url: string;
  };
}

export default function Ajira() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
    benefits: ""
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");

  useEffect(() => {
    fetchJobPostings();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobPostings, searchTerm, jobTypeFilter]);

  const fetchJobPostings = async () => {
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

      // Then get job postings from users in the same university
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          profiles(
            full_name,
            profile_picture_url,
            classes!inner(
              university_id
            )
          )
        `)
        .eq('profiles.classes.university_id', userProfile.classes.university_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobPostings(data || []);
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
  };

  const filterJobs = () => {
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
  };

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

      const { error } = await supabase
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
          created_by: user?.id
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
      benefits: ""
    });
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case 'full_time': return 'bg-green-100 text-green-800';
      case 'part_time': return 'bg-blue-100 text-blue-800';
      case 'internship': return 'bg-purple-100 text-purple-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case 'full_time': return 'Full Time';
      case 'part_time': return 'Part Time';
      case 'internship': return 'Internship';
      case 'contract': return 'Contract';
      default: return jobType;
    }
  };

  const isDeadlineUrgent = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ajira</h1>
            <p className="text-muted-foreground">
              Find job opportunities, internships, and career prospects
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="mt-4 lg:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a Job Opportunity</DialogTitle>
                <DialogDescription>
                  Share job opportunities, internships, or career prospects with fellow students.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Software Developer, Marketing Intern, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>

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
                    placeholder="e.g., Nairobi, Remote, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    placeholder="e.g., $30,000 - $50,000, Negotiable, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="application_url">Application URL</Label>
                  <Input
                    id="application_url"
                    type="url"
                    value={formData.application_url}
                    onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                    placeholder="https://company.com/apply"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="hr@company.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and what the company does..."
                    rows={4}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="requirements">Requirements *</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="List the skills, qualifications, and experience required..."
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="benefits">Benefits & Perks</Label>
                  <Textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    placeholder="List benefits, perks, and what makes this opportunity attractive..."
                    rows={3}
                  />
                </div>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs, companies, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Postings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {filteredJobs.length === 0 && jobPostings.length > 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setJobTypeFilter("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {jobPostings.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No job postings yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share job opportunities and help fellow students find their next career move!
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Post First Job
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function JobCard({ job }: { job: JobPosting }) {
  const hasDeadline = !!job.application_deadline;
  const isUrgent = hasDeadline && isDeadlineUrgent(job.application_deadline!);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{job.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building className="h-4 w-4" />
              <span className="font-medium">{job.company}</span>
            </div>
          </div>
          <Badge className={getJobTypeColor(job.job_type)}>
            {getJobTypeLabel(job.job_type)}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{job.location}</span>
          </div>
          {job.salary_range && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{job.salary_range}</span>
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
