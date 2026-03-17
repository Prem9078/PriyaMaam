import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';

const PURPLE = '#4B42D6';

export default function NotificationsScreen({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        try {
            const res = await getNotifications();
            setNotifications(res.data);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadNotifications(); }, []);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {
            console.log(e);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {
            console.log(e);
        }
    };

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>📭</Text>
                <Text style={s.emptyTitle}>You're all caught up!</Text>
                <Text style={s.emptyDesc}>No new notifications right now.</Text>
            </View>
        );
    };

    const renderItem = ({ item }) => {
        const isRead = item.isRead;
        const iconName = item.type === 'certificate' ? 'ribbon' : 'notifications';
        const iconColor = item.type === 'certificate' ? '#F5A623' : PURPLE;

        return (
            <TouchableOpacity 
                style={[s.card, !isRead && s.cardUnread]}
                onPress={() => !isRead && handleMarkRead(item.id)}
                activeOpacity={isRead ? 1 : 0.7}
            >
                <View style={[s.iconBox, !isRead && s.iconBoxUnread]}>
                    <Ionicons name={iconName} size={24} color={isRead ? '#999' : iconColor} />
                </View>
                <View style={s.cardBody}>
                    <Text style={[s.title, !isRead && s.titleUnread]}>{item.title}</Text>
                    <Text style={s.message}>{item.message}</Text>
                    <Text style={s.time}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </Text>
                </View>
                {!isRead && <View style={s.dotUnread} />}
            </TouchableOpacity>
        );
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Notifications</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={handleMarkAllRead}>
                        <Text style={s.markAllTxt}>Mark All Read</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 80 }} />
                )}
            </View>

            {loading && !refreshing ? (
                <View style={s.loaderWrap}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={n => n.id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={s.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
    markAllTxt: { fontSize: 13, color: PURPLE, fontWeight: '700' },
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'flex-start',
        borderWidth: 1, borderColor: '#F0F0F8', opacity: 0.7
    },
    cardUnread: {
        opacity: 1, borderColor: '#E0DEFF', elevation: 2,
        shadowColor: PURPLE, shadowOpacity: 0.1, shadowRadius: 8,
    },
    iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F6FA', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    iconBoxUnread: { backgroundColor: '#EEF0FF' },
    cardBody: { flex: 1 },
    title: { fontSize: 15, fontWeight: '700', color: '#555', marginBottom: 4 },
    titleUnread: { color: '#1a1a2e', fontWeight: '800' },
    message: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
    time: { fontSize: 11, color: '#aaa' },
    dotUnread: { width: 10, height: 10, borderRadius: 5, backgroundColor: PURPLE, marginTop: 4, marginLeft: 8 },

    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyEmoji: { fontSize: 60, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
    emptyDesc: { color: '#888', fontSize: 15, textAlign: 'center' },
});
