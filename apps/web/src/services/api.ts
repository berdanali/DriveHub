import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor - unwrap backend { success, data } wrapper & handle token refresh
api.interceptors.response.use(
    (response) => {
        // Backend TransformInterceptor wraps all responses as { success, data, timestamp }
        // Auto-unwrap so callers can use response.data directly
        if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
            response.data = response.data.data;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Skip token refresh logic for auth endpoints (login, register, etc.)
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

        // If 401 and not already retried and not an auth endpoint
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            const { refreshToken, updateTokens, logout } = useAuthStore.getState();

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/refresh`, null, {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`,
                        },
                    });

                    // Raw axios call doesn't go through our interceptor, so unwrap manually
                    const responseData = response.data?.data || response.data;
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                        responseData;

                    updateTokens(newAccessToken, newRefreshToken);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout
                    logout();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token and not auth endpoint - session expired
                logout();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    },
);

export default api;
