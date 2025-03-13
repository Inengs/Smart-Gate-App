import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, List, Switch, Button, Divider, TextInput, IconButton, Avatar } from 'react-native-paper';
import { auth, database } from '../../src/firebaseConfig';
import { ref, get, update } from 'firebase/database';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const [user, setUser] = useState(auth.currentUser);
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    // Edit profile state
    const [editMode, setEditMode] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const router = useRouter();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        if (!user) return;

        try {
            setProfileLoading(true);
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                setUserData(data);
                setDisplayName(user.displayName || data.name || '');
                setNewEmail(user.email || '');

                // You could also save notification preferences in the database
                if (data.preferences) {
                    setNotificationsEnabled(data.preferences.notifications || true);
                    setDarkModeEnabled(data.preferences.darkMode || false);
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            Alert.alert("Error", "Failed to load user data");
        } finally {
            setProfileLoading(false);
        }
    };

    const savePreferences = async () => {
        if (!user) return;

        try {
            setLoading(true);
            await update(ref(database, `users/${user.uid}/preferences`), {
                notifications: notificationsEnabled,
                darkMode: darkModeEnabled,
            });
            Alert.alert("Success", "Preferences updated successfully");
        } catch (error) {
            console.error("Error saving preferences:", error);
            Alert.alert("Error", "Failed to save preferences");
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Check if we need to update the display name
            if (displayName !== user.displayName) {
                await updateProfile(user, { displayName });
                await update(ref(database, `users/${user.uid}`), { name: displayName });
            }

            // Check if we need to update email
            if (newEmail !== user.email) {
                if (!currentPassword) {
                    Alert.alert("Error", "Current password is required to change email");
                    setLoading(false);
                    return;
                }

                // Re-authenticate before changing email
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updateEmail(user, newEmail);
                await update(ref(database, `users/${user.uid}`), { email: newEmail });
            }

            // Check if we need to update password
            if (newPassword) {
                if (newPassword.length < 6) {
                    Alert.alert("Error", "Password must be at least 6 characters");
                    setLoading(false);
                    return;
                }

                if (newPassword !== confirmPassword) {
                    Alert.alert("Error", "Passwords do not match");
                    setLoading(false);
                    return;
                }

                if (!currentPassword) {
                    Alert.alert("Error", "Current password is required to set a new password");
                    setLoading(false);
                    return;
                }

                // Re-authenticate before changing password
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
            }

            Alert.alert("Success", "Profile updated successfully");
            setEditMode(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Refresh user data
            setUser(auth.currentUser);
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "Failed to update profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // No need to navigate - _layout will handle this
        } catch (error) {
            Alert.alert("Error", "Failed to log out: " + error.message);
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", onPress: handleLogout, style: "destructive" }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView style={styles.container}>
                {/* Profile Section */}
                <Card style={styles.card}>
                    <Card.Title
                        title="Profile"
                        right={(props) => editMode ? (
                            <IconButton {...props} icon="check" onPress={updateUserProfile} disabled={loading} />
                        ) : (
                            <IconButton {...props} icon="pencil" onPress={() => setEditMode(true)} />
                        )}
                    />
                    <Card.Content>
                        {profileLoading ? (
                            <View style={styles.centeredContent}>
                                <Text>Loading profile...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.profileHeader}>
                                    <Avatar.Text size={64} label={displayName ? displayName.substring(0, 2).toUpperCase() : 'U'} />
                                    <View style={styles.profileInfo}>
                                        <Text style={styles.profileName}>{user?.displayName || userData?.name || 'User'}</Text>
                                        <Text style={styles.profileEmail}>{user?.email}</Text>
                                        <Text style={styles.profileRole}>{userData?.role || 'User'}</Text>
                                    </View>
                                </View>

                                <Divider style={styles.divider} />

                                {editMode ? (
                                    <View style={styles.editForm}>
                                        <TextInput
                                            label="Display Name"
                                            value={displayName}
                                            onChangeText={setDisplayName}
                                            style={styles.input}
                                            mode="outlined"
                                        />

                                        <TextInput
                                            label="Email"
                                            value={newEmail}
                                            onChangeText={setNewEmail}
                                            style={styles.input}
                                            mode="outlined"
                                            keyboardType="email-address"
                                        />

                                        <TextInput
                                            label="Current Password (required for email/password change)"
                                            value={currentPassword}
                                            onChangeText={setCurrentPassword}
                                            secureTextEntry
                                            style={styles.input}
                                            mode="outlined"
                                        />

                                        <TextInput
                                            label="New Password (leave blank to keep current)"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry
                                            style={styles.input}
                                            mode="outlined"
                                        />

                                        <TextInput
                                            label="Confirm New Password"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry
                                            style={styles.input}
                                            mode="outlined"
                                        />

                                        <View style={styles.buttonRow}>
                                            <Button
                                                mode="outlined"
                                                onPress={() => {
                                                    setEditMode(false);
                                                    setDisplayName(user?.displayName || userData?.name || '');
                                                    setNewEmail(user?.email || '');
                                                    setCurrentPassword('');
                                                    setNewPassword('');
                                                    setConfirmPassword('');
                                                }}
                                                style={styles.cancelButton}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                mode="contained"
                                                onPress={updateUserProfile}
                                                loading={loading}
                                                disabled={loading}
                                            >
                                                Save Changes
                                            </Button>
                                        </View>
                                    </View>
                                ) : null}
                            </>
                        )}
                    </Card.Content>
                </Card>

                {/* Preferences Section */}
                <Card style={styles.card}>
                    <Card.Title title="Preferences" />
                    <Card.Content>
                        <List.Item
                            title="Notifications"
                            description="Receive alerts about gate activities"
                            right={() =>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                />
                            }
                        />
                        <Divider />
                        <List.Item
                            title="Dark Mode"
                            description="Use dark theme"
                            right={() =>
                                <Switch
                                    value={darkModeEnabled}
                                    onValueChange={setDarkModeEnabled}
                                />
                            }
                        />
                        <Button
                            mode="contained"
                            onPress={savePreferences}
                            style={styles.saveButton}
                            loading={loading}
                            disabled={loading}
                        >
                            Save Preferences
                        </Button>
                    </Card.Content>
                </Card>

                {/* Account Actions */}
                <Card style={styles.card}>
                    <Card.Title title="Account" />
                    <Card.Content>
                        <Button
                            mode="contained"
                            onPress={confirmLogout}
                            style={styles.logoutButton}
                            icon="logout"
                        >
                            Logout
                        </Button>
                    </Card.Content>
                </Card>

                {/* App Info */}
                <Card style={styles.card}>
                    <Card.Title title="About" />
                    <Card.Content>
                        <Text style={styles.appVersion}>Smart Gate App v1.0.0</Text>
                        <Text style={styles.appInfo}>© 2025 All rights reserved</Text>
                    </Card.Content>
                </Card>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
    profileRole: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: '500',
    },
    divider: {
        marginVertical: 12,
    },
    input: {
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    cancelButton: {
        marginRight: 12,
    },
    saveButton: {
        marginTop: 16,
    },
    logoutButton: {
        backgroundColor: '#F44336',
    },
    centeredContent: {
        alignItems: 'center',
        padding: 16,
    },
    editForm: {
        marginTop: 8,
    },
    appVersion: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    appInfo: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    bottomPadding: {
        height: 40,
    },
});