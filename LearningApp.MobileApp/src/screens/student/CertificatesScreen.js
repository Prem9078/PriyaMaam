import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCertificates } from '../../services/api';

const GOLD = '#F5A623';

export default function CertificatesScreen({ navigation }) {
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadCerts = async () => {
        try {
            const res = await getCertificates();
            setCerts(res.data);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadCerts(); }, []);

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>🏅</Text>
                <Text style={s.emptyTitle}>No certificates yet</Text>
                <Text style={s.emptyDesc}>Complete courses to earn your certificates!</Text>
            </View>
        );
    };

    const renderCert = ({ item }) => {
        const date = new Date(item.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        return (
            <View style={s.card}>
                <View style={s.cardLeft}>
                    <View style={s.iconBox}>
                        <Ionicons name="ribbon" size={28} color={GOLD} />
                    </View>
                </View>
                <View style={s.cardBody}>
                    <Text style={s.title} numberOfLines={2}>{item.courseTitle}</Text>
                    <Text style={s.date}>Issued: {date}</Text>
                    <Text style={s.certId}>ID: {item.id.split('-').pop().toUpperCase()}</Text>
                </View>
                {!!item.pdfUrl && (
                    <TouchableOpacity
                        style={s.viewPdfBtn}
                        onPress={() => navigation.navigate('Home', { screen: 'PdfViewer', params: { url: item.pdfUrl, title: 'Certificate' } })}
                    >
                        <Ionicons name="document-text" size={18} color="#fff" />
                        <Text style={s.viewPdfTxt}>PDF</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Certificates</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={s.loaderWrap}>
                    <ActivityIndicator size="large" color="#4B42D6" />
                </View>
            ) : (
                <FlatList
                    data={certs}
                    keyExtractor={c => c.id}
                    renderItem={renderCert}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={s.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCerts(); }} />
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
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
        flexDirection: 'row', alignItems: 'center',
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
        borderWidth: 1, borderColor: '#F0F0F8'
    },
    cardLeft: { marginRight: 16 },
    iconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF4E5', justifyContent: 'center', alignItems: 'center' },
    cardBody: { flex: 1 },
    title: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
    date: { fontSize: 13, color: '#666', marginBottom: 4 },
    certId: { fontSize: 11, color: '#aaa', fontFamily: 'monospace' },

    viewPdfBtn: {
        backgroundColor: '#4B42D6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4
    },
    viewPdfTxt: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },

    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyEmoji: { fontSize: 60, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
    emptyDesc: { color: '#888', fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
});
