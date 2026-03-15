import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { AppAlertHost } from './src/components/AppAlert';
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from './src/services/notificationService';

// Inner component that has access to auth context
function AppContent({ navigationRef }) {
  const { user } = useAuth();

  useEffect(() => {
    // Register push token whenever a user logs in
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  useEffect(() => {
    // Setup notification tap listeners (deep link on tap)
    const cleanup = setupNotificationListeners(navigationRef.current);
    return cleanup;
  }, []);

  return (
    <>
      <RootNavigator />
      <AppAlertHost />
    </>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const navigationRef = useRef(null);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <AppContent navigationRef={navigationRef} />
      </NavigationContainer>
    </AuthProvider>
  );
}
