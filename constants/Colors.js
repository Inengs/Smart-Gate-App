/**
 * Colors used throughout the Smart Gate App, based on the orange gradient theme (#F5A623 to #D88C1A).
 * Supports light and dark modes for consistent theming.
 * Used in conjunction with react-native-paper and LinearGradient components.
 */

export const Colors = {
  light: {
    primary: '#F5A623', // Main orange color for buttons, FABs, etc.
    secondary: '#D88C1A', // Secondary orange for gradients
    background: '#f5f5f5', // Light gray background for screens
    card: '#fff', // White background for cards
    text: '#333', // Dark text for readability
    border: '#e0e0e0', // Light gray for borders and dividers
    tint: '#F5A623', // Primary color for active tab icons, buttons
    icon: '#687076', // Neutral gray for inactive icons
    tabIconDefault: '#687076', // Default tab icon color
    tabIconSelected: '#F5A623', // Selected tab icon color
  },
  dark: {
    primary: '#F5A623', // Keep orange for consistency
    secondary: '#D88C1A', // Secondary orange for gradients
    background: '#1a1a1a', // Dark background for screens
    card: '#2a2a2a', // Dark gray for cards
    text: '#fff', // White text for readability
    border: '#444', // Dark gray for borders and dividers
    tint: '#F5A623', // Primary color for active elements
    icon: '#9BA1A6', // Light gray for inactive icons
    tabIconDefault: '#9BA1A6', // Default tab icon color
    tabIconSelected: '#F5A623', // Selected tab icon color
  },
};