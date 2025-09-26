import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Globe, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PrivacySelectorProps {
  currentPrivacy: 'private' | 'uni' | 'public';
  onPrivacyChange: (privacy: 'private' | 'uni' | 'public') => void;
  className?: string;
}

export function PrivacySelector({ currentPrivacy, onPrivacyChange, className }: PrivacySelectorProps) {
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const privacyOptions = [
    {
      value: 'private' as const,
      label: 'Private',
      icon: Shield,
      color: 'bg-gray-500',
      description: 'Invisible to everyone. No one can search or message you.'
    },
    {
      value: 'uni' as const,
      label: 'University',
      icon: Users,
      color: 'bg-blue-500',
      description: 'Visible only to your university. Only university members can search and message you.'
    },
    {
      value: 'public' as const,
      label: 'Public',
      icon: Globe,
      color: 'bg-green-500',
      description: 'Visible to everyone. Anyone can search and message you.'
    }
  ];

  const handlePrivacyChange = async (newPrivacy: 'private' | 'uni' | 'public') => {
    if (newPrivacy === currentPrivacy) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_level: newPrivacy })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      onPrivacyChange(newPrivacy);
      
      // Show brief explanation popup
      setShowInfoDialog(true);
      setTimeout(() => setShowInfoDialog(false), 8000); // 8 seconds

      toast({
        title: "Privacy Updated",
        description: `Your privacy level has been changed to ${privacyOptions.find(opt => opt.value === newPrivacy)?.label}.`,
      });
    } catch (error) {
      console.error('Error updating privacy level:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy level. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentOption = privacyOptions.find(opt => opt.value === currentPrivacy);

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {currentOption && (
            <>
              <currentOption.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{currentOption.label}</span>
            </>
          )}
        </div>
        
        <div className="flex gap-1">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === currentPrivacy;
            
            return (
              <Button
                key={option.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePrivacyChange(option.value)}
                disabled={isUpdating}
                className={`h-8 w-8 p-0 ${isActive ? option.color : ''}`}
                title={option.description}
              >
                <Icon className="h-3 w-3" />
              </Button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfoDialog(true)}
          className="h-8 w-8 p-0"
          title="Privacy Information"
        >
          <Info className="h-3 w-3" />
        </Button>
      </div>

      {/* Privacy Information Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Privacy Levels</DialogTitle>
            <DialogDescription>
              Choose who can search and message you
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {privacyOptions.map((option) => {
              const Icon = option.icon;
              const isActive = option.value === currentPrivacy;
              
              return (
                <div
                  key={option.value}
                  className={`p-3 rounded-lg border ${
                    isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{option.label}</span>
                    {isActive && <Badge variant="secondary">Current</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
