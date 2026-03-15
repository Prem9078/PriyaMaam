import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Image, ActivityIndicator, RefreshControl, TextInput, StatusBar,
} from 'react-native';
import { getCourses } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchCourses = useCallback(async () => {
        try {
            const res = await getCourses();
            setCourses(res.data);
        } catch (e) {
            console.log('Fetch courses error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchCourses(); }, []);

    const filtered = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    const renderCourse = ({ item }) => (
        <TouchableOpacity
            style={s.card}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('CourseDetail', { course: item })}
        >
            {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={s.thumbnail} />
            ) : (
                <View style={[s.thumbnail, s.thumbPlaceholder]}>
                    <Text style={s.thumbEmoji}>📚</Text>
                </View>
            )}

            {/* FREE / PAID badge */}
            <View style={[s.badge, item.isFree ? s.badgeFree : s.badgePaid]}>
                <Text style={s.badgeText}>{item.isFree ? '🎁 FREE' : '💎 PAID'}</Text>
            </View>

            {item.isEnrolled && (
                <View style={s.enrolledBadge}>
                    <Text style={s.enrolledText}>✓ Enrolled</Text>
                </View>
            )}

            <View style={s.cardBody}>
                <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
                <View style={s.cardFooter}>
                    {item.isFree ? (
                        <Text style={s.freeLabel}>Free Access</Text>
                    ) : (
                        <Text style={s.priceLabel}>₹{item.price.toFixed(0)}</Text>
                    )}
                    <TouchableOpacity
                        style={s.goBtn}
                        onPress={() => navigation.navigate('CourseDetail', { course: item })}
                    >
                        <Text style={s.goBtnText}>View →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) return (
        <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#6C63FF" />
        </View>
    );

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4B42D6" />

            {/* ─── Branded Header ─── */}
            <View style={s.header}>
                <View>
                    <Text style={s.appName}>Priya Ma'am</Text>
                    <Text style={s.greeting}>Welcome back, {user?.name?.split(' ')[0]} 👋</Text>
                </View>
            </View>

            {/* ─── Search ─── */}
            <View style={s.searchRow}>
                <TextInput
                    style={s.search}
                    placeholder="Search courses..."
                    placeholderTextColor="#aaa"
                    value={search}
                    onChangeText={setSearch}
                />
                <Text style={s.searchIcon}>🔍</Text>
            </View>

            <Text style={s.sectionTitle}>All Courses ({filtered.length})</Text>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={renderCourse}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                ListHeaderComponent={
                    // Find the first enrolled course with a last accessed lesson
                    courses.find(c => c.isEnrolled && c.lastAccessedLessonId) ? (() => {
                        const target = courses.find(c => c.isEnrolled && c.lastAccessedLessonId);
                        return (
                            <TouchableOpacity 
                                style={s.resumeCard}
                                onPress={() => navigation.navigate('Lesson', { 
                                    lessonId: target.lastAccessedLessonId,
                                    courseTitle: target.title 
                                })}
                            >
                                <View style={s.resumeIconBox}><Text style={s.resumeIcon}>↺</Text></View>
                                <View style={s.resumeTextCol}>
                                    <Text style={s.resumeLabel}>Resume Learning</Text>
                                    <Text style={s.resumeTitle} numberOfLines={1}>{target.title}</Text>
                                    {target.progressPercentage > 0 && (
                                        <View style={s.resumeProgressTrack}>
                                            <View style={[s.resumeProgressFill, { width: `${target.progressPercentage}%`}]} />
                                        </View>
                                    )}
                                </View>
                                <Text style={s.resumeArrow}>›</Text>
                            </TouchableOpacity>
                        );
                    })() : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchCourses(); }}
                        tintColor="#6C63FF"
                    />
                }
                ListEmptyComponent={
                    <View style={s.emptyBox}>
                        <Text style={s.emptyEmoji}>📭</Text>
                        <Text style={s.emptyText}>No courses found</Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const PURPLE = '#5B52E8';
const PURPLE_DARK = '#4B42D6';

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },

    // Header
    header: {
        backgroundColor: PURPLE_DARK,
        paddingTop: 56, paddingBottom: 28,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    appName: {
        fontSize: 26, fontWeight: '900', color: '#fff',
        letterSpacing: 0.5,
    },
    greeting: {
        fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3,
    },

    // Search
    searchRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16,
        marginTop: -18, marginBottom: 8,
        paddingHorizontal: 14,
        elevation: 6, shadowColor: PURPLE, shadowOpacity: 0.15, shadowRadius: 8,
    },
    search: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1a1a2e' },
    searchIcon: { fontSize: 16 },

    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: '#888',
        marginHorizontal: 20, marginBottom: 12, marginTop: 10,
        letterSpacing: 0.3,
    },

    // Course Card
    card: {
        backgroundColor: '#fff', borderRadius: 20, marginBottom: 18,
        elevation: 4, shadowColor: PURPLE, shadowOpacity: 0.1, shadowRadius: 10,
        overflow: 'hidden',
    },
    thumbnail: { width: '100%', height: 170 },
    thumbPlaceholder: {
        backgroundColor: '#EEF0FF', justifyContent: 'center', alignItems: 'center'
    },
    thumbEmoji: { fontSize: 52 },

    // Badges overlaid on thumbnail
    badge: {
        position: 'absolute', top: 12, left: 12,
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20,
    },
    badgeFree: { backgroundColor: '#00C853' },
    badgePaid: { backgroundColor: '#FF6B35' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

    enrolledBadge: {
        position: 'absolute', top: 12, right: 12,
        backgroundColor: '#1a1a2e', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20,
    },
    enrolledText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // Card body
    cardBody: { padding: 16 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', marginBottom: 5 },
    cardDesc: { fontSize: 13, color: '#777', lineHeight: 19, marginBottom: 12 },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    freeLabel: { fontSize: 15, fontWeight: '800', color: '#00C853' },
    priceLabel: { fontSize: 15, fontWeight: '800', color: '#FF6B35' },
    goBtn: {
        backgroundColor: PURPLE, paddingHorizontal: 18, paddingVertical: 8,
        borderRadius: 20,
    },
    goBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // Empty state
    emptyBox: { alignItems: 'center', marginTop: 80 },
    emptyEmoji: { fontSize: 52, marginBottom: 12 },
    emptyText: { color: '#aaa', fontSize: 16 },

    // Resume Learning Banner
    resumeCard: {
        backgroundColor: '#1a1a2e', borderRadius: 18, marginBottom: 20,
        padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
        elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    },
    resumeIconBox: { 
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(108, 99, 255, 0.2)',
        justifyContent: 'center', alignItems: 'center'
    },
    resumeIcon: { color: '#887BFF', fontSize: 22, fontWeight: '700' },
    resumeTextCol: { flex: 1 },
    resumeLabel: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    resumeTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 2, marginBottom: 8 },
    resumeProgressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
    resumeProgressFill: { height: '100%', backgroundColor: '#00C853', borderRadius: 2 },
    resumeArrow: { color: '#555', fontSize: 26, fontWeight: '300' },
});
