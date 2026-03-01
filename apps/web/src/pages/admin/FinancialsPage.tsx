import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const revenueData = [
    { name: 'Pzt', revenue: 4000, commission: 600 },
    { name: 'Sal', revenue: 3000, commission: 450 },
    { name: 'Çar', revenue: 5000, commission: 750 },
    { name: 'Per', revenue: 2780, commission: 417 },
    { name: 'Cum', revenue: 6890, commission: 1034 },
    { name: 'Cmt', revenue: 8390, commission: 1259 },
    { name: 'Paz', revenue: 7490, commission: 1124 },
];

const payoutData = [
    { name: 'Platform Komisyonu', value: 15 },
    { name: 'Araç Sahibi Ödemesi', value: 85 },
];

const COLORS = ['#3b82f6', '#22c55e'];

export default function FinancialsPage() {
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCommission = revenueData.reduce((sum, item) => sum + item.commission, 0);
    const ownerPayout = totalRevenue - totalCommission;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Finansal Raporlar</h1>
                <p className="text-gray-500">Gelir analitiği ve ödemeler</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500">Toplam Gelir (Bu Hafta)</p>
                    <p className="text-3xl font-bold mt-2">₺{totalRevenue.toLocaleString('tr-TR')}</p>
                    <p className="text-sm text-green-500 mt-1">Geçen haftaya göre +%18</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500">Platform Komisyonu (%15)</p>
                    <p className="text-3xl font-bold mt-2 text-blue-600">₺{totalCommission.toLocaleString('tr-TR')}</p>
                    <p className="text-sm text-gray-500 mt-1">Platform kazancı</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500">Araç Sahibi Ödemeleri</p>
                    <p className="text-3xl font-bold mt-2 text-green-600">₺{ownerPayout.toLocaleString('tr-TR')}</p>
                    <p className="text-sm text-gray-500 mt-1">Dağıtılacak tutar</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Günlük Gelir</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Gelir" />
                                <Bar dataKey="commission" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Komisyon" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payout Distribution Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Gelir Dağılımı</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={payoutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {payoutData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        {payoutData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index] }}
                                />
                                <span className="text-sm">{entry.name}: {entry.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Son İşlemler</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 text-sm font-medium text-gray-500">İşlem No</th>
                                <th className="text-left py-3 text-sm font-medium text-gray-500">Tür</th>
                                <th className="text-left py-3 text-sm font-medium text-gray-500">Tutar</th>
                                <th className="text-left py-3 text-sm font-medium text-gray-500">Durum</th>
                                <th className="text-left py-3 text-sm font-medium text-gray-500">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[
                                { id: 'TXN-001', type: 'Kiralama Ödemesi', amount: 450, status: 'Tamamlandı' },
                                { id: 'TXN-002', type: 'Araç Sahibi Ödemesi', amount: 382.50, status: 'Beklemede' },
                                { id: 'TXN-003', type: 'Komisyon', amount: 67.50, status: 'Tamamlandı' },
                                { id: 'TXN-004', type: 'İade', amount: -125, status: 'Tamamlandı' },
                            ].map((txn) => (
                                <tr key={txn.id}>
                                    <td className="py-3 text-sm font-mono">{txn.id}</td>
                                    <td className="py-3 text-sm">{txn.type}</td>
                                    <td className={`py-3 text-sm font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {txn.amount < 0 ? '-' : '+'}₺{Math.abs(txn.amount).toFixed(2)}
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${txn.status === 'Tamamlandı' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">Bugün</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
