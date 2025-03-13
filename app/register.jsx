import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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

    const validateEmail = (email) => {
        return email.match(/^\S+@\S+\.\S+$/);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const handleRegister = async () => {
        // Reset error
        setError('');

        // Basic validation
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
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile
            await updateProfile(user, {
                displayName: name
            });

            // Create user record in database
            await set(ref(database, `users/${user.uid}`), {
                name: name,
                email: email,
                role: 'user', // Default role
                createdAt: Date.now()
            });

            // No need to navigate - _layout will handle this
        } catch (error) {
            console.error('Registration error:', error);
            setError('Registration failed: ' + error.message);
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
                />

                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                />
                {password.length > 0 && !validatePassword(password) && (
                    <HelperText type="error" visible={true}>
                        Password must be at least 6 characters
                    </HelperText>
                )}

                <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                    <HelperText type="error" visible={true}>
                        Passwords do not match
                    </HelperText>
                )}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.button}
                    disabled={loading}
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
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        color: '#666',
    },
    input: {
        marginBottom: 12,
    },
    error: {
        color: 'red',
        marginBottom: 16,
    },
    button: {
        marginTop: 16,
        paddingVertical: 8,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginLink: {
        fontWeight: 'bold',
    },
    loginText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
});