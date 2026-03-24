import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, FlatList,
    StyleSheet, ActivityIndicator, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCourses, getLessons, getQuizzes } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const PURPLE = '#6C63FF';

export default function AdminQuizAnalyticsScreen({ navigation }) {
    const [courses, setCourses] = useState([]);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [expandedLessons, setExpandedLessons] = useState({});
    const [lessons, setLessons] = useState({});
    const [quizzes, setQuizzes] = useState({});
    const [loadingMap, setLoadingMap] = useState({});
    const [loading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
        getCourses()
            .then(r => setCourses(r.data))
            .catch(() => showAlert('Error', 'Could not load courses.'))
            .finally(() => setLoading(false));
    }, []));

    const toggleCourse = async (courseId) => {
        const nowExpanded = !expandedCourses[courseId];
        setExpandedCourses(prev => ({ ...prev, [courseId]: nowExpanded }));

        if (nowExpanded && !lessons[courseId]) {
            setLoadingMap(prev => ({ ...prev, [courseId]: true }));
            try {
                const res = await getLessons(courseId);
                setLessons(prev => ({ ...prev, [courseId]: res.data }));
            } catch {
                showAlert('Error', 'Could not load lessons.');
            } finally {
                setLoadingMap(prev => ({ ...prev, [courseId]: false }));
            }
        }
    };

    const toggleLesson = async (lessonId) => {
        const nowExpanded = !expandedLessons[lessonId];
        setExpandedLessons(prev => ({ ...prev, [lessonId]: nowExpanded }));

        if (nowExpanded && !quizzes[lessonId]) {
            setLoadingMap(prev => ({ ...prev, [lessonId]: true }));
            try {
                const res = await getQuizzes(lessonId);
                setQuizzes(prev => ({ ...prev, [lessonId]: res.data }));
            } catch {
                showAlert('Error', 'Could not load quizzes.');
            } finally {
                setLoadingMap(prev => ({ ...prev, [lessonId]: false }));
            }
        }
    };

    const renderCourse = ({ item: course }) => {
        const isExpanded = expandedCourses[course.id];
        const courseLessons = lessons[course.id] || [];

        return (
            <View style={s.courseCard}>
                <TouchableOpacity style={s.courseHeader} onPress={() => toggleCourse(course.id)}>
                    <Text style={s.courseEmoji}>📚</Text>
                    <Text style={s.courseTitle} numberOfLines={2}>{course.title}</Text>
                    {loadingMap[course.id]
                        ? <ActivityIndicator size="small" color={PURPLE} />
                        : <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={PURPLE} />
                    }
                </TouchableOpacity>

                {isExpanded && (
                    <View style={s.lessonsWrap}>
                        {courseLessons.length === 0 && !loadingMap[course.id] && (
                            <Text style={s.empty}>No lessons found.</Text>
                        )}
                        {courseLessons.map(lesson => {
                            const lessonExpanded = expandedLessons[lesson.id];
                            const lessonQuizzes = quizzes[lesson.id] || [];
                            return (
                                <View key={lesson.id}>
                                    <TouchableOpacity style={s.lessonRow} onPress={() => toggleLesson(lesson.id)}>
                                        <Ionicons name="book-outline" size={14} color="#888" />
                                        <Text style={s.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                                        {loadingMap[lesson.id]
                                            ? <ActivityIndicator size="small" color={PURPLE} />
                                            : <Ionicons name={lessonExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#bbb" />
                                        }
                                    </TouchableOpacity>

                                    {lessonExpanded && (
                                        <View style={s.quizzesWrap}>
                                            {lessonQuizzes.length === 0 && !loadingMap[lesson.id] && (
                                                <Text style={s.noQuiz}>No quizzes for this lesson.</Text>
                                            )}
                                            {lessonQuizzes.map(quiz => (
                                                <TouchableOpacity
                                                    key={quiz.id}
                                                    style={s.quizRow}
                                                    onPress={() => navigation.navigate('Leaderboard', { quizId: quiz.id, quizTitle: quiz.title })}
                                                >
                                                    <Ionicons name="trophy-outline" size={15} color={PURPLE} />
                                                    <Text style={s.quizTitle} numberOfLines={1}>{quiz.title}</Text>
                                                    <Text style={s.viewBoard}>View ›</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.headerSub}>Admin</Text>
                    <Text style={s.headerTitle}>Quiz Analytics</Text>
                </View>
                <Ionicons name="bar-chart" size={24} color="rgba(255,255,255,0.8)" />
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color={PURPLE} /></View>
            ) : (
                <FlatList
                    data={courses}
                    keyExtractor={c => c.id}
                    renderItem={renderCourse}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ListHeaderComponent={
                        <Text style={s.hint}>Tap a course → lesson → quiz to view its leaderboard.</Text>
                    }
                    ListEmptyComponent={<Text style={s.empty}>No courses found.</Text>}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: PURPLE, paddingTop: 52, paddingBottom: 18,
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12
    },
    backBtn: { padding: 4 },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    hint: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16 },
    empty: { textAlign: 'center', color: '#aaa', marginTop: 10, padding: 8 },

    courseCard: {
        backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, overflow: 'hidden'
    },
    courseHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
    courseEmoji: { fontSize: 20 },
    courseTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1a1a2e' },

    lessonsWrap: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingHorizontal: 16, paddingBottom: 8 },
    lessonRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5'
    },
    lessonTitle: { flex: 1, fontSize: 13, color: '#555', fontWeight: '600' },

    quizzesWrap: { paddingLeft: 22, paddingBottom: 4 },
    quizRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#F0EFFF', borderRadius: 8, padding: 10, marginVertical: 4
    },
    quizTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
    viewBoard: { fontSize: 12, color: PURPLE, fontWeight: '700' },
    noQuiz: { fontSize: 12, color: '#bbb', paddingVertical: 6 },
});
