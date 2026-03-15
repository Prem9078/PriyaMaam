import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAdminStats } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../components/AppAlert';

export default function AdminDashboard({ navigation }) {
    const { logout, user } = useAuth();
    const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, totalEnrollments: 0, estimatedRevenue: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
        getAdminStats().then(r => setStats(r.data)).finally(() => setLoading(false));
    }, []));

    const handleLogout = () =>
        showAlert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

    return (
        <ScrollView style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Admin Panel 🔑</Text>
                    <Text style={s.sub}>{user?.name}</Text>
                </View>
                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                    <Text style={s.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
                <View style={s.stat}><Text style={[s.statNum, { color: '#6C63FF' }]}>{stats.totalStudents}</Text><Text style={s.statLabel}>Students</Text></View>
                <View style={s.stat}><Text style={[s.statNum, { color: '#27ae60' }]}>{stats.totalEnrollments}</Text><Text style={s.statLabel}>Enrollments</Text></View>
            </View>
            <View style={s.statsRow}>
                <View style={s.stat}><Text style={[s.statNum, { color: '#e67e22' }]}>{stats.totalCourses}</Text><Text style={s.statLabel}>Courses</Text></View>
                <View style={s.stat}><Text style={[s.statNum, { color: '#f39c12' }]}>{stats.estimatedRevenue > 0 ? `₹${stats.estimatedRevenue}` : '0'}</Text><Text style={s.statLabel}>Revenue</Text></View>
            </View>

            {/* Actions */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Content Management</Text>
                <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('ManageCourses')}>
                    <Text style={s.actionIcon}>📚</Text>
                    <View><Text style={s.actionTitle}>Manage Courses</Text><Text style={s.actionSub}>Add, edit, delete courses & lessons</Text></View>
                    <Text style={s.actionArrow}>›</Text>
                </TouchableOpacity>
                <Text style={[s.sectionTitle, { marginTop: 10 }]}>Users & Engagement</Text>
                <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('ManageStudents')}>
                    <Text style={s.actionIcon}>👥</Text>
                    <View><Text style={s.actionTitle}>Manage Students</Text><Text style={s.actionSub}>View students, manually assign courses</Text></View>
                    <Text style={s.actionArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('SendAnnouncement')}>
                    <Text style={s.actionIcon}>📢</Text>
                    <View><Text style={s.actionTitle}>Global Announcement</Text><Text style={s.actionSub}>Send a push notification to all users</Text></View>
                    <Text style={s.actionArrow}>›</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    greeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
    sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    logoutText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 12 },
    stat: {
        flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4
    },
    statNum: { fontSize: 24, fontWeight: '800' },
    statLabel: { fontSize: 12, color: '#888', marginTop: 2, fontWeight: '600' },
    section: { paddingHorizontal: 16, marginTop: 24, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
    actionCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', gap: 14,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4
    },
    actionIcon: { fontSize: 28 },
    actionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    actionSub: { fontSize: 12, color: '#888', marginTop: 2 },
    actionArrow: { marginLeft: 'auto', fontSize: 22, color: '#6C63FF', fontWeight: '700' },
});
