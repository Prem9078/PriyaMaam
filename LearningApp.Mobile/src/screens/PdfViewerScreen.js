import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { usePreventScreenCapture } from 'expo-screen-capture';

export default function PdfViewerScreen({ route, navigation }) {
    const { secureUrl, fileName } = route.params;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Block screenshots and screen recording while viewing the document
    usePreventScreenCapture();

    // Google Docs Viewer renders PDFs on both Android and iOS in a WebView
    const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(secureUrl)}`;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>{fileName}</Text>
                <View style={{ width: 50 }} />
            </View>

            {loading && !error && (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text style={s.loadingText}>Loading document...</Text>
                </View>
            )}

            {error ? (
                <View style={s.errorBox}>
                    <Text style={s.errorIcon}>😕</Text>
                    <Text style={s.errorTitle}>Could not load preview</Text>
                    <Text style={s.errorSub}>Google Docs Viewer may be temporarily unavailable.</Text>
                    <TouchableOpacity style={s.retryBtn} onPress={() => { setError(false); setLoading(true); }}>
                        <Text style={s.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <WebView
                    source={{ uri: viewerUrl }}
                    style={{ flex: 1 }}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => { setLoading(false); setError(true); }}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'center' },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', zIndex: 10
    },
    loadingText: { marginTop: 12, color: '#6C63FF', fontSize: 14 },
    errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    errorIcon: { fontSize: 48, marginBottom: 12 },
    errorTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
    errorSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
    retryBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
    retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
