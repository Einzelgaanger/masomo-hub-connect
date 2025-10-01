import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, GripVertical, Loader2, Save } from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  description: string | null;
  unit_order: number;
}

interface ManageClassUnitsProps {
  classId: string;
}

export function ManageClassUnits({ classId }: ManageClassUnitsProps) {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Unit Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDescription, setNewUnitDescription] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Edit Unit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Delete Unit Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  useEffect(() => {
    fetchUnits();
  }, [classId]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_units')
        .select('*')
        .eq('class_id', classId)
        .order('unit_order');

      if (error) throw error;
      setUnits(data || []);
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

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a unit name',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const maxOrder = units.length > 0 ? Math.max(...units.map(u => u.unit_order)) : -1;
      
      const { error } = await supabase
        .from('class_units')
        .insert({
          class_id: classId,
          name: newUnitName.trim(),
          description: newUnitDescription.trim() || null,
          unit_order: maxOrder + 1,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Unit added successfully',
      });

      setNewUnitName('');
      setNewUnitDescription('');
      setShowAddModal(false);
      fetchUnits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleEditUnit = async () => {
    if (!editName.trim() || !editingUnit) {
      toast({
        title: 'Error',
        description: 'Please enter a unit name',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('class_units')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
        })
        .eq('id', editingUnit.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Unit updated successfully',
      });

      setShowEditModal(false);
      setEditingUnit(null);
      fetchUnits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;

    try {
      const { error } = await supabase
        .from('class_units')
        .delete()
        .eq('id', deletingUnit.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Unit deleted successfully',
      });

      setShowDeleteDialog(false);
      setDeletingUnit(null);
      fetchUnits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setEditName(unit.name);
    setEditDescription(unit.description || '');
    setShowEditModal(true);
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Manage Units</h3>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      {/* Units List */}
      <div className="space-y-3">
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{unit.name}</h4>
                  </div>
                  {unit.description && (
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      {unit.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(unit)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingUnit(unit);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {units.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No units yet. Add your first unit!</p>
          </CardContent>
        </Card>
      )}

      {/* Add Unit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>
              Create a new unit for this class
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="unitName">Unit Name *</Label>
              <Input
                id="unitName"
                placeholder="e.g., Data Structures"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unitDescription">Description</Label>
              <Textarea
                id="unitDescription"
                placeholder="Brief description of this unit..."
                rows={3}
                value={newUnitDescription}
                onChange={(e) => setNewUnitDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUnit} disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Unit
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>
              Update unit name and description
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editName">Unit Name *</Label>
              <Input
                id="editName"
                placeholder="e.g., Data Structures"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Brief description of this unit..."
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingUnit(null);
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUnit} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingUnit?.name}"? 
              This will permanently remove the unit from the class.
              All associated content (notes, papers) will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUnit(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

