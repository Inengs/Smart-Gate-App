import React from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { PanGestureHandler } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

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

    const handleGetStarted = () => {
        router.replace('/login')
    }

    return (
        <LinearGradient
            colors={[Colors.light.primary, Colors.light.secondary]}
            style={styles.container}
        >
            <PanGestureHandler onGestureEvent={onGestureEvent} onEnded={onHandlerStateChange}>
                <Animated.View style={[styles.content, animatedStyle]}>
                    <View style={styles.circle} /> {/* Orange Circle Background */}
                    <Text style={styles.title}>Smart Gate</Text> {/* Title */}
                    <Text style={styles.subtitle}>
                        Welcome to Smart-Gate –{"\n"}Seamless, Secure, & Smart{"\n"}Access At Your Fingertips.
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                </Animated.View>
            </PanGestureHandler>
        </LinearGradient>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    circle: {
        position: 'absolute',
        top: -200, // Adjust to position the circle partially off-screen
        left: -100,
        width: 400,
        height: 400,
        backgroundColor: Colors.light.primary,
        borderRadius: 200, // Make it a circle
        opacity: 0.5, // Slight transparency
    },
    title: {
        fontSize: 48, // Larger font for "Smart Gate"
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24, // Adjust line spacing for better readability
    },
    button: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25, // Rounded corners
    },
    buttonText: {
        fontSize: 18,
        color: Colors.light.text,
        fontWeight: 'bold',
    },
});