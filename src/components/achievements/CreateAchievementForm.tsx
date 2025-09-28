import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  FileText,
  Plus,
  Trash2,
  Trophy
} from "lucide-react";

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  id: string;
}

interface CreateAchievementFormProps {
  onSuccess?: (achievement: any) => void;
  onCancel?: () => void;
}

export function CreateAchievementForm({ onSuccess, onCancel }: CreateAchievementFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (mediaFiles.length + files.length > 4) {
      toast({
        title: "Too Many Files",
        description: "You can upload a maximum of 4 files.",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "Invalid File Type",
          description: "Please select only image or video files.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File Too Large",
          description: "Please select files smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }

      const mediaFile: MediaFile = {
        file,
        preview: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
        id: Math.random().toString(36).substr(2, 9)
      };

      setMediaFiles(prev => [...prev, mediaFile]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadMediaFile = async (mediaFile: MediaFile): Promise<string> => {
    const fileExt = mediaFile.file.name.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `achievements/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, mediaFile.file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const generateVideoThumbnail = async (videoFile: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      });

      video.src = URL.createObjectURL(videoFile);
      video.currentTime = 1; // Seek to 1 second for thumbnail
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an achievement.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your achievement.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create achievement record
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null
        })
        .select()
        .single();

      if (achievementError) throw achievementError;

      // Upload media files
      const mediaUploads = mediaFiles.map(async (mediaFile, index) => {
        const mediaUrl = await uploadMediaFile(mediaFile);
        let thumbnailUrl = null;

        // Generate thumbnail for videos
        if (mediaFile.type === 'video') {
          const thumbnailBlob = await generateVideoThumbnail(mediaFile.file);
          if (thumbnailBlob) {
            // Upload thumbnail
            const thumbnailExt = 'jpg';
            const thumbnailName = `${user.id}-${Date.now()}-thumb-${Math.random().toString(36).substr(2, 9)}.${thumbnailExt}`;
            const thumbnailPath = `achievements/thumbnails/${thumbnailName}`;
            
            const thumbnailFile = new File([thumbnailBlob], thumbnailName, { type: 'image/jpeg' });
            const { error: thumbError } = await supabase.storage
              .from('uploads')
              .upload(thumbnailPath, thumbnailFile);

            if (!thumbError) {
              const { data: { publicUrl: thumbUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(thumbnailPath);
              thumbnailUrl = thumbUrl;
            }
          }
        }

        // Create media record
        const { error: mediaError } = await supabase
          .from('achievement_media')
          .insert({
            achievement_id: achievement.id,
            media_url: mediaUrl,
            media_type: mediaFile.type,
            thumbnail_url: thumbnailUrl,
            file_name: mediaFile.file.name,
            file_size: mediaFile.file.size,
            duration: mediaFile.type === 'video' ? undefined : null, // TODO: Extract video duration
            order_index: index
          });

        if (mediaError) throw mediaError;
      });

      await Promise.all(mediaUploads);

      // Clean up preview URLs
      mediaFiles.forEach(mediaFile => {
        URL.revokeObjectURL(mediaFile.preview);
      });

      toast({
        title: "Success",
        description: "Achievement created successfully!",
      });

      onSuccess?.(achievement);
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast({
        title: "Error",
        description: "Failed to create achievement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Form Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Share Your Achievement
        </h2>
        <p className="text-base text-muted-foreground">
          Tell the community about your accomplishment and inspire others
        </p>
      </div>

      <div className="space-y-8">
        {/* Title Input */}
        <div className="space-y-3">
          <Label htmlFor="title" className="text-base font-semibold text-slate-700 dark:text-slate-300">
            Achievement Title *
          </Label>
          <Input
            id="title"
            placeholder="e.g., Built a full-stack web application, Won a hackathon, Completed a certification..."
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            maxLength={100}
            className="h-12 text-base border-2 focus:border-primary/50 transition-colors duration-200 rounded-xl"
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Be specific and descriptive about your achievement
            </p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {formData.title.length}/100
            </p>
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-3">
          <Label htmlFor="description" className="text-base font-semibold text-slate-700 dark:text-slate-300">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Share the story behind your achievement. What challenges did you overcome? What did you learn? How did it impact you or others?"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={5}
            maxLength={500}
            className="text-base border-2 focus:border-primary/50 transition-colors duration-200 rounded-xl resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Help others understand the impact and significance of your achievement
            </p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {formData.description.length}/500
            </p>
          </div>
        </div>

        {/* Media Upload */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Media (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Add photos or videos to showcase your achievement visually
            </p>
          </div>
          
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors duration-200 group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 4}
                  className="h-12 px-6 text-base font-semibold rounded-xl border-2 hover:border-primary/50 transition-all duration-200"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose Photos/Videos
                </Button>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Maximum 4 files, up to 50MB each</p>
                  <p className="text-xs">Supported: JPG, PNG, GIF, MP4, MOV, AVI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Selected Media ({mediaFiles.length}/4)
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 4}
                  className="h-8 px-3 text-sm rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add More
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaFiles.map((mediaFile, index) => (
                  <div key={mediaFile.id} className="relative group bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-t-xl overflow-hidden">
                      {mediaFile.type === 'image' ? (
                        <img
                          src={mediaFile.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={mediaFile.preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {mediaFile.type === 'video' ? (
                          <Video className="h-4 w-4 text-primary" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {mediaFile.file.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(mediaFile.file.size)}</span>
                        <span>#{index + 1}</span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full shadow-lg"
                      onClick={() => removeMediaFile(mediaFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-12 px-8 text-base font-semibold rounded-xl border-2 hover:border-slate-300 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isSubmitting}
            className="h-12 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Share Achievement
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
