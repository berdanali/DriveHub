import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Search,
    Car,
    Star,
    Users,
    Fuel,
    SlidersHorizontal,
    Grid3X3,
    List,
    MapPin,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Heart,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
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
    address?: string;
}

const fuelTypes = ['Benzin', 'Dizel', 'Hybrid', 'Elektrik'];
const transmissions = ['Otomatik', 'Manuel'];
const categories = [
    'Tümü',
    'Ekonomik',
    'Orta Sınıf',
    'Premium',
    'Lüks',
    'SUV',
    'Minivan',
];

export default function VehicleSearchPage() {
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        fuelType: '',
        transmission: '',
    });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [page, setPage] = useState(1);
    const { isAuthenticated, user } = useAuthStore();
    const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';
    const { data: favoriteIds } = useFavoriteIds();
    const toggleFavorite = useToggleFavorite();

    // Kategori fiyat aralıkları
    const getCategoryPriceRange = (category: string) => {
        switch (category) {
            case 'Ekonomik':
                return { minPrice: '0', maxPrice: '1000' };
            case 'Orta Sınıf':
                return { minPrice: '1000', maxPrice: '2000' };
            case 'Premium':
                return { minPrice: '2000', maxPrice: '3000' };
            case 'Lüks':
                return { minPrice: '3000', maxPrice: '' };
            default:
                return { minPrice: '', maxPrice: '' };
        }
    };

    // Kategori değiştiğinde fiyat aralığını güncelle
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setPage(1);
        if (category === 'Tümü') {
            setFilters({ ...filters, minPrice: '', maxPrice: '' });
        } else {
            const priceRange = getCategoryPriceRange(category);
            setFilters({ ...filters, minPrice: priceRange.minPrice, maxPrice: priceRange.maxPrice });
        }
    };

    // Filtrelenmiş araçlar (kategori bazlı)
    const getFilteredVehicles = () => {
        if (!vehicles) return [];

        // Kategori filtreleme (SUV, Minivan gibi model bazlı)
        if (selectedCategory === 'SUV') {
            return vehicles.filter((v: Vehicle) =>
                v.model?.toLowerCase().includes('suv') ||
                v.model?.toLowerCase().includes('xc') ||
                v.model?.toLowerCase().includes('tucson') ||
                v.model?.toLowerCase().includes('sportage') ||
                v.model?.toLowerCase().includes('cx-5') ||
                v.model?.toLowerCase().includes('3008') ||
                v.model?.toLowerCase().includes('qashqai') ||
                v.model?.toLowerCase().includes('gla') ||
                v.model?.toLowerCase().includes('evoque')
            );
        }

        if (selectedCategory === 'Minivan') {
            return vehicles.filter((v: Vehicle) =>
                v.model?.toLowerCase().includes('minivan') ||
                v.model?.toLowerCase().includes('van')
            );
        }

        return vehicles;
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['vehicles-search', search, filters, selectedCategory, page],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (search) params.append('search', search);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.fuelType) params.append('fuelType', filters.fuelType);
            if (filters.transmission) params.append('transmission', filters.transmission);
            params.append('page', String(page));

            const response = await api.get(`/vehicles/search?${params}`);
            return response.data;
        },
    });

    const vehicles = data?.vehicles || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;
    const filteredVehicles = getFilteredVehicles();

    const clearFilters = () => {
        setSearch('');
        setFilters({ minPrice: '', maxPrice: '', fuelType: '', transmission: '' });
        setSelectedCategory('Tümü');
        setPage(1);
    };

    const hasActiveFilters =
        search ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.fuelType ||
        filters.transmission ||
        selectedCategory !== 'Tümü';

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Hero Section */}
            <section className="relative py-16 bg-gradient-to-r from-primary to-secondary">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920')] bg-cover bg-center mix-blend-overlay opacity-20" />
                <div className="container mx-auto px-4 relative z-10">
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 text-center">
                        Araç Bul ve Kirala
                    </h1>
                    <p className="text-xl text-white/80 text-center mb-8 max-w-2xl mx-auto">
                        {total} araç içinden size en uygun olanı bulun
                    </p>

                    {/* Main Search Bar */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-xl">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Marka veya model ara... (örn: BMW, Mercedes)"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-muted/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors md:w-auto"
                                >
                                    <SlidersHorizontal className="h-5 w-5" />
                                    <span className="hidden sm:inline">Filtreler</span>
                                    {hasActiveFilters && (
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </button>
                                <button className="btn-primary px-8 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
                                    <Search className="h-5 w-5" />
                                    Ara
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => handleCategoryChange(category)}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                                selectedCategory === category
                                    ? 'bg-primary text-white'
                                    : 'bg-card border border-border hover:border-primary'
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Advanced Filters Panel */}
                <div
                    className={cn(
                        'overflow-hidden transition-all duration-300 mb-8',
                        showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                >
                    <div className="bg-card rounded-2xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg">Filtreler</h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    <X className="h-4 w-4" />
                                    Temizle
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Fiyat Aralığı (₺/gün)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                minPrice: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <span className="flex items-center text-muted-foreground">
                                        -
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                maxPrice: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Fuel Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Yakıt Tipi
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.fuelType}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                fuelType: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                                    >
                                        <option value="">Tümü</option>
                                        {fuelTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Transmission */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Vites
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.transmission}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                transmission: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                                    >
                                        <option value="">Tümü</option>
                                        {transmissions.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Sıralama
                                </label>
                                <div className="relative">
                                    <select className="w-full px-3 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                                        <option>Önerilen</option>
                                        <option>Fiyat: Düşükten Yükseğe</option>
                                        <option>Fiyat: Yüksekten Düşüğe</option>
                                        <option>En Yeni</option>
                                        <option>En Popüler</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">
                            {selectedCategory === 'Tümü' ? total : filteredVehicles.length}
                        </span>{' '}
                        araç bulundu
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                'p-2 rounded-lg',
                                viewMode === 'grid'
                                    ? 'bg-primary text-white'
                                    : 'bg-card border border-border'
                            )}
                        >
                            <Grid3X3 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'p-2 rounded-lg',
                                viewMode === 'list'
                                    ? 'bg-primary text-white'
                                    : 'bg-card border border-border'
                            )}
                        >
                            <List className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Araçlar yükleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-24">
                        <Car className="h-16 w-16 mx-auto text-red-400 mb-4" />
                        <p className="text-red-500 mb-2 font-medium">
                            Araçlar yüklenirken bir hata oluştu
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            {error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                            <Car className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Araç Bulunamadı</h3>
                        <p className="text-muted-foreground mb-4">
                            Arama kriterlerinize uygun araç bulunamadı.
                        </p>
                        <button
                            onClick={clearFilters}
                            className="text-primary font-medium hover:underline"
                        >
                            Filtreleri temizle
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVehicles.map((vehicle: Vehicle) => (
                            <Link
                                key={vehicle.id}
                                to={`/vehicles/${vehicle.id}`}
                                className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 card-hover"
                            >
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    {vehicle.images?.[0] ? (
                                        <img
                                            src={vehicle.images[0]}
                                            alt={`${vehicle.make} ${vehicle.model}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Car className="h-16 w-16 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        {isCustomer && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavorite.mutate(vehicle.id);
                                                }}
                                                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                                                title={favoriteIds?.includes(vehicle.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                            >
                                                <Heart className={cn(
                                                    "h-4 w-4",
                                                    favoriteIds?.includes(vehicle.id)
                                                        ? "fill-red-500 text-red-500"
                                                        : "text-gray-600"
                                                )} />
                                            </button>
                                        )}
                                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            4.9
                                        </div>
                                    </div>
                                    <span
                                        className={cn(
                                            'absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium',
                                            vehicle.status === 'AVAILABLE'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {vehicle.status === 'AVAILABLE'
                                            ? 'Müsait'
                                            : 'Rezerveli'}
                                    </span>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {vehicle.make} {vehicle.model}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {vehicle.year} • {vehicle.color}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground my-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {vehicle.seats}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Fuel className="h-4 w-4" />
                                            {vehicle.fuelType}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Car className="h-4 w-4" />
                                            {vehicle.transmission}
                                        </div>
                                    </div>

                                    {vehicle.features?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {vehicle.features.slice(0, 3).map((feature) => (
                                                <span
                                                    key={feature}
                                                    className="px-2 py-1 bg-muted rounded-lg text-xs"
                                                >
                                                    {feature}
                                                </span>
                                            ))}
                                            {vehicle.features.length > 3 && (
                                                <span className="px-2 py-1 bg-muted rounded-lg text-xs text-muted-foreground">
                                                    +{vehicle.features.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <div>
                                            <span className="text-2xl font-bold text-primary">
                                                ₺{Number(vehicle.dailyRate).toFixed(0)}
                                            </span>
                                            <span className="text-muted-foreground text-sm">
                                                /gün
                                            </span>
                                        </div>
                                        <button className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
                                            Kirala
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-4">
                        {filteredVehicles.map((vehicle: Vehicle) => (
                            <Link
                                key={vehicle.id}
                                to={`/vehicles/${vehicle.id}`}
                                className="flex flex-col md:flex-row gap-6 bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 p-4"
                            >
                                <div className="relative w-full md:w-80 aspect-[16/10] md:aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0">
                                    {vehicle.images?.[0] ? (
                                        <img
                                            src={vehicle.images[0]}
                                            alt={`${vehicle.make} ${vehicle.model}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Car className="h-16 w-16 text-muted-foreground" />
                                        </div>
                                    )}
                                    <span
                                        className={cn(
                                            'absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium',
                                            vehicle.status === 'AVAILABLE'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {vehicle.status === 'AVAILABLE'
                                            ? 'Müsait'
                                            : 'Rezerveli'}
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-xl">
                                                    {vehicle.make} {vehicle.model}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {vehicle.year} • {vehicle.color}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isCustomer && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleFavorite.mutate(vehicle.id);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                                                        title={favoriteIds?.includes(vehicle.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                                    >
                                                        <Heart className={cn(
                                                            "h-4 w-4",
                                                            favoriteIds?.includes(vehicle.id)
                                                                ? "fill-red-500 text-red-500"
                                                                : "text-muted-foreground"
                                                        )} />
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-medium">4.9</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-muted-foreground my-4">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {vehicle.seats} Kişi
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Fuel className="h-4 w-4" />
                                                {vehicle.fuelType}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Car className="h-4 w-4" />
                                                {vehicle.transmission}
                                            </div>
                                            {vehicle.address && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    {vehicle.address}
                                                </div>
                                            )}
                                        </div>

                                        {vehicle.features?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {vehicle.features.map((feature) => (
                                                    <span
                                                        key={feature}
                                                        className="px-2 py-1 bg-muted rounded-lg text-xs"
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                                        <div>
                                            <span className="text-3xl font-bold text-primary">
                                                ₺{Number(vehicle.dailyRate).toFixed(0)}
                                            </span>
                                            <span className="text-muted-foreground">
                                                /gün
                                            </span>
                                        </div>
                                        <button className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
                                            Hemen Kirala
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && !error && filteredVehicles.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                            ? 'bg-primary text-white'
                                            : 'border border-border bg-card hover:bg-muted'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        >
                            Sonraki
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
