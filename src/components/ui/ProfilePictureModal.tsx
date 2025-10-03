import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProfilePictureModalProps {
  src?: string;
  fallback?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  name?: string;
  course?: string;
}

export function ProfilePictureModal({ 
  src, 
  fallback, 
  alt = "Profile picture", 
  className,
  children,
  name,
  course
}: ProfilePictureModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <div className={`${className} shadow-md overflow-hidden`} style={{ borderRadius: '20%' }}>
            {src ? (
              <img 
                src={src} 
                alt={alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-semibold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {fallback}
              </div>
            )}
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 bg-black border-0">
        <DialogTitle className="sr-only">Profile Picture</DialogTitle>
        <DialogDescription className="sr-only">
          Full view of {name || 'user'} profile picture
        </DialogDescription>
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-10 h-10 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Full square image */}
          <div className="aspect-square w-full">
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* User info overlay */}
          {(name || course) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
              <div className="text-white">
                {name && (
                  <h3 className="text-lg font-semibold mb-1">{name}</h3>
                )}
                {course && (
                  <p className="text-sm text-gray-300">{course}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
