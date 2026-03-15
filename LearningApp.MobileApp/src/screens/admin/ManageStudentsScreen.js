import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStudents } from '../../services/api';

export default function ManageStudentsScreen({ navigation }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useFocusEffect(useCallback(() => {
        getStudents().then(r => setStudents(r.data)).finally(() => setLoading(false));
    }, []));

    const filteredStudents = students.filter(s => 
        (s.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
        (s.email?.toLowerCase() || '').includes(search.toLowerCase())
    );

    const renderStudent = ({ item }) => (
        <TouchableOpacity 
            style={s.card} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('StudentDetail', { student: item })}
        >
            <View style={s.avatar}><Text style={s.avatarText}>{item.name ? item.name[0].toUpperCase() : '?'}</Text></View>
            <View style={s.cardContent}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.email}>{item.email}</Text>
                <Text style={s.enrollInfo}>{item.enrollmentCount} Course(s)</Text>
            </View>
            <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle}>Manage Students</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={s.searchContainer}>
                <TextInput 
                    style={s.searchInput} 
                    placeholder="Search by name or email..." 
                    placeholderTextColor="#999"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
            ) : (
                <FlatList 
                    data={filteredStudents} 
                    keyExtractor={i => i.id} 
                    renderItem={renderStudent}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={<Text style={s.empty}>No students found.</Text>}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        backgroundColor: '#6C63FF', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    searchContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    searchInput: { 
        backgroundColor: '#F5F6FA', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e' 
    },
    card: { 
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, 
        flexDirection: 'row', alignItems: 'center', gap: 14,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4
    },
    avatar: { 
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF0FF', 
        justifyContent: 'center', alignItems: 'center' 
    },
    avatarText: { color: '#6C63FF', fontSize: 18, fontWeight: 'bold' },
    cardContent: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    email: { fontSize: 13, color: '#666', marginTop: 2 },
    enrollInfo: { fontSize: 11, color: '#27ae60', marginTop: 6, fontWeight: '700' },
    chevron: { fontSize: 24, color: '#ccc', fontWeight: '300' },
    empty: { textAlign: 'center', marginTop: 60, color: '#999' }
});
