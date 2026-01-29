import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import LandingPage from './components/Landing/LandingPage';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import MFASetup from './components/Auth/MFASetup';
import MFAVerify from './components/Auth/MFAVerify';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import UserDashboard from './components/Dashboard/UserDashboard';
import EncryptedVault from './components/Files/EncryptedVault';
import PublicRepository from './components/Files/PublicRepository';
import AuditLog from './components/Admin/AuditLog';
import UserManagement from './components/Admin/UserManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
                <div className="spinner w-12 h-12"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/app/dashboard" replace />;
    }

    return children;
};

// MFA Required Route
const MFARoute = ({ children }) => {
    const { mfaPending } = useAuth();

    if (!mfaPending) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Public Route (redirects if already logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
                <div className="spinner w-12 h-12"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/app/dashboard" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Landing Page - Public Home */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Routes */}
            <Route path="/login" element={
                <PublicRoute>
                    <LoginForm />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <RegisterForm />
                </PublicRoute>
            } />

            {/* MFA Routes */}
            <Route path="/mfa-verify" element={
                <MFARoute>
                    <MFAVerify />
                </MFARoute>
            } />
            <Route path="/mfa-setup" element={<MFASetup />} />

            {/* Protected Routes with Layout */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <MainLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="vault" element={
                    <ProtectedRoute allowedRoles={['admin', 'premium']}>
                        <EncryptedVault />
                    </ProtectedRoute>
                } />
                <Route path="public" element={<PublicRepository />} />

                {/* Admin Only Routes */}
                <Route path="admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="admin/logs" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AuditLog />
                    </ProtectedRoute>
                } />
                <Route path="admin/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <UserManagement />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
