import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3006' : 'http://localhost:3006';

export const AuthService = {
    async login(email: string, password: string) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        await AsyncStorage.setItem('token', data.token);
        return data.user;
    },

    async register(name: string, email: string, password: string) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        const data = await response.json();
        await AsyncStorage.setItem('token', data.token);
        return data.user;
    },

    async logout() {
        await AsyncStorage.removeItem('token');
    },

    async getToken() {
        return await AsyncStorage.getItem('token');
    }
};
