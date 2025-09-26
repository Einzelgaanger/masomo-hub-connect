import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  max?: number;
  onClick?: () => void;
}

export function NotificationBadge({ count, className, max = 99, onClick }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-normal cursor-pointer hover:bg-red-600 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {displayCount}
    </Badge>
  );
}
