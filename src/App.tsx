import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import SplashScreen from "./pages/SplashScreen";
import RoleSelection from "./pages/RoleSelection";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import InstallApp from "./pages/InstallApp";

// Layouts
import UserLayout from "./layouts/UserLayout";
import MechanicLayout from "./layouts/MechanicLayout";

// User Pages
import UserHome from "./pages/user/UserHome";
import UserServices from "./pages/user/UserServices";
import UserTrack from "./pages/user/UserTrack";
import UserHistory from "./pages/user/UserHistory";
import UserProfile from "./pages/user/UserProfile";
import BookService from "./pages/user/BookService";
import FindMechanics from "./pages/user/FindMechanics";
import MyVehicles from "./pages/user/MyVehicles";
import BookingHistory from "./pages/user/BookingHistory";
import PaymentMethods from "./pages/user/PaymentMethods";
import NotificationSettings from "./pages/user/NotificationSettings";
import PrivacySecurity from "./pages/user/PrivacySecurity";

// Mechanic Pages
import MechanicHome from "./pages/mechanic/MechanicHome";
import MechanicRegistration from "./pages/mechanic/MechanicRegistration";
import MechanicProfile from "./pages/mechanic/MechanicProfile";
import MechanicJobs from "./pages/mechanic/MechanicJobs";
import MechanicEarnings from "./pages/mechanic/MechanicEarnings";
import MechanicStats from "./pages/mechanic/MechanicStats";
import MechanicGuard from "./components/MechanicGuard";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Splash & Auth Routes */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<InstallApp />} />

            {/* User Routes */}
            <Route path="/user" element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route index element={<UserHome />} />
              <Route path="services" element={<UserServices />} />
              <Route path="book/:serviceType" element={<BookService />} />
              <Route path="find-mechanics" element={<FindMechanics />} />
              <Route path="track" element={<UserTrack />} />
              <Route path="history" element={<UserHistory />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="vehicles" element={<MyVehicles />} />
              <Route path="bookings" element={<BookingHistory />} />
              <Route path="payments" element={<PaymentMethods />} />
              <Route path="notifications" element={<NotificationSettings />} />
              <Route path="security" element={<PrivacySecurity />} />
            </Route>

            {/* Mechanic Registration */}
            <Route path="/mechanic/register" element={
              <ProtectedRoute>
                <MechanicRegistration />
              </ProtectedRoute>
            } />

            {/* Mechanic Routes */}
            <Route path="/mechanic" element={
              <ProtectedRoute>
                <MechanicGuard>
                  <MechanicLayout />
                </MechanicGuard>
              </ProtectedRoute>
            }>
              <Route index element={<MechanicHome />} />
              <Route path="jobs" element={<MechanicJobs />} />
              <Route path="earnings" element={<MechanicEarnings />} />
              <Route path="stats" element={<MechanicStats />} />
              <Route path="profile" element={<MechanicProfile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
