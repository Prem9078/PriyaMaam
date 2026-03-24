import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Platform, StatusBar
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { sendOtp as sendOtpApi, verifyOtp as verifyOtpApi } from '../../services/api';
import api from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const LOGO = require('../../../assets/Logo.png');
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

const STEPS = ['Enter Email', 'Verify OTP', 'New Password'];

function StepBar({ current }) {
    return (
        <View style={s.stepBar}>
            {STEPS.map((label, i) => (
                <View key={i} style={s.stepItem}>
                    <View style={[s.stepDot, i <= current && s.stepDotActive]}>
                        <Text style={[s.stepNum, i <= current && s.stepNumActive]}>{i + 1}</Text>
                    </View>
                    <Text style={[s.stepLabel, i === current && s.stepLabelActive]}>{label}</Text>
                </View>
            ))}
        </View>
    );
}

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [verifiedToken, setVerifiedToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const startResendTimer = () => {
        setResendTimer(60);
        const iv = setInterval(() => {
            setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
        }, 1000);
    };

    // Step 0 — Send OTP
    const handleSendOtp = async () => {
        if (!email.trim()) return showAlert('Error', 'Enter your registered email.');
        setLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email: email.trim() });
            setStep(1);
            startResendTimer();
        } catch (e) {
            showAlert('Error', e.response?.data?.message || 'Could not send OTP.');
        } finally { setLoading(false); }
    };

    // Step 1 — Verify OTP
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return showAlert('Error', 'Enter the 6-digit OTP.');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/verify-reset-otp', { email: email.trim(), otp: otp.trim() });
            setVerifiedToken(res.data.verifiedToken);
            setStep(2);
        } catch (e) {
            showAlert('Invalid OTP', e.response?.data?.message || 'Wrong or expired OTP.');
        } finally { setLoading(false); }
    };

    // Step 2 — Reset Password
    const handleReset = async () => {
        if (password.length < 6) return showAlert('Error', 'Password must be at least 6 characters.');
        if (password !== confirmPass) return showAlert('Error', 'Passwords do not match.');
        setLoading(true);
        try {
            await api.post('/api/auth/reset-password', {
                email: email.trim(),
                otp: verifiedToken,
                newPassword: password,
            });
            showAlert('✅ Password Reset!', 'Your password has been changed. Please log in.', [
                { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
            ]);
        } catch (e) {
            showAlert('Error', e.response?.data?.message || 'Reset failed. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0F2FF" />
            <KeyboardAwareScrollView
                contentContainerStyle={s.inner}
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={20}
            >

                <View style={s.brandRow}>
                    <Image source={LOGO} style={s.logo} resizeMode="contain" />
                    <Text style={s.appName}>Soham Sir</Text>
                    <Text style={s.appSub}>Learn with Soham Sir</Text>
                </View>

                <View style={s.card}>
                    <Text style={s.cardTitle}>Forgot Password 🔐</Text>
                    <StepBar current={step} />

                    {/* Step 0 */}
                    {step === 0 && (
                        <>
                            <Text style={s.infoText}>Enter your registered email and we'll send a reset OTP.</Text>
                            <TextInput
                                style={s.input} placeholder="Email address" placeholderTextColor="#bbb"
                                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                            />
                            <TouchableOpacity style={s.btn} onPress={handleSendOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP →</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <>
                            <Text style={s.infoText}>
                                OTP sent to{' '}
                                <Text style={s.emailHighlight}>{email}</Text>
                            </Text>
                            <TextInput
                                style={[s.input, s.otpInput]}
                                placeholder="● ● ● ● ● ●"
                                placeholderTextColor="#ccc"
                                value={otp} onChangeText={setOtp}
                                keyboardType="number-pad" maxLength={6} textAlign="center"
                            />
                            <TouchableOpacity style={s.btn} onPress={handleVerifyOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify OTP →</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={s.resendRow}
                                onPress={resendTimer === 0 ? handleSendOtp : undefined}
                                disabled={resendTimer > 0}>
                                <Text style={[s.resendText, resendTimer > 0 && s.resendDisabled]}>
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep(0)}>
                                <Text style={s.changeLink}>← Change email</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <>
                            <Text style={s.infoText}>✅ OTP verified. Set your new password below.</Text>
                            <PasswordInput value={password} onChangeText={setPassword} placeholder="New Password (min 6 chars)" />
                            <PasswordInput value={confirmPass} onChangeText={setConfirmPass} placeholder="Confirm New Password" />
                            <TouchableOpacity style={s.btn} onPress={handleReset} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Reset Password 🔐</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={s.backToLogin}>← Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },
    inner: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
    brandRow: { alignItems: 'center', marginBottom: 24 },
    logo: { width: 90, height: 90, marginBottom: 10 },
    appName: { fontSize: 28, fontWeight: '900', color: PURPLE },
    appSub: { fontSize: 12, color: '#888', marginTop: 4 },
    card: {
        width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24,
        elevation: 6, shadowColor: PURPLE, shadowOpacity: 0.12, shadowRadius: 12,
    },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },
    stepBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    stepItem: { alignItems: 'center' },
    stepDot: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8E8F5',
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    stepDotActive: { backgroundColor: PURPLE },
    stepNum: { fontSize: 12, fontWeight: '700', color: '#aaa' },
    stepNumActive: { color: '#fff' },
    stepLabel: { fontSize: 10, color: '#aaa' },
    stepLabelActive: { color: PURPLE, fontWeight: '700' },
    infoText: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 20 },
    emailHighlight: { fontWeight: '700', color: PURPLE },
    input: {
        backgroundColor: '#F5F6FF', borderRadius: 12, padding: 14,
        color: '#1a1a2e', marginBottom: 14, fontSize: 15,
        borderWidth: 1.5, borderColor: '#E0DEFF',
    },
    otpInput: { fontSize: 24, letterSpacing: 8, fontWeight: '700', textAlign: 'center' },
    pwRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FF',
        borderRadius: 12, borderWidth: 1.5, borderColor: '#E0DEFF', marginBottom: 14,
    },
    pwInput: { flex: 1, padding: 14, fontSize: 15, color: '#1a1a2e' },
    eyeBtn: { paddingHorizontal: 12 },
    btn: {
        backgroundColor: PURPLE, borderRadius: 14, padding: 16,
        alignItems: 'center', marginBottom: 12,
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    resendRow: { alignItems: 'center', marginBottom: 10 },
    resendText: { color: PURPLE, fontWeight: '700', fontSize: 14 },
    resendDisabled: { color: '#aaa' },
    changeLink: { color: '#aaa', textAlign: 'center', fontSize: 13, marginBottom: 14 },
    backToLogin: { color: PURPLE, textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 4 },
});
