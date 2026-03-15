import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getLeaderboard } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const PURPLE = '#6C63FF';
const GOLD = '#FFD700';
const SILVER = '#B0BEC5';
const BRONZE = '#CD7F32';

const MEDAL_ICONS = ['trophy', 'medal', 'ribbon'];
const MEDAL_COLORS = [GOLD, SILVER, BRONZE];

function RankBadge({ rank }) {
    if (rank <= 3) {
        return (
            <View style={[rb.wrap, { backgroundColor: MEDAL_COLORS[rank - 1] + '22' }]}>
                <Ionicons name={MEDAL_ICONS[rank - 1]} size={20} color={MEDAL_COLORS[rank - 1]} />
            </View>
        );
    }
    return (
        <View style={rb.wrap}>
            <Text style={rb.num}>#{rank}</Text>
        </View>
    );
}

const rb = StyleSheet.create({
    wrap: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F0F2FF',
    },
    num: { fontWeight: '800', fontSize: 14, color: '#555' },
});

function ScoreBadge({ pct }) {
    const color = pct >= 70 ? '#2E7D32' : pct >= 40 ? '#F57C00' : '#C62828';
    const bg = pct >= 70 ? '#E8F5E9' : pct >= 40 ? '#FFF3E0' : '#FFEBEE';
    return (
        <View style={[sb.wrap, { backgroundColor: bg }]}>
            <Text style={[sb.text, { color }]}>{pct}%</Text>
        </View>
    );
}

const sb = StyleSheet.create({
    wrap: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    text: { fontWeight: '800', fontSize: 13 },
});

export default function LeaderboardScreen({ route, navigation }) {
    const { quizId, quizTitle } = route.params;
    const { user } = useAuth();
    const [board, setBoard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard(quizId)
            .then(res => setBoard(res.data))
            .catch(() => showAlert('Error', 'Could not load leaderboard.'))
            .finally(() => setLoading(false));
    }, [quizId]);

    const renderItem = ({ item }) => {
        const isMe = item.studentName === user?.name;
        const dateStr = new Date(item.bestAttemptAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });

        return (
            <View style={[s.row, isMe && s.rowMe]}>
                <RankBadge rank={item.rank} />
                <View style={s.info}>
                    <Text style={[s.name, isMe && s.nameMe]} numberOfLines={1}>
                        {item.studentName}{isMe ? ' (You)' : ''}
                    </Text>
                    <Text style={s.date}>Best on {dateStr}</Text>
                </View>
                <View style={s.right}>
                    <Text style={[s.score, isMe && s.scoreMe]}>
                        {item.score}/{item.totalQuestions}
                    </Text>
                    <ScoreBadge pct={item.percentage} />
                </View>
            </View>
        );
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.headerSub}>Leaderboard</Text>
                    <Text style={s.headerTitle} numberOfLines={1}>{quizTitle}</Text>
                </View>
                <Ionicons name="trophy" size={28} color={GOLD} />
            </View>

            {/* Top 3 Podium */}
            {!loading && board.length >= 3 && (
                <View style={s.podium}>
                    {/* 2nd */}
                    <View style={[s.podiumCol, { marginTop: 24 }]}>
                        <View style={[s.podiumCircle, { borderColor: SILVER }]}>
                            <Text style={s.podiumInitial}>
                                {board[1].studentName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={[s.podiumBlock, { backgroundColor: SILVER, height: 60 }]}>
                            <Text style={s.podiumRank}>2</Text>
                        </View>
                        <Text style={s.podiumName} numberOfLines={1}>{board[1].studentName}</Text>
                        <Text style={s.podiumScore}>{board[1].score}/{board[1].totalQuestions}</Text>
                    </View>
                    {/* 1st */}
                    <View style={s.podiumCol}>
                        <View style={[s.podiumCircle, { borderColor: GOLD, width: 60, height: 60, borderRadius: 30 }]}>
                            <Text style={[s.podiumInitial, { fontSize: 22 }]}>
                                {board[0].studentName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={[s.podiumBlock, { backgroundColor: GOLD, height: 80 }]}>
                            <Text style={s.podiumRank}>1</Text>
                        </View>
                        <Text style={s.podiumName} numberOfLines={1}>{board[0].studentName}</Text>
                        <Text style={s.podiumScore}>{board[0].score}/{board[0].totalQuestions}</Text>
                    </View>
                    {/* 3rd */}
                    <View style={[s.podiumCol, { marginTop: 40 }]}>
                        <View style={[s.podiumCircle, { borderColor: BRONZE }]}>
                            <Text style={s.podiumInitial}>
                                {board[2].studentName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={[s.podiumBlock, { backgroundColor: BRONZE, height: 44 }]}>
                            <Text style={s.podiumRank}>3</Text>
                        </View>
                        <Text style={s.podiumName} numberOfLines={1}>{board[2].studentName}</Text>
                        <Text style={s.podiumScore}>{board[2].score}/{board[2].totalQuestions}</Text>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            ) : (
                <FlatList
                    data={board}
                    keyExtractor={item => item.userId}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <Ionicons name="trophy-outline" size={56} color="#ccc" />
                            <Text style={s.emptyTitle}>No Results Yet</Text>
                            <Text style={s.emptyText}>Be the first to complete this quiz!</Text>
                        </View>
                    }
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
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backBtn: { padding: 4 },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },

    // Podium
    podium: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
        backgroundColor: PURPLE, paddingBottom: 20, paddingHorizontal: 24, gap: 8,
    },
    podiumCol: { alignItems: 'center', flex: 1 },
    podiumCircle: {
        width: 48, height: 48, borderRadius: 24, borderWidth: 3,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    },
    podiumInitial: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
    podiumBlock: { width: '90%', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    podiumRank: { fontSize: 20, fontWeight: '900', color: '#fff' },
    podiumName: { fontSize: 11, fontWeight: '700', color: '#fff', marginTop: 4, textAlign: 'center' },
    podiumScore: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

    // List rows
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    },
    rowMe: { borderWidth: 2, borderColor: PURPLE, backgroundColor: '#F0EFFF' },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
    nameMe: { color: PURPLE },
    date: { fontSize: 12, color: '#999', marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 4 },
    score: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
    scoreMe: { color: PURPLE },

    empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#ccc', marginTop: 16, marginBottom: 6 },
    emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center' },
});
