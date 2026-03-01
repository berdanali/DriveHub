import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
    Car,
    Calendar,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    ChevronRight,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Rental {
    id: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
    totalAmount: number;
    pickupLocation: string;
    vehicle: {
        id: string;
        make: string;
        model: string;
        year: number;
        images: string[];
    };
}

const statusConfig = {
    PENDING: { label: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    APPROVED: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    ACTIVE: { label: 'Aktif', color: 'bg-green-100 text-green-800', icon: Car },
    COMPLETED: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    CANCELLED: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800', icon: XCircle },
    REJECTED: { label: 'Reddedildi', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function MyRentalsPage() {
    const location = useLocation();
    const successMessage = location.state?.message;

    const { data, isLoading, error } = useQuery({
        queryKey: ['my-rentals'],
        queryFn: async () => {
            const response = await api.get('/rentals/my-rentals');
            return response.data as Rental[];
        },
    });

    const rentals = data || [];

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Kiralamalarım</h1>
                        <p className="text-muted-foreground">Tüm kiralama geçmişinizi görüntüleyin</p>
                    </div>
                    <Link
                        to="/vehicles"
                        className="btn-primary px-4 py-2 rounded-lg text-white text-sm font-medium"
                    >
                        Yeni Kiralama
                    </Link>
                </div>

                {successMessage && (
                    <div className="alert alert-success mb-6 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5" />
                        {successMessage}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Yükleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="card p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-500 mb-2">Kiralamalar yüklenirken bir hata oluştu</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-primary hover:underline"
                        >
                            Tekrar dene
                        </button>
                    </div>
                ) : rentals.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                            <Car className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Henüz Kiralama Yok</h3>
                        <p className="text-muted-foreground mb-6">
                            İlk araç kiralamanızı yapmak için araçlara göz atın.
                        </p>
                        <Link
                            to="/vehicles"
                            className="btn-primary px-6 py-3 rounded-lg text-white font-medium inline-block"
                        >
                            Araçları İncele
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rentals.map((rental) => {
                            const status = statusConfig[rental.status];
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={rental.id}
                                    className="card overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Vehicle Image */}
                                        <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                                            {rental.vehicle.images?.[0] ? (
                                                <img
                                                    src={rental.vehicle.images[0]}
                                                    alt={`${rental.vehicle.make} ${rental.vehicle.model}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                                    <Car className="h-10 w-10 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Rental Details */}
                                        <div className="flex-1 p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {rental.vehicle.make} {rental.vehicle.model}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {rental.vehicle.year}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                                                    status.color
                                                )}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {new Date(rental.startDate).toLocaleDateString('tr-TR')} - {new Date(rental.endDate).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="truncate">{rental.pickupLocation || 'Belirtilmemiş'}</span>
                                                </div>
                                                <div className="font-semibold text-primary">
                                                    ₺{Number(rental.totalAmount).toFixed(0)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="flex items-center px-5 pb-5 md:pb-0">
                                            <Link
                                                to={`/vehicles/${rental.vehicle.id}`}
                                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                Detaylar
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
