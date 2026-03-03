import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../components/AppAlert';

const LOGO = require('../../../assets/AppLogo.png');
const PURPLE = '#4B42D6';

function PasswordInput({ value, onChangeText, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <View style={s.pwRow}>
            <TextInput
                style={s.pwInput}
                placeholder={placeholder}
                placeholderTextColor="#bbb"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!show}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShow(v => !v)}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
            </TouchableOpacity>
        </View>
    );
}

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return showAlert('Error', 'Please fill in all fields.');
        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (err) {
            showAlert('Login Failed', err.response?.data?.message || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

                {/* Logo + App Name */}
                <View style={s.brandRow}>
                    <Image source={LOGO} style={s.logo} resizeMode="contain" />
                    <Text style={s.appName}>Priya Ma'am</Text>
                    <Text style={s.appSub}>हिंदी साहित्य सरल भाषा में</Text>
                </View>

                {/* Card */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Welcome Back 👋</Text>
                    <Text style={s.cardSub}>Sign in to continue learning</Text>

                    <TextInput
                        style={s.input}
                        placeholder="Email address"
                        placeholderTextColor="#bbb"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />

                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={s.forgotRow}>
                        <Text style={s.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={s.btnText}>Sign In</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={s.link}>
                            Don't have an account?{'  '}
                            <Text style={s.linkBold}>Register</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },
    inner: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

    brandRow: { alignItems: 'center', marginBottom: 28 },
    logo: { width: 110, height: 110, marginBottom: 10 },
    appName: { fontSize: 30, fontWeight: '900', color: PURPLE, letterSpacing: 0.5 },
    appSub: { fontSize: 13, color: '#888', marginTop: 4, letterSpacing: 0.3 },

    card: {
        width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24,
        elevation: 6, shadowColor: PURPLE, shadowOpacity: 0.12, shadowRadius: 12,
    },
    cardTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
    cardSub: { fontSize: 13, color: '#aaa', marginBottom: 24 },

    input: {
        backgroundColor: '#F5F6FF', borderRadius: 12, padding: 14,
        color: '#1a1a2e', marginBottom: 14, fontSize: 15,
        borderWidth: 1.5, borderColor: '#E0DEFF',
    },
    // Password row
    pwRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F5F6FF', borderRadius: 12,
        borderWidth: 1.5, borderColor: '#E0DEFF', marginBottom: 14,
    },
    pwInput: { flex: 1, padding: 14, fontSize: 15, color: '#1a1a2e' },
    eyeBtn: { paddingHorizontal: 12 },

    btn: {
        backgroundColor: PURPLE, borderRadius: 14, padding: 16,
        alignItems: 'center', marginTop: 4, marginBottom: 18,
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    forgotRow: { alignItems: 'flex-end', marginBottom: 16, marginTop: -4 },
    forgotText: { color: PURPLE, fontSize: 13, fontWeight: '600' },
    link: { color: '#aaa', textAlign: 'center', fontSize: 14 },
    linkBold: { color: PURPLE, fontWeight: '700' },
});
