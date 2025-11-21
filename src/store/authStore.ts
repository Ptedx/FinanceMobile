import { create } from 'zustand';
import { AuthService } from '../services/AuthService';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,

    login: async (email, password) => {
        const user = await AuthService.login(email, password);
        set({ isAuthenticated: true, user });
    },

    register: async (name, email, password) => {
        const user = await AuthService.register(name, email, password);
        set({ isAuthenticated: true, user });
    },

    logout: async () => {
        await AuthService.logout();
        set({ isAuthenticated: false, user: null });
    },

    checkAuth: async () => {
        try {
            const token = await AuthService.getToken();
            if (token) {
                // Ideally we should validate the token with the backend here
                // For now, we'll assume if token exists, we are logged in
                // You might want to add a /me endpoint to verify and get user details
                set({ isAuthenticated: true, isLoading: false });
            } else {
                set({ isAuthenticated: false, isLoading: false });
            }
        } catch (e) {
            set({ isAuthenticated: false, isLoading: false });
        }
    },
}));
