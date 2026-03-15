import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

// Lazy-load expo-screen-capture to prevent native module crash in Expo Go
function useSafePreventScreenCapture() {
    useEffect(() => {
        let sub;
        try {
            const SC = require('expo-screen-capture');
            SC.activateKeepAwakeAsync?.();
            sub = SC.addScreenshotListener?.(() => {});
            SC.preventScreenCaptureAsync?.();
        } catch (e) {
            // Not available in Expo Go — silently skip
        }
        return () => {
            try { sub?.remove?.(); } catch (_) {}
        };
    }, []);
}

export default function PdfViewerScreen({ route, navigation }) {
    const { secureUrl, fileName } = route.params;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // Offline State
    const [isOffline, setIsOffline] = useState(false);
    const [localUri, setLocalUri] = useState('');
    const [downloading, setDownloading] = useState(false);

    // Block screenshots and screen recording while viewing the document
    useSafePreventScreenCapture();

    // Fix filename to aviod directory traversal or invalid characters
    const encodedFileName = encodeURIComponent(fileName.replace(/[<>:"/\\|?*]+/g, '_')) + '.pdf';
    const fileUri = `${FileSystem.documentDirectory}${encodedFileName}`;

    useEffect(() => {
        checkLocalFile();
    }, []);

    const checkLocalFile = async () => {
        try {
            const info = await FileSystem.getInfoAsync(fileUri);
            if (info.exists) {
                setIsOffline(true);
                setLocalUri(info.uri);
                setLoading(false); // Skip webview loading entirely
            }
        } catch (e) {
            console.log('Error checking local file', e);
        }
    };

    const downloadFile = async () => {
        setDownloading(true);
        try {
            const result = await FileSystem.downloadAsync(secureUrl, fileUri);
            setIsOffline(true);
            setLocalUri(result.uri);
        } catch (e) {
            console.log('Download error', e);
            alert('Failed to download file');
        } finally {
            setDownloading(false);
            setLoading(false);
        }
    };

    const openOfflineFile = async () => {
        try {
            if (Platform.OS === 'android') {
                const IntentLauncher = require('expo-intent-launcher');
                const cUri = await FileSystem.getContentUriAsync(localUri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: cUri,
                    flags: 1,
                    type: 'application/pdf'
                });
            } else {
                const Sharing = require('expo-sharing');
                await Sharing.shareAsync(localUri);
            }
        } catch (e) {
            console.log('Error opening file natively:', e);
            alert('Could not open the file natively. It may require a PDF reader app.');
        }
    };

    // Google Docs Viewer renders PDFs online
    const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(secureUrl)}`;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backHitbox}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                
                <Text style={s.headerTitle} numberOfLines={1}>{fileName}</Text>
                
                <View style={s.rightHitbox}>
                    {!isOffline ? (
                        <TouchableOpacity onPress={downloadFile} disabled={downloading}>
                            {downloading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={s.saveOfflineBtn}>Save</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <Text style={s.savedText}>Saved ✓</Text>
                    )}
                </View>
            </View>

            {loading && !error && !isOffline && (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                    <Text style={s.loadingText}>Loading document...</Text>
                </View>
            )}

            {isOffline ? (
                <View style={s.offlineBox}>
                    <Text style={s.offlineIcon}>📄</Text>
                    <Text style={s.offlineTitle}>Available Offline</Text>
                    <Text style={s.offlineSub}>This document is saved to your device cache.</Text>
                    <TouchableOpacity style={s.openBtn} onPress={openOfflineFile}>
                        <Text style={s.openText}>Open Document Native Viewer</Text>
                    </TouchableOpacity>
                </View>
            ) : error ? (
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
    backHitbox: { width: 60 },
    rightHitbox: { width: 60, alignItems: 'flex-end' },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'center' },
    saveOfflineBtn: { color: '#fff', fontSize: 15, fontWeight: '800' },
    savedText: { color: '#C8E6C9', fontSize: 14, fontWeight: '700' },
    
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', zIndex: 10
    },
    loadingText: { marginTop: 12, color: '#6C63FF', fontSize: 14 },
    
    offlineBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9F9FB' },
    offlineIcon: { fontSize: 64, marginBottom: 16 },
    offlineTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
    offlineSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 28 },
    openBtn: { backgroundColor: '#6C63FF', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
    openText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    errorIcon: { fontSize: 48, marginBottom: 12 },
    errorTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
    errorSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
    retryBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
    retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
