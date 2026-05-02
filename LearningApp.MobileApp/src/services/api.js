import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

//const BASE_URL = 'https://p01--soham-sir--jzlk2868lbzn.code.run';
export const BASE_URL = 'http://192.168.31.145:5005';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // 15 seconds — prevent hung requests from freezing the UI
    headers: { 'Content-Type': 'application/json' },
});

// ─── Logout callback (set by AuthContext) ─────────────────────────────────────
let _logoutCallback = null;
export const setLogoutCallback = (fn) => { _logoutCallback = fn; };

const forceLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('last_active_at');
    if (_logoutCallback) _logoutCallback();
};

// ─── 7-Day Inactivity Tracking ────────────────────────────────────────────────
export const LAST_ACTIVE_KEY = 'last_active_at';
export const INACTIVITY_DAYS = 7;

/** Touch the last-active timestamp — called on every successful API response */
export async function updateLastActive() {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

/** Returns true if the user has been inactive for more than INACTIVITY_DAYS */
export async function isInactivityExpired() {
    const raw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) return false; // no record yet — don't force logout on first install
    const lastActive = parseInt(raw, 10);
    const diffDays = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
    return diffDays > INACTIVITY_DAYS;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Decode JWT payload without any library */
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

/** Return seconds until token expires (negative = already expired) */
export function secondsUntilExpiry(token) {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return -1;
    return decoded.exp - Math.floor(Date.now() / 1000);
}

/** Returns true if token is expired */
export function isTokenExpired(token) {
    return secondsUntilExpiry(token) <= 0;
}

let isRefreshing = false;

/** Silently call the refresh endpoint and persist the new token */
async function refreshToken(currentToken) {
    if (isRefreshing) return null;
    isRefreshing = true;
    try {
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${currentToken}` },
        });
        const newToken = res.data.token;
        await AsyncStorage.setItem('token', newToken);
        return newToken;
    } catch {
        return null;
    } finally {
        isRefreshing = false;
    }
}

// ─── Request Interceptor — attach token + sliding refresh ────────────────────
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        // Sliding session: silently refresh if < 10 min left
        const secsLeft = secondsUntilExpiry(token);
        if (secsLeft > 0 && secsLeft < 600) {
            refreshToken(token); // fire-and-forget
        }
    }
    return config;
});

// ─── Response Interceptor — touch inactivity timer + handle 401 ──────────────
api.interceptors.response.use(
    (response) => {
        // Every successful API call = user is active → refresh the 7-day timer
        updateLastActive();
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Skip 401 interceptor for login/register/notification endpoints
        // — notifications endpoints are called during login/logout flows and
        //   must NOT trigger forceLogout (would wipe a freshly-set session)
        const skipUrls = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/notifications/clear-token',
            '/api/notifications/register-token',
        ];
        const isSkippedEndpoint = skipUrls.some(u => originalRequest.url?.includes(u));

        if (error.response?.status === 401 && !originalRequest._retried && !isSkippedEndpoint) {
            originalRequest._retried = true;
            const tokenAtRequestTime = originalRequest.headers?.Authorization?.replace('Bearer ', '');
            const currentToken = await AsyncStorage.getItem('token');

            // If a fresh login has already stored a NEW token, don't log out
            if (currentToken && currentToken !== tokenAtRequestTime) {
                // A new session was established while this request was in-flight — ignore this 401
                return Promise.reject(error);
            }

            if (currentToken) {
                const newToken = await refreshToken(currentToken);
                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            }

            // Refresh failed — token is truly expired, force logout
            await forceLogout();
        }

        return Promise.reject(error);
    }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const sendOtp = (email) => api.post('/api/auth/send-otp', { email });
export const verifyOtp = (email, otp) => api.post('/api/auth/verify-otp', { email, otp });
export const updateProfile = (data) => api.put('/api/auth/profile', data);
export const uploadAvatar = (formData) => api.post('/api/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

// ─── Courses ──────────────────────────────────────────────────────────────────
export const getCourses = () => api.get('/api/courses');
export const getCourse = (id) => api.get(`/api/courses/${id}`);
export const enrollCourse = (id) => api.post(`/api/courses/enroll/${id}`);
export const createCourse = (formData) => api.post('/api/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateCourse = (id, formData) => api.put(`/api/courses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteCourse = (id) => api.delete(`/api/courses/${id}`);
export const toggleCourseFree = (id) => api.patch(`/api/courses/${id}/toggle-free`);

// ─── Payment (Razorpay) ───────────────────────────────────────────────────────
export const createPaymentOrder = (courseId) => api.post('/api/payment/create-order', { courseId });
export const verifyPayment = (data) => api.post('/api/payment/verify', data);

// ─── Lessons ─────────────────────────────────────────────────────────────────
export const getLessons = (courseId) => api.get(`/api/lessons/${courseId}`);
export const getLessonById = (id) => api.get(`/api/lessons/single/${id}`);
export const createLesson = (data) => api.post('/api/lessons', data);
export const updateLesson = (id, data) => api.put(`/api/lessons/${id}`, data);
export const deleteLesson = (id) => api.delete(`/api/lessons/${id}`);

// ─── Lesson Materials ─────────────────────────────────────────────────────────
export const getMaterials = (lessonId) => api.get(`/api/materials/${lessonId}`);
export const uploadMaterial = (lessonId, formData) => api.post(`/api/materials/${lessonId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteMaterial = (materialId) => api.delete(`/api/materials/${materialId}`);

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const getQuizzes = (lessonId) => api.get(`/api/quiz/${lessonId}`);
export const getQuizAdmin = (quizId) => api.get(`/api/quiz/admin/${quizId}`);
export const updateQuiz = (quizId, data) => api.put(`/api/quiz/${quizId}`, data);
export const getQuizById = (quizId) => api.get(`/api/quiz/take/${quizId}`);
export const createQuiz = (data) => api.post('/api/quiz', data);
export const deleteQuiz = (quizId) => api.delete(`/api/quiz/${quizId}`);
export const submitQuiz = (data) => api.post('/api/quiz/submit', data);
export const getMyQuizHistory = () => api.get('/api/quiz/history');
export const getLeaderboard = (quizId) => api.get(`/api/quiz/${quizId}/leaderboard`);

// ─── Notifications ────────────────────────────────────────────────────────────
export const registerPushToken = (token) => api.post('/api/notifications/register-token', { token });
export const sendBroadcast = (title, message) => api.post('/api/notifications/broadcast', { title, message });
export const getNotifications = () => api.get('/api/notifications');
export const markNotificationRead = (id) => api.put(`/api/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/api/notifications/read-all');

// ─── Certificates ─────────────────────────────────────────────────────────────
export const getCertificates = () => api.get('/api/certificates');

// ─── Admin Management ─────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/api/admin/dashboard-stats');
export const getStudents = () => api.get('/api/admin/students');
export const getStudentEnrollments = (userId) => api.get(`/api/admin/students/${userId}/enrollments`);
export const getStudentQuizPerformance = (userId) => api.get(`/api/admin/students/${userId}/quiz-performance`);
export const enrollStudent = (userId, courseId) => api.post(`/api/admin/students/${userId}/enroll/${courseId}`);
export const revokeStudentEnrollment = (userId, courseId) => api.delete(`/api/admin/students/${userId}/enroll/${courseId}`);

// ─── Student Learning Features ────────────────────────────────────────────────
export const markLessonComplete = (lessonId) => api.post(`/api/learning/progress/${lessonId}`);
export const getLessonComments = (lessonId) => api.get(`/api/learning/lessons/${lessonId}/comments`);
export const postLessonComment = (lessonId, text) => api.post(`/api/learning/lessons/${lessonId}/comments`, { text });

export default api;
