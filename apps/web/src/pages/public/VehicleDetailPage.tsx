import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Car,
    Star,
    Users,
    Fuel,
    MapPin,
    Calendar,
    Shield,
    CheckCircle,
    ArrowLeft,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Heart,
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    dailyRate: number;
    images: string[];
    features: string[];
    status: string;
    fuelType: string;
    transmission: string;
    seats: number;
    color: string;
    description: string;
    address: string;
    city: string;
    licensePlate: string;
    owner: {
        firstName: string;
        lastName: string;
    };
}

export default function VehicleDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rentError, setRentError] = useState('');
    const [rentSuccess, setRentSuccess] = useState('');
    const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';
    const { data: favoriteIds } = useFavoriteIds();
    const toggleFavorite = useToggleFavorite();
    const isFavorited = id ? favoriteIds?.includes(id) : false;

    const { data: vehicle, isLoading, error } = useQuery({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const response = await api.get(`/vehicles/${id}`);
            return response.data as Vehicle;
        },
    });

    const calculateTotal = () => {
        if (!startDate || !endDate || !vehicle) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 ? days * Number(vehicle.dailyRate) : 0;
    };

    const handleRent = async () => {
        setRentError('');
        setRentSuccess('');

        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/vehicles/${id}` } } });
            return;
        }

        if (!startDate || !endDate) {
            setRentError('Lütfen başlangıç ve bitiş tarihlerini seçin');
            return;
        }

        try {
            await api.post('/rentals', {
                vehicleId: id,
                startDate,
                endDate,
                pickupLocation: vehicle?.address || '',
                returnLocation: vehicle?.address || '',
            });
            navigate('/rentals', { state: { message: 'Kiralama başarıyla oluşturuldu!' } });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setRentError(
                error.response?.data?.error?.message ||
                'Kiralama oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
            );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    if (error || !vehicle) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Araç Bulunamadı</h1>
                <p className="text-muted-foreground mb-6">
                    Aradığınız araç mevcut değil veya kaldırılmış olabilir.
                </p>
                <Link to="/vehicles" className="btn-primary px-6 py-3 rounded-lg text-white">
                    Araçlara Dön
                </Link>
            </div>
        );
    }

    const images = vehicle.images?.length > 0 
        ? vehicle.images 
        : ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'];

    return (
        <div className="min-h-screen bg-muted/30 pb-12">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <Link 
                        to="/vehicles" 
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Araçlara Dön
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Images & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="card overflow-hidden">
                            <div className="relative aspect-[16/10]">
                                <img
                                    src={images[currentImageIndex]}
                                    alt={`${vehicle.make} ${vehicle.model}`}
                                    className="w-full h-full object-cover"
                                />
                                
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}

                                <div className="absolute top-4 left-4">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-sm font-medium",
                                        vehicle.status === 'AVAILABLE' 
                                            ? "bg-green-500 text-white" 
                                            : "bg-gray-500 text-white"
                                    )}>
                                        {vehicle.status === 'AVAILABLE' ? 'Müsait' : 'Rezerveli'}
                                    </span>
                                </div>
                            </div>

                            {images.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={cn(
                                                "flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors",
                                                currentImageIndex === index 
                                                    ? "border-primary" 
                                                    : "border-transparent opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Vehicle Info */}
                        <div className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">
                                        {vehicle.make} {vehicle.model}
                                    </h1>
                                    <p className="text-muted-foreground">
                                        {vehicle.year} • {vehicle.color}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isCustomer && id && (
                                        <button
                                            onClick={() => toggleFavorite.mutate(id)}
                                            disabled={toggleFavorite.isPending}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium",
                                                isFavorited
                                                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800"
                                                    : "border-border hover:bg-muted"
                                            )}
                                        >
                                            <Heart className={cn(
                                                "h-4 w-4",
                                                isFavorited ? "fill-red-500 text-red-500" : ""
                                            )} />
                                            {isFavorited ? 'Favorilerde' : 'Favorilere Ekle'}
                                        </button>
                                    )}
                                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium">4.9</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
                                <div className="text-center">
                                    <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                    <p className="text-sm font-medium">{vehicle.seats} Kişi</p>
                                </div>
                                <div className="text-center">
                                    <Fuel className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                    <p className="text-sm font-medium">{vehicle.fuelType}</p>
                                </div>
                                <div className="text-center">
                                    <Car className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                    <p className="text-sm font-medium">{vehicle.transmission}</p>
                                </div>
                                <div className="text-center">
                                    <MapPin className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                    <p className="text-sm font-medium">{vehicle.city || 'İstanbul'}</p>
                                </div>
                            </div>

                            {vehicle.description && (
                                <div className="mt-4">
                                    <h3 className="font-semibold mb-2">Açıklama</h3>
                                    <p className="text-muted-foreground text-sm">
                                        {vehicle.description}
                                    </p>
                                </div>
                            )}

                            {vehicle.features?.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-semibold mb-3">Özellikler</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {vehicle.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Owner Info */}
                        <div className="card p-6">
                            <h3 className="font-semibold mb-4">Araç Sahibi</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-primary font-medium">
                                        {vehicle.owner?.firstName?.[0]}{vehicle.owner?.lastName?.[0]}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {vehicle.owner?.firstName} {vehicle.owner?.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Araç Sahibi</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold text-primary">
                                    ₺{Number(vehicle.dailyRate).toFixed(0)}
                                </span>
                                <span className="text-muted-foreground">/gün</span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <Calendar className="inline h-4 w-4 mr-1" />
                                        Alış Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <Calendar className="inline h-4 w-4 mr-1" />
                                        İade Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        className="input"
                                    />
                                </div>
                            </div>

                            {calculateTotal() > 0 && (
                                <div className="border-t border-border pt-4 mb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">
                                            ₺{Number(vehicle.dailyRate).toFixed(0)} x {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} gün
                                        </span>
                                        <span>₺{calculateTotal().toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Hizmet bedeli (%15)</span>
                                        <span>₺{(calculateTotal() * 0.15).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                                        <span>Toplam</span>
                                        <span className="text-primary">₺{(calculateTotal() * 1.15).toFixed(0)}</span>
                                    </div>
                                </div>
                            )}

                            {rentError && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{rentError}</p>
                                </div>
                            )}

                            {rentSuccess && (
                                <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-green-600 dark:text-green-400">{rentSuccess}</p>
                                </div>
                            )}

                            <button
                                onClick={handleRent}
                                disabled={vehicle.status !== 'AVAILABLE'}
                                className="w-full btn-primary py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {vehicle.status === 'AVAILABLE' ? 'Hemen Kirala' : 'Müsait Değil'}
                            </button>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="h-4 w-4 text-green-500" />
                                    Kapsamlı sigorta dahil
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Ücretsiz iptal (24 saat önce)
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    7/24 yol yardım hizmeti
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

