import React from "react";
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { PanGestureHandler } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

export default function LandingScreen() {
    const router = useRouter();
    const translateY = useSharedValue(0);

    const onGestureEvent = (event) => {
        const { translationY } = event.nativeEvent;
        translateY.value = translationY;
    };

    const onHandlerStateChange = (event) => {
        if (event.nativeEvent.translationY < -50) { // Swipe up threshold
            router.replace('/login')
        }
        translateY.value = withSpring(0); //Reset Position
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <View style={styles.container}>
            <PanGestureHandler onGestureEvent={onGestureEvent} onEnded={onHandlerStateChange}>
                <Animated.View style={[styles.content, animatedStyle]}>
                    <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.logo} />
                    <Text style={styles.title}> Welcome to Smart Gate App</Text>
                    <Text style={styles.subtitle}>Swipe up to get started</Text>
                </Animated.View>
            </PanGestureHandler>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#6200ee', // A vibrant background
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#fff',
        opacity: 0.8,
    },
});