import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  X, 
  BookOpen, 
  Users, 
  Link,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ClassUnit {
  id: string;
  name: string;
  description: string;
}

interface CreateClassFormProps {
  onSuccess: (classData: any) => void;
  onCancel: () => void;
}

const CreateClassForm = ({ onSuccess, onCancel }: CreateClassFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    codeExpires: false,
    expirationHours: 24
  });
  
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [currentUnit, setCurrentUnit] = useState({
    name: '',
    description: ''
  });

  const addUnit = () => {
    if (!currentUnit.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a unit name.",
        variant: "destructive",
      });
      return;
    }

    const newUnit: ClassUnit = {
      id: Date.now().toString(),
      name: currentUnit.name.trim(),
      description: currentUnit.description.trim()
    };

    setUnits([...units, newUnit]);
    setCurrentUnit({ name: '', description: '' });
  };

  const removeUnit = (unitId: string) => {
    setUnits(units.filter(unit => unit.id !== unitId));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name.",
        variant: "destructive",
      });
      return;
    }

    if (units.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one unit to the class.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate secure class code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_secure_class_code');
      if (codeError) throw codeError;

      // Calculate expiration time if needed
      let expiresAt = null;
      if (formData.codeExpires) {
        expiresAt = new Date(Date.now() + formData.expirationHours * 60 * 60 * 1000).toISOString();
      }

      // Create the class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          creator_id: user?.id,
          class_code: codeData,
          code_expires: formData.codeExpires,
          code_expires_at: expiresAt,
          code_created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (classError) throw classError;

      // Create the units
      const unitsToInsert = units.map((unit) => ({
        class_id: classData.id,
        name: unit.name,
        description: unit.description
      }));

      const { error: unitsError } = await supabase
        .from('class_units')
        .insert(unitsToInsert);

      if (unitsError) throw unitsError;

      // Check if user is already a member (shouldn't happen, but just in case)
      const { data: existingMember } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', classData.id)
        .eq('user_id', user?.id)
        .single();

      // Only add creator as member if they're not already a member
      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('class_members')
          .insert({
            class_id: classData.id,
            user_id: user?.id,
            role: 'creator'
          });

        if (memberError) throw memberError;
      }

      toast({
        title: "Success",
        description: "Class created successfully!",
      });

      onSuccess({
        ...classData,
        units: unitsToInsert,
        class_code: classData.class_code
      });
    } catch (error: any) {
      console.error('Error creating class:', error);
      
      let errorMessage = "Failed to create class. Please try again.";
      
      // Handle specific error cases
      if (error?.code === '23505') {
        if (error.message?.includes('class_members_class_id_user_id_key')) {
          errorMessage = "You are already a member of this class. Please try with a different class name.";
        } else if (error.message?.includes('classes_class_code_key')) {
          errorMessage = "Class code already exists. Please try again.";
        } else {
          errorMessage = "Duplicate entry detected. Please try again.";
        }
      } else if (error?.code === '23503') {
        errorMessage = "Database relationship error. Please contact support.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateClassCode = async (): Promise<string> => {
    // Use the database function to generate a unique code
    const { data, error } = await supabase.rpc('generate_class_code');
    if (error) {
      // Fallback to manual generation if RPC fails
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
    return data;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create New Class
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Class Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="class-name">Class Name *</Label>
            <Input
              id="class-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Computer Science 101"
            />
          </div>
          
          <div>
            <Label htmlFor="class-description">Description</Label>
            <Textarea
              id="class-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what this class is about..."
              rows={3}
            />
          </div>

          {/* Code Expiration Settings */}
          <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="code-expires"
                checked={formData.codeExpires}
                onChange={(e) => setFormData({...formData, codeExpires: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="code-expires" className="font-medium">
                🔐 Set class code expiration
              </Label>
            </div>
            
            {formData.codeExpires && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="expiration-hours" className="text-sm">
                  Code expires after (hours):
                </Label>
                <select
                  id="expiration-hours"
                  value={formData.expirationHours}
                  onChange={(e) => setFormData({...formData, expirationHours: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours (1 day)</option>
                  <option value={72}>72 hours (3 days)</option>
                  <option value={168}>168 hours (1 week)</option>
                  <option value={720}>720 hours (1 month)</option>
                </select>
                <p className="text-xs text-blue-600">
                  ⚠️ After expiration, students won't be able to join using this code
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Units Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Class Units *</Label>
            <Badge variant="outline">{units.length} units</Badge>
          </div>

          {/* Add Unit Form */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="unit-name">Unit Name</Label>
                <Input
                  id="unit-name"
                  value={currentUnit.name}
                  onChange={(e) => setCurrentUnit({...currentUnit, name: e.target.value})}
                  placeholder="e.g., Introduction to Programming"
                />
              </div>
              <div>
                <Label htmlFor="unit-description">Unit Description</Label>
                <Input
                  id="unit-description"
                  value={currentUnit.description}
                  onChange={(e) => setCurrentUnit({...currentUnit, description: e.target.value})}
                  placeholder="Brief description of this unit"
                />
              </div>
            </div>
            <Button onClick={addUnit} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>

          {/* Units List */}
          {units.length > 0 && (
            <div className="space-y-2">
              {units.map((unit, index) => (
                <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{unit.name}</p>
                      {unit.description && (
                        <p className="text-sm text-muted-foreground">{unit.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeUnit(unit.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Code Preview */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Link className="h-4 w-4" />
            <span className="text-sm font-medium">Class Join Code</span>
          </div>
          <p className="text-sm text-muted-foreground">
            A unique code will be generated for this class. Students can use this code to join your class.
          </p>
        </div>

        {/* Validation */}
        {units.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Add Units Required</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Please add at least one unit to create the class.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={loading || units.length === 0 || !formData.name.trim()}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Class"}
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
  );
};

export default CreateClassForm;
