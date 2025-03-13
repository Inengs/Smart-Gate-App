import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebaseConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and Password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // No navigation needed; _layout.jsx will redirect
    } catch (error) {
      setError('Login Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Gate App</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
        Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { marginBottom: 16 },
  error: { color: 'red', marginBottom: 16 },
  button: { marginTop: 8 },
});
























































// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet } from 'react-native';
// import { TextInput, Button, Text } from 'react-native-paper';
// import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from './firebaseConfig';
// import { useRouter } from 'expo-router';

// const LoginScreen = ({ }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         router.replace('/HomeScreen')
//       }
//     });
//     return () => unsubscribe()
//   }, []);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       setError('Email and Password are required');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//       // navigation.navigate('Home');
//     } catch (error) {
//       setError('Login Failed: ' + error.message)
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Smart Gate App</Text>

//       <TextInput
//         label="Email"
//         value={email}
//         onChangeText={setEmail}
//         mode='outlined'
//         style={styles.input}
//       />

//       <TextInput
//         label="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//         mode='outlined'
//         style={styles.input}
//       />

//       {error ? <Text style={styles.error}>{error}</Text> : null}

//       <Button
//         mode="contained"
//         onPress={handleLogin}
//         loading={loading}
//         style={styles.button}
//       >
//         Login
//       </Button>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   input: {
//     marginBottom: 16,
//   },
//   error: {
//     color: 'red',
//     marginBottom: 16,
//   },
//   button: {
//     marginTop: 8,
//   },
// });

// export default LoginScreen

