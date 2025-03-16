import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebaseConfig';
import { ActivityIndicator, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} /> {/* Landing page */}
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
          {user && (
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false, gestureEnabled: false }}
            />
          )}
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}


{/* <GestureHandlerRootView style={{ flex: 1 }}>
<PaperProvider>
  <Stack>
    {user ? (
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    ) : (
      <Stack.Screen
        name="login"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    )}
  </Stack>
</PaperProvider>
</GestureHandlerRootView> */}