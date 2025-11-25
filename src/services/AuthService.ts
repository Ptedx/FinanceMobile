import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { API_URL } from '../config/api';

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
    },

    async updateThemePreference(themePreference: 'light' | 'dark') {
        const token = await this.getToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/users/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ themePreference }),
        });

        if (!response.ok) {
            console.error('Failed to update theme preference');
        }
    },

    async getMe() {
        const token = await this.getToken();
        if (!token) return null;

        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }

        return await response.json();
    }
};
