import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

export function useFavoriteIds() {
    const { isAuthenticated, user } = useAuthStore();
    const isCustomer = user?.role === 'CUSTOMER';

    return useQuery({
        queryKey: ['favorite-ids'],
        queryFn: async () => {
            const res = await api.get('/favorites/ids');
            return res.data as string[];
        },
        enabled: isAuthenticated && isCustomer,
        staleTime: 30_000, // 30 seconds
    });
}

export function useToggleFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (vehicleId: string) => {
            const res = await api.post(`/favorites/${vehicleId}/toggle`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
}

export function useIsFavorite(vehicleId: string): boolean {
    const { data: favoriteIds } = useFavoriteIds();
    return favoriteIds?.includes(vehicleId) ?? false;
}

