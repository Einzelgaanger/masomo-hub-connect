import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ApplicationGuard from "@/components/ApplicationGuard";
import AdminGuard from "@/components/AdminGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CreatePassword from "./pages/CreatePassword";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminContentManagement from "./pages/admin/AdminContentManagement";
import ClassSelection from "./pages/ClassSelection";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationStatus from "./pages/ApplicationStatus";
import AuthCallback from "./pages/AuthCallback";
import UnitPage from "./pages/UnitPage";
import Settings from "./pages/Settings";
import Info from "./pages/Info";
import Tukio from "./pages/Tukio";
import Profile from "./pages/Profile";
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
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-password" element={<CreatePassword />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ApplicationGuard>
                  <Dashboard />
                </ApplicationGuard>
              </ProtectedRoute>
            } />
            <Route path="/tukio" element={
              <ProtectedRoute>
                <ApplicationGuard>
                  <Tukio />
                </ApplicationGuard>
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <ApplicationGuard>
                  <Profile />
                </ApplicationGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            } />
            <Route path="/admin/classes" element={
              <AdminGuard>
                <AdminClasses />
              </AdminGuard>
            } />
            <Route path="/admin/content" element={
              <AdminGuard>
                <AdminContentManagement />
              </AdminGuard>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/class-selection" element={<ClassSelection />} />
            <Route path="/application" element={<ApplicationForm />} />
            <Route path="/application-status" element={<ApplicationStatus />} />
            <Route path="/unit/:unitId" element={
              <ProtectedRoute>
                <ApplicationGuard>
                  <UnitPage />
                </ApplicationGuard>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <ApplicationGuard>
                  <Settings />
                </ApplicationGuard>
              </ProtectedRoute>
            } />
            <Route path="/info" element={
              <ProtectedRoute>
                <ApplicationGuard>
                  <Info />
                </ApplicationGuard>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
