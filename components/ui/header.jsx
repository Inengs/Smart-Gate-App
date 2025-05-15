// components/ui/Header.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

const Header = ({ title, showBack = false }) => {
    const router = useRouter();
    const colorScheme = useColorScheme();

    return (
        <LinearGradient
            colors={[Colors[colorScheme].primary, Colors[colorScheme].secondary]}
            style={styles.header}
        >
            {showBack && (
                <IconButton
                    icon="arrow-left"
                    iconColor={Colors[colorScheme].text}
                    onPress={() => router.back()}
                    style={styles.backButton}
                />
            )}
            <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>{title}</Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
});

export default Header;