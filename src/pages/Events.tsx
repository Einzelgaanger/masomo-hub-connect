import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, MapPin, Clock, User, Image as ImageIcon, Upload, X, Globe, Building, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  event_date?: string;
  location?: string;
  image_url?: string;
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

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [myUniversityEvents, setMyUniversityEvents] = useState<PublicEvent[]>([]);
  const [allEvents, setAllEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    visibility: "university" as 'university' | 'country' | 'global',
    target_countries: [] as string[]
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchAvailableCountries();
  }, []);

  const fetchEvents = async () => {
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

      // Fetch events from my university only
      const { data: myUniEvents, error: myUniError } = await supabase
        .from('public_events')
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

      // Fetch all events (global, country, and university)
      const { data: allEventsData, error: allEventsError } = await supabase
        .from('public_events')
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
      if (allEventsError) throw allEventsError;

      setMyUniversityEvents(myUniEvents || []);
      setAllEvents(allEventsData || []);
      setEvents(myUniEvents || []); // Default to university events
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCountries = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_countries');
      if (error) throw error;
      setAvailableCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    try {
      setUploadingImage(true);
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public-events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-events')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public-events')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      if (!formData.title || !formData.description) {
        toast({
          title: "Error",
          description: "Please fill in title and description.",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);

      // Upload image if selected
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (selectedImage && !imageUrl) {
          return; // Stop if image upload failed
        }
      }

      const { error } = await supabase
        .from('public_events')
        .insert({
          title: formData.title,
          description: formData.description,
          event_date: formData.event_date || null,
          location: formData.location || null,
          image_url: imageUrl,
          created_by: user?.id,
          visibility: formData.visibility,
          target_countries: formData.visibility === 'country' ? formData.target_countries : null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tukio created successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      location: "",
      visibility: "university",
      target_countries: []
    });
    setSelectedImage(null);
    setImagePreview(null);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tukio</h1>
            <p className="text-muted-foreground">
              Discover and share events happening in your student community
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={resetForm} className="mt-4 sm:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tukio
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Tukio</DialogTitle>
                <DialogDescription>
                  Share an event or happening with your student community. Add an image to make it more engaging!
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Tukio Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Study Group, Sports Event, Party, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your event in detail..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_date">Event Date (Optional)</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Main Campus, Online, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="visibility">Who can see this event?</Label>
                  <select
                    id="visibility"
                    value={formData.visibility}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      visibility: e.target.value as 'university' | 'country' | 'global',
                      target_countries: e.target.value === 'country' ? formData.target_countries : []
                    })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    title="Select visibility level for your event"
                    aria-label="Select visibility level for your event"
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

                <div>
                  <Label htmlFor="image">Event Image (Optional)</Label>
                  <div className="space-y-2">
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload an image to make your event more engaging
                        </p>
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="max-w-xs mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateEvent} 
                  disabled={isCreating || uploadingImage}
                >
                  {isCreating ? "Creating..." : uploadingImage ? "Uploading..." : "Create Tukio"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events Tabs */}
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
              {myUniversityEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {myUniversityEvents.length === 0 && (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No campus events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a tukio for your campus!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Campus Tukio
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {allEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {allEvents.length === 0 && (
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No global events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a global tukio!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Global Tukio
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EventCard({ event }: { event: PublicEvent }) {
  const hasImage = !!event.image_url;
  const hasDate = !!event.event_date;
  const hasLocation = !!event.location;

  const getVisibilityIcon = () => {
    switch (event.visibility) {
      case 'university': return <Building className="h-3 w-3" />;
      case 'country': return <Users className="h-3 w-3" />;
      case 'global': return <Globe className="h-3 w-3" />;
      default: return <Building className="h-3 w-3" />;
    }
  };

  const getVisibilityText = () => {
    switch (event.visibility) {
      case 'university': return 'My University';
      case 'country': return 'Selected Countries';
      case 'global': return 'All Countries';
      default: return 'My University';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {hasImage ? (
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* Overlay Content */}
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4">
            <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
              {event.title}
            </h3>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <User className="h-4 w-4" />
              <span>{event.profiles?.full_name}</span>
            </div>
          </div>
        </div>
      ) : (
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2 line-clamp-2">{event.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={event.profiles?.profile_picture_url} />
                  <AvatarFallback className="text-xs">
                    {event.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span>{event.profiles?.full_name}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={hasImage ? "p-4" : "pt-0"}>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {event.description}
        </p>

        <div className="space-y-2">
          {hasDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(event.event_date!), 'MMM dd, yyyy')}</span>
              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
              <span>{format(new Date(event.event_date!), 'HH:mm')}</span>
            </div>
          )}
          
          {hasLocation && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            {/* University and Course Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              <span>{event.universities?.name}</span>
              <span>•</span>
              <span>{event.classes?.course_name}</span>
              {event.universities?.countries && (
                <>
                  <span>•</span>
                  <span>{event.universities.countries.name}</span>
                </>
              )}
            </div>

            {/* Visibility and Time */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {getVisibilityIcon()}
                <span>{getVisibilityText()}</span>
              </div>
              <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
            </div>

            {hasImage && (
              <Badge variant="secondary" className="text-xs w-fit">
                <ImageIcon className="h-3 w-3 mr-1" />
                With Image
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
