import { Suspense, lazy, useEffect } from "react";
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
import { AuthErrorHandler } from "@/components/AuthErrorHandler";
import { initSentry, Sentry } from "@/lib/sentry";
import { initPerformanceMonitoring } from "@/lib/performance";

// Eager load critical pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages
const MyLogin = lazy(() => import("./pages/MyLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ApplicationForm = lazy(() => import("./pages/ApplicationForm"));
const ApplicationStatus = lazy(() => import("./pages/ApplicationStatus"));
const ApplicationRejected = lazy(() => import("./pages/ApplicationRejected"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const UnitPage = lazy(() => import("./pages/UnitPage"));
const Info = lazy(() => import("./pages/Info"));
const Ukumbi = lazy(() => import("./pages/Ukumbi"));
const Events = lazy(() => import("./pages/Events"));
const Ajira = lazy(() => import("./pages/Ajira"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Alumni = lazy(() => import("./pages/Alumni"));
const Profile = lazy(() => import("./pages/Profile"));
const Sifa = lazy(() => import("./pages/Sifa"));
const Masomo = lazy(() => import("./pages/Masomo"));
const ClassPage = lazy(() => import("./pages/ClassPage"));
const Admin = lazy(() => import("./pages/Admin"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Initialize Sentry and Performance Monitoring
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
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

const App = () => {
  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitoring();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthErrorHandler />
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
                <Suspense fallback={<PageLoader />}>
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
        <Route path="/class/:classId" element={
          <ProtectedRoute>
            <ClassPage />
          </ProtectedRoute>
        } />
        <Route path="/class/:classId/unit/:unitId" element={
          <ProtectedRoute>
            <UnitPage />
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
                </Suspense>
                
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
};

export default Sentry.withProfiler(App);
