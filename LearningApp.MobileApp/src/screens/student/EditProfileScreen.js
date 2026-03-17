import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Image, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, uploadAvatar, BASE_URL } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const PURPLE = '#4B42D6';

export default function EditProfileScreen({ navigation }) {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return showAlert('Error', 'Name is required.');
        setLoading(true);
        try {
            const res = await updateProfile({ name, phone });
            await updateUser({ name: res.data.name, phone: res.data.phone });
            showAlert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            showAlert('Error', e.response?.data?.message || 'Update failed.');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert('Permission Denied', 'You refuse to allow access to your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            const formData = new FormData();
            formData.append('file', { uri, name: filename, type });

            setUploading(true);
            try {
                const res = await uploadAvatar(formData);
                await updateUser({ avatarUrl: res.data.avatarUrl || res.data });
                showAlert('Success', 'Profile photo updated!');
            } catch (e) {
                showAlert('Error', 'Failed to upload photo.');
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {/* Avatar Section */}
                <View style={s.avatarSection}>
                    <View style={s.avatarRing}>
                        {user?.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BASE_URL}${user.avatarUrl}` }} style={s.avatar} />
                        ) : (
                            <View style={[s.avatar, { backgroundColor: '#EEF0FF', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={s.avatarInit}>{user?.name?.[0]?.toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={s.changePhotoBtn} onPress={handlePickImage} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator size="small" color={PURPLE} />
                        ) : (
                            <Text style={s.changePhotoTxt}>Change Photo</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={s.form}>
                    <Text style={s.label}>Full Name</Text>
                    <TextInput
                        style={s.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="John Doe"
                    />

                    <Text style={s.label}>Phone Number</Text>
                    <TextInput
                        style={s.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="e.g. 9876543210"
                        keyboardType="phone-pad"
                    />

                    <Text style={s.label}>Email Address</Text>
                    <TextInput
                        style={[s.input, s.inputDisabled]}
                        value={user?.email}
                        editable={false}
                    />
                    <Text style={s.helpText}>Email cannot be changed.</Text>
                </View>

                <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2FF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
    content: { padding: 20 },
    
    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 16 },
    avatar: { width: '100%', height: '100%', borderRadius: 55 },
    avatarInit: { fontSize: 40, fontWeight: '800', color: PURPLE },
    changePhotoBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EEF0FF', borderRadius: 20 },
    changePhotoTxt: { color: PURPLE, fontWeight: '700', fontSize: 14 },

    form: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    label: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#F5F6FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1a1a2e', marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
    inputDisabled: { backgroundColor: '#eee', color: '#888' },
    helpText: { fontSize: 12, color: '#aaa', marginTop: -14, marginBottom: 20 },

    saveBtn: { backgroundColor: PURPLE, padding: 16, borderRadius: 14, alignItems: 'center', elevation: 4, shadowColor: PURPLE, shadowOpacity: 0.3, shadowRadius: 8 },
    saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
