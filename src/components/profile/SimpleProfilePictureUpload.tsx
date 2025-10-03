import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Camera, 
  Upload, 
  X,
  Edit3,
  Trash2
} from "lucide-react";
import { ProfilePictureModal } from "@/components/ui/ProfilePictureModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SimpleProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (newImageUrl: string) => void;
  className?: string;
}

export function SimpleProfilePictureUpload({ 
  currentImageUrl, 
  onImageUpdate, 
  className = "h-24 w-24" 
}: SimpleProfilePictureUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB for simplicity)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);

      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        // Update profile with base64 image
        const { error } = await supabase
          .from('profiles')
          .update({ profile_picture_url: base64 })
          .eq('user_id', user?.id);

        if (error) throw error;

        onImageUpdate(base64);
        
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been successfully updated.",
        });
      };
      
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);

      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('user_id', user?.id);

      if (error) throw error;

      onImageUpdate('');
      
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      });

    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Display */}
      <div className="relative group">
        {currentImageUrl ? (
          <ProfilePictureModal
            src={currentImageUrl}
            fallback={user?.email?.charAt(0).toUpperCase() || 'U'}
            alt="Profile Picture"
            name={user?.email?.split('@')[0] || 'User'}
            className={`${className} shadow-lg`}
          />
        ) : (
          <div className={`${className} shadow-lg overflow-hidden`} style={{ borderRadius: '20%' }}>
            <div className="w-full h-full flex items-center justify-center text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        )}
        
        {/* Camera Hover Overlay - Only show if there's an image */}
        {currentImageUrl && (
          <div className="absolute inset-0 bg-black/50 rounded-[20%] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="text-white text-center">
              <Camera className="h-6 w-6 mx-auto mb-1" />
              <span className="text-xs font-medium">View</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
          title={currentImageUrl ? 'Change Photo' : 'Upload Photo'}
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        
        {currentImageUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            title="Remove Photo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload profile picture"
        title="Upload profile picture"
      />
    </div>
  );
}
