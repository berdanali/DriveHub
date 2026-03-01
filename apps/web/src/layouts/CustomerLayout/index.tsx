import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Car,
    Menu,
    X,
    LogOut,
    CalendarCheck,
    Bell,
    Settings,
    Heart,
    Home,
    User,
    Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Kiralamalarım', href: '/customer/rentals', icon: CalendarCheck },
    { name: 'Favorilerim', href: '/customer/favorites', icon: Heart },
    { name: 'Ayarlar', href: '/customer/settings', icon: Settings },
];

export default function CustomerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                            <Car className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">RentaCar</span>
                            <span className="text-xs text-muted-foreground block -mt-1">Müşteri Paneli</span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 rounded hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Quick Action */}
                <div className="p-4">
                    <Link
                        to="/vehicles"
                        className="w-full btn-primary py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                    >
                        <Car className="h-4 w-4" />
                        Araç Kirala
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="px-3 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href ||
                            (item.href !== '/customer/rentals' && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-white'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="my-4 mx-4 border-t border-border" />

                {/* Back to Site */}
                <div className="px-3">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <Home className="h-5 w-5" />
                        Siteye Dön
                    </Link>
                </div>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-card border-b border-border">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-muted"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="hidden lg:block">
                        <h1 className="text-lg font-semibold">
                            {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Panelim'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

