import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Car,
    DollarSign,
    TrendingUp,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    ArrowUpRight,
    Plus,
    AlertCircle,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface DashboardStats {
    totalVehicles: number;
    activeRentals: number;
    pendingRequests: number;
    monthlyEarnings: number;
    totalEarnings: number;
    occupancyRate: number;
}

interface RecentRental {
    id: string;
    vehicleName: string;
    customerName: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    totalAmount: number;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
    images?: string[];
    dailyRate: number;
}

export default function OwnerDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalVehicles: 0,
        activeRentals: 0,
        pendingRequests: 0,
        monthlyEarnings: 0,
        totalEarnings: 0,
        occupancyRate: 0,
    });
    const [recentRentals, setRecentRentals] = useState<RecentRental[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Bu API'ler backend'de tanımlanmalı
            const [vehiclesRes, rentalsRes] = await Promise.all([
                api.get('/vehicles/my').catch(() => ({ data: [] })),
                api.get('/rentals/owner').catch(() => ({ data: [] })),
            ]);

            const myVehicles = vehiclesRes.data || [];
            const myRentals = rentalsRes.data || [];

            // Stats hesapla
            const activeRentals = myRentals.filter((r: any) => r.status === 'ACTIVE').length;
            const pendingRequests = myRentals.filter((r: any) => r.status === 'PENDING').length;
            const completedRentals = myRentals.filter((r: any) => r.status === 'COMPLETED');
            const monthlyEarnings = completedRentals
                .filter((r: any) => {
                    const date = new Date(r.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((sum: number, r: any) => sum + (Number(r.totalAmount) || 0), 0);
            const totalEarnings = completedRentals.reduce((sum: number, r: any) => sum + (Number(r.totalAmount) || 0), 0);

            setStats({
                totalVehicles: myVehicles.length,
                activeRentals,
                pendingRequests,
                monthlyEarnings,
                totalEarnings,
                occupancyRate: myVehicles.length > 0 
                    ? Math.round((activeRentals / myVehicles.length) * 100) 
                    : 0,
            });

            setVehicles(myVehicles.slice(0, 4));
            setRecentRentals(myRentals.slice(0, 5).map((r: any) => ({
                id: r.id,
                vehicleName: `${r.vehicle?.make || ''} ${r.vehicle?.model || ''}`.trim() || 'Araç',
                customerName: `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim() || 'Müşteri',
                startDate: r.startDate,
                endDate: r.endDate,
                status: r.status,
                totalAmount: Number(r.totalAmount) || 0,
            })));
        } catch (error) {
            console.error('Dashboard verisi yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            ACTIVE: 'bg-green-100 text-green-800',
            COMPLETED: 'bg-blue-100 text-blue-800',
            CANCELLED: 'bg-red-100 text-red-800',
            AVAILABLE: 'bg-green-100 text-green-800',
            RENTED: 'bg-blue-100 text-blue-800',
            MAINTENANCE: 'bg-orange-100 text-orange-800',
        };
        const labels: Record<string, string> = {
            PENDING: 'Bekliyor',
            ACTIVE: 'Aktif',
            COMPLETED: 'Tamamlandı',
            CANCELLED: 'İptal',
            AVAILABLE: 'Müsait',
            RENTED: 'Kirada',
            MAINTENANCE: 'Bakımda',
        };
        return (
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Hoş Geldiniz! 👋</h1>
                    <p className="text-muted-foreground">
                        Araçlarınızı ve kiralamalarınızı buradan yönetebilirsiniz.
                    </p>
                </div>
                <Link
                    to="/owner/vehicles/new"
                    className="btn-primary px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Araç Ekle
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Toplam Araç</p>
                            <p className="text-2xl font-bold mt-1">{stats.totalVehicles}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Car className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Aktif Kiralama</p>
                            <p className="text-2xl font-bold mt-1">{stats.activeRentals}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Bekleyen Talep</p>
                            <p className="text-2xl font-bold mt-1">{stats.pendingRequests}</p>
                            {stats.pendingRequests > 0 && (
                                <p className="text-xs text-yellow-600 mt-1">Onay bekliyor</p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Bu Ay Kazanç</p>
                            <p className="text-2xl font-bold mt-1">₺{stats.monthlyEarnings.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Requests Alert */}
            {stats.pendingRequests > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-yellow-800">
                            {stats.pendingRequests} adet bekleyen kiralama talebi var
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Müşterilerinizi bekletmeyin, talepleri incelemeyi unutmayın.
                        </p>
                    </div>
                    <Link
                        to="/owner/rentals"
                        className="text-yellow-700 hover:text-yellow-800 text-sm font-medium whitespace-nowrap"
                    >
                        Talepleri Gör →
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Rentals */}
                <div className="card">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="font-semibold">Son Kiralamalar</h2>
                        <Link
                            to="/owner/rentals"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            Tümünü Gör <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {recentRentals.length > 0 ? (
                        <div className="divide-y divide-border">
                            {recentRentals.map((rental) => (
                                <div key={rental.id} className="p-4 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{rental.vehicleName}</p>
                                        <p className="text-sm text-muted-foreground">{rental.customerName}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        {getStatusBadge(rental.status)}
                                        <p className="text-sm font-medium mt-1">₺{rental.totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">Henüz kiralama yok</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Araçlarınız kiralandığında burada görünecek
                            </p>
                        </div>
                    )}
                </div>

                {/* My Vehicles */}
                <div className="card">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="font-semibold">Araçlarım</h2>
                        <Link
                            to="/owner/vehicles"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            Tümünü Gör <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {vehicles.length > 0 ? (
                        <div className="divide-y divide-border">
                            {vehicles.map((vehicle) => (
                                <div key={vehicle.id} className="p-4 flex items-center gap-4">
                                    <div className="w-16 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                        {vehicle.images?.[0] ? (
                                            <img
                                                src={vehicle.images[0]}
                                                alt={`${vehicle.make} ${vehicle.model}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="h-6 w-6 text-muted-foreground/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{vehicle.make} {vehicle.model}</p>
                                        <p className="text-sm text-muted-foreground">₺{Number(vehicle.dailyRate)}/gün</p>
                                    </div>
                                    {getStatusBadge(vehicle.status)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Car className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">Henüz araç eklemediniz</p>
                            <Link
                                to="/owner/vehicles/new"
                                className="inline-flex items-center gap-2 text-primary hover:underline mt-2 text-sm"
                            >
                                <Plus className="h-4 w-4" />
                                İlk aracınızı ekleyin
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Occupancy & Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Doluluk Oranı</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-muted"
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${stats.occupancyRate * 2.51} 251`}
                                    className="text-primary"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold">{stats.occupancyRate}%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {stats.totalVehicles} araçtan {stats.activeRentals} tanesi şu an kirada
                            </p>
                            {stats.occupancyRate >= 80 && (
                                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    Mükemmel performans!
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Toplam Kazanç</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">₺{stats.totalEarnings.toLocaleString()}</span>
                        <span className="text-muted-foreground">toplam</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Bu ay</span>
                            <span className="font-medium">₺{stats.monthlyEarnings.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
