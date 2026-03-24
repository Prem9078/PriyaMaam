import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getStudentEnrollments, enrollStudent, revokeStudentEnrollment, getCourses, getStudentQuizPerformance } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const PURPLE = '#6C63FF';

function ScoreBadge({ pct }) {
    const color = pct >= 70 ? '#2E7D32' : pct >= 40 ? '#F57C00' : '#C62828';
    const bg = pct >= 70 ? '#E8F5E9' : pct >= 40 ? '#FFF3E0' : '#FFEBEE';
    return (
        <View style={[pb.wrap, { backgroundColor: bg }]}>
            <Text style={[pb.text, { color }]}>{pct}%</Text>
        </View>
    );
}
const pb = StyleSheet.create({
    wrap: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    text: { fontWeight: '800', fontSize: 12 },
});

export default function StudentDetailScreen({ route, navigation }) {
    const { student } = route.params;
    const [activeTab, setActiveTab] = useState('enrollments'); // 'enrollments' | 'performance'

    // Enrollments state
    const [enrollments, setEnrollments] = useState([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Performance state
    const [perfData, setPerfData] = useState(null);
    const [loadingPerf, setLoadingPerf] = useState(false);
    const [perfLoaded, setPerfLoaded] = useState(false);

    const fetchEnrollments = useCallback(() => {
        setLoadingEnrollments(true);
        getStudentEnrollments(student.id)
            .then(res => setEnrollments(res.data))
            .finally(() => setLoadingEnrollments(false));
    }, [student.id]);

    useFocusEffect(fetchEnrollments);

    const loadPerformance = async () => {
        if (perfLoaded) return;
        setLoadingPerf(true);
        try {
            const res = await getStudentQuizPerformance(student.id);
            setPerfData(res.data);
            setPerfLoaded(true);
        } catch {
            showAlert('Error', 'Could not load performance data.');
        } finally {
            setLoadingPerf(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'performance') loadPerformance();
    };

    const handleRevoke = (courseId, courseTitle) => {
        showAlert('Revoke Access', `Are you sure you want to remove "${courseTitle}" from ${student.name}'s account?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Revoke', style: 'destructive', onPress: async () => {
                    try {
                        await revokeStudentEnrollment(student.id, courseId);
                        fetchEnrollments();
                        showAlert('Success', 'Course access revoked.');
                    } catch (e) {
                        showAlert('Error', e.response?.data?.message || 'Could not revoke access.');
                    }
                }
            }
        ]);
    };

    const handleOpenEnrollModal = async () => {
        setModalVisible(true);
        setLoadingCourses(true);
        try {
            const res = await getCourses();
            const available = res.data.filter(c => !enrollments.some(e => e.courseId === c.id));
            setAllCourses(available);
        } catch {
            showAlert('Error', 'Failed to load courses.');
            setModalVisible(false);
        } finally {
            setLoadingCourses(false);
        }
    };

    const handleAssignCourse = async (courseId, courseTitle) => {
        showAlert('Assign Course', `Manually enroll ${student.name} in "${courseTitle}" for free?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Enroll', onPress: async () => {
                    try {
                        setModalVisible(false);
                        await enrollStudent(student.id, courseId);
                        fetchEnrollments();
                        showAlert('Success', `${student.name} is now enrolled in "${courseTitle}".`);
                    } catch (e) {
                        setModalVisible(false);
                        showAlert('Error', e.response?.data?.message || 'Failed to enroll student.');
                    }
                }
            }
        ]);
    };

    const renderEnrollment = ({ item }) => (
        <View style={s.card}>
            <View style={s.cardContent}>
                <Text style={s.courseTitle}>{item.courseTitle}</Text>
                <Text style={s.enrollDate}>Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRevoke(item.courseId, item.courseTitle)}>
                <Text style={s.revokeBtn}>🗑</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAttempt = ({ item }) => (
        <View style={s.attemptCard}>
            <View style={s.attemptTop}>
                <Text style={s.attemptQuiz} numberOfLines={1}>{item.quizTitle}</Text>
                <ScoreBadge pct={item.percentage} />
            </View>
            <Text style={s.attemptCourse} numberOfLines={1}>{item.courseTitle} › {item.lessonTitle}</Text>
            <View style={s.attemptBottom}>
                <Text style={s.attemptScore}>{item.score}/{item.totalQuestions} correct</Text>
                <Text style={s.attemptDate}>{new Date(item.attemptedAt).toLocaleDateString()}</Text>
            </View>
        </View>
    );

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>{student.name}</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={s.infoSection}>
                <Text style={s.infoName}>{student.name}</Text>
                <Text style={s.infoEmail}>{student.email}</Text>
                <Text style={s.infoDate}>Joined: {new Date(student.createdAt).toLocaleDateString()}</Text>
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
                <TouchableOpacity
                    style={[s.tab, activeTab === 'enrollments' && s.tabActive]}
                    onPress={() => handleTabChange('enrollments')}
                >
                    <Text style={[s.tabText, activeTab === 'enrollments' && s.tabTextActive]}>📚 Courses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.tab, activeTab === 'performance' && s.tabActive]}
                    onPress={() => handleTabChange('performance')}
                >
                    <Text style={[s.tabText, activeTab === 'performance' && s.tabTextActive]}>📊 Performance</Text>
                </TouchableOpacity>
            </View>

            {/* Enrollments Tab */}
            {activeTab === 'enrollments' && (
                <>
                    <View style={s.listHeaderRow}>
                        <Text style={s.listTitle}>Enrolled Courses ({enrollments.length})</Text>
                        <TouchableOpacity onPress={handleOpenEnrollModal}>
                            <Text style={s.assignBtn}>+ Assign Course</Text>
                        </TouchableOpacity>
                    </View>
                    {loadingEnrollments ? (
                        <View style={s.center}><ActivityIndicator size="large" color={PURPLE} /></View>
                    ) : (
                        <FlatList
                            data={enrollments}
                            keyExtractor={i => i.courseId}
                            renderItem={renderEnrollment}
                            contentContainerStyle={{ padding: 16 }}
                            ListEmptyComponent={<Text style={s.empty}>This student is not enrolled in any courses.</Text>}
                        />
                    )}
                </>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <>
                    {loadingPerf ? (
                        <View style={s.center}><ActivityIndicator size="large" color={PURPLE} /></View>
                    ) : perfData ? (
                        <FlatList
                            data={perfData.attempts}
                            keyExtractor={i => i.id}
                            renderItem={renderAttempt}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                            ListHeaderComponent={
                                <View style={s.statsRow}>
                                    <View style={s.statBox}>
                                        <Text style={[s.statNum, { color: PURPLE }]}>{perfData.totalAttempts}</Text>
                                        <Text style={s.statLabel}>Quizzes Taken</Text>
                                    </View>
                                    <View style={s.statBox}>
                                        <Text style={[s.statNum, {
                                            color: perfData.averagePercentage >= 70 ? '#27ae60'
                                                : perfData.averagePercentage >= 40 ? '#e67e22' : '#e74c3c'
                                        }]}>{perfData.averagePercentage}%</Text>
                                        <Text style={s.statLabel}>Avg Score</Text>
                                    </View>
                                    <View style={s.statBox}>
                                        <Text style={[s.statNum, { color: '#f39c12' }]}>{perfData.bestPercentage}%</Text>
                                        <Text style={s.statLabel}>Best Score</Text>
                                    </View>
                                </View>
                            }
                            ListEmptyComponent={
                                <View style={s.emptyWrap}>
                                    <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
                                    <Text style={s.empty}>No quiz attempts yet.</Text>
                                </View>
                            }
                        />
                    ) : null}
                </>
            )}

            {/* Assign Course Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Assign Course to Student</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={s.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        {loadingCourses ? (
                            <ActivityIndicator size="large" color={PURPLE} style={{ margin: 20 }} />
                        ) : (
                            <ScrollView style={{ maxHeight: 400 }}>
                                {allCourses.length === 0 ? (
                                    <Text style={s.empty}>No new courses available to assign.</Text>
                                ) : (
                                    allCourses.map(c => (
                                        <TouchableOpacity key={c.id} style={s.courseOption} onPress={() => handleAssignCourse(c.id, c.title)}>
                                            <Text style={s.courseOptionTitle}>{c.title}</Text>
                                            <Text style={s.courseOptionPrice}>{c.isFree ? 'FREE' : 'Paid (Manual Override)'}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: PURPLE, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },

    infoSection: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    infoName: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    infoEmail: { fontSize: 14, color: '#666', marginTop: 4 },
    infoDate: { fontSize: 12, color: '#999', marginTop: 8 },

    tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: PURPLE },
    tabText: { fontSize: 14, fontWeight: '600', color: '#999' },
    tabTextActive: { color: PURPLE, fontWeight: '800' },

    listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
    listTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
    assignBtn: { color: PURPLE, fontWeight: '800', fontSize: 14 },

    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center',
        elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3
    },
    cardContent: { flex: 1 },
    courseTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    enrollDate: { fontSize: 12, color: '#888', marginTop: 4 },
    revokeBtn: { fontSize: 20, color: '#e74c3c', padding: 8 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statBox: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4
    },
    statNum: { fontSize: 22, fontWeight: '900' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },

    attemptCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
        elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3
    },
    attemptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    attemptQuiz: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginRight: 8 },
    attemptCourse: { fontSize: 11, color: '#888', marginBottom: 6 },
    attemptBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    attemptScore: { fontSize: 13, color: PURPLE, fontWeight: '700' },
    attemptDate: { fontSize: 12, color: '#aaa' },

    empty: { textAlign: 'center', marginTop: 20, color: '#999' },
    emptyWrap: { alignItems: 'center', marginTop: 50 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
    modalClose: { fontSize: 24, color: '#999', paddingHorizontal: 8 },
    courseOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    courseOptionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    courseOptionPrice: { fontSize: 12, color: PURPLE, marginTop: 4, fontWeight: '600' },
});
