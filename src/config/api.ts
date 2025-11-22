// Centralized API configuration
// This allows for easy updates to the API URL across the entire app

// Replace with your local IP address
import { Platform } from 'react-native';

// Use localhost for Web to avoid Ngrok warning pages/latency
// Use Ngrok for Native (Android/iOS) to bypass firewall/network isolation
export const API_URL = Platform.OS === 'web'
    ? 'http://localhost:3006'
    : 'https://strawhat-wealthily-lyla.ngrok-free.dev';
