import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import "./theme/global.css";
import DevTheme from "./pages/DevTheme";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import OrganizationPage from "./pages/OrganizationPage";
import AssetsPage from "./pages/AssetsPage";
import AssetDetailPage from "./pages/AssetDetailPage";
import AllocationsPage from "./pages/AllocationsPage";
import BookingsPage from "./pages/BookingsPage";
import MaintenancePage from "./pages/MaintenancePage";
import AuditsPage from "./pages/AuditsPage";
import AuditDetailPage from "./pages/AuditDetailPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireRole } from "./components/auth/RequireRole";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/dev/theme" element={<DevTheme />} />

          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route element={<RequireRole roles={["admin"]} />}>
                <Route path="organization" element={<OrganizationPage />} />
              </Route>
              <Route path="assets" element={<AssetsPage />} />
              <Route path="assets/:id" element={<AssetDetailPage />} />
              <Route element={<RequireRole roles={["admin", "manager"]} />}>
                <Route path="allocations" element={<AllocationsPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="audits" element={<AuditsPage />} />
                <Route path="audits/:id" element={<AuditDetailPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
