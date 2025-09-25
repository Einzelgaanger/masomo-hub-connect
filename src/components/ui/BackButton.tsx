import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const BackButton = ({ 
  fallbackPath = "/dashboard", 
  className = "",
  variant = "ghost",
  size = "icon"
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      // Go back to the previous page
      window.history.back();
    } else {
      // Fallback to specified path if no history
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant={variant}
      size={size}
      className={`rounded-full hover:bg-transparent hover:text-current ${className}`}
      title="Go back to previous page"
    >
      {/* Double arrow design */}
      <div className="relative flex items-center">
        {/* First arrow */}
        <div className="relative">
          <div className="w-2.5 h-2.5 border-l-2 border-b-2 border-black rotate-45 transform origin-center"></div>
          <div className="absolute inset-0 w-2.5 h-2.5 border-l-2 border-b-2 border-black/30 rotate-45 transform origin-center translate-x-0.5 translate-y-0.5"></div>
        </div>
        
        {/* Second arrow - positioned close to first */}
        <div className="relative -ml-1">
          <div className="w-2.5 h-2.5 border-l-2 border-b-2 border-black rotate-45 transform origin-center"></div>
          <div className="absolute inset-0 w-2.5 h-2.5 border-l-2 border-b-2 border-black/30 rotate-45 transform origin-center translate-x-0.5 translate-y-0.5"></div>
        </div>
      </div>
    </Button>
  );
};

export default BackButton;
