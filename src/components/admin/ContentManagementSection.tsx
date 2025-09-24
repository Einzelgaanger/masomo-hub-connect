import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Eye, 
  FileText, 
  Video, 
  Image, 
  File,
  Calendar,
  User,
  BookOpen,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface Upload {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  upload_type: 'note' | 'past_paper';
  uploaded_by: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  profiles: {
    full_name: string;
    email: string;
    profile_picture_url: string | null;
  };
  units: {
    id: string;
    name: string;
    classes: {
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
  };
}

export function ContentManagementSection() {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Preview states
  const [previewUpload, setPreviewUpload] = useState<Upload | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  useEffect(() => {
    filterAndSortUploads();
  }, [uploads, searchFilter, typeFilter, sortBy]);

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          profiles!uploads_uploaded_by_fkey (
            full_name,
            email,
            profile_picture_url
          ),
          units!uploads_unit_id_fkey (
            id,
            name,
            classes!units_class_id_fkey (
              course_name,
              course_year,
              semester,
              universities!classes_university_id_fkey (
                name,
                countries!universities_country_id_fkey (
                  name
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load uploads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUploads = () => {
    let filtered = [...uploads];

    // Apply search filter
    if (searchFilter) {
      filtered = filtered.filter(upload =>
        upload.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        upload.description?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        upload.profiles.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        upload.units.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        upload.units.classes.course_name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(upload => upload.upload_type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "uploader":
          return a.profiles.full_name.localeCompare(b.profiles.full_name);
        case "likes":
          return b.likes_count - a.likes_count;
        default:
          return 0;
      }
    });

    setFilteredUploads(filtered);
  };

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully.",
      });

      // Refresh uploads
      fetchUploads();
    } catch (error) {
      console.error('Error deleting upload:', error);
      toast({
        title: "Error",
        description: "Failed to delete content.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string | null, uploadType: string) => {
    if (!fileType) {
      return uploadType === 'past_paper' ? <FileText className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
    }

    const type = fileType.toLowerCase();
    if (type.includes('video')) return <Video className="h-4 w-4" />;
    if (type.includes('image')) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileTypeColor = (fileType: string | null, uploadType: string) => {
    if (!fileType) {
      return uploadType === 'past_paper' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
    }

    const type = fileType.toLowerCase();
    if (type.includes('video')) return "bg-red-100 text-red-800";
    if (type.includes('image')) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatFileSize = (url: string) => {
    // This is a placeholder - in a real app you'd get file size from metadata
    return "Unknown size";
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold">{uploads.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-2xl font-bold">{uploads.filter(u => u.upload_type === 'note').length}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Past Papers</p>
                <p className="text-2xl font-bold">{uploads.filter(u => u.upload_type === 'past_paper').length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Files</p>
                <p className="text-2xl font-bold">{uploads.filter(u => u.file_url).length}</p>
              </div>
              <File className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search uploads..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="past_paper">Past Papers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="uploader">Uploader A-Z</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Uploads ({filteredUploads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUploads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No uploads found</h3>
              <p className="text-muted-foreground">
                {searchFilter || typeFilter !== "all" 
                  ? "Try adjusting your search or filters." 
                  : "No content has been uploaded yet."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Unit/Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getFileIcon(upload.file_type, upload.upload_type)}
                          <span className="font-medium">{upload.title}</span>
                        </div>
                        {upload.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {upload.description}
                          </p>
                        )}
                        {upload.file_url && (
                          <p className="text-xs text-muted-foreground">
                            {upload.file_type} • {formatFileSize(upload.file_url)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{upload.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">{upload.profiles.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{upload.units.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {upload.units.classes.course_name} • Year {upload.units.classes.course_year}, Sem {upload.units.classes.semester}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {upload.units.classes.universities.name}, {upload.units.classes.universities.countries.name}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getFileTypeColor(upload.file_type, upload.upload_type)}>
                        {upload.upload_type === 'past_paper' ? 'Past Paper' : 'Note'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(upload.created_at), 'MMM dd, yyyy')}</p>
                        <p className="text-muted-foreground">{format(new Date(upload.created_at), 'HH:mm')}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {upload.likes_count}
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          {upload.dislikes_count}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        {upload.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(upload.file_url!, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewUpload(upload);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Content</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{upload.title}"? This action cannot be undone.
                                The file and all associated data will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUpload(upload.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
            <DialogDescription>
              Preview and download content uploaded by users
            </DialogDescription>
          </DialogHeader>
          
          {previewUpload && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Content Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {previewUpload.title}</p>
                    <p><strong>Type:</strong> {previewUpload.upload_type === 'past_paper' ? 'Past Paper' : 'Note'}</p>
                    <p><strong>Uploader:</strong> {previewUpload.profiles.full_name}</p>
                    <p><strong>Date:</strong> {format(new Date(previewUpload.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Unit & Class</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Unit:</strong> {previewUpload.units.name}</p>
                    <p><strong>Class:</strong> {previewUpload.units.classes.course_name}</p>
                    <p><strong>Year/Sem:</strong> Year {previewUpload.units.classes.course_year}, Sem {previewUpload.units.classes.semester}</p>
                    <p><strong>University:</strong> {previewUpload.units.classes.universities.name}</p>
                  </div>
                </div>
              </div>
              
              {previewUpload.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{previewUpload.description}</p>
                </div>
              )}
              
              {previewUpload.file_url && (
                <div>
                  <h3 className="font-semibold mb-2">File</h3>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    {getFileIcon(previewUpload.file_type, previewUpload.upload_type)}
                    <span className="flex-1">{previewUpload.file_type || 'Unknown type'}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewUpload.file_url!, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            {previewUpload && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Content
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Content</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{previewUpload.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleDeleteUpload(previewUpload.id);
                        setIsPreviewOpen(false);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
