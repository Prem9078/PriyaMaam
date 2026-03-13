import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Image, Platform
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { createCourse } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function AddCourseScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return showAlert('Permission needed', 'Allow access to photo library.');
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [16, 9], quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleCreate = async () => {
        if (!title || !desc) return showAlert('Error', 'Title and description are required.');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', desc);
            formData.append('price', price || '0');
            if (image) {
                formData.append('thumbnailImage', {
                    uri: image.uri,
                    type: 'image/jpeg',
                    name: 'thumbnail.jpg',
                });
            }
            await createCourse(formData);
            showAlert('✅ Created!', 'Course created successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to create course.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle}>Add Course</Text>
                <View style={{ width: 50 }} />
            </View>
            <KeyboardAwareScrollView
                contentContainerStyle={{ padding: 20 }}
                enableOnAndroid={true}
                extraScrollHeight={20}
            >
                <Text style={s.label}>Course Title *</Text>
                <TextInput style={s.input} placeholder="e.g. Complete C# Course" value={title} onChangeText={setTitle} />

                <Text style={s.label}>Description *</Text>
                <TextInput style={[s.input, s.textArea]} placeholder="What will students learn?" value={desc}
                    onChangeText={setDesc} multiline numberOfLines={4} />

                <Text style={s.label}>Price (₹)</Text>
                <TextInput style={s.input} placeholder="0 for free" value={price}
                    onChangeText={setPrice} keyboardType="numeric" />

                <Text style={s.label}>Thumbnail Image</Text>
                <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
                    {image
                        ? <Image source={{ uri: image.uri }} style={s.previewImage} />
                        : <Text style={s.imagePickerText}>📷 Tap to select image</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={s.btn} onPress={handleCreate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Course</Text>}
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 4 },
    input: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14,
        marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0', color: '#1a1a2e'
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    imagePicker: {
        backgroundColor: '#fff', borderRadius: 12, height: 160, justifyContent: 'center',
        alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#E0E0E0',
        borderStyle: 'dashed', overflow: 'hidden'
    },
    imagePickerText: { color: '#999', fontSize: 15 },
    previewImage: { width: '100%', height: '100%' },
    btn: {
        backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
        alignItems: 'center', marginBottom: 30
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
