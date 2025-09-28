import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function FloatingConcernsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('concerns')
        .insert({
          user_id: user.id,
          message: message.trim()
        });

      if (error) {
        // If table doesn't exist, show a helpful message
        if (error.code === 'PGRST116' || error.message.includes('relation "concerns" does not exist')) {
          toast({
            title: "Feature Coming Soon",
            description: "The concerns system is being set up. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Concern submitted!",
        description: "Thank you for your feedback. We'll review it soon.",
      });

      // Clear message and close popup
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting concern:', error);
      toast({
        title: "Error",
        description: "Failed to submit concern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed top-3/4 right-6 z-50 transform -translate-y-1/2">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-10 h-10 p-0 bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200"
          style={{ backgroundColor: '#dc2626' }}
          title="Share concerns or ideas"
        >
          <AlertTriangle className="h-4 w-4" />
        </Button>
      </div>

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Share Your Concerns
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share your concerns, ideas, or feedback about the website
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your concerns, ideas, or feedback here... (Press Enter to send)"
                  className="min-h-32 resize-none"
                  disabled={sending}
                  autoFocus
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={sending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
