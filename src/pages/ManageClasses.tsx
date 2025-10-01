import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, ArrowLeft } from 'lucide-react';

export default function ManageClasses() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/units')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classes
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Your Classes</h1>
          <p className="text-muted-foreground">
            Create a new class or join an existing one
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Class Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/masomo/create')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Create a Class</CardTitle>
              <CardDescription>
                Start your own class and invite members
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Set class name and description</li>
                <li>• Add units for your class</li>
                <li>• Get a unique shareable code</li>
                <li>• Approve member join requests</li>
                <li>• Manage units and members</li>
              </ul>
              <Button className="mt-6 w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </CardContent>
          </Card>

          {/* Join Class Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/masomo/join')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-500/10 rounded-full w-fit">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Join a Class</CardTitle>
              <CardDescription>
                Enter a class code to request access
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Get class code from a friend</li>
                <li>• Preview class and units</li>
                <li>• Request to join</li>
                <li>• Wait for creator approval</li>
                <li>• Start collaborating!</li>
              </ul>
              <Button variant="outline" className="mt-6 w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Join Class
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

