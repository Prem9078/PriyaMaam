import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator
} from 'react-native';
import { getLessons } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function LessonsScreen({ route, navigation }) {
    const { courseId, courseTitle } = route.params;
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLessons(courseId)
            .then(res => setLessons(res.data))
            .catch(err => showAlert('Error', err.response?.data?.message || 'Failed to load lessons.'))
            .finally(() => setLoading(false));
    }, [courseId]);

    const renderLesson = ({ item, index }) => (
        <TouchableOpacity style={styles.card}
            onPress={() => navigation.navigate('Lesson', { lesson: item, courseId })}>
            <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.lessonTitle}>{item.title}</Text>
                <Text style={styles.lessonSub}>
                    {item.notesSecureUrl ? '📄 Notes available  ' : ''}▶ Watch Video
                </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{courseTitle}</Text>
            </View>
            <FlatList
                data={lessons}
                keyExtractor={item => item.id}
                renderItem={renderLesson}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={styles.empty}>No lessons yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4
    },
    orderBadge: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#6C63FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    orderText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    cardContent: { flex: 1 },
    lessonTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
    lessonSub: { fontSize: 12, color: '#888' },
    arrow: { fontSize: 22, color: '#6C63FF', fontWeight: '700' },
    empty: { textAlign: 'center', marginTop: 60, color: '#999' },
});
