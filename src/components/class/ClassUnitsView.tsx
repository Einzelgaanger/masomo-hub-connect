import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  ChevronRight,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  description: string | null;
  unit_order: number;
  uploads_count?: number;
  assignments_count?: number;
  is_hidden?: boolean;
}

interface ClassUnitsViewProps {
  classId: string;
  isCreator: boolean;
}

export function ClassUnitsView({ classId, isCreator }: ClassUnitsViewProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchUnits();
    }
  }, [classId]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      // Fetch class units
      const { data: unitsData, error } = await supabase
        .from('class_units')
        .select('*')
        .eq('class_id', classId)
        .order('unit_order');

      if (error) throw error;

      // For each unit, get upload and assignment counts
      const unitsWithCounts = await Promise.all(
        (unitsData || []).map(async (unit) => {
          // This would require linking class_units to the old units table
          // For now, we'll show the units without counts
          // In Phase 9, we'll properly link everything
          
          return {
            ...unit,
            uploads_count: 0,
            assignments_count: 0,
            is_hidden: false,
          };
        })
      );

      setUnits(unitsWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHideUnit = async (unitId: string) => {
    try {
      // Add to user_hidden_units
      const { error } = await supabase
        .from('user_hidden_units')
        .insert({
          unit_id: unitId,
        });

      if (error) throw error;

      toast({
        title: 'Unit Hidden',
        description: 'This unit will no longer appear in your view',
      });

      fetchUnits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUnhideUnit = async (unitId: string) => {
    try {
      const { error } = await supabase
        .from('user_hidden_units')
        .delete()
        .eq('unit_id', unitId);

      if (error) throw error;

      toast({
        title: 'Unit Restored',
        description: 'This unit is now visible',
      });

      fetchUnits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUnit = async (unitId: string, unitName: string) => {
    if (!confirm(`Delete unit "${unitName}"? This will only remove it from your view. Other members will still see it.`)) {
      return;
    }

    handleHideUnit(unitId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {units.map((unit) => (
        <Card 
          key={unit.id}
          className={`hover:shadow-md transition-shadow cursor-pointer ${
            unit.is_hidden ? 'opacity-50' : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {unit.name}
                </CardTitle>
                {unit.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {unit.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {unit.is_hidden ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnhideUnit(unit.id);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUnit(unit.id, unit.name);
                    }}
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {unit.uploads_count || 0} uploads
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {unit.assignments_count || 0} assignments
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // This will navigate to the unit page
                  // We'll create this in a moment
                  toast({
                    title: 'Coming Soon',
                    description: 'Unit detail view will be available soon!',
                  });
                }}
              >
                View
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {units.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No units in this class yet
            </p>
            {isCreator && (
              <p className="text-sm text-muted-foreground mt-2">
                Class creator can add units from class management
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isCreator && units.length > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            toast({
              title: 'Coming Soon',
              description: 'Unit management will be available soon!',
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Unit
        </Button>
      )}
    </div>
  );
}

