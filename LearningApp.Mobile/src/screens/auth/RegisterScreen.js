import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Platform
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { sendOtp as sendOtpApi, verifyOtp as verifyOtpApi } from '../../services/api';
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

// ─── Step indicators ─────────────────────────────────────────────────────────
const STEPS = ['Details', 'Verify Email', 'Set Password'];

function StepBar({ current }) {
    return (
        <View style={s.stepBar}>
            {STEPS.map((label, i) => (
                <View key={i} style={s.stepItem}>
                    <View style={[s.stepDot, i <= current && s.stepDotActive]}>
                        <Text style={[s.stepNum, i <= current && s.stepNumActive]}>{i + 1}</Text>
                    </View>
                    <Text style={[s.stepLabel, i === current && s.stepLabelActive]}>{label}</Text>
                    {i < STEPS.length - 1 && <View style={[s.stepLine, i < current && s.stepLineActive]} />}
                </View>
            ))}
        </View>
    );
}

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();

    // Step 0 — Details
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Step 1 — OTP
    const [otp, setOtp] = useState('');
    const [verifiedToken, setVerifiedToken] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    // Step 2 — Password
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // ── Step 0: Send OTP ──────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        if (!name.trim()) return showAlert('Error', 'Full name is required.');
        if (!email.trim()) return showAlert('Error', 'Email is required.');
        if (!phone.trim()) return showAlert('Error', 'Phone number is required.');

        setLoading(true);
        try {
            await sendOtpApi(email.trim());
            setStep(1);
            startResendTimer();
        } catch (e) {
            // 409 Conflict = email already registered
            if (e.response?.status === 409) {
                showAlert(
                    'Email Already Registered',
                    'An account with this email already exists.\n\nWhat would you like to do?',
                    [
                        {
                            text: 'Sign In',
                            onPress: () => navigation.navigate('Login'),
                        },
                        {
                            text: 'Reset Password',
                            onPress: () => navigation.navigate('ForgotPassword'),
                        },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
            } else {
                showAlert('Error', e.response?.data?.message || 'Could not send OTP. Check your email.');
            }
        } finally {
            setLoading(false);
        }
    };

    const startResendTimer = () => {
        setResendTimer(60);
        const iv = setInterval(() => {
            setResendTimer(t => {
                if (t <= 1) { clearInterval(iv); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    // ── Step 1: Verify OTP ────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return showAlert('Error', 'Enter the 6-digit OTP.');
        setLoading(true);
        try {
            const res = await verifyOtpApi(email.trim(), otp.trim());
            setVerifiedToken(res.data.verifiedToken);
            setStep(2);
        } catch (e) {
            showAlert('Invalid OTP', e.response?.data?.message || 'Wrong or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Register ──────────────────────────────────────────────────────
    const handleRegister = async () => {
        if (password.length < 6) return showAlert('Error', 'Password must be at least 6 characters.');
        if (password !== confirmPass) return showAlert('Error', 'Passwords do not match.');

        setLoading(true);
        try {
            await register(name.trim(), email.trim(), password, phone.trim(), verifiedToken);
        } catch (e) {
            showAlert('Registration Failed', e.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            <KeyboardAwareScrollView
                contentContainerStyle={s.inner}
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={20}
            >

                {/* Logo + App Name */}
                <View style={s.brandRow}>
                    <Image source={LOGO} style={s.logo} resizeMode="contain" />
                    <Text style={s.appName}>Priya Ma'am</Text>
                    <Text style={s.appSub}>हिंदी साहित्य सरल भाषा में</Text>
                </View>

                {/* Card */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Create Account ✨</Text>
                    <StepBar current={step} />

                    {/* ── Step 0: Personal Details ── */}
                    {step === 0 && (
                        <>
                            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor="#bbb"
                                value={name} onChangeText={setName} />
                            <TextInput style={s.input} placeholder="Email address" placeholderTextColor="#bbb"
                                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                            <TextInput style={s.input} placeholder="Phone number" placeholderTextColor="#bbb"
                                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                            <TouchableOpacity style={s.btn} onPress={handleSendOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.btnText}>Send OTP →</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── Step 1: OTP Verification ── */}
                    {step === 1 && (
                        <>
                            <Text style={s.otpInfo}>
                                A 6-digit OTP has been sent to{'\n'}
                                <Text style={s.otpEmail}>{email}</Text>
                            </Text>
                            <TextInput
                                style={[s.input, s.otpInput]}
                                placeholder="● ● ● ● ● ●"
                                placeholderTextColor="#ccc"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                                textAlign="center"
                            />
                            <TouchableOpacity style={s.btn} onPress={handleVerifyOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.btnText}>Verify OTP →</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.resendRow}
                                onPress={resendTimer === 0 ? handleSendOtp : undefined}
                                disabled={resendTimer > 0}
                            >
                                <Text style={[s.resendText, resendTimer > 0 && s.resendDisabled]}>
                                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep(0)}>
                                <Text style={s.back}>← Change email</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── Step 2: Set Password ── */}
                    {step === 2 && (
                        <>
                            <Text style={s.otpInfo}>
                                ✅ Email verified! Set a strong password to finish.
                            </Text>
                            <PasswordInput value={password} onChangeText={setPassword} placeholder="Password (min 6 chars)" />
                            <PasswordInput value={confirmPass} onChangeText={setConfirmPass} placeholder="Confirm Password" />
                            <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.btnText}>Create Account 🎉</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={s.link}>
                            Already have an account?{'  '}
                            <Text style={s.linkBold}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAwareScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },
    inner: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },

    // Brand
    brandRow: { alignItems: 'center', marginBottom: 24 },
    logo: { width: 90, height: 90, marginBottom: 10 },
    appName: { fontSize: 28, fontWeight: '900', color: PURPLE, letterSpacing: 0.5 },
    appSub: { fontSize: 12, color: '#888', marginTop: 4 },

    // Card
    card: {
        width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24,
        elevation: 6, shadowColor: PURPLE, shadowOpacity: 0.12, shadowRadius: 12,
    },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },

    // Step bar
    stepBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22, alignItems: 'flex-start' },
    stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
    stepDot: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8E8F5',
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    stepDotActive: { backgroundColor: PURPLE },
    stepNum: { fontSize: 12, fontWeight: '700', color: '#aaa' },
    stepNumActive: { color: '#fff' },
    stepLabel: { fontSize: 10, color: '#aaa', textAlign: 'center' },
    stepLabelActive: { color: PURPLE, fontWeight: '700' },
    stepLine: {
        position: 'absolute', top: 14, right: -'50%',
        width: '100%', height: 2, backgroundColor: '#E8E8F5', zIndex: -1,
    },
    stepLineActive: { backgroundColor: PURPLE },

    // Form
    input: {
        backgroundColor: '#F5F6FF', borderRadius: 12, padding: 14,
        color: '#1a1a2e', marginBottom: 14, fontSize: 15,
        borderWidth: 1.5, borderColor: '#E0DEFF',
    },
    pwRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F5F6FF', borderRadius: 12,
        borderWidth: 1.5, borderColor: '#E0DEFF', marginBottom: 14,
    },
    pwInput: { flex: 1, padding: 14, fontSize: 15, color: '#1a1a2e' },
    eyeBtn: { paddingHorizontal: 12 },
    otpInput: { fontSize: 24, letterSpacing: 8, fontWeight: '700' },
    btn: {
        backgroundColor: PURPLE, borderRadius: 14, padding: 16,
        alignItems: 'center', marginTop: 2, marginBottom: 14,
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    // OTP
    otpInfo: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
    otpEmail: { fontWeight: '700', color: PURPLE },
    resendRow: { alignItems: 'center', marginBottom: 12 },
    resendText: { color: PURPLE, fontWeight: '700', fontSize: 14 },
    resendDisabled: { color: '#aaa' },
    back: { color: '#aaa', textAlign: 'center', fontSize: 13, marginBottom: 14 },

    link: { color: '#aaa', textAlign: 'center', fontSize: 14 },
    linkBold: { color: PURPLE, fontWeight: '700' },
});
