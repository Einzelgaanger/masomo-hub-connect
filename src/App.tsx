import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CreatePassword from "./pages/CreatePassword";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminContent from "./pages/admin/AdminContent";
// Temporarily disabled until types are updated
// import ClassSelection from "./pages/ClassSelection";
// import ApplicationForm from "./pages/ApplicationForm";
import UnitPage from "./pages/UnitPage";
import Settings from "./pages/Settings";
import Info from "./pages/Info";
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-password" element={<CreatePassword />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/classes" element={<AdminClasses />} />
            <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/class-selection" element={<div className="p-6 text-center"><h2 className="text-xl font-bold text-gray-900 mb-2">Class Selection Coming Soon</h2><p className="text-gray-600">The class selection feature will be available once the database is fully synchronized.</p></div>} />
          <Route path="/application" element={<div className="p-6 text-center"><h2 className="text-xl font-bold text-gray-900 mb-2">Application Form Coming Soon</h2><p className="text-gray-600">The application form will be available once the database is fully synchronized.</p></div>} />
          <Route path="/application-status" element={<div className="p-6 text-center"><h2 className="text-xl font-bold text-gray-900 mb-2">Application Status Coming Soon</h2><p className="text-gray-600">The application status page will be available once the database is fully synchronized.</p></div>} />
            <Route path="/unit/:unitId" element={
              <ProtectedRoute>
                <UnitPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/info" element={
              <ProtectedRoute>
                <Info />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
