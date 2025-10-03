import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ApplicationStatusGuard from "@/components/ApplicationStatusGuard";
import AdminGuard from "@/components/AdminGuard";
import ProfileGuard from "@/components/ProfileGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FloatingConcernsButton } from "@/components/ui/FloatingConcernsButton";
import Index from "./pages/Index";
import Login from "./pages/Login";
import MyLogin from "./pages/MyLogin";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationStatus from "./pages/ApplicationStatus";
import ApplicationRejected from "./pages/ApplicationRejected";
import AuthCallback from "./pages/AuthCallback";
import UnitPage from "./pages/UnitPage";
import Info from "./pages/Info";
import Ukumbi from "./pages/Ukumbi";
import Events from "./pages/Events";
import Ajira from "./pages/Ajira";
import Inbox from "./pages/Inbox";
import Alumni from "./pages/Alumni";
import Profile from "./pages/Profile";
import Sifa from "./pages/Sifa";
import Masomo from "./pages/Masomo";
import ClassUnits from "./pages/ClassUnits";
import UnitContent from "./pages/UnitContent";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen overflow-x-hidden">
          <ErrorBoundary>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <ProfileGuard>
                <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mylogin" element={<MyLogin />} />
            <Route path="/dashboard" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/ukumbi" element={
              <ProtectedRoute>
                <Ukumbi />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/ajira" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Ajira />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/inbox" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/inbox/:conversationId" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/alumni" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Alumni />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/sifa" element={
              <ProtectedRoute>
                <Sifa />
              </ProtectedRoute>
            } />
            <Route path="/masomo" element={
              <ProtectedRoute>
                <Masomo />
              </ProtectedRoute>
            } />
            <Route path="/class/:classId/units" element={
              <ProtectedRoute>
                <ClassUnits />
              </ProtectedRoute>
            } />
            <Route path="/class/:classId/unit/:unitId" element={
              <ProtectedRoute>
                <UnitContent />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminGuard>
                <Admin />
              </AdminGuard>
            } />
            <Route path="/admin/classes" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/concerns" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/new" element={<Navigate to="/admin" replace />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/application-status" element={<ApplicationStatus />} />
            <Route path="/application" element={<ApplicationForm />} />
            <Route path="/application-status" element={<ApplicationStatus />} />
            <Route path="/application-rejected" element={<ApplicationRejected />} />
            <Route path="/unit/:unitId" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <UnitPage />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            <Route path="/info" element={
              <ApplicationStatusGuard>
                <ProtectedRoute>
                  <Info />
                </ProtectedRoute>
              </ApplicationStatusGuard>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
                </Routes>
                
                {/* Floating Concerns Button - appears on all pages */}
                <FloatingConcernsButton />
              </ProfileGuard>
            </BrowserRouter>
          </ErrorBoundary>
        </div>
        </TooltipProvider>
      </AuthProvider>
  </QueryClientProvider>
);

export default App;
