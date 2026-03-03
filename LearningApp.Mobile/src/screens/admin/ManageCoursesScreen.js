import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Image,
} from 'react-native';
import { getCourses, deleteCourse, toggleCourseFree } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function ManageCoursesScreen({ navigation }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = () => {
        getCourses().then(r => setCourses(r.data)).finally(() => setLoading(false));
    };

    useEffect(() => {
        const unsub = navigation.addListener('focus', fetchCourses);
        return unsub;
    }, [navigation]);

    const handleDelete = (id, title) => {
        showAlert('Delete Course', `Delete "${title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteCourse(id);
                        setCourses(prev => prev.filter(c => c.id !== id));
                    } catch (e) {
                        showAlert('Error', 'Could not delete course.');
                    }
                }
            },
        ]);
    };

    const handleToggle = async (id) => {
        try {
            const res = await toggleCourseFree(id);
            setCourses(prev => prev.map(c => c.id === id ? { ...c, isFree: res.data.isFree } : c));
        } catch {
            showAlert('Error', 'Could not update course.');
        }
    };

    const renderCourse = ({ item }) => (
        <View style={s.card}>
            {item.thumbnailUrl
                ? <Image source={{ uri: item.thumbnailUrl }} style={s.thumb} />
                : <View style={[s.thumb, s.thumbPh]}><Text style={{ fontSize: 32 }}>📚</Text></View>
            }

            {/* Free/Paid badge */}
            <View style={[s.badge, item.isFree ? s.badgeFree : s.badgePaid]}>
                <Text style={s.badgeText}>{item.isFree ? '🎁 FREE' : '💎 PAID'}</Text>
            </View>

            <View style={s.cardBody}>
                <Text style={s.title} numberOfLines={2}>{item.title}</Text>
                {!item.isFree && <Text style={s.price}>₹{item.price.toFixed(0)}</Text>}

                {/* Row 1: Toggle + Lessons */}
                <View style={s.actions}>
                    <TouchableOpacity
                        style={[s.toggleBtn, item.isFree ? s.toggleBtnPaid : s.toggleBtnFree]}
                        onPress={() => handleToggle(item.id)}
                    >
                        <Text style={s.toggleBtnText}>
                            {item.isFree ? '💎 Mark as Paid' : '🎁 Mark as Free'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Row 2: Edit + Lessons + Delete */}
                <View style={s.actions}>
                    <TouchableOpacity style={s.editBtn}
                        onPress={() => navigation.navigate('EditCourse', { course: item })}>
                        <Text style={s.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.lessonsBtn}
                        onPress={() => navigation.navigate('ManageLessons', { courseId: item.id, courseTitle: item.title })}>
                        <Text style={s.lessonsBtnText}>📝 Lessons</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
                        <Text style={s.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle}>Manage Courses</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddCourse')}>
                    <Text style={s.addBtn}>+ Add</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={courses}
                keyExtractor={i => i.id}
                renderItem={renderCourse}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={s.empty}>No courses yet.</Text>}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    addBtn: { color: '#fff', fontSize: 15, fontWeight: '700' },
    card: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden',
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6
    },
    thumb: { width: '100%', height: 140 },
    thumbPh: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
    badge: {
        position: 'absolute', top: 12, left: 12,
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    },
    badgeFree: { backgroundColor: '#00C853' },
    badgePaid: { backgroundColor: '#FF6B35' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    cardBody: { padding: 14 },
    title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
    price: { fontSize: 13, fontWeight: '700', color: '#FF6B35', marginBottom: 10 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    toggleBtn: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
    toggleBtnFree: { backgroundColor: '#E8F5E9' },
    toggleBtnPaid: { backgroundColor: '#FFF3E0' },
    toggleBtnText: { fontWeight: '700', fontSize: 13, color: '#1a1a2e' },
    editBtn: { flex: 1, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10, alignItems: 'center' },
    editBtnText: { color: '#F59E0B', fontWeight: '700', fontSize: 13 },
    lessonsBtn: { flex: 1, backgroundColor: '#EEF0FF', borderRadius: 10, padding: 10, alignItems: 'center' },
    lessonsBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 13 },
    deleteBtn: { backgroundColor: '#FFEEEE', borderRadius: 10, padding: 10, alignItems: 'center', paddingHorizontal: 16 },
    deleteBtnText: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
    empty: { textAlign: 'center', marginTop: 60, color: '#999' },
});
