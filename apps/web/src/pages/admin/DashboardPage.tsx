import { useQuery } from '@tanstack/react-query';
import { Users, Car, DollarSign, Activity, TrendingUp, Loader2 } from 'lucide-react';
import api from '@/services/api';

export default function AdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // Parallel requests for dashboard data
            const [usersRes, vehiclesRes, rentalsRes] = await Promise.all([
                api.get('/users').catch(() => ({ data: [] })),
                api.get('/vehicles/search').catch(() => ({ data: { vehicles: [], total: 0 } })),
                api.get('/rentals/admin/statistics').catch(() => ({ data: { totalRentals: 0, activeRentals: 0, totalRevenue: 0 } })),
            ]);

            return {
                totalUsers: usersRes.data?.total || usersRes.data?.users?.length || 0,
                totalVehicles: vehiclesRes.data?.total || 0,
                activeRentals: rentalsRes.data?.activeRentals || 0,
                totalRevenue: rentalsRes.data?.totalRevenue || 0,
            };
        },
    });

    const statCards = [
        {
            name: 'Toplam Kullanıcı',
            value: stats?.totalUsers || 0,
            change: '+12%',
            icon: Users,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            name: 'Aktif Kiralamalar',
            value: stats?.activeRentals || 0,
            change: '+8%',
            icon: Activity,
            color: 'bg-green-500',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
        {
            name: 'Toplam Araç',
            value: stats?.totalVehicles || 0,
            change: '+5%',
            icon: Car,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
        {
            name: 'Toplam Gelir',
            value: `₺${(stats?.totalRevenue || 0).toLocaleString('tr-TR')}`,
            change: '+18%',
            icon: DollarSign,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Yönetim Paneli</h1>
                <p className="text-muted-foreground">Yönetim paneline hoş geldiniz</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div
                        key={stat.name}
                        className="bg-card rounded-xl p-6 border border-border"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.name}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                    <span className="text-sm text-green-500">{stat.change}</span>
                                </div>
                            </div>
                            <div className={`${stat.bgColor} p-3 rounded-lg`}>
                                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl p-6 border border-border">
                    <h2 className="text-lg font-semibold mb-4">Son İşlemler</h2>
                    <div className="space-y-4">
                        {[
                            { action: 'Yeni kullanıcı kaydı', user: 'ahmet@example.com', time: '2 dk önce' },
                            { action: 'Araç onaylandı', user: 'Toyota Camry 2023', time: '15 dk önce' },
                            { action: 'Kiralama tamamlandı', user: 'Kiralama #1234', time: '1 saat önce' },
                            { action: 'Ödeme alındı', user: '₺450.00', time: '2 saat önce' },
                        ].map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                                <div>
                                    <p className="font-medium text-sm">{activity.action}</p>
                                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                    <h2 className="text-lg font-semibold mb-4">Hızlı İşlemler</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                            <Users className="h-5 w-5 text-primary mb-2" />
                            <p className="font-medium text-sm">Kullanıcıları Yönet</p>
                        </button>
                        <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                            <Car className="h-5 w-5 text-primary mb-2" />
                            <p className="font-medium text-sm">Araçları Görüntüle</p>
                        </button>
                        <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                            <Activity className="h-5 w-5 text-primary mb-2" />
                            <p className="font-medium text-sm">Kiralamalar</p>
                        </button>
                        <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
                            <DollarSign className="h-5 w-5 text-primary mb-2" />
                            <p className="font-medium text-sm">Finansal Rapor</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
