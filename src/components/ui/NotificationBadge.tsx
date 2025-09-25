import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  max?: number;
}

export function NotificationBadge({ count, className, max = 99 }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold",
        className
      )}
    >
      {displayCount}
    </Badge>
  );
}
