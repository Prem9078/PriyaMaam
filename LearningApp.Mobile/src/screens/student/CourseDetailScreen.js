import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Image, ScrollView, ActivityIndicator,
} from 'react-native';
import { enrollCourse, getCourse } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function CourseDetailScreen({ route, navigation }) {
    const { course } = route.params;
    const [loading, setLoading] = useState(false);
    const [enrolled, setEnrolled] = useState(course.isEnrolled ?? false);

    // Fetch fresh enrollment status on mount to avoid stale nav-param data
    useEffect(() => {
        getCourse(course.id)
            .then(res => setEnrolled(res.data.isEnrolled ?? false))
            .catch(() => { }); // silently ignore — fallback to nav-param value
    }, [course.id]);

    const handleEnroll = async () => {
        setLoading(true);
        try {
            await enrollCourse(course.id);
            setEnrolled(true);
            showAlert('🎉 Enrolled!', `You are now enrolled in "${course.title}"`);
        } catch (err) {
            // 409 = already enrolled — just update the UI silently
            if (err.response?.status === 409) {
                setEnrolled(true);
                return;
            }
            const msg = err.response?.data?.message || 'Enrollment failed.';
            showAlert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
            </View>

            {/* Thumbnail */}
            {course.thumbnailUrl ? (
                <Image source={{ uri: course.thumbnailUrl }} style={styles.thumbnail} />
            ) : (
                <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
                    <Text style={{ fontSize: 60 }}>📚</Text>
                </View>
            )}

            <View style={styles.body}>
                <Text style={styles.title}>{course.title}</Text>
                <Text style={styles.price}>₹{course.price.toFixed(0)}</Text>
                <Text style={styles.descLabel}>About this course</Text>
                <Text style={styles.desc}>{course.description}</Text>

                {enrolled ? (
                    <TouchableOpacity style={styles.btnGo}
                        onPress={() => navigation.navigate('Lessons', { courseId: course.id, courseTitle: course.title })}>
                        <Text style={styles.btnText}>▶ Go to Lessons</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.btnEnroll} onPress={handleEnroll} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enroll Now</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    header: { backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16 },
    backBtn: { alignSelf: 'flex-start' },
    backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    thumbnail: { width: '100%', height: 220 },
    thumbPlaceholder: { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    body: { padding: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
    price: { fontSize: 22, fontWeight: '800', color: '#6C63FF', marginBottom: 16 },
    descLabel: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 6 },
    desc: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 28 },
    btnEnroll: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center' },
    btnGo: { backgroundColor: '#27ae60', borderRadius: 14, padding: 16, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
