import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Key, 
  RefreshCw, 
  Copy, 
  Clock, 
  CheckCircle,
  AlertTriangle 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ClassInfo {
  id: string;
  name: string;
  class_code: string;
  code_expires: boolean;
  code_expires_at: string | null;
  code_created_at: string;
}

interface CodeManagementProps {
  classInfo: ClassInfo;
  isOpen: boolean;
  onClose: () => void;
  onCodeUpdated: (newCode: string) => void;
}

export const CodeManagement = ({ classInfo, isOpen, onClose, onCodeUpdated }: CodeManagementProps) => {
  const { toast } = useToast();
  const [regenerating, setRegenerating] = useState(false);
  const [newCodeSettings, setNewCodeSettings] = useState({
    expires: false,
    expirationHours: 24
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Class code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const regenerateCode = async () => {
    setRegenerating(true);
    try {
      const { data: newCode, error } = await supabase.rpc('regenerate_class_code', {
        p_class_id: classInfo.id,
        p_creator_id: (await supabase.auth.getUser()).data.user?.id,
        p_expires: newCodeSettings.expires,
        p_expires_in_hours: newCodeSettings.expires ? newCodeSettings.expirationHours : null
      });

      if (error) throw error;

      toast({
        title: "Code Regenerated!",
        description: `New class code: ${newCode}`,
      });

      onCodeUpdated(newCode);
      onClose();
    } catch (error: any) {
      console.error('Error regenerating code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate code",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const isExpired = classInfo.code_expires && classInfo.code_expires_at && 
    new Date(classInfo.code_expires_at) < new Date();

  const timeUntilExpiry = classInfo.code_expires && classInfo.code_expires_at ? 
    Math.max(0, new Date(classInfo.code_expires_at).getTime() - new Date().getTime()) : null;

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Manage Class Code
          </DialogTitle>
          <DialogDescription>
            View your current class code, check its status, and generate a new code with optional expiration settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Code */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Class Code</Label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-lg font-mono font-bold tracking-wider">
                {classInfo.class_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(classInfo.class_code)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Code Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Code Status</Label>
            <div className="flex items-center gap-2">
              {isExpired ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Expired</Badge>
                </>
              ) : classInfo.code_expires ? (
                <>
                  <Clock className="h-4 w-4 text-orange-500" />
                  <Badge variant="outline">
                    Expires in {timeUntilExpiry ? formatTimeRemaining(timeUntilExpiry) : 'Unknown'}
                  </Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="outline">Never expires</Badge>
                </>
              )}
            </div>
          </div>

          {/* Regenerate Section */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">Generate New Code</Label>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-code-expires"
                  checked={newCodeSettings.expires}
                  onChange={(e) => setNewCodeSettings({
                    ...newCodeSettings, 
                    expires: e.target.checked
                  })}
                  className="rounded"
                />
                <Label htmlFor="new-code-expires" className="text-sm">
                  Set expiration for new code
                </Label>
              </div>
              
              {newCodeSettings.expires && (
                <div className="ml-6">
                  <Label htmlFor="new-expiration-hours" className="text-xs">
                    Expires after:
                  </Label>
                  <select
                    id="new-expiration-hours"
                    value={newCodeSettings.expirationHours}
                    onChange={(e) => setNewCodeSettings({
                      ...newCodeSettings, 
                      expirationHours: parseInt(e.target.value)
                    })}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                    <option value={720}>1 month</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              onClick={regenerateCode}
              disabled={regenerating}
              className="w-full"
              variant="outline"
            >
              {regenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Code
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-600">
              ⚠️ The old code will stop working immediately after generating a new one.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
