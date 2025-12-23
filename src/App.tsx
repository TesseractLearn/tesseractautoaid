import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import RoleSelection from "./pages/RoleSelection";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

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

// Mechanic Pages
import MechanicHome from "./pages/mechanic/MechanicHome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<RoleSelection />} />
            <Route path="/login" element={<Login />} />

            {/* User Routes */}
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<UserHome />} />
              <Route path="services" element={<UserServices />} />
              <Route path="book/:serviceType" element={<BookService />} />
              <Route path="track" element={<UserTrack />} />
              <Route path="history" element={<UserHistory />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Mechanic Routes */}
            <Route path="/mechanic" element={<MechanicLayout />}>
              <Route index element={<MechanicHome />} />
              <Route path="jobs" element={<MechanicHome />} />
              <Route path="earnings" element={<MechanicHome />} />
              <Route path="stats" element={<MechanicHome />} />
              <Route path="profile" element={<MechanicHome />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
