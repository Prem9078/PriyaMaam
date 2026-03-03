import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.31.145:5005';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Logout callback (set by AuthContext) ─────────────────────────────────────
// This lets api.js trigger logout without importing React context
let _logoutCallback = null;
export const setLogoutCallback = (fn) => { _logoutCallback = fn; };

const forceLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    if (_logoutCallback) _logoutCallback();
};

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

// ─── Response Interceptor — on 401, try refresh once then force logout ────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retried) {
            originalRequest._retried = true;
            const currentToken = await AsyncStorage.getItem('token');

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

// ─── Lessons ─────────────────────────────────────────────────────────────────
export const getLessons = (courseId) => api.get(`/api/lessons/${courseId}`);
export const createLesson = (data) => api.post('/api/lessons', data);
export const updateLesson = (id, data) => api.put(`/api/lessons/${id}`, data);

// ─── Lesson Materials ─────────────────────────────────────────────────────────
export const getMaterials = (lessonId) => api.get(`/api/materials/${lessonId}`);
export const uploadMaterial = (lessonId, formData) => api.post(`/api/materials/${lessonId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteMaterial = (materialId) => api.delete(`/api/materials/${materialId}`);

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const getQuizzes = (lessonId) => api.get(`/api/quiz/${lessonId}`);
export const getQuizById = (quizId) => api.get(`/api/quiz/take/${quizId}`);
export const createQuiz = (data) => api.post('/api/quiz', data);
export const deleteQuiz = (quizId) => api.delete(`/api/quiz/${quizId}`);
export const submitQuiz = (data) => api.post('/api/quiz/submit', data);

export default api;
