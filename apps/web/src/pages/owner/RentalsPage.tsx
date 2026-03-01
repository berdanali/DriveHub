import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Car,
    Phone,
    Mail,
    AlertCircle,
    Search,
    Filter,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Rental {
    id: string;
    vehicle: {
        id: string;
        make: string;
        model: string;
        licensePlate: string;
        images?: string[];
        ownerId: string;
    };
    customer: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
    createdAt: string;
}

export default function OwnerRentalsPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        loadRentals();
    }, []);

    const loadRentals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/rentals/owner');
            setRentals(response.data || []);
        } catch (error) {
            console.error('Kiralamalar yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (rentalId: string) => {
        try {
            setActionLoading(true);
            setActionError('');
            await api.patch(`/rentals/${rentalId}/approve`);
            setRentals(rentals.map(r => 
                r.id === rentalId ? { ...r, status: 'APPROVED' as const } : r
            ));
            setShowDetailModal(false);
        } catch (err: any) {
            const msg = err?.response?.data?.error?.message || 'Kiralama onaylanamadı';
            setActionError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (rentalId: string) => {
        try {
            setActionLoading(true);
            setActionError('');
            await api.patch(`/rentals/${rentalId}/reject`);
            setRentals(rentals.map(r => 
                r.id === rentalId ? { ...r, status: 'REJECTED' as const } : r
            ));
            setShowDetailModal(false);
        } catch (err: any) {
            const msg = err?.response?.data?.error?.message || 'Kiralama reddedilemedi';
            setActionError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Onay Bekliyor' },
            APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Onaylandı' },
            ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
            COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Tamamlandı' },
            CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'İptal Edildi' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Reddedildi' },
        };
        return config[status] || config.PENDING;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const calculateDays = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const filteredRentals = rentals.filter(rental => 
        statusFilter === 'ALL' || rental.status === statusFilter
    );

    const pendingCount = rentals.filter(r => r.status === 'PENDING').length;

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
            <div>
                <h1 className="text-2xl font-bold">Kiralamalar</h1>
                <p className="text-muted-foreground">
                    Araçlarınıza gelen kiralama taleplerini yönetin
                </p>
            </div>

            {/* Pending Alert */}
            {pendingCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-yellow-800">
                            {pendingCount} adet bekleyen kiralama talebi var
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Müşterilerinizi bekletmeyin, talepleri incelemeyi unutmayın.
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((status) => {
                    const count = status === 'ALL' 
                        ? rentals.length 
                        : rentals.filter(r => r.status === status).length;
                    const isActive = statusFilter === status;
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-white'
                                    : 'bg-muted hover:bg-muted/80'
                            )}
                        >
                            {status === 'ALL' ? 'Tümü' : getStatusConfig(status).label}
                            <span className="ml-1.5 opacity-70">({count})</span>
                        </button>
                    );
                })}
            </div>

            {/* Rentals List */}
            {filteredRentals.length > 0 ? (
                <div className="space-y-4">
                    {filteredRentals.map((rental) => {
                        const statusConfig = getStatusConfig(rental.status);
                        const days = calculateDays(rental.startDate, rental.endDate);
                        
                        return (
                            <div 
                                key={rental.id} 
                                className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                    setSelectedRental(rental);
                                    setShowDetailModal(true);
                                }}
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Vehicle Image */}
                                    <div className="w-full md:w-32 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                        {rental.vehicle.images?.[0] ? (
                                            <img
                                                src={rental.vehicle.images[0]}
                                                alt={`${rental.vehicle.make} ${rental.vehicle.model}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-semibold">
                                                    {rental.vehicle.make} {rental.vehicle.model}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {rental.vehicle.licensePlate}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                'px-2 py-1 rounded-full text-xs font-medium',
                                                statusConfig.bg, statusConfig.text
                                            )}>
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                {rental.customer.firstName} {rental.customer.lastName}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {days} gün
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-primary">
                                                ₺{Number(rental.totalAmount).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Toplam</p>
                                        </div>

                                        {rental.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApprove(rental.id);
                                                    }}
                                                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                    title="Onayla"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReject(rental.id);
                                                    }}
                                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    title="Reddet"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Henüz kiralama yok</h3>
                    <p className="text-muted-foreground">
                        Araçlarınız kiralandığında burada görünecek
                    </p>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRental && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">Kiralama Detayı</h2>
                                    <p className="text-sm text-muted-foreground">
                                        #{selectedRental.id.slice(0, 8)}
                                    </p>
                                </div>
                                <span className={cn(
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    getStatusConfig(selectedRental.status).bg,
                                    getStatusConfig(selectedRental.status).text
                                )}>
                                    {getStatusConfig(selectedRental.status).label}
                                </span>
                            </div>

                            {/* Vehicle Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Araç</h3>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <div className="w-16 h-12 rounded bg-background overflow-hidden">
                                        {selectedRental.vehicle.images?.[0] ? (
                                            <img
                                                src={selectedRental.vehicle.images[0]}
                                                alt="Araç"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="h-6 w-6 text-muted-foreground/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {selectedRental.vehicle.make} {selectedRental.vehicle.model}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedRental.vehicle.licensePlate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Müşteri</h3>
                                <div className="p-3 bg-muted rounded-lg space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedRental.customer.firstName} {selectedRental.customer.lastName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a href={`mailto:${selectedRental.customer.email}`} className="text-primary hover:underline">
                                            {selectedRental.customer.email}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Dates & Price */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Başlangıç</h3>
                                    <p className="font-medium">{formatDate(selectedRental.startDate)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Bitiş</h3>
                                    <p className="font-medium">{formatDate(selectedRental.endDate)}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-primary/5 rounded-lg mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Toplam Tutar</span>
                                    <span className="text-xl font-bold text-primary">
                                        ₺{Number(selectedRental.totalAmount).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {calculateDays(selectedRental.startDate, selectedRental.endDate)} gün kiralama
                                </p>
                            </div>

                            {/* Error message */}
                            {actionError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDetailModal(false); setActionError(''); }}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
                                >
                                    Kapat
                                </button>
                                {selectedRental.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleReject(selectedRental.id)}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            Reddet
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedRental.id)}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Onayla
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

