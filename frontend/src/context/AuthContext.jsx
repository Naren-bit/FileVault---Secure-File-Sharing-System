import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mfaPending, setMfaPending] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await authAPI.getMe();
            if (response.data.success) {
                setUser(response.data.data.user);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        if (response.data.success && response.data.data.mfaRequired) {
            setMfaPending(true);
            return { mfaRequired: true };
        }
        return response.data;
    };

    const verifyMFA = async (token) => {
        const response = await authAPI.verifyMFA(token);
        if (response.data.success) {
            setUser(response.data.data.user);
            setMfaPending(false);
        }
        return response.data;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        return response.data;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } finally {
            setUser(null);
            setMfaPending(false);
        }
    };

    const value = {
        user,
        loading,
        mfaPending,
        login,
        verifyMFA,
        register,
        logout,
        checkAuth,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isPremium: user?.role === 'premium' || user?.role === 'admin',
        isGuest: user?.role === 'guest'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
