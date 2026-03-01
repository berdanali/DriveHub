import { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    Car,
    Download,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface EarningsData {
    totalEarnings: number;
    monthlyEarnings: number;
    weeklyEarnings: number;
    monthlyChange: number;
    completedRentals: number;
    averagePerRental: number;
}

interface Transaction {
    id: string;
    vehicleName: string;
    customerName: string;
    amount: number;
    date: string;
    type: 'EARNING' | 'COMMISSION';
}

export default function OwnerEarningsPage() {
    const [earnings, setEarnings] = useState<EarningsData>({
        totalEarnings: 0,
        monthlyEarnings: 0,
        weeklyEarnings: 0,
        monthlyChange: 0,
        completedRentals: 0,
        averagePerRental: 0,
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

    useEffect(() => {
        loadEarningsData();
    }, []);

    const loadEarningsData = async () => {
        try {
            setLoading(true);
            
            // Bu API'ler backend'de tanımlanmalı
            const rentalsRes = await api.get('/rentals/owner').catch(() => ({ data: [] }));
            const rentals = rentalsRes.data || [];
            
            // Tamamlanan kiralamaları filtrele
            const completedRentals = rentals.filter((r: any) => r.status === 'COMPLETED');
            
            // İstatistikleri hesapla
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

            const totalEarnings = completedRentals.reduce((sum: number, r: any) => 
                sum + (Number(r.totalAmount) || 0), 0);
            
            const weeklyRentals = completedRentals.filter((r: any) => 
                new Date(r.createdAt) >= weekAgo);
            const weeklyEarnings = weeklyRentals.reduce((sum: number, r: any) => 
                sum + (Number(r.totalAmount) || 0), 0);
            
            const monthlyRentals = completedRentals.filter((r: any) => 
                new Date(r.createdAt) >= monthAgo);
            const monthlyEarnings = monthlyRentals.reduce((sum: number, r: any) => 
                sum + (Number(r.totalAmount) || 0), 0);
            
            const prevMonthRentals = completedRentals.filter((r: any) => {
                const date = new Date(r.createdAt);
                return date >= twoMonthsAgo && date < monthAgo;
            });
            const prevMonthEarnings = prevMonthRentals.reduce((sum: number, r: any) => 
                sum + (Number(r.totalAmount) || 0), 0);
            
            const monthlyChange = prevMonthEarnings > 0 
                ? ((monthlyEarnings - prevMonthEarnings) / prevMonthEarnings) * 100 
                : 0;

            setEarnings({
                totalEarnings,
                monthlyEarnings,
                weeklyEarnings,
                monthlyChange: Math.round(monthlyChange),
                completedRentals: completedRentals.length,
                averagePerRental: completedRentals.length > 0 
                    ? Math.round(totalEarnings / completedRentals.length) 
                    : 0,
            });

            // Son işlemleri oluştur
            const recentTransactions = completedRentals
                .slice(0, 10)
                .map((r: any) => ({
                    id: r.id,
                    vehicleName: `${r.vehicle?.make || ''} ${r.vehicle?.model || ''}`.trim() || 'Araç',
                    customerName: `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim() || 'Müşteri',
                    amount: Number(r.totalAmount) || 0,
                    date: r.createdAt,
                    type: 'EARNING' as const,
                }));
            
            setTransactions(recentTransactions);
        } catch (error) {
            console.error('Kazanç verileri yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Kazançlar</h1>
                    <p className="text-muted-foreground">
                        Gelirlerinizi takip edin ve analiz edin
                    </p>
                </div>
                <button className="btn-primary px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Rapor İndir
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Toplam Kazanç</span>
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(earnings.totalEarnings)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {earnings.completedRentals} tamamlanan kiralama
                    </p>
                </div>

                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Bu Ay</span>
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(earnings.monthlyEarnings)}</p>
                    <div className={cn(
                        "flex items-center gap-1 text-xs mt-1",
                        earnings.monthlyChange >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                        {earnings.monthlyChange >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3" />
                        )}
                        %{Math.abs(earnings.monthlyChange)} geçen aya göre
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Bu Hafta</span>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(earnings.weeklyEarnings)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Son 7 gün</p>
                </div>

                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">Ortalama</span>
                        <Car className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(earnings.averagePerRental)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Kiralama başına</p>
                </div>
            </div>

            {/* Chart Placeholder */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold">Kazanç Grafiği</h2>
                    <div className="flex gap-2">
                        {['week', 'month', 'year'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period as any)}
                                className={cn(
                                    'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                                    selectedPeriod === period
                                        ? 'bg-primary text-white'
                                        : 'bg-muted hover:bg-muted/80'
                                )}
                            >
                                {period === 'week' ? 'Hafta' : period === 'month' ? 'Ay' : 'Yıl'}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Simple Bar Chart */}
                <div className="h-48 flex items-end gap-2">
                    {Array.from({ length: 12 }).map((_, i) => {
                        const height = Math.random() * 100;
                        const isCurrentMonth = i === new Date().getMonth();
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div 
                                    className={cn(
                                        "w-full rounded-t transition-all",
                                        isCurrentMonth ? "bg-primary" : "bg-primary/30"
                                    )}
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'][i]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-semibold">Son İşlemler</h2>
                </div>
                {transactions.length > 0 ? (
                    <div className="divide-y divide-border">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        transaction.type === 'EARNING' 
                                            ? "bg-green-100" 
                                            : "bg-red-100"
                                    )}>
                                        {transaction.type === 'EARNING' ? (
                                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">{transaction.vehicleName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {transaction.customerName}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "font-semibold",
                                        transaction.type === 'EARNING' 
                                            ? "text-green-600" 
                                            : "text-red-600"
                                    )}>
                                        {transaction.type === 'EARNING' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(transaction.date)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Henüz işlem yok</p>
                    </div>
                )}
            </div>
        </div>
    );
}

