import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { getQuizById, submitQuiz } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

export default function QuizScreen({ route, navigation }) {
    const { quizId, quizTitle, lessonTitle } = route.params;
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getQuizById(quizId)
            .then(res => setQuiz(res.data))
            .catch(() => showAlert('Error', 'Could not load quiz.'))
            .finally(() => setLoading(false));
    }, [quizId]);


    const selectAnswer = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            return showAlert('Incomplete', 'Please answer all questions before submitting.');
        }
        setSubmitting(true);
        try {
            const res = await submitQuiz({ quizId: quiz.id, answers });
            navigation.replace('Result', { result: res.data, lessonTitle });
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Submission failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
    if (!quiz) return <View style={styles.center}><Text style={styles.noQuiz}>No quiz available.</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{quizTitle || lessonTitle}</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {quiz.questions.map((q, idx) => (
                    <View key={q.id} style={styles.questionCard}>
                        <Text style={styles.qNum}>Q{idx + 1}.</Text>
                        <Text style={styles.qText}>{q.questionText}</Text>
                        {['A', 'B', 'C', 'D'].map(opt => {
                            const text = q[`option${opt}`];
                            const selected = answers[q.id] === opt;
                            return (
                                <TouchableOpacity key={opt} style={[styles.option, selected && styles.optionSelected]}
                                    onPress={() => selectAnswer(q.id, opt)}>
                                    <Text style={[styles.optLabel, selected && styles.optLabelSelected]}>{opt}</Text>
                                    <Text style={[styles.optText, selected && styles.optTextSelected]}>{text}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Quiz</Text>}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noQuiz: { color: '#999', fontSize: 15 },
    header: {
        backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12
    },
    back: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
    questionCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4
    },
    qNum: { fontSize: 12, color: '#6C63FF', fontWeight: '700', marginBottom: 4 },
    qText: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 14, lineHeight: 22 },
    option: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12,
        marginBottom: 8, backgroundColor: '#F5F6FA', borderWidth: 1.5, borderColor: '#E0E0E0'
    },
    optionSelected: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
    optLabel: {
        width: 26, height: 26, borderRadius: 13, backgroundColor: '#E0E0E0',
        textAlign: 'center', lineHeight: 26, fontWeight: '700', fontSize: 13, marginRight: 10, color: '#555'
    },
    optLabelSelected: { backgroundColor: 'rgba(255,255,255,0.3)', color: '#fff' },
    optText: { flex: 1, fontSize: 14, color: '#333' },
    optTextSelected: { color: '#fff' },
    submitBtn: {
        backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
        alignItems: 'center', marginBottom: 30, marginTop: 4
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
