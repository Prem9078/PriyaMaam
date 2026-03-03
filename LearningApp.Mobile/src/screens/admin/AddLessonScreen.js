import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { createLesson } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

/** Extract a YouTube video ID from any YouTube URL format or plain ID */
function extractYouTubeId(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return '';

    try {
        // Try parsing as a URL
        const url = new URL(trimmed);
        // youtube.com/watch?v=ID
        if (url.searchParams.get('v')) return url.searchParams.get('v');
        // youtu.be/ID
        if (url.hostname === 'youtu.be') return url.pathname.replace('/', '');
        // youtube.com/embed/ID
        const embedMatch = url.pathname.match(/\/embed\/([^/?&]+)/);
        if (embedMatch) return embedMatch[1];
        // youtube.com/shorts/ID
        const shortsMatch = url.pathname.match(/\/shorts\/([^/?&]+)/);
        if (shortsMatch) return shortsMatch[1];
    } catch {
        // Not a valid URL — assume it's already a raw video ID
    }
    return trimmed;
}

export default function AddLessonScreen({ route, navigation }) {
    const { courseId, courseTitle } = route.params;
    const [title, setTitle] = useState('');
    const [videoInput, setVideoInput] = useState('');
    const [order, setOrder] = useState('');
    const [loading, setLoading] = useState(false);

    const videoId = extractYouTubeId(videoInput);
    const thumbUri = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null;

    const handleCreate = async () => {
        if (!title || !videoId) return showAlert('Error', 'Title and YouTube video are required.');
        setLoading(true);
        try {
            await createLesson({
                courseId,
                title,
                youTubeVideoId: videoId,
                order: parseInt(order) || 1,
            });
            showAlert('✅ Created!', 'Lesson added successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to create lesson.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>Add Lesson</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={s.info}>
                    <Text style={s.infoText}>📚 Course: {courseTitle}</Text>
                </View>

                <Text style={s.label}>Lesson Title *</Text>
                <TextInput style={s.input} placeholder="e.g. Introduction to Variables"
                    value={title} onChangeText={setTitle} />

                <Text style={s.label}>YouTube Link or Video ID *</Text>
                <TextInput
                    style={s.input}
                    placeholder="Paste YouTube link or video ID"
                    value={videoInput}
                    onChangeText={setVideoInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Text style={s.hint}>
                    e.g. https://youtu.be/<Text style={s.hintBold}>VIDEO_ID</Text>  or  https://youtube.com/watch?v=<Text style={s.hintBold}>ID</Text>
                </Text>

                {/* Live thumbnail preview */}
                {thumbUri ? (
                    <View style={s.preview}>
                        <Image source={{ uri: thumbUri }} style={s.thumb} resizeMode="cover" />
                        <View style={s.playOverlay}>
                            <Text style={s.playIcon}>▶</Text>
                        </View>
                        <Text style={s.previewLabel}>Video ID: {videoId}</Text>
                    </View>
                ) : videoInput.length > 0 ? (
                    <Text style={s.invalidHint}>⚠️ Could not detect a valid YouTube video ID</Text>
                ) : null}

                <Text style={s.label}>Order (position in course)</Text>
                <TextInput style={s.input} placeholder="1" value={order}
                    onChangeText={setOrder} keyboardType="numeric" />

                <TouchableOpacity style={s.btn} onPress={handleCreate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Add Lesson</Text>}
                </TouchableOpacity>
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
    info: { backgroundColor: '#EEF0FF', borderRadius: 12, padding: 12, marginBottom: 20 },
    infoText: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },
    label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 4 },
    input: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14,
        marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0', color: '#1a1a2e'
    },
    hint: { fontSize: 12, color: '#999', marginBottom: 14 },
    hintBold: { fontWeight: '700', color: '#6C63FF' },
    invalidHint: { color: '#e74c3c', fontSize: 12, marginBottom: 14 },
    preview: {
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
        backgroundColor: '#000', position: 'relative'
    },
    thumb: { width: '100%', height: 190 },
    playOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 28,
        justifyContent: 'center', alignItems: 'center'
    },
    playIcon: {
        fontSize: 44, color: 'rgba(255,255,255,0.9)',
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4
    },
    previewLabel: {
        backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11,
        paddingHorizontal: 10, paddingVertical: 5, textAlign: 'center'
    },
    btn: {
        backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
        alignItems: 'center', marginTop: 12, marginBottom: 30
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
