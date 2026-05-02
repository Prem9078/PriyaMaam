import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, register as registerApi, setLogoutCallback, isTokenExpired, isInactivityExpired, updateLastActive } from '../services/api';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearSession = async () => {
        // Tell the backend to remove the push token for this user
        // so they don't receive notifications after logout (fire-and-forget)
        try { await api.post('/api/notifications/clear-token'); } catch (_) { }

        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('last_active_at'); // clear inactivity timer
        setToken(null);
        setUser(null);
    };

    // Load saved session on app start — check token expiry AND 7-day inactivity
    useEffect(() => {
        const loadSession = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('token');
                const savedUser = await AsyncStorage.getItem('user');

                if (savedToken && savedUser) {
                    // Check JWT expiry
                    if (isTokenExpired(savedToken)) {
                        await clearSession();
                        return;
                    }

                    // Check 7-day inactivity — if user hasn't opened app in 7 days, log out
                    if (await isInactivityExpired()) {
                        await clearSession();
                        return;
                    }

                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch {
            } finally {
                setLoading(false);
            }
        };
        loadSession();

        // Register logout callback so api.js can trigger it on 401
        setLogoutCallback(clearSession);
    }, []);

    const login = async (email, password) => {
        const res = await loginApi({ email, password });
        const { token, name, email: userEmail, phone, role, avatarUrl } = res.data;
        const userData = { name, email: userEmail, phone, role, avatarUrl };

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await updateLastActive(); // stamp activity time on fresh login
        setToken(token);
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, phone, verifiedToken) => {
        const res = await registerApi({ name, email, password, phone, otp: verifiedToken });
        const { token, name: n, email: e, phone: ph, role, avatarUrl } = res.data;
        const userData = { name: n, email: e, phone: ph, role, avatarUrl };

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await updateLastActive(); // stamp activity time on fresh registration
        setToken(token);
        setUser(userData);
        return userData;
    };

    const updateUser = async (updatedData) => {
        const newData = { ...user, ...updatedData };
        await AsyncStorage.setItem('user', JSON.stringify(newData));
        setUser(newData);
    };

    const logout = clearSession;

    const isAdmin = user?.role === 'Admin';
    const isStudent = user?.role === 'Student';

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAdmin, isStudent }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
