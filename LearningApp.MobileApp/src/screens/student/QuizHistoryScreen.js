import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMyQuizHistory } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const PURPLE = '#6C63FF';

function ScoreBadge({ pct }) {
    const color = pct >= 70 ? '#2E7D32' : pct >= 40 ? '#F57C00' : '#C62828';
    const bg = pct >= 70 ? '#E8F5E9' : pct >= 40 ? '#FFF3E0' : '#FFEBEE';
    return (
        <View style={[badge.wrap, { backgroundColor: bg }]}>
            <Text style={[badge.text, { color }]}>{pct}%</Text>
        </View>
    );
}

const badge = StyleSheet.create({
    wrap: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    text: { fontWeight: '800', fontSize: 13 },
});

function HistoryCard({ item, onLeaderboard }) {
    const date = new Date(item.submittedAt);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
        <View style={s.card}>
            <View style={s.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={s.quizTitle} numberOfLines={2}>{item.quizTitle}</Text>
                    <Text style={s.lessonTitle}>{item.lessonTitle}</Text>
                </View>
                <ScoreBadge pct={item.percentage} />
            </View>

            <View style={s.statsRow}>
                <View style={s.stat}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={PURPLE} />
                    <Text style={s.statText}>{item.score}/{item.totalQuestions} Correct</Text>
                </View>
                <View style={s.stat}>
                    <Ionicons name="time-outline" size={16} color="#888" />
                    <Text style={s.statText}>{dateStr} · {timeStr}</Text>
                </View>
            </View>

            <TouchableOpacity style={s.leaderBtn} onPress={() => onLeaderboard(item.quizId, item.quizTitle)}>
                <Ionicons name="trophy-outline" size={15} color={PURPLE} />
                <Text style={s.leaderBtnText}>View Leaderboard</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function QuizHistoryScreen({ navigation }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getMyQuizHistory();
            setHistory(res.data);
        } catch {
            showAlert('Error', 'Could not load quiz history.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const goLeaderboard = (quizId, quizTitle) =>
        navigation.navigate('Leaderboard', { quizId, quizTitle });

    if (loading) return (
        <View style={s.center}>
            <ActivityIndicator size="large" color={PURPLE} />
        </View>
    );

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <Ionicons name="time" size={22} color="#fff" />
                <Text style={s.headerTitle}>My Quiz History</Text>
            </View>

            <FlatList
                data={history}
                keyExtractor={item => item.resultId}
                renderItem={({ item }) => (
                    <HistoryCard item={item} onLeaderboard={goLeaderboard} />
                )}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(true); }}
                        colors={[PURPLE]}
                    />
                }
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Ionicons name="document-text-outline" size={56} color="#ccc" />
                        <Text style={s.emptyTitle}>No Attempts Yet</Text>
                        <Text style={s.emptyText}>Take a quiz in any lesson to see your history here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: PURPLE, paddingTop: 52, paddingBottom: 18,
        paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
        elevation: 3, shadowColor: PURPLE, shadowOpacity: 0.08, shadowRadius: 8,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
    quizTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 3 },
    lessonTitle: { fontSize: 12, color: '#888' },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statText: { fontSize: 13, color: '#555' },

    leaderBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1.5, borderColor: PURPLE, borderRadius: 10, paddingVertical: 8,
    },
    leaderBtnText: { color: PURPLE, fontWeight: '700', fontSize: 13 },

    empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#ccc', marginTop: 16, marginBottom: 6 },
    emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 20 },
});
