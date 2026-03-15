import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { sendBroadcast } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function SendAnnouncementScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = () => {
        if (!title.trim() || !message.trim()) {
            showAlert('Missing Fields', 'Please enter a title and a message.');
            return;
        }

        showAlert('Confirm Broadcast', 'Are you sure you want to send this push notification to every student? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Send Broadcast', style: 'default', onPress: async () => {
                    setSending(true);
                    try {
                        await sendBroadcast(title, message);
                        showAlert('Success', 'Broadcast notification sent!');
                        setTitle('');
                        setMessage('');
                    } catch (e) {
                        showAlert('Error', e.response?.data?.message || 'Failed to send broadcast.');
                    } finally {
                        setSending(false);
                    }
                }
            }
        ]);
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>Global Announcement</Text>
                <View style={{ width: 50 }} />
            </View>

            <KeyboardAwareScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={s.card}>
                    <Text style={s.icon}>📢</Text>
                    <Text style={s.headline}>Send a Push Notification</Text>
                    <Text style={s.desc}>This message will immediately ring every student's phone and appear on their lock screen.</Text>

                    <Text style={s.label}>Notification Title</Text>
                    <TextInput
                        style={s.input}
                        placeholder="e.g. 50% Off Holiday Sale!"
                        placeholderTextColor="#999"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={50}
                    />

                    <Text style={s.label}>Notification Message</Text>
                    <TextInput
                        style={[s.input, s.textArea]}
                        placeholder="Type your message here..."
                        placeholderTextColor="#999"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        maxLength={200}
                    />

                    <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending}>
                        {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.sendBtnText}>Send Broadcast</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
    },
    icon: { fontSize: 40, textAlign: 'center', marginBottom: 10 },
    headline: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 6 },
    desc: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
    label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14,
        fontSize: 15, marginBottom: 20, backgroundColor: '#FAFAFA', color: '#1a1a2e'
    },
    textArea: { height: 100 },
    sendBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center' },
    sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
