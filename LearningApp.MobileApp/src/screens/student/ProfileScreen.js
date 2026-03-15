import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const PURPLE = '#4B42D6';
const GOLD = '#F5A623';

function PasswordInput({ value, onChangeText, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <View style={s.pwRow}>
            <TextInput style={s.pwInput} placeholder={placeholder} placeholderTextColor="#bbb"
                value={value} onChangeText={onChangeText} secureTextEntry={!show} />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShow(v => !v)}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#999" />
            </TouchableOpacity>
        </View>
    );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ visible, email, onClose }) {
    const [step, setStep] = useState(0); // 0=send, 1=verify, 2=set
    const [otp, setOtp] = useState('');
    const [verifiedToken, setVerifiedToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const reset = () => { setStep(0); setOtp(''); setVerifiedToken(''); setNewPassword(''); setConfirmPass(''); };

    const startTimer = () => {
        setResendTimer(60);
        const iv = setInterval(() => setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
    };

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            await api.post('/api/auth/send-change-otp');
            setStep(1);
            startTimer();
        } catch (e) {
            showAlert('Error', e.response?.data?.message || 'Could not send OTP.');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return showAlert('Error', 'Enter the 6-digit OTP.');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/verify-change-otp', { email, otp });
            setVerifiedToken(res.data.verifiedToken);
            setStep(2);
        } catch (e) {
            showAlert('Invalid OTP', e.response?.data?.message || 'Wrong or expired OTP.');
        } finally { setLoading(false); }
    };

    const handleChange = async () => {
        if (newPassword.length < 6) return showAlert('Error', 'Password must be at least 6 characters.');
        if (newPassword !== confirmPass) return showAlert('Error', 'Passwords do not match.');
        setLoading(true);
        try {
            await api.post('/api/auth/change-password', { otp: verifiedToken, newPassword });
            showAlert('✅ Done!', 'Your password has been changed successfully.', [
                { text: 'OK', onPress: () => { reset(); onClose(); } },
            ]);
        } catch (e) {
            showAlert('Error', e.response?.data?.message || 'Failed to change password.');
        } finally { setLoading(false); }
    };

    const STEPS = ['Send OTP', 'Verify OTP', 'New Password'];

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
            <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={s.modalCard}>
                    <View style={s.modalHeader}>
                        <Text style={s.modalTitle}>🔐 Change Password</Text>
                        <TouchableOpacity onPress={() => { reset(); onClose(); }}>
                            <Ionicons name="close" size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Step dots */}
                    <View style={s.stepBar}>
                        {STEPS.map((l, i) => (
                            <View key={i} style={s.stepItem}>
                                <View style={[s.dot, i <= step && s.dotActive]}>
                                    <Text style={[s.dotNum, i <= step && s.dotNumActive]}>{i + 1}</Text>
                                </View>
                                <Text style={[s.stepLbl, i === step && s.stepLblActive]}>{l}</Text>
                            </View>
                        ))}
                    </View>

                    {step === 0 && (
                        <>
                            <Text style={s.modalInfo}>We'll send an OTP to your registered email address to verify it's you.</Text>
                            <TouchableOpacity style={s.modalBtn} onPress={handleSendOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBtnText}>Send OTP →</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <Text style={s.modalInfo}>Enter the 6-digit OTP sent to{'\n'}<Text style={{ color: PURPLE, fontWeight: '700' }}>{email}</Text></Text>
                            <TextInput
                                style={[s.input, { fontSize: 22, letterSpacing: 8, textAlign: 'center', fontWeight: '700' }]}
                                placeholder="● ● ● ● ● ●" placeholderTextColor="#ccc"
                                value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6}
                            />
                            <TouchableOpacity style={s.modalBtn} onPress={handleVerifyOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBtnText}>Verify OTP →</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity disabled={resendTimer > 0} onPress={handleSendOtp}>
                                <Text style={[s.resendText, resendTimer > 0 && { color: '#aaa' }]}>
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Text style={s.modalInfo}>✅ Identity verified. Set your new password below.</Text>
                            <PasswordInput value={newPassword} onChangeText={setNewPassword} placeholder="New Password (min 6 chars)" />
                            <PasswordInput value={confirmPass} onChangeText={setConfirmPass} placeholder="Confirm New Password" />
                            <TouchableOpacity style={s.modalBtn} onPress={handleChange} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBtnText}>Update Password ✅</Text>}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Main Profile Screen ──────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [changePwVisible, setChangePwVisible] = useState(false);

    // Subscription tier — "Free" until you add purchase logic
    const tier = 'Free';
    const tierColor = tier === 'Premium' ? GOLD : '#6C63FF';
    const tierIcon = tier === 'Premium' ? '👑' : '🎓';

    const handleLogout = () =>
        showAlert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);

    const InfoRow = ({ icon, label, value }) => (
        <View style={s.infoRow}>
            <View style={s.infoIcon}><Ionicons name={icon} size={18} color={PURPLE} /></View>
            <View style={s.infoText}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value || '—'}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={s.header}>
                {/* Avatar */}
                <View style={s.avatarRing}>
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={s.name}>{user?.name}</Text>
                <Text style={s.emailSub}>{user?.email}</Text>

                {/* Subscription badge */}
                <View style={[s.subBadge, { backgroundColor: tierColor }]}>
                    <Text style={s.subIcon}>{tierIcon}</Text>
                    <Text style={s.subText}>{tier} Member</Text>
                </View>
            </View>

            <View style={s.body}>

                {/* ── Account Info ───────────────────────────────────────── */}
                <Text style={s.sectionTitle}>Account Details</Text>
                <View style={s.card}>
                    <InfoRow icon="person-outline" label="Full Name" value={user?.name} />
                    <View style={s.divider} />
                    <InfoRow icon="mail-outline" label="Email" value={user?.email} />
                    <View style={s.divider} />
                    <InfoRow icon="call-outline" label="Phone" value={user?.phone} />
                </View>

                {/* ── Subscription ───────────────────────────────────────── */}
                <Text style={s.sectionTitle}>Subscription</Text>
                <View style={s.subCard}>
                    <View style={s.subLeft}>
                        <Text style={s.subPlanName}>{tierIcon} {tier} Plan</Text>
                        <Text style={s.subPlanDesc}>
                            {tier === 'Premium'
                                ? 'Full access to all courses & materials'
                                : 'Access to free courses only'}
                        </Text>
                    </View>
                    {tier !== 'Premium' && (
                        <TouchableOpacity style={s.upgradeBtn}>
                            <Text style={s.upgradeBtnText}>Upgrade</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Offline Materials ─────────────────────────────────────────────── */}
                <Text style={s.sectionTitle}>Library</Text>
                <View style={s.card}>
                    <TouchableOpacity style={s.actionRow} onPress={() => navigation.navigate('OfflineMaterials')}>
                        <View style={s.actionLeft}>
                            <View style={[s.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                                <Ionicons name="document-text-outline" size={18} color="#0091EA" />
                            </View>
                            <Text style={s.actionText}>My Offline Materials</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* ── Actions ────────────────────────────────────────────── */}
                <Text style={s.sectionTitle}>Security</Text>
                <View style={s.card}>
                    <TouchableOpacity style={s.actionRow} onPress={() => setChangePwVisible(true)}>
                        <View style={s.actionLeft}>
                            <View style={[s.actionIcon, { backgroundColor: '#EEF0FF' }]}>
                                <Ionicons name="lock-closed-outline" size={18} color={PURPLE} />
                            </View>
                            <Text style={s.actionText}>Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* ── Logout ─────────────────────────────────────────────── */}
                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
                    <Text style={s.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={s.version}>Priya Ma'am v1.0.0</Text>
            </View>

            <ChangePasswordModal
                visible={changePwVisible}
                email={user?.email}
                onClose={() => setChangePwVisible(false)}
            />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },

    // Header
    header: {
        backgroundColor: PURPLE, paddingTop: 60, paddingBottom: 36,
        alignItems: 'center',
    },
    avatarRing: {
        width: 96, height: 96, borderRadius: 48,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    avatar: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 36, fontWeight: '900', color: '#fff' },
    name: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
    emailSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
    subBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 5,
        borderRadius: 20, gap: 6,
    },
    subIcon: { fontSize: 13 },
    subText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    // Body
    body: { padding: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },

    // Card
    card: {
        backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
        marginBottom: 20, elevation: 2, shadowColor: PURPLE, shadowOpacity: 0.06, shadowRadius: 8,
    },
    divider: { height: 1, backgroundColor: '#F0F0F8', marginHorizontal: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    infoIcon: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF0FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: '#1a1a2e', fontWeight: '600' },

    // Subscription card
    subCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 2, shadowColor: PURPLE, shadowOpacity: 0.06, shadowRadius: 8,
        borderLeftWidth: 4, borderLeftColor: PURPLE,
    },
    subLeft: { flex: 1 },
    subPlanName: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
    subPlanDesc: { fontSize: 12, color: '#888' },
    upgradeBtn: {
        backgroundColor: GOLD, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    upgradeBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

    // Action rows
    actionRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16,
    },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    actionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontSize: 15, color: '#1a1a2e', fontWeight: '600' },

    // Logout
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#fff', borderRadius: 14, padding: 16,
        marginBottom: 16, borderWidth: 1.5, borderColor: '#FFCDD2',
    },
    logoutText: { color: '#e74c3c', fontWeight: '700', fontSize: 15 },
    version: { color: '#ccc', fontSize: 11, textAlign: 'center', marginBottom: 32 },

    // ── Change Password Modal ─────────────────────────────────────────────────
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 36,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
    stepBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 22 },
    stepItem: { alignItems: 'center' },
    dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E8E8F5', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    dotActive: { backgroundColor: PURPLE },
    dotNum: { fontSize: 11, fontWeight: '700', color: '#aaa' },
    dotNumActive: { color: '#fff' },
    stepLbl: { fontSize: 10, color: '#aaa' },
    stepLblActive: { color: PURPLE, fontWeight: '700' },
    modalInfo: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 20 },
    input: {
        backgroundColor: '#F5F6FF', borderRadius: 12, padding: 14,
        color: '#1a1a2e', marginBottom: 14, fontSize: 15,
        borderWidth: 1.5, borderColor: '#E0DEFF',
    },
    pwRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FF',
        borderRadius: 12, borderWidth: 1.5, borderColor: '#E0DEFF', marginBottom: 14,
    },
    pwInput: { flex: 1, padding: 14, fontSize: 15, color: '#1a1a2e' },
    eyeBtn: { paddingHorizontal: 12 },
    modalBtn: {
        backgroundColor: PURPLE, borderRadius: 14, padding: 16,
        alignItems: 'center', marginBottom: 12,
    },
    modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    resendText: { color: PURPLE, fontWeight: '700', fontSize: 14, textAlign: 'center' },
});
