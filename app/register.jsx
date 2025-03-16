import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../src/firebaseConfig';
import { Link } from 'expo-router';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => password.length >= 6;
    const isFormValid = () => name.length > 0 && validateEmail(email) && validatePassword(password) && password === confirmPassword;

    const handleRegister = async () => {
        setError('');
        setSuccess('');

        if (!name || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        if (!validatePassword(password)) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name.trim() });
            await set(ref(database, `users/${user.uid}`), {
                name: name.trim(),
                email: email.trim(),
                role: 'user',
                createdAt: Date.now(),
            });

            await sendEmailVerification(user);
            setSuccess('Account created! Please check your email to verify.');
            // RootLayout will redirect after a short delay
        } catch (error) {
            let errorMessage = 'Registration Failed';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Smart Gate App</Text>

                <TextInput
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    accessibilityLabel="Full Name input"
                    accessibilityHint="Enter your full name"
                />

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
                    <HelperText type="error">Invalid email address</HelperText>
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
                {password.length > 0 && !validatePassword(password) && (
                    <HelperText type="error">Password must be 6+ characters</HelperText>
                )}

                <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                    accessibilityLabel="Confirm Password input"
                    accessibilityHint="Re-enter your password"
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                    <HelperText type="error">Passwords do not match</HelperText>
                )}

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}

                <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={loading}
                    disabled={loading || !isFormValid()}
                    style={styles.button}
                >
                    Register
                </Button>

                <View style={styles.loginContainer}>
                    <Text>Already have an account? </Text>
                    <Link href="/login" style={styles.loginLink}>
                        <Text style={styles.loginText}>Login</Text>
                    </Link>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
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
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    error: {
        color: '#d32f2f',
        marginBottom: 16,
        textAlign: 'center',
    },
    success: {
        color: '#2e7d32',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        marginTop: 16,
        paddingVertical: 8,
        backgroundColor: '#6200ee',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
});

