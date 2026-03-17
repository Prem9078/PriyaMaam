import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PdfViewerScreen({ route, navigation }) {
    // The previous implementation used WebView, but it was unreliable.
    // We now just use Linking to delegate to the system browser/pdf viewer.
    // params: { url, title } or legacy { secureUrl, fileName }
    
    const url = route.params?.url || route.params?.secureUrl;
    const title = route.params?.title || route.params?.fileName || 'Document';

    useEffect(() => {
        if (url) {
            // Automatically prompt download/view in default browser on mount
            Linking.openURL(url).catch(err => {
                console.error("Failed to open URL:", err);
            });
        }
    }, [url]);

    const handleDownloadFormat = () => {
        if (url) {
            Linking.openURL(url);
        }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backHitbox}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={s.content}>
                <Ionicons name="document-text" size={80} color="#6C63FF" style={{ marginBottom: 20 }} />
                <Text style={s.title}>Opening your document...</Text>
                <Text style={s.sub}>
                    If you aren't automatically redirected, tap the button below to view or download the PDF securely in your browser.
                </Text>
                
                <TouchableOpacity style={s.btn} onPress={handleDownloadFormat}>
                    <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={s.btnText}>Download / View PDF</Text>
                </TouchableOpacity>
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
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 12, textAlign: 'center' },
    sub: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    btn: {
        backgroundColor: '#6C63FF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
