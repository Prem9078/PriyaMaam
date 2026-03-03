import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { createQuiz } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

const EMPTY_QUESTION = () => ({
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A',
});

export default function AddQuizScreen({ route, navigation }) {
    const { lessonId, lessonTitle } = route.params;
    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState([EMPTY_QUESTION()]);
    const [loading, setLoading] = useState(false);

    const updateQ = (idx, field, value) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
    };

    const addQuestion = () => setQuestions(prev => [...prev, EMPTY_QUESTION()]);
    const removeQuestion = (idx) => setQuestions(prev => prev.filter((_, i) => i !== idx));

    const handleSubmit = async () => {
        if (!quizTitle.trim())
            return showAlert('Incomplete', 'Please enter a quiz title.');
        for (const q of questions) {
            if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD)
                return showAlert('Incomplete', 'Please fill all fields for every question.');
        }
        setLoading(true);
        try {
            await createQuiz({ lessonId, title: quizTitle, questions });
            showAlert('✅ Quiz Created!', `${questions.length} questions added.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to create quiz.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>Add Quiz</Text>
                <View style={{ width: 50 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={s.info}><Text style={s.infoText}>📝 Lesson: {lessonTitle}</Text></View>

                <TextInput
                    style={[s.input, { marginBottom: 16, fontSize: 15, fontWeight: '600' }]}
                    placeholder="Quiz Title (e.g. Chapter 1 Test)"
                    value={quizTitle}
                    onChangeText={setQuizTitle}
                />
                {questions.map((q, idx) => (
                    <View key={idx} style={s.questionCard}>
                        <View style={s.questionHeader}>
                            <Text style={s.questionNum}>Question {idx + 1}</Text>
                            {questions.length > 1 && (
                                <TouchableOpacity onPress={() => removeQuestion(idx)}>
                                    <Text style={s.removeBtn}>✕ Remove</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TextInput style={s.input} placeholder="Question text" value={q.questionText}
                            onChangeText={v => updateQ(idx, 'questionText', v)} multiline />
                        {['A', 'B', 'C', 'D'].map(opt => (
                            <TextInput key={opt} style={s.input} placeholder={`Option ${opt}`}
                                value={q[`option${opt}`]} onChangeText={v => updateQ(idx, `option${opt}`, v)} />
                        ))}
                        <Text style={s.label}>Correct Answer:</Text>
                        <View style={s.answerRow}>
                            {['A', 'B', 'C', 'D'].map(opt => (
                                <TouchableOpacity key={opt} style={[s.ansBtn, q.correctAnswer === opt && s.ansBtnActive]}
                                    onPress={() => updateQ(idx, 'correctAnswer', opt)}>
                                    <Text style={[s.ansBtnText, q.correctAnswer === opt && s.ansBtnTextActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={s.addQBtn} onPress={addQuestion}>
                    <Text style={s.addQBtnText}>+ Add Another Question</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Save Quiz ({questions.length} Q)</Text>}
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
    info: { backgroundColor: '#EEF0FF', borderRadius: 12, padding: 12, marginBottom: 16 },
    infoText: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },
    questionCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4
    },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    questionNum: { fontSize: 14, fontWeight: '800', color: '#6C63FF' },
    removeBtn: { color: '#e74c3c', fontSize: 13, fontWeight: '600' },
    label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 4 },
    input: {
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 11,
        fontSize: 13, marginBottom: 8, backgroundColor: '#FAFAFA', color: '#1a1a2e'
    },
    answerRow: { flexDirection: 'row', gap: 10 },
    ansBtn: { flex: 1, borderRadius: 10, padding: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
    ansBtnActive: { backgroundColor: '#6C63FF' },
    ansBtnText: { fontWeight: '700', color: '#555' },
    ansBtnTextActive: { color: '#fff' },
    addQBtn: {
        borderWidth: 2, borderColor: '#6C63FF', borderStyle: 'dashed', borderRadius: 12,
        padding: 14, alignItems: 'center', marginBottom: 14
    },
    addQBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
    submitBtn: {
        backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
        alignItems: 'center', marginBottom: 30
    },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
