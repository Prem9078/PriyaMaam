import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, register as registerApi, setLogoutCallback, isTokenExpired } from '../services/api';
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
        setToken(null);
        setUser(null);
    };

    // Load saved session on app start — and immediately log out if token expired
    useEffect(() => {
        const loadSession = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('token');
                const savedUser = await AsyncStorage.getItem('user');

                if (savedToken && savedUser) {
                    if (isTokenExpired(savedToken)) {
                        // Token has fully expired while app was closed → force login
                        await clearSession();
                    } else {
                        setToken(savedToken);
                        setUser(JSON.parse(savedUser));
                    }
                }
            } catch (e) {
                console.log('Session load error:', e);
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
        const { token, name, email: userEmail, phone, role } = res.data;
        const userData = { name, email: userEmail, phone, role };

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setToken(token);
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, phone, verifiedToken) => {
        const res = await registerApi({ name, email, password, phone, otp: verifiedToken });
        const { token, name: n, email: e, phone: ph, role } = res.data;
        const userData = { name: n, email: e, phone: ph, role };

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setToken(token);
        setUser(userData);
        return userData;
    };

    const logout = clearSession;

    const isAdmin = user?.role === 'Admin';
    const isStudent = user?.role === 'Student';

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isStudent }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
