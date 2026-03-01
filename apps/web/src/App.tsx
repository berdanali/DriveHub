import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

// Layouts
import AdminLayout from '@/layouts/AdminLayout';
import PublicLayout from '@/layouts/PublicLayout';
import OwnerLayout from '@/layouts/OwnerLayout';

// Public Pages
import HomePage from '@/pages/public/HomePage';
import LoginPage from '@/pages/public/LoginPage';
import RegisterPage from '@/pages/public/RegisterPage';
import ForgotPasswordPage from '@/pages/public/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/public/ResetPasswordPage';
import VerifyEmailPage from '@/pages/public/VerifyEmailPage';
import VehicleSearchPage from '@/pages/public/VehicleSearchPage';
import VehicleDetailPage from '@/pages/public/VehicleDetailPage';
import ContactPage from '@/pages/public/ContactPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import SettingsPage from '@/pages/public/SettingsPage';
import AboutPage from '@/pages/public/AboutPage';
import FAQPage from '@/pages/public/FAQPage';
import HowItWorksPage from '@/pages/public/HowItWorksPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/DashboardPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import FleetOverviewPage from '@/pages/admin/FleetOverviewPage';
import FinancialsPage from '@/pages/admin/FinancialsPage';

// Owner Pages
import OwnerDashboard from '@/pages/owner/DashboardPage';
import MyVehiclesPage from '@/pages/owner/MyVehiclesPage';
import AddVehiclePage from '@/pages/owner/AddVehiclePage';
import OwnerRentalsPage from '@/pages/owner/RentalsPage';
import OwnerEarningsPage from '@/pages/owner/EarningsPage';

// Customer Pages
import MyRentalsPage from '@/pages/customer/MyRentalsPage';
import FavoritesPage from '@/pages/customer/FavoritesPage';

// Protected Route Component
function ProtectedRoute({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles?: string[];
}) {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export default function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/vehicles" element={<VehicleSearchPage />} />
                <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'VEHICLE_OWNER', 'SUPER_ADMIN']}>
                        <SettingsPage />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="fleet" element={<FleetOverviewPage />} />
                <Route path="financials" element={<FinancialsPage />} />
            </Route>

            {/* Owner Routes */}
            <Route
                path="/owner"
                element={
                    <ProtectedRoute allowedRoles={['VEHICLE_OWNER', 'SUPER_ADMIN']}>
                        <OwnerLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<OwnerDashboard />} />
                <Route path="vehicles" element={<MyVehiclesPage />} />
                <Route path="vehicles/new" element={<AddVehiclePage />} />
                <Route path="vehicles/:id/edit" element={<AddVehiclePage />} />
                <Route path="rentals" element={<OwnerRentalsPage />} />
                <Route path="earnings" element={<OwnerEarningsPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Customer Routes */}
            <Route
                path="/rentals"
                element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}>
                        <PublicLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<MyRentalsPage />} />
            </Route>
            <Route
                path="/favorites"
                element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}>
                        <PublicLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<FavoritesPage />} />
            </Route>
        </Routes>
    );
}
