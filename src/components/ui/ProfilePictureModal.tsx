import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProfilePictureModalProps {
  src?: string;
  fallback?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProfilePictureModal({ 
  src, 
  fallback, 
  alt = "Profile picture", 
  className,
  children 
}: ProfilePictureModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Avatar className={className}>
            <AvatarImage src={src} alt={alt} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 bg-black border-0">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
