import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Mail, 
  User, 
  IdCard,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Application {
  id: string;
  user_id: string;
  class_id: string;
  full_name: string;
  admission_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string;
  email: string;
  class: {
    id: string;
    course_name: string;
    course_group: string;
    course_year: number;
    semester: number;
    university: {
      name: string;
    };
  };
}

interface Class {
  id: string;
  course_name: string;
  course_group: string;
  course_year: number;
  semester: number;
}

const AdminApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      loadApplications();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      // For now, load all classes - in a real scenario, this would be filtered by admin's university
      const { data, error } = await supabase
        .from('classes')
        .select('id, course_name, course_group, course_year, semester')
        .eq('is_graduated', false)
        .order('course_name, course_year, semester');

      if (error) throw error;
      setClasses(data || []);
      
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      
      // Load applications for the selected class with user email
      const { data, error } = await supabase
        .from('admin_applications_view')
        .select('*')
        .eq('class_id', selectedClass)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = data?.map(app => ({
        id: app.id,
        user_id: app.user_id,
        class_id: app.class_id,
        full_name: app.full_name,
        admission_number: app.admission_number,
        status: app.status as 'pending' | 'approved' | 'rejected',
        created_at: app.created_at,
        rejection_reason: app.rejection_reason,
        email: app.email,
        class: {
          id: app.class_id,
          course_name: app.course_name,
          course_group: app.course_group,
          course_year: app.course_year,
          semester: app.semester,
          university: {
            name: app.university_name
          }
        }
      })) || [];

      setApplications(transformedData);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    setProcessing(applicationId);
    try {
      const { error } = await supabase.functions.invoke('approve-application', {
        body: {
          applicationId,
          decision: 'approve'
        }
      });

      if (error) throw error;

      toast({
        title: "Application Approved",
        description: "The student has been approved and can now access the platform.",
      });

      loadApplications(); // Reload to see updated status
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(selectedApplication.id);
    try {
      const { error } = await supabase.functions.invoke('approve-application', {
        body: {
          applicationId: selectedApplication.id,
          decision: 'reject',
          rejectionReason: rejectionReason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Application Rejected",
        description: "The student has been notified of the rejection.",
      });

      setShowRejectDialog(false);
      setSelectedApplication(null);
      setRejectionReason('');
      loadApplications(); // Reload to see updated status
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (application: Application) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
          <p className="text-gray-600">Review and manage student class applications</p>
        </div>
        <Button
          variant="outline"
          onClick={loadApplications}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Class Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Class</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a class to view applications" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.course_name} - {cls.course_group} (Year {cls.course_year}, Semester {cls.semester})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                <p className="text-sm text-gray-600">Total Applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                <p className="text-sm text-gray-600">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <p className="text-sm text-gray-600">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                <p className="text-sm text-gray-600">Rejected</p>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner message="Loading applications..." />
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
                <p className="text-gray-600">No students have applied to this class yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(application.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.full_name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {application.email}
                            </div>
                            <div className="flex items-center">
                              <IdCard className="h-4 w-4 mr-1" />
                              {application.admission_number}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Applied:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(application.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Class:</span>
                        <span className="ml-2 text-gray-600">
                          {application.class.course_name} - {application.class.course_group}
                        </span>
                      </div>
                    </div>

                    {application.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-red-800">Rejection Reason:</span>
                        <p className="text-red-700 mt-1">{application.rejection_reason}</p>
                      </div>
                    )}

                    {application.status === 'pending' && (
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectDialog(application)}
                          disabled={processing === application.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(application.id)}
                          disabled={processing === application.id}
                        >
                          {processing === application.id ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-1" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedApplication?.full_name}'s application.
              This will be sent to the student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
              <Textarea
                placeholder="Please explain why this application is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={processing === selectedApplication?.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing === selectedApplication?.id || !rejectionReason.trim()}
              >
                {processing === selectedApplication?.id ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Application'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApplications;