import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebaseConfig';
import { Link, useRouter } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter()

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
  const isFormValid = () => validateEmail(email) && password.length > 0;

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and Password are required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('(tabs)/HomeScreen')
    } catch (error) {
      let errorMessage = 'Login Failed';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Try again later.';
          break;
        default:
          errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Gate App</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Email input"
        accessibilityHint="Enter your email address"
      />
      {email.length > 0 && !validateEmail(email) && (
        <HelperText type="error" visible={true}>
          Please enter a valid email address
        </HelperText>
      )}

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        accessibilityLabel="Password input"
        accessibilityHint="Enter your password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading || !isFormValid()}
        style={styles.button}
      >
        Login
      </Button>

      <Link href="/forgot-password" style={styles.forgotLink}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </Link>

      <View style={styles.registerContainer}>
        <Text>Don't have an account? </Text>
        <Link href="/register" style={styles.registerLink}>
          <Text style={styles.registerText}>Register</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5', // Light background for polish
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  error: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
    backgroundColor: '#6200ee', // Consistent with Material Design
  },
  forgotLink: {
    marginTop: 12,
    alignSelf: 'center',
  },
  forgotText: {
    color: '#2196F3',
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});




