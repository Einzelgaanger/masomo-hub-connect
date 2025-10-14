import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, RefreshCw } from 'lucide-react';

interface PWAUpdatePromptProps {
  updateAvailable: boolean;
  isUpdating: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function PWAUpdatePrompt({ 
  updateAvailable, 
  isUpdating, 
  onUpdate, 
  onDismiss 
}: PWAUpdatePromptProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!updateAvailable || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Update Available
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
              className="h-6 w-6 p-0 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-700">
            A new version of Bunifu is available with the latest features and improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={onUpdate}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Update Now
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
