import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, FileText, Calendar, Upload, Eye } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  media_url: string;
  media_type: string;
  created_at: string;
  created_by: string;
  universities: {
    name: string;
    countries: {
      name: string;
    };
  };
}

interface Class {
  id: string;
  course_name: string;
  course_year: number;
  semester: number;
  course_group: string;
  universities: {
    id: string;
    name: string;
    countries: {
      name: string;
    };
  };
}

export function ContentManagementSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    university_id: "",
    file: null as File | null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          *,
          universities(
            name,
            countries(name)
          )
        `)
        .order('created_at', { ascending: false });

      // Fetch classes to get universities
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          universities(
            id,
            name,
            countries(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;
      if (classesError) throw classesError;

      setAnnouncements(announcementsData || []);
      setClasses(classesData || []);
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

  const handleCreateAnnouncement = async () => {
    try {
      if (!formData.title || !formData.content || !formData.university_id) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      let media_url = null;
      let media_type = null;

      // Upload file if provided
      if (formData.file) {
        // Validate file type (only images and videos)
        const fileType = formData.file.type;
        if (!fileType.startsWith('image/') && !fileType.startsWith('video/')) {
          toast({
            title: "Error",
            description: "Only images and videos are allowed.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        // Upload to Supabase Storage
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(fileName, formData.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('announcements')
          .getPublicUrl(fileName);

        media_url = urlData.publicUrl;
        media_type = fileType;
      }

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          media_url,
          media_type,
          university_id: formData.university_id,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement deleted successfully.",
      });

      setDeleteAnnouncementId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      university_id: "",
      file: null
    });
  };

  // Get unique universities from classes
  const universities = Array.from(
    new Map(
      classes.map(cls => [cls.universities.id, cls.universities])
    ).values()
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
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
          <CardTitle>Announcements</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Create an announcement to share with students at a specific university.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter announcement content"
                    rows={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="university_id">University *</Label>
                  <Select value={formData.university_id} onValueChange={(value) => setFormData({ ...formData, university_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((university) => (
                        <SelectItem key={university.id} value={university.id}>
                          {university.name} - {university.countries.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="file">Media (Optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      file: e.target.files?.[0] || null 
                    })}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    📸 Upload an image or 🎥 video to make your announcement more engaging. Files will be automatically processed and optimized.
                  </p>
                  {formData.file && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✅ Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAnnouncement} disabled={isUploading}>
                  {isUploading ? "Creating..." : "Create Announcement"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Media Preview Section */}
                {announcement.media_url && (
                  <div className="relative aspect-video bg-gray-100">
                    {announcement.media_type?.startsWith('image/') ? (
                      <img
                        src={announcement.media_url}
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                      />
                    ) : announcement.media_type?.startsWith('video/') ? (
                      <video
                        src={announcement.media_url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster=""
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <FileText className="h-12 w-12 text-gray-400" />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{announcement.title}</div>
                          <div className="text-sm text-gray-500">Document File</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay with University Info */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/70 text-white hover:bg-black/80">
                        {announcement.universities.name}
                      </Badge>
                    </div>
                    
                    {/* Media Type Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-white/90 text-black">
                        {announcement.media_type?.split('/')[0] || 'Media'}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                      {announcement.title}
                    </h3>
                    
                    {/* Content */}
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {announcement.content}
                    </p>
                    
                    {/* University & Date */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <div className="font-medium">{announcement.universities.name}</div>
                        <div>{announcement.universities.countries.name}</div>
                      </div>
                      <div className="text-right">
                        {format(new Date(announcement.created_at), 'MMM dd')}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteAnnouncementId(announcement.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Empty State */}
            {announcements.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
                <p className="text-gray-500 text-center max-w-sm">
                  Create your first announcement to start engaging with students across universities.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Total Announcements</div>
                <div className="text-2xl font-bold">{announcements.length}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">This Month</div>
                <div className="text-2xl font-bold">
                  {announcements.filter(a => {
                    const announcementDate = new Date(a.created_at);
                    const now = new Date();
                    return announcementDate.getMonth() === now.getMonth() && 
                           announcementDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">With Media</div>
                <div className="text-2xl font-bold">
                  {announcements.filter(a => a.media_url).length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteAnnouncementId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Delete Announcement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete this announcement? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteAnnouncementId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAnnouncement(deleteAnnouncementId)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
