import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import { GraduationCap, BookOpen, Users, Trophy, ArrowRight } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <GraduationCap className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Masomo Hub
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Where learning meets creativity. Transform your university experience with our gamified learning platform.
          </p>
          <Link to="/login">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Collaborative Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share notes, past papers, and resources with your classmates. Learn together, grow together.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Trophy className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle>Gamified Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Earn points, climb rankings, and unlock achievements as you contribute to the learning community.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Class Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Stay organized with your class schedule, assignments, and events all in one place.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to revolutionize your learning?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of students already using Masomo Hub to enhance their academic journey.
          </p>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
