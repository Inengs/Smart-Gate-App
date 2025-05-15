import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebaseConfig';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

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
    <LinearGradient
      colors={[Colors.light.primary, Colors.light.secondary]}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Log In</Text>

        <TextInput
          label="Enter your email address"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Email input"
          accessibilityHint="Enter your email address"
          theme={{ colors: { primary: '#fff', text: '#fff', placeholder: '#fff' } }}
          outlineColor="rgba(255, 255, 255, 0.3)"
          textColor="#fff"
        />

        {email.length > 0 && !validateEmail(email) && (
          <HelperText type="error" style={styles.helperText}>
            Please enter a valid email address
          </HelperText>
        )}

        <TextInput
          label="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
          accessibilityLabel="Password input"
          accessibilityHint="Enter your password"
          theme={{ colors: { primary: '#fff', text: '#fff', placeholder: '#fff' } }}
          outlineColor="rgba(255, 255, 255, 0.3)"
          textColor="#fff"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || !isFormValid()}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          Log In
        </Button>

        <Link href="/forgot-password" style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Link>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <Link href="/register" style={styles.registerLink}>
            <Text style={styles.registerLinkText}>Sign up</Text>
          </Link>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: Colors.light.text, // Use text color for dark mode compatibility
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  helperText: {
    color: Colors.light.text,
    opacity: 0.8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  error: {
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 25,
  },
  buttonText: {
    color: Colors.light.text,
    fontWeight: 'bold',
    fontSize: 16, // Added font size for button text
  },
  forgotLink: {
    marginTop: 12,
    alignSelf: 'center',
  },
  forgotText: {
    color: Colors.light.text,
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: Colors.light.text,
    fontSize: 16,
  },
  registerLinkText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  registerLink: {
    marginLeft: 4,
  },
});




