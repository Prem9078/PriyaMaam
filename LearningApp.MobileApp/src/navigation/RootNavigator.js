import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Student Screens
import HomeScreen from '../screens/student/HomeScreen';
import CourseDetailScreen from '../screens/student/CourseDetailScreen';
import LessonsScreen from '../screens/student/LessonsScreen';
import LessonScreen from '../screens/student/LessonScreen';
import QuizScreen from '../screens/student/QuizScreen';
import ResultScreen from '../screens/student/ResultScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import EditProfileScreen from '../screens/student/EditProfileScreen';
import CertificatesScreen from '../screens/student/CertificatesScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import OfflineMaterialsScreen from '../screens/student/OfflineMaterialsScreen';
import QuizHistoryScreen from '../screens/student/QuizHistoryScreen';
import LeaderboardScreen from '../screens/student/LeaderboardScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageCoursesScreen from '../screens/admin/ManageCoursesScreen';
import AddCourseScreen from '../screens/admin/AddCourseScreen';
import ManageLessonsScreen from '../screens/admin/ManageLessonsScreen';
import ManageLessonDetailScreen from '../screens/admin/ManageLessonDetailScreen';
import AddLessonScreen from '../screens/admin/AddLessonScreen';
import AddQuizScreen from '../screens/admin/AddQuizScreen';
import EditCourseScreen from '../screens/admin/EditCourseScreen';
import EditQuizScreen from '../screens/admin/EditQuizScreen';
import ManageStudentsScreen from '../screens/admin/ManageStudentsScreen';
import StudentDetailScreen from '../screens/admin/StudentDetailScreen';
import SendAnnouncementScreen from '../screens/admin/SendAnnouncementScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Stack ──────────────────────────────────────────────────────────────
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
);

// ─── Student Tab Navigator ────────────────────────────────────────────────────
const StudentTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#6C63FF',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee' },
            tabBarIcon: ({ color, size }) => {
                const icons = {
                    Home: 'home-outline',
                    History: 'time-outline',
                    Profile: 'person-outline',
                };
                return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
            },
        })}
    >
        <Tab.Screen name="Home" component={StudentStack} />
        <Tab.Screen name="History" component={HistoryStack} />
        <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
);

// ─── Profile Stack ────────────────────────────────────────────────────────────
const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileMain" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Certificates" component={CertificatesScreen} />
        <Stack.Screen name="OfflineMaterials" component={OfflineMaterialsScreen} />
    </Stack.Navigator>
);

// ─── Student Main Stack ───────────────────────────────────────────────────────
const StudentStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeMain" component={HomeScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <Stack.Screen name="Lessons" component={LessonsScreen} />
        <Stack.Screen name="Lesson" component={LessonScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
        <Stack.Screen name="Certificates" component={CertificatesScreen} />
    </Stack.Navigator>
);

// ─── History Tab Stack ────────────────────────────────────────────────────────
const HistoryStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="QuizHistory" component={QuizHistoryScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
);

// ─── Admin Stack ─────────────────────────────────────────────────────────────
const AdminStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ManageCourses" component={ManageCoursesScreen} />
        <Stack.Screen name="AddCourse" component={AddCourseScreen} />
        <Stack.Screen name="ManageLessons" component={ManageLessonsScreen} />
        <Stack.Screen name="ManageLessonDetail" component={ManageLessonDetailScreen} />
        <Stack.Screen name="AddLesson" component={AddLessonScreen} />
        <Stack.Screen name="AddQuiz" component={AddQuizScreen} />
        <Stack.Screen name="EditQuiz" component={EditQuizScreen} />
        <Stack.Screen name="EditCourse" component={EditCourseScreen} />
        <Stack.Screen name="ManageStudents" component={ManageStudentsScreen} />
        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
        <Stack.Screen name="SendAnnouncement" component={SendAnnouncementScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
    </Stack.Navigator>
);

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6C63FF' }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    if (user?.role === 'Student') {
        return <StudentTabs />;
    }

    if (user?.role === 'Admin') {
        return <AdminStack />;
    }

    // Not logged in or unknown role → show Auth screens
    return <AuthStack />;
}
