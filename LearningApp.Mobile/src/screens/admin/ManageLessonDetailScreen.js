import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import YoutubeIframe from 'react-native-youtube-iframe';
import { updateLesson, getMaterials, uploadMaterial, deleteMaterial, getQuizzes, deleteQuiz } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

/** Extract YouTube video ID from any URL format or plain ID */
function extractYouTubeId(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return '';
    try {
        const url = new URL(trimmed);
        if (url.searchParams.get('v')) return url.searchParams.get('v');
        if (url.hostname === 'youtu.be') return url.pathname.replace('/', '');
        const embedMatch = url.pathname.match(/\/embed\/([^/?&]+)/);
        if (embedMatch) return embedMatch[1];
        const shortsMatch = url.pathname.match(/\/shorts\/([^/?&]+)/);
        if (shortsMatch) return shortsMatch[1];
    } catch { }
    return trimmed;
}

export default function ManageLessonDetailScreen({ route, navigation }) {
    const { lesson, courseTitle } = route.params;

    const [title, setTitle] = useState(lesson.title);
    const [youtubeInput, setYoutubeInput] = useState(lesson.youTubeVideoId || '');
    const [saving, setSaving] = useState(false);

    // Derived: extract ID from whatever the admin typed
    const youtubeId = extractYouTubeId(youtubeInput);

    const [materials, setMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [quizzes, setQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);

    const fetchMaterials = useCallback(async () => {
        try {
            const res = await getMaterials(lesson.id);
            setMaterials(res.data);
        } catch (e) { /* ignore */ } finally {
            setLoadingMaterials(false);
        }
    }, [lesson.id]);

    const fetchQuizzes = useCallback(async () => {
        try {
            const res = await getQuizzes(lesson.id);
            setQuizzes(res.data);
        } catch (e) { /* ignore */ } finally {
            setLoadingQuizzes(false);
        }
    }, [lesson.id]);

    useEffect(() => {
        fetchMaterials();
        fetchQuizzes();
    }, []);

    // Refresh when coming back from AddQuiz screen
    useEffect(() => {
        const unsub = navigation.addListener('focus', () => {
            fetchQuizzes();
        });
        return unsub;
    }, [navigation]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateLesson(lesson.id, { title, youTubeVideoId: youtubeId });
            showAlert('✅ Saved', 'Lesson updated successfully.');
        } catch {
            showAlert('Error', 'Could not save lesson.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf'], copyToCacheDirectory: true });
            if (res.canceled) return;
            const file = res.assets[0];
            setUploading(true);
            const formData = new FormData();
            formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' });
            await uploadMaterial(lesson.id, formData);
            showAlert('Success', 'File uploaded!');
            fetchMaterials();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to upload.');
        } finally { setUploading(false); }
    };

    const handleDeleteMaterial = (id, name) => {
        showAlert('Delete File', `Delete "${name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    await deleteMaterial(id);
                    setMaterials(prev => prev.filter(m => m.id !== id));
                }
            }
        ]);
    };

    const handleDeleteQuiz = (id, quizTitle) => {
        showAlert('Delete Quiz', `Delete "${quizTitle}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteQuiz(id);
                        setQuizzes(prev => prev.filter(q => q.id !== id));
                    } catch (e) {
                        showAlert('Error', e.response?.data?.message || 'Could not delete quiz.');
                    }
                }
            }
        ]);
    };

    const openDoc = (secureUrl, fileName) => {
        navigation.navigate('PdfViewer', { secureUrl, fileName });
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>Lesson Details</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={s.infoCard}>
                    <Text style={s.infoCourse}>Course: {courseTitle}</Text>
                    <Text style={s.infoLesson}>Lesson {lesson.order}</Text>
                </View>

                {/* Edit Details */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>✏️ Edit Details</Text>
                    <Text style={s.label}>Title</Text>
                    <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Lesson Title" />
                    <Text style={s.label}>YouTube Link or Video ID</Text>
                    <TextInput
                        style={s.input}
                        value={youtubeInput}
                        onChangeText={setYoutubeInput}
                        placeholder="Paste YouTube link or video ID"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {/* Live YouTube player preview */}
                    {youtubeId ? (
                        <View style={s.playerWrapper}>
                            <YoutubeIframe
                                videoId={youtubeId}
                                height={200}
                                width={Dimensions.get('window').width - 64}
                                play={false}
                                webViewProps={{ androidLayerType: 'hardware' }}
                            />
                            <Text style={s.previewLabel}>ID: {youtubeId}</Text>
                        </View>
                    ) : youtubeInput.length > 0 ? (
                        <Text style={s.invalidHint}>⚠️ Could not detect a YouTube video ID</Text>
                    ) : null}
                    <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                </View>

                {/* Materials */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>📎 Materials (PDFs)</Text>
                    {loadingMaterials ? <ActivityIndicator color="#6C63FF" style={{ marginVertical: 10 }} /> :
                        materials.length === 0 ? <Text style={s.emptyText}>No materials uploaded yet.</Text> :
                            materials.map(m => (
                                <View key={m.id} style={s.fileRow}>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openDoc(m.secureUrl, m.fileName)}>
                                        <Text style={s.fileName} numberOfLines={1}>📄 {m.fileName}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteMaterial(m.id, m.fileName)}>
                                        <Text style={s.deleteText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                    }
                    <TouchableOpacity style={s.uploadBtn} onPress={handleUpload} disabled={uploading}>
                        {uploading ? <ActivityIndicator color="#6C63FF" /> : <Text style={s.uploadBtnText}>⬆️ Upload New File</Text>}
                    </TouchableOpacity>
                </View>

                {/* Quizzes */}
                <View style={[s.section, { marginBottom: 30 }]}>
                    <Text style={s.sectionTitle}>📝 Mock Tests / Quizzes</Text>
                    {loadingQuizzes ? <ActivityIndicator color="#6C63FF" style={{ marginVertical: 10 }} /> :
                        quizzes.length === 0 ? <Text style={s.emptyText}>No quizzes yet.</Text> :
                            quizzes.map(q => (
                                <View key={q.id} style={s.quizRow}>
                                    <Text style={s.quizRowTitle} numberOfLines={1}>🎯 {q.title}</Text>
                                    <Text style={s.quizCount}>{q.questions?.length || 0} Qs</Text>
                                    <TouchableOpacity onPress={() => handleDeleteQuiz(q.id, q.title)}>
                                        <Text style={s.deleteText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                    }
                    <TouchableOpacity
                        style={s.quizBtn}
                        onPress={() => navigation.navigate('AddQuiz', { lessonId: lesson.id, lessonTitle: title })}
                    >
                        <Text style={s.quizBtnText}>+ Add New Quiz</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    infoCard: { backgroundColor: '#EEF0FF', borderRadius: 12, padding: 14, marginBottom: 20 },
    infoCourse: { color: '#6C63FF', fontSize: 12, fontWeight: '700', marginBottom: 4 },
    infoLesson: { color: '#1a1a2e', fontSize: 16, fontWeight: '800' },
    section: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12,
        fontSize: 14, marginBottom: 16, backgroundColor: '#FAFAFA', color: '#1a1a2e'
    },
    saveBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    emptyText: { color: '#999', fontSize: 13, textAlign: 'center', marginVertical: 8 },
    fileRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
        borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EEE'
    },
    fileName: { color: '#6C63FF', fontSize: 13, fontWeight: '600', flex: 1 },
    deleteText: { color: '#e74c3c', fontWeight: '700', fontSize: 18, paddingLeft: 8 },
    uploadBtn: {
        borderWidth: 2, borderColor: '#6C63FF', borderStyle: 'dashed',
        borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8
    },
    uploadBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
    quizRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
        borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EEE'
    },
    quizRowTitle: { flex: 1, color: '#1a1a2e', fontSize: 13, fontWeight: '600' },
    quizCount: { color: '#6C63FF', fontSize: 12, fontWeight: '700', marginRight: 8 },
    quizBtn: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
    quizBtnText: { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
    playerWrapper: { borderRadius: 12, overflow: 'hidden', marginBottom: 14, backgroundColor: '#000' },
    previewLabel: {
        backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11,
        paddingHorizontal: 10, paddingVertical: 4, textAlign: 'center'
    },
    invalidHint: { color: '#e74c3c', fontSize: 12, marginBottom: 12 },
});
