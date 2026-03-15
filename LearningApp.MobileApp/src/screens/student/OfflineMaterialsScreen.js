import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function OfflineMaterialsScreen({ navigation }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => {
        try {
            const dirUri = FileSystem.documentDirectory;
            const dirContents = await FileSystem.readDirectoryAsync(dirUri);
            const pdfs = dirContents.filter(f => f.endsWith('.pdf'));

            const fileInfos = await Promise.all(pdfs.map(async (filename) => {
                const info = await FileSystem.getInfoAsync(dirUri + filename);
                return {
                    name: decodeURIComponent(filename).replace('.pdf', ''),
                    filename: filename,
                    uri: info.uri,
                    size: info.size,
                    time: info.modificationTime
                };
            }));

            setFiles(fileInfos.sort((a,b) => b.time - a.time));
        } catch (e) {
            console.log('Error listing files', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
             loadFiles();
        });
        loadFiles();
        return unsubscribe;
    }, [navigation, loadFiles]);

    const openFile = async (uri) => {
        try {
            if (Platform.OS === 'android') {
                const IntentLauncher = require('expo-intent-launcher');
                const cUri = await FileSystem.getContentUriAsync(uri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: cUri,
                    flags: 1,
                    type: 'application/pdf'
                });
            } else {
                const Sharing = require('expo-sharing');
                await Sharing.shareAsync(uri);
            }
        } catch (e) {
            console.log('Error opening file', e);
            Alert.alert('Error', 'Could not open the file. Make sure you have a PDF viewer installed.');
        }
    };

    const deleteFile = (name, uri) => {
        Alert.alert('Delete Offline File', `Are you sure you want to delete "${name}" from your device?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                    loadFiles();
                }
            }
        ]);
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const renderFile = ({ item }) => (
        <View style={s.card}>
            <View style={s.cardLeft}>
                <View style={s.iconBox}><Text style={s.icon}>📄</Text></View>
                <View style={s.cardInfo}>
                    <Text style={s.fileName} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.fileMeta}>{formatSize(item.size)}</Text>
                </View>
            </View>
            <View style={s.cardActions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => deleteFile(item.name, item.uri)}>
                    <Text style={s.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.openBtn} onPress={() => openFile(item.uri)}>
                    <Text style={s.openBtnText}>Open</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backHitbox}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>Offline Materials</Text>
                <View style={{ width: 60 }} />
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            ) : files.length === 0 ? (
                <View style={s.center}>
                    <Text style={s.emptyEmoji}>📭</Text>
                    <Text style={s.emptyTitle}>No offline materials</Text>
                    <Text style={s.emptySub}>Download PDFs from course lessons to view them offline anytime without internet access.</Text>
                </View>
            ) : (
                <FlatList
                    data={files}
                    keyExtractor={item => item.filename}
                    renderItem={renderFile}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                />
            )}
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

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 2, shadowColor: '#4B42D6', shadowOpacity: 0.08, shadowRadius: 8
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    icon: { fontSize: 20 },
    cardInfo: { flex: 1 },
    fileName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
    fileMeta: { fontSize: 12, color: '#888' },
    cardActions: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, marginRight: 8 },
    deleteIcon: { fontSize: 18 },
    openBtn: { backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    openBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 }
});
