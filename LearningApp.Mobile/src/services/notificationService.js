import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import api from './api';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications;
if (!isExpoGo) {
    // Only require push notifications in standalone builds (APK/AAB)
    // Expo Go removes push notification native modules causing a hard crash
    Notifications = require('expo-notifications');
}

// ── How to display notification when app is in FOREGROUND ──────────────────
if (!isExpoGo && Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

/**
 * Ask permission, get Expo push token, and register it with the API.
 * Call this after the user logs in.
 * @returns {Promise<string|null>} The Expo push token, or null if failed.
 */
export async function registerForPushNotifications() {
    if (!Notifications) {
        console.log('[Notifications] Skipped — module not available (Expo Go).');
        return null;
    }
    try {
        // Must be a real device — emulators can't receive push notifications
        if (!Device.isDevice) {
            console.log('[Notifications] Skipped — not a real device.');
            return null;
        }

        console.log('[Notifications] Requesting permission...');

        // Request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission denied.');
            return null;
        }

        console.log('[Notifications] Permission granted. Getting token...');

        // Android requires a notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'LearningApp',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4A90D9',
            });
        }

        // Get the projectId from app.json extras (required in SDK 49+)
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId) {
            console.warn('[Notifications] No projectId found in app.json extra.eas.projectId');
            return null;
        }

        // Get the Expo Push Token
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('[Notifications] Push Token:', token);

        // Save token to our .NET API
        try {
            await api.post('/api/notifications/register-token', { token });
            console.log('[Notifications] Token registered with API successfully.');
        } catch (err) {
            console.warn('[Notifications] Failed to register token with API:', err?.response?.status, err?.message);
        }

        return token;
    } catch (err) {
        console.error('[Notifications] Unexpected error in registerForPushNotifications:', err?.message);
        return null;
    }
}

/**
 * Setup listeners for notification interactions.
 * - Foreground: notification received while app is open.
 * - Tap: user taps a notification to open the app.
 *
 * @param {object} navigationRef - React Navigation ref (optional, for deep linking on tap)
 */
export function setupNotificationListeners(navigationRef) {
    if (!Notifications) return () => {};

    // Listener 1: notification received while app is OPEN (foreground)
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Notifications] Received in foreground:', notification.request.content.title);
    });

    // Listener 2: user TAPPED a notification (from background or closed state)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('[Notifications] Tapped, data:', data);

        // Deep link: navigate to the screen specified in notification data
        if (navigationRef?.isReady() && data?.screen) {
            try {
                navigationRef.navigate(data.screen, data);
            } catch (e) {
                console.warn('[Notifications] Navigation error:', e.message);
            }
        }
    });

    // Return a cleanup function to remove listeners when component unmounts
    return () => {
        receivedListener.remove();
        responseListener.remove();
    };
}
