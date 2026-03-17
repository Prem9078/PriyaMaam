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
    const [progress, setProgress] = useState(course.progressPercentage ?? 0);
    const [lastAccessedLessonId, setLastAccessedLessonId] = useState(course.lastAccessedLessonId);

    // Fetch fresh course dat on mount
    useEffect(() => {
        getCourse(course.id)
            .then(res => {
                setEnrolled(res.data.isEnrolled ?? false);
                setProgress(res.data.progressPercentage ?? 0);
                setLastAccessedLessonId(res.data.lastAccessedLessonId);
            })
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
                {course.isFree ? (
                    <Text style={[styles.price, { color: '#00C853' }]}>Free</Text>
                ) : (
                    <Text style={styles.price}>₹{course.price.toFixed(0)}</Text>
                )}
                <Text style={styles.descLabel}>About this course</Text>
                <Text style={styles.desc}>{course.description}</Text>

                {enrolled ? (
                    <View style={styles.enrolledContainer}>
                        {/* Progress Bar */}
                        <View style={styles.progressWrap}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Course Progress</Text>
                                <Text style={styles.progressVal}>{progress}%</Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                        </View>

                        {progress === 100 && (
                            <TouchableOpacity style={styles.btnCer} onPress={() => navigation.navigate('Certificates')}>
                                <Text style={styles.btnCerText}>🏆 View Certificate</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.btnGo}
                            onPress={() => navigation.navigate('Lessons', { courseId: course.id, courseTitle: course.title })}>
                            <Text style={styles.btnText}>▶ Go to Lessons</Text>
                        </TouchableOpacity>

                        {/* If they have a last accessed lesson, show Resume button */}
                        {lastAccessedLessonId ? (
                             <TouchableOpacity style={styles.btnResume}
                                 onPress={() => navigation.navigate('Lesson', { 
                                     lessonId: lastAccessedLessonId, 
                                     courseTitle: course.title 
                                 })}>
                                 <Text style={styles.btnTextResume}>↺ Resume Video</Text>
                             </TouchableOpacity>
                        ) : null}
                    </View>
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
    enrolledContainer: { gap: 12 },
    btnGo: { backgroundColor: '#27ae60', borderRadius: 14, padding: 16, alignItems: 'center' },
    btnCer: { backgroundColor: '#FFD700', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 2 },
    btnResume: { backgroundColor: '#EEF0FF', borderRadius: 14, padding: 16, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnCerText: { color: '#8B6508', fontWeight: '800', fontSize: 16 },
    btnTextResume: { color: '#6C63FF', fontWeight: '800', fontSize: 16 },
    progressWrap: { marginBottom: 16, backgroundColor: '#fff', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#eee' },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 13, fontWeight: '700', color: '#555' },
    progressVal: { fontSize: 13, fontWeight: '800', color: '#6C63FF' },
    progressTrack: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#6C63FF', borderRadius: 4 },
});
