import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  UserMinus, 
  Video, 
  Heart, 
  MessageCircle, 
  Share, 
  Play,
  Users,
  Calendar,
  MapPin,
  Edit,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  profile_picture_url: string;
  bio: string;
  follower_count: number;
  following_count: number;
  video_count: number;
  created_at: string;
  classes: {
    universities: {
      name: string;
      countries: {
        name: string;
      };
    };
  };
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  created_at: string;
  video_likes: Array<{ user_id: string }>;
  video_comments: Array<{ id: string }>;
  profiles: {
    full_name: string;
    profile_picture_url: string;
  };
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    video: null as File | null
  });

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchVideos();
      checkFollowingStatus();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          classes(
            universities(
              name,
              countries(name)
            )
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive",
      });
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // If videos table doesn't exist yet, show empty state
        if (error.code === 'PGRST200' || error.message.includes('relation "videos" does not exist')) {
          console.log('Videos table not created yet - showing empty state');
          setVideos([]);
          return;
        } else {
          throw error;
        }
      }

      if (!data || data.length === 0) {
        setVideos([]);
        return;
      }

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .eq('user_id', userId)
        .single();

      // Fetch likes for each video
      const { data: likes } = await supabase
        .from('video_likes')
        .select('video_id, user_id')
        .in('video_id', data.map(v => v.id));

      // Fetch comments for each video
      const { data: comments } = await supabase
        .from('video_comments')
        .select('id, video_id')
        .in('video_id', data.map(v => v.id));

      // Combine data
      const videosWithData = data.map(video => ({
        ...video,
        profiles: profileData,
        video_likes: likes?.filter(l => l.video_id === video.id) || [],
        video_comments: comments?.filter(c => c.video_id === video.id) || []
      }));

      setVideos(videosWithData);
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Set empty videos array to prevent crashes
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async () => {
    if (!user || !userId || user.id === userId) return;
    
    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${profile?.full_name}`,
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${profile?.full_name}`,
        });
      }
      
      // Refresh profile to update follower count
      fetchProfile();
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive",
      });
    }
  };

  const handleVideoUpload = async () => {
    if (!user || !uploadForm.video || !uploadForm.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a video.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload video to Supabase Storage
      const fileExt = uploadForm.video.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, uploadForm.video);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Create video record
      const { error: insertError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: uploadForm.title,
          description: uploadForm.description,
          video_url: urlData.publicUrl,
          duration: 0 // We'll calculate this later
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      setIsUploadDialogOpen(false);
      setUploadForm({ title: "", description: "", video: null });
      fetchVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/tukio?video=${videoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-2 sm:py-3">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 flex-shrink-0">
                  <AvatarImage src={profile.profile_picture_url} />
                  <AvatarFallback className="text-lg">
                    {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold fredoka-bold truncate">{profile.full_name}</h1>
                  <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!isOwnProfile && (
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      className="gap-1 text-xs px-3"
                    >
                      {isFollowing ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1 text-xs px-3">
                          <Upload className="h-3 w-3" />
                          Upload
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload New Video</DialogTitle>
                        <DialogDescription>
                          Share a new video with your followers
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                            placeholder="Enter video title"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                            placeholder="Describe your video"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="video">Video File *</Label>
                          <Input
                            id="video"
                            type="file"
                            accept="video/*"
                            onChange={(e) => setUploadForm({ 
                              ...uploadForm, 
                              video: e.target.files?.[0] || null 
                            })}
                            className="cursor-pointer"
                          />
                          {uploadForm.video && (
                            <p className="text-sm text-green-600 mt-1">
                              Selected: {uploadForm.video.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleVideoUpload} disabled={isUploading}>
                          {isUploading ? "Uploading..." : "Upload Video"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>
              </div>
              
              {/* Mobile Stats */}
              <div className="flex items-center justify-around py-2 border-t border-gray-200">
                <div className="text-center">
                  <div className="font-bold text-lg">{videos.length}</div>
                  <div className="text-xs text-gray-600">Videos</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{profile.follower_count}</div>
                  <div className="text-xs text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{profile.following_count}</div>
                  <div className="text-xs text-gray-600">Following</div>
                </div>
              </div>
              
              {/* Mobile Bio and Info */}
              <div className="space-y-2 pt-2">
                {profile.bio && (
                  <p className="text-gray-700 fredoka-medium text-sm leading-relaxed">{profile.bio}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.classes?.universities?.name}, {profile.classes?.universities?.countries?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>Joined {format(new Date(profile.created_at), 'MMM yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profile_picture_url} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-2xl font-bold fredoka-bold">{profile.full_name}</h1>
                  {!isOwnProfile && (
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className="gap-2"
                    >
                      {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Video
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload New Video</DialogTitle>
                          <DialogDescription>
                            Share a new video with your followers
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                              id="title"
                              value={uploadForm.title}
                              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                              placeholder="Enter video title"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={uploadForm.description}
                              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                              placeholder="Describe your video"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="video">Video File *</Label>
                            <Input
                              id="video"
                              type="file"
                              accept="video/*"
                              onChange={(e) => setUploadForm({ 
                                ...uploadForm, 
                                video: e.target.files?.[0] || null 
                              })}
                              className="cursor-pointer"
                            />
                            {uploadForm.video && (
                              <p className="text-sm text-green-600 mt-1">
                                Selected: {uploadForm.video.name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleVideoUpload} disabled={isUploading}>
                            {isUploading ? "Uploading..." : "Upload Video"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {/* Desktop Stats */}
                <div className="flex items-center gap-6 mb-3">
                  <div className="text-center">
                    <div className="font-bold text-lg">{videos.length}</div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{profile.follower_count}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{profile.following_count}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                </div>
                
                {/* Desktop Bio and Info */}
                <div className="space-y-1">
                  {profile.bio && (
                    <p className="text-gray-700 fredoka-medium">{profile.bio}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.classes?.universities?.name}, {profile.classes?.universities?.countries?.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
        {videos.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Video className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 fredoka-bold">
              {isOwnProfile ? "No videos yet" : "No videos uploaded"}
            </h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">
              {isOwnProfile 
                ? "Upload your first video to start sharing with your followers!" 
                : `${profile.full_name} hasn't uploaded any videos yet.`}
            </p>
            {isOwnProfile && (
              <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2" size="sm">
                <Upload className="h-4 w-4" />
                Upload Your First Video
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-1 sm:hidden">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className="relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <video
                    src={video.video_url}
                    className="w-full h-full object-cover"
                    poster={video.thumbnail_url}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                    {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                  </div>
                  {/* Mobile overlay with likes/comments */}
                  <div className="absolute top-1 left-1 flex items-center gap-1">
                    <div className="bg-black/50 rounded-full px-1 py-0.5 flex items-center gap-1">
                      <Heart className="h-2 w-2 text-white fill-current" />
                      <span className="text-[10px] text-white">{video.video_likes.length}</span>
                    </div>
                  </div>
                  <div className="absolute top-1 right-1">
                    <div className="bg-black/50 rounded-full px-1 py-0.5 flex items-center gap-1">
                      <MessageCircle className="h-2 w-2 text-white" />
                      <span className="text-[10px] text-white">{video.video_comments.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/Tablet Grid */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <Card 
                  key={video.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <div className="relative aspect-[9/16] bg-gray-100">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      poster={video.thumbnail_url}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1 fredoka-medium">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Heart className="h-3 w-3" />
                      {video.video_likes.length}
                      <MessageCircle className="h-3 w-3" />
                      {video.video_comments.length}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
