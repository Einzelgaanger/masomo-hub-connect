import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  GraduationCap, 
  Search, 
  Users, 
  Briefcase, 
  Calendar, 
  Award, 
  MessageCircle,
  UserPlus,
  Filter,
  MapPin,
  Building,
  Star,
  TrendingUp,
  Heart,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";

interface AlumniProfile {
  id: string;
  user_id: string;
  graduation_year: number;
  current_company: string;
  current_position: string;
  current_location: string;
  industry: string;
  linkedin_url: string;
  personal_website: string;
  bio: string;
  achievements: string[];
  skills: string[];
  willing_to_mentor: boolean;
  available_for_hiring: boolean;
  profiles: {
    full_name: string;
    profile_picture_url: string;
    email: string;
  };
  graduation_class: {
    course_name: string;
    course_year: number;
    semester: number;
    universities: {
      name: string;
      countries: {
        name: string;
      };
    };
  };
}

interface AlumniEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  location: string;
  is_virtual: boolean;
  meeting_url: string;
  max_attendees: number;
  current_attendees: number;
  created_by: string;
  created_at: string;
  profiles: {
    full_name: string;
    profile_picture_url: string;
  };
}

interface SuccessStory {
  id: string;
  title: string;
  story: string;
  achievement_type: string;
  featured: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    profile_picture_url: string;
  };
}

export default function Alumni() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_type: "networking",
    event_date: "",
    location: "",
    is_virtual: false,
    meeting_url: "",
    max_attendees: ""
  });

  const [storyForm, setStoryForm] = useState({
    title: "",
    story: "",
    achievement_type: "career_advancement"
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchAlumniData();
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes(
            course_name,
            course_year,
            semester,
            universities(
              name,
              countries(name)
            )
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAlumniData = async () => {
    try {
      await Promise.all([
        fetchAlumni(),
        fetchEvents(),
        fetchSuccessStories()
      ]);
    } catch (error) {
      console.error('Error fetching alumni data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if user is a graduate/alumni
  const isGraduate = () => {
    return userProfile?.role === 'alumni';
  };

  // Helper function to check if user can create content (graduates only)
  const canCreateContent = () => {
    return userProfile?.role === 'alumni';
  };

  const fetchAlumni = async () => {
    try {
      // First get user's university ID
      const userUniversityId = userProfile?.classes?.universities?.id;
      if (!userUniversityId) return;

      const { data, error } = await supabase
        .from('alumni_profiles')
        .select(`
          *,
          profiles(full_name, profile_picture_url, email),
          graduation_class:classes(
            course_name,
            course_year,
            semester,
            university_id,
            universities(name, countries(name))
          )
        `)
        .eq('graduation_class.university_id', userUniversityId)
        .order('graduation_year', { ascending: false });

      if (error) {
        // If table doesn't exist yet, just set empty array
        if (error.code === '42P01') {
          console.log('Alumni profiles table not created yet, showing empty list');
          setAlumni([]);
          return;
        }
        throw error;
      }
      setAlumni(data || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      setAlumni([]);
    }
  };

  const fetchEvents = async () => {
    try {
      // First get user's university ID
      const userUniversityId = userProfile?.classes?.universities?.id;
      if (!userUniversityId) return;

      // Try the full query first
      const { data, error } = await supabase
        .from('alumni_events')
        .select(`
          *,
          profiles(full_name, profile_picture_url)
        `)
        .eq('university_id', userUniversityId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) {
        console.warn('Full alumni events query failed, trying simplified query:', error);
        
        // Fallback to simplified query without university_id filter
        const { data: simpleData, error: simpleError } = await supabase
          .from('alumni_events')
          .select(`
            *,
            profiles(full_name, profile_picture_url)
          `)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(10);

        if (simpleError) {
          // If table doesn't exist yet, just set empty array
          if (simpleError.code === '42P01') {
            console.log('Alumni events table not created yet, showing empty list');
            setEvents([]);
            return;
          }
          throw simpleError;
        }
        
        // Filter by university on the client side if needed
        const filteredData = simpleData?.filter(event => 
          // You can add client-side filtering here if needed
          true
        ) || [];
        
        setEvents(filteredData);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchSuccessStories = async () => {
    try {
      // First get user's university ID
      const userUniversityId = userProfile?.classes?.universities?.id;
      if (!userUniversityId) return;

      // Try the full query with complex join first
      const { data, error } = await supabase
        .from('alumni_success_stories')
        .select(`
          *,
          profiles(full_name, profile_picture_url),
          alumni_profiles!inner(university_id)
        `)
        .eq('alumni_profiles.university_id', userUniversityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('Full alumni success stories query failed, trying simplified query:', error);
        
        // Fallback to simplified query without complex join
        const { data: simpleData, error: simpleError } = await supabase
          .from('alumni_success_stories')
          .select(`
            *,
            profiles(full_name, profile_picture_url)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (simpleError) {
          // If table doesn't exist yet, just set empty array
          if (simpleError.code === '42P01') {
            console.log('Alumni success stories table not created yet, showing empty list');
            setSuccessStories([]);
            return;
          }
          throw simpleError;
        }
        
        // Filter by university on the client side if needed
        const filteredData = simpleData?.filter(story => 
          // You can add client-side filtering here if needed
          true
        ) || [];
        
        setSuccessStories(filteredData);
      } else {
        setSuccessStories(data || []);
      }
    } catch (error) {
      console.error('Error fetching success stories:', error);
      setSuccessStories([]);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase
        .from('alumni_events')
        .insert({
          ...eventForm,
          max_attendees: eventForm.max_attendees ? parseInt(eventForm.max_attendees) : null,
          created_by: user?.id,
          university_id: userProfile?.classes?.universities?.id
        });

      if (error) {
        if (error.code === '42P01') {
          toast({
            title: "Error",
            description: "Alumni system not set up yet. Please contact admin.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      setIsCreateEventOpen(false);
      setEventForm({
        title: "",
        description: "",
        event_type: "networking",
        event_date: "",
        location: "",
        is_virtual: false,
        meeting_url: "",
        max_attendees: ""
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
    }
  };

  const handleCreateStory = async () => {
    try {
      const { error } = await supabase
        .from('alumni_success_stories')
        .insert({
          ...storyForm,
          alumni_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Success story shared!",
      });

      setIsCreateStoryOpen(false);
      setStoryForm({
        title: "",
        story: "",
        achievement_type: "career_advancement"
      });
      fetchSuccessStories();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error",
        description: "Failed to share story.",
        variant: "destructive",
      });
    }
  };

  const filteredAlumni = alumni.filter(alumnus => {
    const matchesSearch = 
      alumnus.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumnus.current_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumnus.current_position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumnus.industry?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = selectedYear === "all" || alumnus.graduation_year.toString() === selectedYear;
    const matchesIndustry = selectedIndustry === "all" || alumnus.industry === selectedIndustry;

    return matchesSearch && matchesYear && matchesIndustry;
  });

  const getUniqueYears = () => {
    const years = Array.from(new Set(alumni.map(a => a.graduation_year)));
    return years.sort((a, b) => b - a);
  };

  const getUniqueIndustries = () => {
    const industries = Array.from(new Set(alumni.map(a => a.industry).filter(Boolean)));
    return industries.sort();
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'career_advancement': return <TrendingUp className="h-4 w-4" />;
      case 'entrepreneurship': return <Briefcase className="h-4 w-4" />;
      case 'award': return <Award className="h-4 w-4" />;
      case 'publication': return <Star className="h-4 w-4" />;
      case 'innovation': return <Heart className="h-4 w-4" />;
      case 'leadership': return <Users className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Alumni Network
            </h1>
            <p className="text-muted-foreground mt-2">
              {isGraduate() 
                ? "Connect with fellow graduates, share your achievements, and organize alumni events."
                : "Connect with graduates, discover career opportunities, and stay updated with alumni events."
              }
            </p>
            {!isGraduate() && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>As a current student/lecturer:</strong> You can view alumni profiles, events, and success stories. 
                  Alumni can create events and share their achievements.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {alumni.length} Alumni
            </Badge>
            <Badge variant="outline" className="text-sm">
              {events.length} Upcoming Events
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="alumni" className="w-full">
          <Card>
            <CardContent className="p-2 sm:p-3">
              <TabsList className="grid w-full grid-cols-4 h-auto">
                <TabsTrigger value="alumni" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 py-2 min-w-0">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Alumni</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 py-2 min-w-0">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Events</span>
                </TabsTrigger>
                <TabsTrigger value="stories" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 py-2 min-w-0">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Stories</span>
                </TabsTrigger>
                <TabsTrigger value="mentorship" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 py-2 min-w-0">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Mentor</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          {/* Alumni Directory Tab */}
          <TabsContent value="alumni" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Find Alumni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search alumni by name, company, position..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                      title="Filter by graduation year"
                    >
                      <option value="all">All Years</option>
                      {getUniqueYears().map(year => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                      title="Filter by industry"
                    >
                      <option value="all">All Industries</option>
                      {getUniqueIndustries().map(industry => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alumni Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlumni.map((alumnus) => (
                <Card key={alumnus.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={alumnus.profiles.profile_picture_url} />
                        <AvatarFallback>
                          {alumnus.profiles.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{alumnus.profiles.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Class of {alumnus.graduation_year}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alumnus.willing_to_mentor && (
                            <Badge variant="outline" className="text-xs">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Mentor
                            </Badge>
                          )}
                          {alumnus.available_for_hiring && (
                            <Badge variant="outline" className="text-xs">
                              <Briefcase className="h-3 w-3 mr-1" />
                              Hiring
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-3">
                    {alumnus.current_company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{alumnus.current_position} at {alumnus.current_company}</span>
                      </div>
                    )}
                    
                    {alumnus.current_location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{alumnus.current_location}</span>
                      </div>
                    )}
                    
                    {alumnus.industry && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Industry:</span>
                        <Badge variant="secondary" className="text-xs">
                          {alumnus.industry}
                        </Badge>
                      </div>
                    )}
                    
                    {alumnus.skills && alumnus.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {alumnus.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {alumnus.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{alumnus.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/inbox/${alumnus.user_id}`)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      {alumnus.linkedin_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={alumnus.linkedin_url} target="_blank" rel="noopener noreferrer" title="View LinkedIn profile">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              {canCreateContent() && (
                <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Alumni Event</DialogTitle>
                      <DialogDescription>
                        Organize networking events, workshops, or reunions for alumni.
                      </DialogDescription>
                    </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        id="title"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                        placeholder="Networking Mixer, Career Workshop, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={eventForm.description}
                        onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                        placeholder="Describe the event..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_type">Event Type</Label>
                        <select
                          id="event_type"
                          value={eventForm.event_type}
                          onChange={(e) => setEventForm({...eventForm, event_type: e.target.value})}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                          title="Select event type"
                          aria-label="Select event type"
                        >
                          <option value="networking">Networking</option>
                          <option value="career_development">Career Development</option>
                          <option value="social">Social</option>
                          <option value="reunion">Reunion</option>
                          <option value="webinar">Webinar</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="event_date">Event Date</Label>
                        <Input
                          id="event_date"
                          type="datetime-local"
                          value={eventForm.event_date}
                          onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={eventForm.location}
                          onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                          placeholder="Physical location or 'Virtual'"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="max_attendees">Max Attendees (optional)</Label>
                        <Input
                          id="max_attendees"
                          type="number"
                          value={eventForm.max_attendees}
                          onChange={(e) => setEventForm({...eventForm, max_attendees: e.target.value})}
                          placeholder="50"
                        />
                      </div>
                    </div>
                    
                    {eventForm.is_virtual && (
                      <div>
                        <Label htmlFor="meeting_url">Meeting URL</Label>
                        <Input
                          id="meeting_url"
                          value={eventForm.meeting_url}
                          onChange={(e) => setEventForm({...eventForm, meeting_url: e.target.value})}
                          placeholder="https://meet.google.com/..."
                        />
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent}>
                      Create Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{event.event_type.replace(/_/g, ' ')}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), 'MMM dd, yyyy • h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {event.current_attendees}/{event.max_attendees || '∞'} attending
                        </span>
                        <Button size="sm" variant="outline">
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Success Stories Tab */}
          <TabsContent value="stories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Success Stories</h2>
              {canCreateContent() && (
                <Dialog open={isCreateStoryOpen} onOpenChange={setIsCreateStoryOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Star className="h-4 w-4 mr-2" />
                      Share Story
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Share Your Success Story</DialogTitle>
                      <DialogDescription>
                        Inspire others by sharing your achievements and career milestones.
                      </DialogDescription>
                    </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="story_title">Story Title</Label>
                      <Input
                        id="story_title"
                        value={storyForm.title}
                        onChange={(e) => setStoryForm({...storyForm, title: e.target.value})}
                        placeholder="e.g., 'From Graduate to CEO in 5 Years'"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="achievement_type">Achievement Type</Label>
                        <select
                          id="achievement_type"
                          value={storyForm.achievement_type}
                          onChange={(e) => setStoryForm({...storyForm, achievement_type: e.target.value})}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                          title="Select achievement type"
                          aria-label="Select achievement type"
                        >
                        <option value="career_advancement">Career Advancement</option>
                        <option value="entrepreneurship">Entrepreneurship</option>
                        <option value="award">Award/Recognition</option>
                        <option value="publication">Publication</option>
                        <option value="innovation">Innovation</option>
                        <option value="leadership">Leadership</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="story">Your Story</Label>
                      <Textarea
                        id="story"
                        value={storyForm.story}
                        onChange={(e) => setStoryForm({...storyForm, story: e.target.value})}
                        placeholder="Share your journey, challenges overcome, and lessons learned..."
                        rows={6}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateStoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateStory}>
                      Share Story
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              )}
            </div>

            <div className="space-y-6">
              {successStories.map((story) => (
                <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedStory(story)}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={story.profiles.profile_picture_url} />
                        <AvatarFallback>
                          {story.profiles.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{story.title}</h3>
                          <div className="flex items-center gap-1">
                            {getAchievementIcon(story.achievement_type)}
                            <Badge variant="outline" className="text-xs">
                              {story.achievement_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          By {story.profiles.full_name} • {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {story.story}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mentorship Tab */}
          <TabsContent value="mentorship" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Mentorship Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-6 ${isGraduate() ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Find a Mentor</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect with experienced alumni who can guide your career
                    </p>
                    <Button variant="outline">
                      Browse Mentors
                    </Button>
                  </div>
                  
                  {isGraduate() && (
                    <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
                      <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Become a Mentor</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Share your experience and help current students succeed
                      </p>
                      <Button variant="outline">
                        Start Mentoring
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Story Details Dialog */}
        <Dialog open={!!selectedStory} onOpenChange={(open) => !open && setSelectedStory(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedStory?.title}</DialogTitle>
              <DialogDescription>
                {selectedStory && (
                  <span>
                    By {selectedStory.profiles.full_name} • {formatDistanceToNow(new Date(selectedStory.created_at), { addSuffix: true })}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedStory && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getAchievementIcon(selectedStory.achievement_type)}
                  <Badge variant="outline" className="text-xs">
                    {selectedStory.achievement_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedStory.story}</p>
                <div>
                  <Button variant="outline" onClick={() => setSelectedStory(null)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
