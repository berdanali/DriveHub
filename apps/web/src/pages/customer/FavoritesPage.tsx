import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Car,
    Heart,
    Users,
    Fuel,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface FavoriteVehicle {
    id: string;
    vehicleId: string;
    createdAt: string;
    vehicle: {
        id: string;
        make: string;
        model: string;
        year: number;
        dailyRate: number;
        images: string[];
        fuelType: string;
        transmission: string;
        seats: number;
        city: string | null;
        status: string;
        owner: {
            firstName: string;
            lastName: string;
        };
    };
}

export default function FavoritesPage() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['favorites'],
        queryFn: async () => {
            const res = await api.get('/favorites');
            return res.data as FavoriteVehicle[];
        },
    });

    const removeMutation = useMutation({
        mutationFn: (vehicleId: string) => api.delete(`/favorites/${vehicleId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
        },
    });

    const favorites = data || [];

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Favorilerim</h1>
                        <p className="text-muted-foreground">
                            {favorites.length > 0
                                ? `${favorites.length} araç favorilerinizde`
                                : 'Favori araçlarınızı burada bulabilirsiniz'}
                        </p>
                    </div>
                    <Link
                        to="/vehicles"
                        className="btn-primary px-4 py-2 rounded-lg text-white text-sm font-medium"
                    >
                        Araçları İncele
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Yükleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="card p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-500 mb-2">Favoriler yüklenirken bir hata oluştu</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-primary hover:underline"
                        >
                            Tekrar dene
                        </button>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
                            <Heart className="h-10 w-10 text-red-300" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Henüz Favori Yok</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Beğendiğiniz araçlara kalp simgesine tıklayarak favorilerinize ekleyebilirsiniz.
                        </p>
                        <Link
                            to="/vehicles"
                            className="btn-primary px-6 py-3 rounded-lg text-white font-medium inline-block"
                        >
                            Araçları İncele
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((fav) => (
                            <div key={fav.id} className="card overflow-hidden card-hover group">
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img
                                        src={fav.vehicle.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600'}
                                        alt={`${fav.vehicle.make} ${fav.vehicle.model}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeMutation.mutate(fav.vehicleId);
                                        }}
                                        disabled={removeMutation.isPending}
                                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                                        title="Favorilerden çıkar"
                                    >
                                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                    </button>
                                    <div className={cn(
                                        "absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium",
                                        fav.vehicle.status === 'AVAILABLE'
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-500 text-white"
                                    )}>
                                        {fav.vehicle.status === 'AVAILABLE' ? 'Müsait' : 'Dolu'}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold mb-1">
                                        {fav.vehicle.make} {fav.vehicle.model}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {fav.vehicle.year} • {fav.vehicle.city || 'Türkiye'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {fav.vehicle.seats} Kişi
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Fuel className="h-3.5 w-3.5" />
                                            {fav.vehicle.fuelType}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Car className="h-3.5 w-3.5" />
                                            {fav.vehicle.transmission}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xl font-bold text-primary">
                                                ₺{Number(fav.vehicle.dailyRate).toLocaleString('tr-TR')}
                                            </span>
                                            <span className="text-muted-foreground text-sm">/gün</span>
                                        </div>
                                        <Link
                                            to={`/vehicles/${fav.vehicle.id}`}
                                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                        >
                                            İncele
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

