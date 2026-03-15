import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ResultScreen({ route, navigation }) {
    const { result, lessonTitle, quizId, quizTitle } = route.params;
    const { score, totalQuestions, correctAnswers } = result;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 60;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
            {/* Score Circle */}
            <View style={[styles.scoreCircle, { borderColor: passed ? '#27ae60' : '#e74c3c' }]}>
                <Text style={[styles.scoreNum, { color: passed ? '#27ae60' : '#e74c3c' }]}>{percentage}%</Text>
                <Text style={styles.scoreLabel}>{score}/{totalQuestions} correct</Text>
            </View>

            <Text style={[styles.status, { color: passed ? '#27ae60' : '#e74c3c' }]}>
                {passed ? '🎉 Passed!' : '😔 Try Again'}
            </Text>
            <Text style={styles.lessonName}>{lessonTitle}</Text>

            {/* Correct Answers Review */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Correct Answers</Text>
                {Object.entries(correctAnswers).map(([qId, ans], idx) => (
                    <View key={qId} style={styles.answerRow}>
                        <Text style={styles.answerQ}>Question {idx + 1}</Text>
                        <Text style={styles.answerVal}>{ans}</Text>
                    </View>
                ))}
            </View>

            {/* Leaderboard Button */}
            {quizId && (
                <TouchableOpacity
                    style={styles.leaderBtn}
                    onPress={() => navigation.navigate('Leaderboard', { quizId, quizTitle: quizTitle || lessonTitle })}
                >
                    <Ionicons name="trophy-outline" size={18} color="#6C63FF" />
                    <Text style={styles.leaderBtnText}>View Leaderboard</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('HomeMain')}>
                <Text style={styles.homeBtnText}>🏠 Back to Home</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    inner: { alignItems: 'center', padding: 28, paddingTop: 60 },
    scoreCircle: {
        width: 150, height: 150, borderRadius: 75, borderWidth: 6,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    scoreNum: { fontSize: 36, fontWeight: '800' },
    scoreLabel: { fontSize: 13, color: '#666', marginTop: 2 },
    status: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
    lessonName: { fontSize: 14, color: '#888', marginBottom: 30, textAlign: 'center' },
    section: {
        width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 16,
        marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
    answerRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    answerQ: { fontSize: 14, color: '#555' },
    answerVal: { fontSize: 14, fontWeight: '700', color: '#6C63FF' },
    leaderBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', borderWidth: 2, borderColor: '#6C63FF', borderRadius: 14,
        padding: 14, marginBottom: 12,
    },
    leaderBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
    homeBtn: {
        backgroundColor: '#6C63FF', borderRadius: 14, padding: 16,
        width: '100%', alignItems: 'center',
    },
    homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
