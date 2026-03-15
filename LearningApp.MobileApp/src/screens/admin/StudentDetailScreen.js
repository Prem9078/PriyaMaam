import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStudentEnrollments, enrollStudent, revokeStudentEnrollment, getCourses } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function StudentDetailScreen({ route, navigation }) {
    const { student } = route.params;
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    const fetchInfo = useCallback(() => {
        setLoading(true);
        getStudentEnrollments(student.id)
            .then(res => setEnrollments(res.data))
            .finally(() => setLoading(false));
    }, [student.id]);

    useFocusEffect(fetchInfo);

    const handleRevoke = (courseId, courseTitle) => {
        showAlert('Revoke Access', `Are you sure you want to remove "${courseTitle}" from ${student.name}'s account?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Revoke', style: 'destructive', onPress: async () => {
                    try {
                        await revokeStudentEnrollment(student.id, courseId);
                        fetchInfo();
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
            // filter out courses the student is already enrolled in
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
                        fetchInfo();
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

            <View style={s.listHeaderRow}>
                <Text style={s.listTitle}>Enrolled Courses ({enrollments.length})</Text>
                <TouchableOpacity onPress={handleOpenEnrollModal}>
                    <Text style={s.assignBtn}>+ Assign Course</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
            ) : (
                <FlatList
                    data={enrollments}
                    keyExtractor={i => i.courseId}
                    renderItem={renderEnrollment}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={<Text style={s.empty}>This student is not enrolled in any courses.</Text>}
                />
            )}

            {/* Modal for adding course manually */}
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
                            <ActivityIndicator size="large" color="#6C63FF" style={{ margin: 20 }} />
                        ) : (
                            <ScrollView style={{ maxHeight: 400 }}>
                                {allCourses.length === 0 ? (
                                    <Text style={s.empty}>No new courses available to assign.</Text>
                                ) : (
                                    allCourses.map(c => (
                                        <TouchableOpacity key={c.id} style={s.courseOption} onPress={() => handleAssignCourse(c.id, c.title)}>
                                            <Text style={s.courseOptionTitle}>{c.title}</Text>
                                            <Text style={s.courseOptionPrice}>{c.isFree ? 'FREE' : `Paid (Manual Override)`}</Text>
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
        backgroundColor: '#6C63FF', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
    infoSection: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    infoName: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    infoEmail: { fontSize: 14, color: '#666', marginTop: 4 },
    infoDate: { fontSize: 12, color: '#999', marginTop: 8 },
    listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
    listTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
    assignBtn: { color: '#6C63FF', fontWeight: '800', fontSize: 14 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center',
        elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3
    },
    cardContent: { flex: 1 },
    courseTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    enrollDate: { fontSize: 12, color: '#888', marginTop: 4 },
    revokeBtn: { fontSize: 20, color: '#e74c3c', padding: 8 },
    empty: { textAlign: 'center', marginTop: 40, color: '#999' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
    modalClose: { fontSize: 24, color: '#999', paddingHorizontal: 8 },
    courseOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    courseOptionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    courseOptionPrice: { fontSize: 12, color: '#6C63FF', marginTop: 4, fontWeight: '600' }
});
