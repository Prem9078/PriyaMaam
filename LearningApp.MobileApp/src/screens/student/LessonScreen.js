import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { getMaterials, getQuizzes } from '../../services/api';

export default function LessonScreen({ route, navigation }) {
    const { lesson, courseId } = route.params;

    const [materials, setMaterials] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);

    useEffect(() => {
        getMaterials(lesson.id)
            .then(res => setMaterials(res.data))
            .catch(() => { })
            .finally(() => setLoadingMaterials(false));

        getQuizzes(lesson.id)
            .then(res => setQuizzes(res.data))
            .catch(() => { })
            .finally(() => setLoadingQuizzes(false));
    }, [lesson.id]);

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
                {/* YouTube Video */}
                {lesson.youTubeVideoId ? (
                    <YoutubeIframe
                        videoId={lesson.youTubeVideoId}
                        height={220}
                        width={Dimensions.get('window').width}
                        play={false}
                        webViewProps={{
                            androidLayerType: 'hardware',
                        }}
                    />
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
});
