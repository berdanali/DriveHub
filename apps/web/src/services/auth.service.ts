import api from './api';
import { useAuthStore, User } from '@/store/auth.store';

interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleType?: 'VEHICLE_OWNER' | 'CUSTOMER';
}

interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
}

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', payload);
        const { user, accessToken, refreshToken } = response.data;
        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
        return response.data;
    },

    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', payload);
        // Mail doğrulaması gerektiği için token kaydetmiyoruz
        // Kullanıcı mail doğruladıktan sonra login yapmalı
        return response.data;
    },

    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } catch {
            // Ignore logout errors
        } finally {
            useAuthStore.getState().logout();
        }
    },

    async getProfile(): Promise<User> {
        const response = await api.get<User>('/users/profile');
        return response.data;
    },

    async forgotPassword(email: string): Promise<void> {
        await api.post('/auth/forgot-password', { email });
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
        await api.post('/auth/reset-password', { token, password: newPassword });
    },

    async verifyEmail(token: string): Promise<void> {
        await api.post('/auth/verify-email', { token });
    },
};
