import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Car,
    Upload,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Info,
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const vehicleSchema = z.object({
    make: z.string().min(2, 'Marka zorunludur'),
    model: z.string().min(1, 'Model zorunludur'),
    year: z.number().min(1990).max(new Date().getFullYear() + 1),
    licensePlate: z.string().min(5, 'Plaka zorunludur').max(10),
    color: z.string().min(2, 'Renk zorunludur'),
    fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG']),
    transmission: z.enum(['AUTOMATIC', 'MANUAL']),
    seats: z.number().min(2).max(9),
    dailyRate: z.number().min(100, 'Günlük fiyat en az 100₺ olmalı'),
    weeklyDiscount: z.number().min(0).max(50).optional(),
    monthlyDiscount: z.number().min(0).max(70).optional(),
    description: z.string().max(1000).optional(),
    features: z.array(z.string()).optional(),
    city: z.string().min(2, 'Şehir zorunludur'),
    address: z.string().optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

const brands = [
    'Audi', 'BMW', 'Chevrolet', 'Citroen', 'Dacia', 'Fiat', 'Ford', 'Honda',
    'Hyundai', 'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot',
    'Renault', 'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'
];

const fuelTypes = [
    { value: 'GASOLINE', label: 'Benzin' },
    { value: 'DIESEL', label: 'Dizel' },
    { value: 'ELECTRIC', label: 'Elektrik' },
    { value: 'HYBRID', label: 'Hibrit' },
    { value: 'LPG', label: 'LPG' },
];

const transmissions = [
    { value: 'AUTOMATIC', label: 'Otomatik' },
    { value: 'MANUAL', label: 'Manuel' },
];

const featureOptions = [
    'Klima', 'Navigasyon', 'Bluetooth', 'Geri Görüş Kamerası', 'Park Sensörü',
    'Deri Koltuk', 'Isıtmalı Koltuk', 'Sunroof', 'Cruise Control', 'Start/Stop',
    'Apple CarPlay', 'Android Auto', 'USB Girişi', 'ABS', 'ESP', 'Hız Sabitleyici',
];

const cities = [
    'Adana', 'Ankara', 'Antalya', 'Bursa', 'Denizli', 'Diyarbakır', 'Eskişehir',
    'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya', 'Mersin',
    'Muğla', 'Samsun', 'Trabzon'
];

export default function AddVehiclePage() {
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<VehicleForm>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            year: new Date().getFullYear(),
            seats: 5,
            fuelType: 'GASOLINE',
            transmission: 'AUTOMATIC',
            dailyRate: 500,
            weeklyDiscount: 10,
            monthlyDiscount: 20,
        },
    });

    const dailyPrice = watch('dailyRate');
    const weeklyDiscount = watch('weeklyDiscount') || 0;
    const monthlyDiscount = watch('monthlyDiscount') || 0;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 6) {
            setError('En fazla 6 fotoğraf yükleyebilirsiniz');
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        // Preview oluştur
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    const toggleFeature = (feature: string) => {
        setSelectedFeatures(prev =>
            prev.includes(feature)
                ? prev.filter(f => f !== feature)
                : [...prev, feature]
        );
    };

    const onSubmit = async (data: VehicleForm) => {
        try {
            setError('');
            
            // Form data oluştur
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });
            formData.append('features', JSON.stringify(selectedFeatures));
            
            // Resimleri ekle
            images.forEach((image, index) => {
                formData.append(`images`, image);
            });

            await api.post('/vehicles', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/owner/vehicles');
            }, 2000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Araç eklenirken bir hata oluştu');
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Araç Başarıyla Eklendi!</h2>
                    <p className="text-muted-foreground mb-4">
                        Aracınız inceleme sonrası yayına alınacaktır.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Araçlarım sayfasına yönlendiriliyorsunuz...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/owner/vehicles')}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Yeni Araç Ekle</h1>
                    <p className="text-muted-foreground">Aracınızın bilgilerini girin</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-error mb-6 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Images */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Araç Fotoğrafları
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        En az 1, en fazla 6 fotoğraf yükleyebilirsiniz. İlk fotoğraf kapak resmi olacaktır.
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={preview}
                                    alt={`Araç ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                {index === 0 && (
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                                        Kapak
                                    </span>
                                )}
                            </div>
                        ))}
                        
                        {images.length < 6 && (
                            <label className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Fotoğraf Ekle</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Araç Bilgileri
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Marka *</label>
                            <select {...register('make')} className="input">
                                <option value="">Marka seçin</option>
                                {brands.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                            {errors.make && (
                                <p className="text-sm text-red-500 mt-1">{errors.make.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Model *</label>
                            <input {...register('model')} className="input" placeholder="örn: Corolla" />
                            {errors.model && (
                                <p className="text-sm text-red-500 mt-1">{errors.model.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Yıl *</label>
                            <input
                                {...register('year', { valueAsNumber: true })}
                                type="number"
                                className="input"
                                min={1990}
                                max={new Date().getFullYear() + 1}
                            />
                            {errors.year && (
                                <p className="text-sm text-red-500 mt-1">{errors.year.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Plaka *</label>
                            <input {...register('licensePlate')} className="input" placeholder="34 ABC 123" />
                            {errors.licensePlate && (
                                <p className="text-sm text-red-500 mt-1">{errors.licensePlate.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Renk *</label>
                            <input {...register('color')} className="input" placeholder="örn: Beyaz" />
                            {errors.color && (
                                <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Koltuk Sayısı *</label>
                            <select {...register('seats', { valueAsNumber: true })} className="input">
                                {[2, 4, 5, 6, 7, 8, 9].map(n => (
                                    <option key={n} value={n}>{n} Kişilik</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Yakıt Tipi *</label>
                            <select {...register('fuelType')} className="input">
                                {fuelTypes.map(fuel => (
                                    <option key={fuel.value} value={fuel.value}>{fuel.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Vites Tipi *</label>
                            <select {...register('transmission')} className="input">
                                {transmissions.map(trans => (
                                    <option key={trans.value} value={trans.value}>{trans.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Konum</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Şehir *</label>
                            <select {...register('city')} className="input">
                                <option value="">Şehir seçin</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            {errors.city && (
                                <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Adres (Opsiyonel)</label>
                            <input {...register('address')} className="input" placeholder="Teslim adresi" />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Fiyatlandırma</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Günlük Fiyat (₺) *</label>
                            <input
                                {...register('dailyRate', { valueAsNumber: true })}
                                type="number"
                                className="input"
                                min={100}
                            />
                            {errors.dailyRate && (
                                <p className="text-sm text-red-500 mt-1">{errors.dailyRate.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Haftalık İndirim (%)</label>
                            <input
                                {...register('weeklyDiscount', { valueAsNumber: true })}
                                type="number"
                                className="input"
                                min={0}
                                max={50}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Aylık İndirim (%)</label>
                            <input
                                {...register('monthlyDiscount', { valueAsNumber: true })}
                                type="number"
                                className="input"
                                min={0}
                                max={70}
                            />
                        </div>
                    </div>

                    {/* Price Preview */}
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Fiyat Önizleme</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">1 Gün</p>
                                <p className="font-semibold">₺{dailyPrice || 0}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">7 Gün</p>
                                <p className="font-semibold">
                                    ₺{Math.round((dailyPrice || 0) * 7 * (1 - weeklyDiscount / 100))}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">30 Gün</p>
                                <p className="font-semibold">
                                    ₺{Math.round((dailyPrice || 0) * 30 * (1 - monthlyDiscount / 100))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Özellikler</h2>
                    <div className="flex flex-wrap gap-2">
                        {featureOptions.map(feature => (
                            <button
                                key={feature}
                                type="button"
                                onClick={() => toggleFeature(feature)}
                                className={cn(
                                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                                    selectedFeatures.includes(feature)
                                        ? 'bg-primary text-white'
                                        : 'bg-muted hover:bg-muted/80'
                                )}
                            >
                                {feature}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Açıklama (Opsiyonel)</h2>
                    <textarea
                        {...register('description')}
                        rows={4}
                        className="input resize-none"
                        placeholder="Aracınız hakkında ek bilgiler yazabilirsiniz..."
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/owner/vehicles')}
                        className="flex-1 py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 btn-primary py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            'Aracı Ekle'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

