import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Car,
    User,
    Menu,
    X,
    Phone,
    Mail,
    MapPin,
    ChevronDown,
    LogOut,
    Settings,
    LayoutDashboard,
    Plus,
    CalendarCheck,
    Heart,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';

export default function PublicLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await authService.logout();
        setUserMenuOpen(false);
        navigate('/login');
    };

    // Rol bazlı navigation linkleri
    const getNavLinks = () => {
        const baseLinks = [
            { to: '/', label: 'Ana Sayfa' },
            { to: '/vehicles', label: 'Araçlar' },
        ];

        if (isAuthenticated && user?.role === 'VEHICLE_OWNER') {
            return [
                ...baseLinks,
                { to: '/owner', label: 'Panelim' },
                { to: '/owner/vehicles', label: 'Araçlarım' },
            ];
        }

        if (isAuthenticated && user?.role === 'CUSTOMER') {
            return [
                ...baseLinks,
                { to: '/rentals', label: 'Kiralamalarım' },
                { to: '/favorites', label: 'Favorilerim' },
            ];
        }

        if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
            return [
                ...baseLinks,
                { to: '/admin', label: 'Yönetim' },
            ];
        }

        return [
            ...baseLinks,
            { to: '/how-it-works', label: 'Nasıl Çalışır?' },
            { to: '/about', label: 'Hakkımızda' },
            { to: '/contact', label: 'İletişim' },
        ];
    };

    const navLinks = getNavLinks();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header
                className={cn(
                    'sticky top-0 z-50 transition-all duration-300',
                    scrolled
                        ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
                        : 'bg-background border-b border-transparent'
                )}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                                <Car className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg text-foreground">
                                RentaCar
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                        location.pathname === link.to
                                            ? 'text-primary bg-primary/5'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Auth Section */}
                        <div className="hidden lg:flex items-center gap-3">
                            {/* Araç Sahibi için hızlı buton */}
                            {isAuthenticated && user?.role === 'VEHICLE_OWNER' && (
                                <Link
                                    to="/owner/vehicles/new"
                                    className="btn-primary px-4 py-2 rounded-lg text-sm text-white font-medium"
                                >
                                    + Araç Ekle
                                </Link>
                            )}

                            {isAuthenticated ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-sm font-medium block leading-tight">
                                                {user?.firstName || user?.email?.split('@')[0] || 'Kullanıcı'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {user?.role === 'SUPER_ADMIN'
                                                    ? 'Yönetici'
                                                    : user?.role === 'VEHICLE_OWNER'
                                                    ? 'Araç Sahibi'
                                                    : 'Müşteri'}
                                            </span>
                                        </div>
                                        <ChevronDown className={cn(
                                            "h-4 w-4 text-muted-foreground transition-transform",
                                            userMenuOpen && "rotate-180"
                                        )} />
                                    </button>

                                    {/* User Dropdown */}
                                    {userMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                                            <div className="px-4 py-2 border-b border-border">
                                                <p className="font-medium text-sm">
                                                    {user?.firstName && user?.lastName 
                                                        ? `${user.firstName} ${user.lastName}`
                                                        : user?.email?.split('@')[0] || 'Kullanıcı'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                                                <p className="text-xs text-primary mt-1">
                                                    {user?.role === 'VEHICLE_OWNER' ? 'Araç Sahibi' : 
                                                     user?.role === 'SUPER_ADMIN' ? 'Yönetici' : 'Müşteri'}
                                                </p>
                                            </div>

                                            {/* Araç Sahibi için menü */}
                                            {user?.role === 'VEHICLE_OWNER' && (
                                                <>
                                                    <Link
                                                        to="/owner"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                                    >
                                                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                                        Panelim
                                                    </Link>
                                                    <Link
                                                        to="/owner/vehicles"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                                    >
                                                        <Car className="h-4 w-4 text-muted-foreground" />
                                                        Araçlarım
                                                    </Link>
                                                    <Link
                                                        to="/owner/rentals"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                                    >
                                                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                                        Kiralamalar
                                                    </Link>
                                                </>
                                            )}

                                            {/* Müşteri için menü */}
                                            {user?.role === 'CUSTOMER' && (
                                                <>
                                                    <Link
                                                        to="/rentals"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                                    >
                                                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                                        Kiralamalarım
                                                    </Link>
                                                    <Link
                                                        to="/favorites"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                                    >
                                                        <Heart className="h-4 w-4 text-muted-foreground" />
                                                        Favorilerim
                                                    </Link>
                                                </>
                                            )}

                                            {/* Admin için menü */}
                                            {user?.role === 'SUPER_ADMIN' && (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                                >
                                                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                                    Yönetim Paneli
                                                </Link>
                                            )}

                                            <Link
                                                to="/settings"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                            >
                                                <Settings className="h-4 w-4 text-muted-foreground" />
                                                Ayarlar
                                            </Link>
                                            <div className="border-t border-border mt-2 pt-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Çıkış Yap
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="btn-primary px-5 py-2 rounded-lg text-sm text-white"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            {menuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div
                    className={cn(
                        'lg:hidden overflow-hidden transition-all duration-300 bg-background border-t border-border',
                        menuOpen ? 'max-h-[500px]' : 'max-h-0 border-transparent'
                    )}
                >
                    <nav className="p-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMenuOpen(false)}
                                className={cn(
                                    'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                    location.pathname === link.to
                                        ? 'text-primary bg-primary/5'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        
                        <div className="pt-4 mt-4 border-t border-border space-y-2">
                            {isAuthenticated ? (
                                <>
                                    <div className="px-4 py-2">
                                        <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        <p className="text-xs text-primary mt-1">
                                            {user?.role === 'VEHICLE_OWNER' ? 'Araç Sahibi' : 
                                             user?.role === 'SUPER_ADMIN' ? 'Yönetici' : 'Müşteri'}
                                        </p>
                                    </div>
                                    
                                    {/* Araç Sahibi için özel butonlar */}
                                    {user?.role === 'VEHICLE_OWNER' && (
                                        <>
                                            <Link
                                                to="/owner/vehicles/new"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 mx-4 px-4 py-3 rounded-lg text-sm font-medium text-white bg-primary"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Araç Ekle
                                            </Link>
                                            <Link
                                                to="/owner"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                                            >
                                                <LayoutDashboard className="h-4 w-4" />
                                                Panelim
                                            </Link>
                                            <Link
                                                to="/owner/vehicles"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                                            >
                                                <Car className="h-4 w-4" />
                                                Araçlarım
                                            </Link>
                                            <Link
                                                to="/owner/rentals"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                                            >
                                                <CalendarCheck className="h-4 w-4" />
                                                Kiralamalar
                                            </Link>
                                        </>
                                    )}

                                    {/* Müşteri için */}
                                    {user?.role === 'CUSTOMER' && (
                                        <>
                                            <Link
                                                to="/rentals"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                                            >
                                                <CalendarCheck className="h-4 w-4" />
                                                Kiralamalarım
                                            </Link>
                                            <Link
                                                to="/favorites"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                                            >
                                                <Heart className="h-4 w-4" />
                                                Favorilerim
                                            </Link>
                                        </>
                                    )}

                                    {/* Admin için */}
                                    {user?.role === 'SUPER_ADMIN' && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            Yönetim Paneli
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        Çıkış Yap
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-3 text-center rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMenuOpen(false)}
                                        className="block btn-primary px-4 py-3 text-center rounded-lg text-sm text-white"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-card border-t border-border mt-auto">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div>
                            <Link to="/" className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                                    <Car className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-lg">RentaCar</span>
                            </Link>
                            <p className="text-sm text-muted-foreground mb-4">
                                Türkiye'nin güvenilir araç kiralama platformu. Kaliteli araçlar, uygun fiyatlar.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-semibold mb-4">Hızlı Linkler</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link to="/vehicles" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        Araçlar
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        Nasıl Çalışır?
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        Hakkımızda
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        SSS
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="font-semibold mb-4">Yasal</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        Kullanım Koşulları
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        Gizlilik Politikası
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/kvkk" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        KVKK
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="font-semibold mb-4">İletişim</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    İstanbul, Türkiye
                                </li>
                                <li>
                                    <a href="tel:+908501234567" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                        <Phone className="h-4 w-4" />
                                        0850 123 45 67
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:info@rentacar.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                        <Mail className="h-4 w-4" />
                                        info@rentacar.com
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="border-t border-border">
                    <div className="container mx-auto px-4 py-4">
                        <p className="text-sm text-center text-muted-foreground">
                            © 2024 RentaCar. Tüm hakları saklıdır.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
