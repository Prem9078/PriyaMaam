import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OfflineMaterialsScreen({ navigation }) {
    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backHitbox}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>Offline Materials</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={s.center}>
                <Text style={s.emptyEmoji}>📚</Text>
                <Text style={s.emptyTitle}>Online Viewing Only</Text>
                <Text style={s.emptySub}>PDF notes are viewed directly online. Open any lesson material to read it in-app.</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    backHitbox: { width: 60 },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});
