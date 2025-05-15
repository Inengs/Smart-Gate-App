import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../src/firebaseConfig';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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
        <LinearGradient
            colors={['#F5A623', 'D88C1A']} // Gradient from light to darker range
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.innerContainer}>
                    <Text style={styles.title}>WELCOME ONBOARD!</Text>

                    <TextInput
                        label="Enter your username"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        accessibilityLabel="UserName input"
                        accessibilityHint="Enter your username"
                        theme={{ colors: { primary: '#fff', text: '#fff', placeholder: '#fff', onSurfaceVariant: '#fff' }, roundness: 10, }}
                        outlineColor="rgba(255, 255, 255, 0.3)"
                        activeOutlineColor='#fff'
                        textColor="#fff"
                        labelStyle={styles.labelStyle}
                    />

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
                        theme={{ colors: { primary: '#fff', text: '#fff', placeholder: '#fff', onSurfaceVariant: '#fff' }, roundness: 10, }}
                        outlineColor="rgba(255, 255, 255, 0.3)"
                        activeOutlineColor="#fff"
                        textColor="#fff"
                        labelStyle={styles.labelStyle}
                    />

                    {email.length > 0 && !validateEmail(email) && (
                        <HelperText type="error" style={styles.helperText}>Invalid email address</HelperText>
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
                        theme={{ colors: { primary: '#fff', text: '#fff', placeholder: '#fff', onSurfaceVariant: '#fff' }, roundness: 10, }}
                        outlineColor="rgba(255, 255, 255, 0.3)"
                        activeOutlineColor='#fff'
                        textColor="#fff"
                        labelStyle={styles.labelStyle}
                    />

                    {password.length > 0 && !validatePassword(password) && (
                        <HelperText type="error" style={styles.helperText}>Password must be 6+ characters</HelperText>
                    )}

                    <TextInput
                        label="Confirm password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                        accessibilityLabel="Confirm Password input"
                        accessibilityHint="Re-enter your password"
                        theme={{ colors: { primary: '#fff', text: '#fff', placeholder: '#fff', onSurfaceVariant: '#fff' }, roundness: 10, }}
                        outlineColor="rgba(255, 255, 255, 0.3)"
                        activeOutlineColor='#fff'
                        textColor="#fff"
                        labelStyle={styles.labelStyle}
                    />

                    {confirmPassword.length > 0 && password !== confirmPassword && (
                        <HelperText type="error" style={styles.helperText}>Passwords do not match</HelperText>
                    )}

                    <Text style={styles.passwordNote}>
                        Password must be 6+ characters
                    </Text>

                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {success ? <Text style={styles.success}>{success}</Text> : null}

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={loading || !isFormValid()}
                        style={styles.button}
                        labelStyle={styles.buttonText}
                    >
                        SIGN UP
                    </Button>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Link href="/login" style={styles.loginLink}>
                            <Text style={styles.loginLinkText}>Log In</Text>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
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
        color: '#fff',
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'transparent',
        borderRadius: 10,
    },
    labelStyle: {
        // Adjust the label's position when floating
        top: -8, // Move the label higher when floating to avoid the border
        fontSize: 12, // Smaller font size when floating
    },
    helperText: {
        color: '#fff',
        opacity: 0.8,
    },
    passwordNote: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.7,
        textAlign: 'center',
        marginBottom: 16,
    },
    error: {
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    success: {
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        marginTop: 16,
        paddingVertical: 8,
        backgroundColor: '#F5A623', // Orange button
        borderRadius: 25,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginText: {
        color: '#fff',
        fontSize: 16,
    },
    loginLink: {
        marginLeft: 4,
    },
    loginLinkText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});

