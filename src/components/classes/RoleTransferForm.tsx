import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Mail, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoleTransferFormProps {
  classId: string;
  className: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const RoleTransferForm = ({ classId, className, onSuccess, onCancel }: RoleTransferFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [newCreatorEmail, setNewCreatorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [targetUserInfo, setTargetUserInfo] = useState<{name: string, email: string} | null>(null);

  const validateEmail = async (email: string) => {
    if (!email.trim()) {
      setEmailValid(null);
      setTargetUserInfo(null);
      return;
    }

    setValidatingEmail(true);
    try {
      // Check if user exists and is a member of this class
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('email', email.trim())
        .single();

      if (userError || !userData) {
        setEmailValid(false);
        setTargetUserInfo(null);
        return;
      }

      // Check if user is a member of this class
      const { data: memberData, error: memberError } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', classId)
        .eq('user_id', userData.user_id)
        .single();

      if (memberError || !memberData) {
        setEmailValid(false);
        setTargetUserInfo(null);
        toast({
          title: "User Not Found",
          description: "This user is not a member of this class.",
          variant: "destructive",
        });
        return;
      }

      if (memberData.role === 'creator') {
        setEmailValid(false);
        setTargetUserInfo(null);
        toast({
          title: "Invalid Transfer",
          description: "This user is already the class creator.",
          variant: "destructive",
        });
        return;
      }

      setEmailValid(true);
      setTargetUserInfo({
        name: userData.full_name,
        email: userData.email
      });
    } catch (error) {
      console.error('Error validating email:', error);
      setEmailValid(false);
      setTargetUserInfo(null);
    } finally {
      setValidatingEmail(false);
    }
  };

  const handleEmailChange = (email: string) => {
    setNewCreatorEmail(email);
    
    // Debounce email validation
    const timeoutId = setTimeout(() => {
      validateEmail(email);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleTransfer = async () => {
    if (!newCreatorEmail.trim() || !emailValid) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('transfer_class_creator_role', {
        p_class_id: classId,
        p_current_creator_id: user?.id,
        p_new_creator_email: newCreatorEmail.trim()
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Role Transferred",
          description: `Class creator role has been transferred to ${targetUserInfo?.name || newCreatorEmail}.`,
        });
        onSuccess();
      } else {
        toast({
          title: "Transfer Failed",
          description: "Failed to transfer role. Please check the email and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error transferring role:', error);
      toast({
        title: "Error",
        description: "Failed to transfer role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Transfer Class Creator Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Crown className="h-4 w-4" />
              <span className="font-medium">Current Class Creator</span>
            </div>
            <p className="text-sm text-blue-700">
              You are currently the creator of "{className}". Transferring this role will give another member full control over the class.
            </p>
          </div>

          {/* Transfer Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-creator-email">New Creator Email *</Label>
              <div className="relative">
                <Input
                  id="new-creator-email"
                  type="email"
                  value={newCreatorEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="Enter the email of the new class creator"
                  className={`pr-10 ${
                    emailValid === true ? 'border-green-500' : 
                    emailValid === false ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validatingEmail && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                  {!validatingEmail && emailValid === true && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {!validatingEmail && emailValid === false && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The user must be a current member of this class.
              </p>
            </div>

            {/* Target User Info */}
            {targetUserInfo && emailValid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Valid Class Member Found</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-green-900">{targetUserInfo.name}</p>
                    <p className="text-sm text-green-700">{targetUserInfo.email}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    New Creator
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Important Notice</span>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• You will lose creator privileges and become a regular member</li>
              <li>• The new creator will have full control over the class</li>
              <li>• This action cannot be undone unless the new creator transfers it back</li>
              <li>• The new creator can manage members, units, and class settings</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => setShowConfirmDialog(true)}
              disabled={loading || !emailValid || validatingEmail}
              className="flex-1"
              variant="destructive"
            >
              {loading ? "Transferring..." : "Transfer Creator Role"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Confirm Role Transfer
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to transfer the creator role of "{className}" to{' '}
                <strong>{targetUserInfo?.name}</strong> ({targetUserInfo?.email})?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ This action is permanent and cannot be undone!
                </p>
                <p className="text-sm text-red-700 mt-1">
                  You will immediately lose all creator privileges for this class.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Transferring..." : "Yes, Transfer Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoleTransferForm;
