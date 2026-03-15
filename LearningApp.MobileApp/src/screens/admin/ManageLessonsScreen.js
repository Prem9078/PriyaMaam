import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLessons } from '../../services/api';

export default function ManageLessonsScreen({ route, navigation }) {
    const { courseId, courseTitle } = route.params;
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
        getLessons(courseId).then(r => setLessons(r.data)).finally(() => setLoading(false));
    }, [courseId]));

    const renderLesson = ({ item, index }) => (
        <TouchableOpacity
            style={s.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ManageLessonDetail', { lesson: item, courseTitle })}
        >
            <View style={s.orderBadge}><Text style={s.orderText}>{index + 1}</Text></View>
            <View style={s.cardContent}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.sub}>YouTube: {item.youTubeVideoId}</Text>
                {item.notesSecureUrl && <Text style={s.notes}>📄 Notes uploaded</Text>}
            </View>
            <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
    );

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>{courseTitle}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddLesson', { courseId, courseTitle })}>
                    <Text style={s.addBtn}>+ Add</Text>
                </TouchableOpacity>
            </View>
            <FlatList data={lessons} keyExtractor={i => i.id} renderItem={renderLesson}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={s.empty}>No lessons yet. Tap + Add to create one.</Text>} />
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
    headerTitle: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'center' },
    addBtn: { color: '#fff', fontSize: 15, fontWeight: '700' },
    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4
    },
    orderBadge: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#6C63FF',
        justifyContent: 'center', alignItems: 'center'
    },
    orderText: { color: '#fff', fontWeight: '700' },
    cardContent: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
    sub: { fontSize: 12, color: '#888' },
    notes: { fontSize: 12, color: '#27ae60', marginTop: 2 },
    chevron: { fontSize: 24, color: '#ccc', fontWeight: '300', paddingHorizontal: 6 },
    empty: { textAlign: 'center', marginTop: 60, color: '#999' },
});
