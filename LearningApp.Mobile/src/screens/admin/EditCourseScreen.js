import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Image, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateCourse } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function EditCourseScreen({ route, navigation }) {
    const { course } = route.params;

    const [title, setTitle] = useState(course.title);
    const [desc, setDesc] = useState(course.description);
    const [price, setPrice] = useState(String(course.price ?? '0'));
    const [isFree, setIsFree] = useState(course.isFree ?? true);
    const [image, setImage] = useState(null);        // new image picked
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

    const handleSave = async () => {
        if (!title || !desc) return showAlert('Error', 'Title and description are required.');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', desc);
            formData.append('price', isFree ? '0' : (price || '0'));
            formData.append('isFree', String(isFree));
            if (image) {
                formData.append('thumbnailImage', {
                    uri: image.uri,
                    type: 'image/jpeg',
                    name: 'thumbnail.jpg',
                });
            }
            await updateCourse(course.id, formData);
            showAlert('✅ Saved!', 'Course updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to update course.');
        } finally {
            setLoading(false);
        }
    };

    // Thumbnail to preview: new pick OR existing URL
    const previewUri = image ? image.uri : course.thumbnailUrl;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={s.back}>← Back</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle}>Edit Course</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

                {/* Thumbnail */}
                <Text style={s.label}>Thumbnail Image</Text>
                <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
                    {previewUri ? (
                        <>
                            <Image source={{ uri: previewUri }} style={s.previewImage} />
                            <View style={s.changeOverlay}>
                                <Text style={s.changeText}>📷 Tap to change</Text>
                            </View>
                        </>
                    ) : (
                        <Text style={s.imagePickerText}>📷 Tap to select image</Text>
                    )}
                </TouchableOpacity>

                {/* Title */}
                <Text style={s.label}>Course Title *</Text>
                <TextInput
                    style={s.input}
                    placeholder="e.g. Complete Hindi Literature"
                    value={title}
                    onChangeText={setTitle}
                />

                {/* Description */}
                <Text style={s.label}>Description *</Text>
                <TextInput
                    style={[s.input, s.textArea]}
                    placeholder="What will students learn?"
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    numberOfLines={4}
                />

                {/* Free / Paid toggle */}
                <View style={s.toggleRow}>
                    <View>
                        <Text style={s.label}>Access Type</Text>
                        <Text style={s.toggleSub}>
                            {isFree ? '🎁 Free — students can access for free' : '💎 Paid — students must pay'}
                        </Text>
                    </View>
                    <Switch
                        value={isFree}
                        onValueChange={setIsFree}
                        trackColor={{ false: '#FF6B35', true: '#00C853' }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Price (only if paid) */}
                {!isFree && (
                    <>
                        <Text style={s.label}>Price (₹)</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Enter price"
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                        />
                    </>
                )}

                {/* Save */}
                <TouchableOpacity style={s.btn} onPress={handleSave} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.btnText}>Save Changes</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
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
    textArea: { height: 110, textAlignVertical: 'top' },
    imagePicker: {
        backgroundColor: '#fff', borderRadius: 12, height: 170,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', overflow: 'hidden'
    },
    imagePickerText: { color: '#999', fontSize: 15 },
    previewImage: { width: '100%', height: '100%' },
    changeOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 8, alignItems: 'center'
    },
    changeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    toggleRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: '#E0E0E0'
    },
    toggleSub: { fontSize: 12, color: '#888', marginTop: 3, maxWidth: 220 },
    btn: {
        backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
        alignItems: 'center', marginBottom: 30, marginTop: 8
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
