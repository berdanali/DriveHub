import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Car,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Calendar,
    Fuel,
    Users,
    Settings,
    AlertCircle,
    CheckCircle,
    Clock,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    dailyRate: number;
    status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
    fuelType: string;
    transmission: string;
    seats: number;
    images: string[];
    totalRentals: number;
    totalEarnings: number;
    createdAt: string;
}

export default function MyVehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/vehicles/my');
            setVehicles(response.data || []);
        } catch (error) {
            console.error('Araçlar yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (vehicleId: string, newStatus: string) => {
        try {
            setActionError('');
            await api.patch(`/vehicles/${vehicleId}/status`, { status: newStatus });
            setVehicles(vehicles.map(v => 
                v.id === vehicleId ? { ...v, status: newStatus as Vehicle['status'] } : v
            ));
            setActionMenuOpen(null);
        } catch (err: any) {
            const msg = err?.response?.data?.error?.message || 'Araç durumu değiştirilemedi';
            setActionError(msg);
        }
    };

    const handleDelete = async () => {
        if (!selectedVehicle) return;
        try {
            setActionError('');
            await api.delete(`/vehicles/${selectedVehicle.id}`);
            setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id));
            setShowDeleteModal(false);
            setSelectedVehicle(null);
        } catch (err: any) {
            const msg = err?.response?.data?.error?.message || 'Araç silinemedi';
            setActionError(msg);
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string; label: string; icon: any }> = {
            AVAILABLE: { 
                bg: 'bg-green-100', 
                text: 'text-green-700', 
                label: 'Müsait',
                icon: CheckCircle
            },
            RENTED: { 
                bg: 'bg-blue-100', 
                text: 'text-blue-700', 
                label: 'Kirada',
                icon: Calendar
            },
            MAINTENANCE: { 
                bg: 'bg-orange-100', 
                text: 'text-orange-700', 
                label: 'Bakımda',
                icon: Settings
            },
        };
        const { bg, text, label, icon: Icon } = config[status] || config.AVAILABLE;
        return (
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', bg, text)}>
                <Icon className="h-3 w-3" />
                {label}
            </span>
        );
    };

    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesSearch = `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Araçlarım</h1>
                    <p className="text-muted-foreground">
                        {vehicles.length} araç kayıtlı
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

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Araç ara (marka, model, plaka)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-full sm:w-48"
                >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="AVAILABLE">Müsait</option>
                    <option value="RENTED">Kirada</option>
                    <option value="MAINTENANCE">Bakımda</option>
                </select>
            </div>

            {/* Action Error */}
            {actionError && !showDeleteModal && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                    </div>
                    <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
            )}

            {/* Vehicles Grid */}
            {filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredVehicles.map((vehicle) => (
                        <div key={vehicle.id} className="card overflow-hidden card-hover">
                            {/* Image */}
                            <div className="relative aspect-video bg-muted">
                                {vehicle.images && vehicle.images[0] ? (
                                    <img
                                        src={vehicle.images[0]}
                                        alt={`${vehicle.make} ${vehicle.model}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Car className="h-16 w-16 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    {getStatusBadge(vehicle.status)}
                                </div>
                                <div className="absolute top-3 right-3">
                                    <div className="relative">
                                        <button
                                            onClick={() => setActionMenuOpen(actionMenuOpen === vehicle.id ? null : vehicle.id)}
                                            className="p-1.5 bg-white/90 backdrop-blur rounded-lg hover:bg-white transition-colors"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                        {actionMenuOpen === vehicle.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                                                <Link
                                                    to={`/owner/vehicles/${vehicle.id}/edit`}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Düzenle
                                                </Link>
                                                {vehicle.status === 'AVAILABLE' && (
                                                    <button
                                                        onClick={() => handleStatusChange(vehicle.id, 'MAINTENANCE')}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                        Bakıma Al
                                                    </button>
                                                )}
                                                {vehicle.status === 'MAINTENANCE' && (
                                                    <button
                                                        onClick={() => handleStatusChange(vehicle.id, 'AVAILABLE')}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Müsait Yap
                                                    </button>
                                                )}
                                                <hr className="my-1 border-border" />
                                                <button
                                                    onClick={() => {
                                                        setSelectedVehicle(vehicle);
                                                        setShowDeleteModal(true);
                                                        setActionMenuOpen(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Sil
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {vehicle.make} {vehicle.model}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {vehicle.year} • {vehicle.licensePlate}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary">
                                            ₺{Number(vehicle.dailyRate)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">/gün</p>
                                    </div>
                                </div>

                                {/* Specs */}
                                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Fuel className="h-4 w-4" />
                                        {vehicle.fuelType || 'Benzin'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Settings className="h-4 w-4" />
                                        {vehicle.transmission || 'Otomatik'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {vehicle.seats || 5}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                    <div className="text-center">
                                        <p className="text-lg font-semibold">{vehicle.totalRentals || 0}</p>
                                        <p className="text-xs text-muted-foreground">Kiralama</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold">₺{(vehicle.totalEarnings || 0).toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Kazanç</p>
                                    </div>
                                    <Link
                                        to={`/owner/vehicles/${vehicle.id}`}
                                        className="btn-primary px-3 py-1.5 rounded-lg text-white text-sm"
                                    >
                                        Detaylar
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <Car className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Henüz araç eklenmemiş</h3>
                    <p className="text-muted-foreground mb-6">
                        İlk aracınızı ekleyerek kiraya vermeye başlayın
                    </p>
                    <Link
                        to="/owner/vehicles/new"
                        className="btn-primary px-6 py-2.5 rounded-lg text-white font-medium inline-flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        İlk Aracımı Ekle
                    </Link>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Aracı Sil</h3>
                                <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            <strong>{selectedVehicle.make} {selectedVehicle.model}</strong> aracını silmek istediğinizden emin misiniz?
                            Bu araçla ilgili tüm veriler kalıcı olarak silinecektir.
                        </p>
                        {actionError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedVehicle(null);
                                    setActionError('');
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
