import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { getMaterials, getQuizzes, markLessonComplete, getLessonComments, postLessonComment, getLessonById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LessonScreen({ route, navigation }) {
    // Support two navigation patterns:
    // 1. Normal: { lesson, courseId } — navigated from LessonsScreen
    // 2. Resume: { lessonId, courseTitle } — navigated from HomeScreen/CourseDetailScreen
    const { lesson: lessonParam, lessonId: lessonIdParam, courseId, courseTitle } = route.params;

    const [lesson, setLesson] = useState(lessonParam ?? null);
    const [loadingLesson, setLoadingLesson] = useState(!lessonParam && !!lessonIdParam);

    const [materials, setMaterials] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [comments, setComments] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);

    const [newComment, setNewComment] = useState('');
    const [posting, setPosting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // ─── Video Timestamp Resume ───────────────────────────────────────────────
    const playerRef = useRef(null);
    const [startSeconds, setStartSeconds] = useState(0);
    // Gate: don't render the player until we've checked AsyncStorage
    const [timestampLoaded, setTimestampLoaded] = useState(false);

    const storageKey = lesson?.id ? `video_ts_${lesson.id}` : null;

    // Save current playback position to AsyncStorage
    const saveCurrentTime = useCallback(async () => {
        if (!playerRef.current || !storageKey) return;
        try {
            const time = await playerRef.current.getCurrentTime();
            if (time > 3) {
                await AsyncStorage.setItem(storageKey, Math.floor(time).toString());
            }
        } catch (_) {}
    }, [storageKey]);

    // loadComments must be a useCallback because it's called from a useEffect below
    const loadComments = useCallback((lessonId) => {
        setLoadingComments(true);
        getLessonComments(lessonId)
            .then(res => setComments(res.data))
            .catch(() => {})
            .finally(() => setLoadingComments(false));
    }, []);

    // If navigated via Resume Learning (only lessonId provided), fetch full lesson object
    useEffect(() => {
        if (!lessonParam && lessonIdParam) {
            getLessonById(lessonIdParam)
                .then(res => setLesson(res.data))
                .catch(() => navigation.goBack())
                .finally(() => setLoadingLesson(false));
        }
    }, [lessonIdParam]);

    // When lesson is ready, load timestamp + data
    useEffect(() => {
        if (!lesson) return;

        // Load saved timestamp — only mount the player after this resolves
        AsyncStorage.getItem(`video_ts_${lesson.id}`).then(val => {
            if (val) setStartSeconds(parseInt(val, 10));
            setTimestampLoaded(true); // now it's safe to render the player
        });

        // Track progress & "Resume Learning" silently
        markLessonComplete(lesson.id).catch(() => {});

        getMaterials(lesson.id)
            .then(res => setMaterials(res.data))
            .catch(() => { })
            .finally(() => setLoadingMaterials(false));

        getQuizzes(lesson.id)
            .then(res => setQuizzes(res.data))
            .catch(() => { })
            .finally(() => setLoadingQuizzes(false));

        loadComments(lesson.id);
    }, [lesson?.id]);

    // Auto-save timestamp every 5 seconds while the screen is mounted
    useEffect(() => {
        if (!lesson) return;
        const interval = setInterval(saveCurrentTime, 5000);
        return () => {
            clearInterval(interval);
            saveCurrentTime(); // final save on unmount
        };
    }, [saveCurrentTime, lesson]);

    if (loadingLesson || !lesson) return (
        <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#6C63FF" />
        </View>
    );

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setPosting(true);
        try {
            const res = await postLessonComment(lesson.id, newComment);
            setComments([res.data, ...comments]); // add to top
            setNewComment('');
        } catch (e) {
            console.log('Error posting comment:', e);
        } finally {
            setPosting(false);
        }
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>{lesson.title}</Text>
            </View>

            <ScrollView>
                {/* YouTube Video — only render after timestamp is loaded from storage */}
                {lesson.youTubeVideoId ? (
                    timestampLoaded ? (
                        <YoutubeIframe
                            ref={playerRef}
                            videoId={lesson.youTubeVideoId}
                            height={220}
                            width={Dimensions.get('window').width}
                            play={false}
                            initialPlayerParams={{ start: startSeconds }}
                            onChangeState={(state) => {
                                if (state === 'paused') saveCurrentTime();
                            }}
                            webViewProps={{ androidLayerType: 'hardware' }}
                        />
                    ) : (
                        <View style={[s.noVideo, { height: 220 }]}>
                            <ActivityIndicator color="#6C63FF" />
                        </View>
                    )
                ) : (
                    <View style={s.noVideo}>
                        <Text style={s.noVideoText}>No video for this lesson</Text>
                    </View>
                )}

                <View style={s.body}>
                    <Text style={s.title}>{lesson.title}</Text>

                    {/* ─── Study Materials ─────────────────────── */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>📎 Study Materials</Text>
                        {loadingMaterials ? (
                            <ActivityIndicator color="#6C63FF" style={{ marginVertical: 8 }} />
                        ) : materials.length === 0 ? (
                            <Text style={s.emptyText}>No materials available for this lesson.</Text>
                        ) : (
                            materials.map(m => (
                                <TouchableOpacity
                                    key={m.id}
                                    style={s.materialBtn}
                                    onPress={() => navigation.navigate('PdfViewer', {
                                        secureUrl: m.secureUrl,
                                        fileName: m.fileName
                                    })}
                                >
                                    <Text style={s.materialIcon}>📄</Text>
                                    <Text style={s.materialName} numberOfLines={1}>{m.fileName}</Text>
                                    <Text style={s.materialArrow}>›</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* ─── Mock Tests ──────────────────────────── */}
                    <View style={[s.section, { marginBottom: 32 }]}>
                        <Text style={s.sectionTitle}>🧠 Mock Tests</Text>
                        {loadingQuizzes ? (
                            <ActivityIndicator color="#6C63FF" style={{ marginVertical: 8 }} />
                        ) : quizzes.length === 0 ? (
                            <Text style={s.emptyText}>No quizzes available for this lesson.</Text>
                        ) : (
                            quizzes.map(q => (
                                <TouchableOpacity
                                    key={q.id}
                                    style={s.quizBtn}
                                    onPress={() => navigation.navigate('Quiz', {
                                        quizId: q.id,
                                        quizTitle: q.title,
                                        lessonTitle: lesson.title
                                    })}
                                >
                                    <View style={s.quizLeft}>
                                        <Text style={s.quizTitle}>{q.title}</Text>
                                        <Text style={s.quizCount}>{q.questions?.length || 0} Questions</Text>
                                    </View>
                                    <Text style={s.quizArrow}>▶</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                    {/* ─── Mark Complete Toggle ──────────────────────── */}
                    <TouchableOpacity 
                        style={[s.completeBtn, isCompleted && s.completeBtnActive]}
                        onPress={() => setIsCompleted(!isCompleted)}
                    >
                        <Text style={s.completeText}>{isCompleted ? '✅ Lesson Completed' : 'Mark as Complete'}</Text>
                    </TouchableOpacity>

                    {/* ─── Q&A Discussion Forum ────────────────────── */}
                    <View style={[s.section, { marginBottom: 32 }]}>
                        <Text style={s.sectionTitle}>💬 Q&A Discussion</Text>
                        
                        <View style={s.commentInputRow}>
                            <TextInput 
                                style={s.commentInput} 
                                placeholder="Ask a question..."
                                placeholderTextColor="#999"
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />
                            <TouchableOpacity style={s.postBtn} onPress={handlePostComment} disabled={posting}>
                                {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.postBtnText}>Post</Text>}
                            </TouchableOpacity>
                        </View>

                        {loadingComments ? (
                            <ActivityIndicator color="#6C63FF" style={{ marginVertical: 12 }} />
                        ) : comments.length === 0 ? (
                            <Text style={s.emptyText}>Be the first to ask a question!</Text>
                        ) : (
                            comments.map(c => (
                                <View key={c.id} style={s.commentItem}>
                                    <View style={s.avatar}><Text style={s.avatarText}>{c.userName?.charAt(0) || 'S'}</Text></View>
                                    <View style={s.commentBody}>
                                        <View style={s.commentHeader}>
                                            <Text style={s.commentAuthor}>{c.userName || 'Student'}</Text>
                                            <Text style={s.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                        <Text style={s.commentText}>{c.text}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
    noVideo: { height: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    noVideoText: { color: '#fff', fontSize: 13 },
    body: { padding: 16 },
    title: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 20 },
    section: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 12 },
    emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
    materialBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EEFF',
        borderRadius: 12, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#DDD9FF'
    },
    materialIcon: { fontSize: 20, marginRight: 10 },
    materialName: { flex: 1, color: '#3D35CC', fontSize: 13, fontWeight: '600' },
    materialArrow: { color: '#6C63FF', fontSize: 20, fontWeight: '600' },
    quizBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, marginBottom: 10
    },
    quizLeft: { flex: 1 },
    quizTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 2 },
    quizCount: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
    quizArrow: { color: '#fff', fontSize: 18 },
    completeBtn: { 
        backgroundColor: '#fff', borderWidth: 2, borderColor: '#6C63FF', 
        borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16 
    },
    completeBtnActive: { backgroundColor: '#6C63FF' },
    completeText: { color: '#1a1a2e', fontWeight: '800', fontSize: 14 },

    // Q&A
    commentInputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    commentInput: { 
        flex: 1, backgroundColor: '#F0EEFF', borderRadius: 12, padding: 12, 
        minHeight: 44, color: '#1a1a2e', fontSize: 14 
    },
    postBtn: { 
        backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 16, 
        justifyContent: 'center', alignItems: 'center' 
    },
    postBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    commentItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    avatar: { 
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#DDD9FF', 
        justifyContent: 'center', alignItems: 'center' 
    },
    avatarText: { color: '#3D35CC', fontWeight: '800', fontSize: 14 },
    commentBody: { flex: 1, backgroundColor: '#F9F9FB', padding: 12, borderRadius: 12 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    commentAuthor: { fontSize: 13, fontWeight: '800', color: '#1a1a2e' },
    commentDate: { fontSize: 11, color: '#999' },
    commentText: { fontSize: 13, color: '#555', lineHeight: 20 },
});
