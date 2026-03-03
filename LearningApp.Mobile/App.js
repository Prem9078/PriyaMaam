import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { AppAlertHost } from './src/components/AppAlert';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <AuthProvider>
      <RootNavigator />
      <AppAlertHost />
    </AuthProvider>
  );
}
