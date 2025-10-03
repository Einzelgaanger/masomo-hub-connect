import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Camera, 
  Upload, 
  X, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (newImageUrl: string) => void;
  className?: string;
}

export function ProfilePictureUpload({ 
  currentImageUrl, 
  onImageUpdate, 
  className = "h-24 w-24" 
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    size: 0,
    scale: 1
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const processImage = (imageUrl: string, cropData: any) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not found'));
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not found'));
          return;
        }

        // Calculate dimensions for square crop
        const originalWidth = img.width;
        const originalHeight = img.height;
        const shorterSide = Math.min(originalWidth, originalHeight);
        
        // Set canvas size to the shorter side (square)
        canvas.width = shorterSide;
        canvas.height = shorterSide;

        // Calculate crop area (center crop)
        const cropX = (originalWidth - shorterSide) / 2;
        const cropY = (originalHeight - shorterSide) / 2;

        // Draw the cropped and scaled image
        ctx.drawImage(
          img,
          cropX, cropY, shorterSide, shorterSide, // source rectangle
          0, 0, shorterSide, shorterSide // destination rectangle
        );

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to process image'));
          }
        }, 'image/jpeg', 0.9);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const uploadImage = async (processedImageUrl: string) => {
    try {
      setIsUploading(true);

      // Convert data URL to blob
      const response = await fetch(processedImageUrl);
      const blob = await response.blob();

      // Generate unique filename
      const fileExt = 'jpg';
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Don't include bucket name in path

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Construct the public URL manually (since storage.get_public_url might not work)
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ztxgmqunqsookgpmluyp.supabase.co';
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/profile-pictures/${filePath}`;

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      onImageUpdate(publicUrl);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setShowCropModal(false);
      setSelectedFile(null);
      setPreviewImage(null);
    }
  };

  const handleCropConfirm = async () => {
    if (!previewImage) return;

    try {
      const processedImageUrl = await processImage(previewImage, cropData);
      await uploadImage(processedImageUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
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
        <Avatar className={`${className} border-4 border-background shadow-lg`}>
          <AvatarImage 
            src={currentImageUrl} 
            className="object-cover"
            style={{ borderRadius: '20%' }} // Smooth rounded corners, not perfect circle
          />
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-[20%] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentImageUrl ? 'Change' : 'Upload'}
        </Button>
        
        {currentImageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
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

      {/* Hidden Canvas for Image Processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Crop Modal */}
      {showCropModal && previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Crop Profile Picture</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCropModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Your image will be automatically cropped to a square and given smooth rounded corners.
                </p>
                
                <div className="relative inline-block">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded-lg"
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCropConfirm}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Processing...' : 'Confirm'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCropModal(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
