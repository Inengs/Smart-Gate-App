import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebaseConfig';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const CustomLightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: Colors.light.primary || '#6200EE',
      background: Colors.light.background || '#FFFFFF',
      onSurface: Colors.light.text || '#333333',
      elevation: { level0: 'transparent', level1: '#f5f5f5', level2: '#eeeeee', level3: '#e0e0e0', level4: '#d5d5d5', level5: '#cccccc' },
    },
  };
  const CustomDarkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: Colors.dark.primary || '#BB86FC',
      background: Colors.dark.background || '#121212',
      onSurface: Colors.dark.text || '#FFFFFF',
      elevation: { level0: 'transparent', level1: '#2c2c2c', level2: '#333333', level3: '#3a3a3a', level4: '#424242', level5: '#4a4a4a' },
    },
  };

  const theme = colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme;
  console.log('Theme colors:', theme.colors);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <PaperProvider theme={theme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PaperProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}












// // app/_layout.jsx
// import React, { useState, useEffect } from 'react';
// import { Stack } from 'expo-router';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../src/firebaseConfig';
// import { ActivityIndicator, View } from 'react-native';
// import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper'; // Import MD3 themes
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { Colors } from '../constants/Colors';
// import { useColorScheme } from '../hooks/useColorScheme';
// import { suppressFindDOMNodeWarning } from '../src/utils/suppressWarnings';

// console.log('Imported suppressFindDOMNodeWarning:', suppressFindDOMNodeWarning);

// const CustomLightTheme = {
//   ...MD3LightTheme,
//   colors: {
//     ...MD3LightTheme.colors,
//     primary: Colors.light.primary, // #F5A623
//     secondary: Colors.light.secondary, // #D88C1A
//     background: Colors.light.background, // #f5f5f5
//     surface: Colors.light.card, // #fff
//     onSurface: Colors.light.text, // #333
//     text: Colors.light.text, // #333
//     onPrimary: '#fff', // White text on primary buttons
//     elevation: {
//       level0: Colors.light.card, // #fff
//       level1: Colors.light.card,
//       level2: Colors.light.card,
//     },
//   },
// };

// const CustomDarkTheme = {
//   ...MD3DarkTheme,
//   colors: {
//     ...MD3DarkTheme.colors,
//     primary: Colors.dark.primary, // #F5A623
//     secondary: Colors.dark.secondary, // #D88C1A
//     background: Colors.dark.background, // #1a1a1a
//     surface: Colors.dark.card, // #2a2a2a
//     onSurface: Colors.dark.text, // #fff
//     text: Colors.dark.text, // #fff
//     onPrimary: '#fff', // White text on primary buttons
//     elevation: {
//       level0: Colors.dark.card, // #2a2a2a
//       level1: Colors.dark.card,
//       level2: Colors.dark.card,
//     },
//   },
// };

// export default function RootLayout() {
//   const [user, setUser] = useState(null);
//   const [initializing, setInitializing] = useState(true);
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme;

//   useEffect(() => {
//     console.log('useEffect running, initializing:', initializing);
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       console.log('Auth state changed, user:', currentUser);
//       setUser(currentUser);
//       if (initializing) setInitializing(false);
//     });
//     return unsubscribe;
//   }, []);

//   if (initializing) {
//     return (
//       <PaperProvider theme={theme}>
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//           <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
//         </View>
//       </PaperProvider>
//     );
//   }



//   try {
//     suppressFindDOMNodeWarning();
//   } catch (error) {
//     console.error('Failed to run suppressFindDOMNodeWarning:', error);
//   }

//   return (
//     // <GestureHandlerRootView style={{ flex: 1 }}>
//     <PaperProvider theme={theme}> {/* Apply theme here */}
//       <Stack>
//         <Stack.Screen name="index" options={{ headerShown: false }} /> {/* Landing page */}
//         <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
//         {/* {user && ( */}
//         <Stack.Screen
//           name="(tabs)"
//           options={{ headerShown: false, gestureEnabled: false }}
//         />
//         {/* )} */}
//       </Stack>
//     </PaperProvider>
//     // {/* </GestureHandlerRootView> */ }
//   );
// }
