import { Link } from 'react-router-dom';
import {
    Car,
    Shield,
    MapPin,
    Clock,
    Star,
    CheckCircle,
    ArrowRight,
    Calendar,
    Users,
    Fuel,
    Search,
} from 'lucide-react';
import { useState } from 'react';

const features = [
    {
        icon: Car,
        title: 'Geniş Araç Filosu',
        description:
            'Ekonomiden lükse, her ihtiyaca uygun 500+ araç seçeneği ile hizmetinizdeyiz.',
    },
    {
        icon: Shield,
        title: 'Güvenli Kiralama',
        description:
            'Kapsamlı kasko ve sigorta seçenekleri ile güvenli seyahat garantisi.',
    },
    {
        icon: MapPin,
        title: 'Canlı GPS Takip',
        description:
            'Aracınızın konumunu 7/24 takip edin, güvenliğiniz bizim önceliğimiz.',
    },
    {
        icon: Clock,
        title: 'Esnek Kiralama',
        description:
            'Günlük, haftalık veya aylık kiralama seçenekleri ile tam esneklik.',
    },
];

const popularCars = [
    {
        id: 1,
        name: 'BMW 320i',
        category: 'Premium Sedan',
        price: 450,
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600',
        seats: 5,
        fuel: 'Benzin',
        transmission: 'Otomatik',
        rating: 4.9,
    },
    {
        id: 2,
        name: 'Mercedes C200',
        category: 'Lüks Sedan',
        price: 550,
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600',
        seats: 5,
        fuel: 'Dizel',
        transmission: 'Otomatik',
        rating: 4.8,
    },
    {
        id: 3,
        name: 'Audi A4',
        category: 'Sportif Sedan',
        price: 500,
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600',
        seats: 5,
        fuel: 'Benzin',
        transmission: 'Otomatik',
        rating: 4.9,
    },
];

const testimonials = [
    {
        name: 'Ahmet Yılmaz',
        role: 'İş Seyahati',
        content:
            'Mükemmel hizmet! Araç tertemiz teslim edildi ve iade süreci son derece kolaydı.',
        avatar: 'AY',
        rating: 5,
    },
    {
        name: 'Elif Kaya',
        role: 'Tatil',
        content:
            'İstanbul gezimiz için kiralama yaptık. Fiyat/performans oranı çok iyi.',
        avatar: 'EK',
        rating: 5,
    },
    {
        name: 'Mehmet Demir',
        role: 'Günlük Kullanım',
        content:
            'Düzenli olarak kullanıyorum. Araç kalitesi ve müşteri hizmetleri harika.',
        avatar: 'MD',
        rating: 5,
    },
];

export default function HomePage() {
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');

    return (
        <div>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>
                
                {/* Gradient Orbs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px]" />

                <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-400" />
                            Türkiye genelinde hizmet
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Hayalinizdeki Araç
                            <br />
                            <span className="text-primary">Sizi Bekliyor</span>
                        </h1>

                        <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
                            Premium araç kiralama deneyimi ile seyahatlerinizi unutulmaz kılın. 
                            Ekonomiden lükse, her bütçeye uygun seçenekler.
                        </p>

                        {/* Search Box */}
                        <div className="bg-white rounded-2xl p-4 shadow-xl max-w-2xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="text-left">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                        Alış Tarihi
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={pickupDate}
                                            onChange={(e) => setPickupDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                        İade Tarihi
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <Link
                                        to="/vehicles"
                                        className="w-full btn-primary text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <Search className="h-4 w-4" />
                                        Araç Bul
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/60 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                Ücretsiz iptal
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                7/24 Destek
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                Kapsamlı sigorta
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="bg-white/5 backdrop-blur-sm border-t border-white/10">
                    <div className="container mx-auto px-4 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { value: '500+', label: 'Araç Filosu' },
                                { value: '50K+', label: 'Mutlu Müşteri' },
                                { value: '81', label: 'Şehir' },
                                { value: '4.9', label: 'Müşteri Puanı' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-2xl lg:text-3xl font-bold text-white">
                                        {stat.value}
                                    </div>
                                    <div className="text-white/50 text-sm">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="badge badge-primary mb-3">Neden Biz?</span>
                        <h2 className="text-3xl font-bold mb-3">
                            Fark Yaratan Özelliklerimiz
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Müşteri memnuniyetini ön planda tutan yaklaşımımız ve
                            sektör liderliğimizle hizmetinizdeyiz.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="card p-6 card-hover"
                            >
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Cars Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
                        <div>
                            <span className="badge badge-primary mb-3">Popüler Araçlar</span>
                            <h2 className="text-3xl font-bold">
                                En Çok Tercih Edilenler
                            </h2>
                        </div>
                        <Link
                            to="/vehicles"
                            className="mt-4 md:mt-0 text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all text-sm"
                        >
                            Tüm Araçları Gör <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularCars.map((car) => (
                            <div
                                key={car.id}
                                className="card overflow-hidden card-hover"
                            >
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img
                                        src={car.image}
                                        alt={car.name}
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {car.rating}
                                    </div>
                                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-primary text-white text-xs font-medium">
                                        {car.category}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold mb-3">
                                        {car.name}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {car.seats} Kişi
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Fuel className="h-3.5 w-3.5" />
                                            {car.fuel}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Car className="h-3.5 w-3.5" />
                                            {car.transmission}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xl font-bold text-primary">
                                                ₺{car.price}
                                            </span>
                                            <span className="text-muted-foreground text-sm">
                                                /gün
                                            </span>
                                        </div>
                                        <Link
                                            to={`/vehicles/${car.id}`}
                                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Kirala
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="badge badge-primary mb-3">Nasıl Çalışır?</span>
                        <h2 className="text-3xl font-bold mb-3">
                            3 Kolay Adımda Araç Kiralayın
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                step: '01',
                                title: 'Araç Seçin',
                                description:
                                    'Geniş araç filomuzdan ihtiyacınıza uygun aracı seçin.',
                            },
                            {
                                step: '02',
                                title: 'Rezervasyon Yapın',
                                description:
                                    'Tarih ve lokasyon bilgilerini girerek hızlıca rezervasyon yapın.',
                            },
                            {
                                step: '03',
                                title: 'Yola Çıkın',
                                description:
                                    'Aracınızı teslim alın ve güvenli bir yolculuğun keyfini çıkarın.',
                            },
                        ].map((item, index) => (
                            <div key={item.step} className="relative text-center">
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
                                )}
                                <div className="relative z-10 w-20 h-20 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Araç Sahipleri CTA */}
            <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="badge badge-primary mb-4">Araç Sahipleri İçin</span>
                            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                                Aracınızı Kiraya Verin,<br />
                                <span className="text-primary">Gelir Elde Edin</span>
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Kullanmadığınız aracınızı platformumuza ekleyin, güvenli bir şekilde kiraya verin 
                                ve pasif gelir elde edin. Sigorta, güvenlik ve tüm süreçler bizden.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>%100 sigorta güvencesi</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>Fiyatlarınızı siz belirleyin</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>Güvenli ödeme sistemi</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>7/24 müşteri desteği</span>
                                </li>
                            </ul>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/register"
                                    className="btn-primary px-6 py-3 rounded-lg text-white font-medium inline-flex items-center justify-center gap-2"
                                >
                                    Araç Sahibi Ol
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    to="/owner/vehicles/new"
                                    className="px-6 py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    Hemen Araç Ekle
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square rounded-2xl overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600"
                                    alt="Araç Sahibi"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Stats overlay */}
                            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
                                <div className="text-2xl font-bold text-primary">₺15.000+</div>
                                <div className="text-sm text-muted-foreground">Ortalama aylık kazanç</div>
                            </div>
                            <div className="absolute -top-6 -right-6 bg-card p-4 rounded-xl shadow-lg border border-border">
                                <div className="text-2xl font-bold text-primary">500+</div>
                                <div className="text-sm text-muted-foreground">Aktif araç sahibi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="badge badge-primary mb-3">Müşteri Yorumları</span>
                        <h2 className="text-3xl font-bold mb-3">
                            Müşterilerimiz Ne Diyor?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.name} className="card p-6">
                                <div className="flex items-center gap-0.5 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>
                                <p className="text-muted-foreground text-sm mb-5">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">
                                            {testimonial.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        Hemen Başlayın
                    </h2>
                    <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                        Ücretsiz üye olun ve araç kiralama deneyiminin keyfini çıkarın.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/register"
                            className="px-6 py-3 bg-white text-primary font-medium rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Ücretsiz Üye Ol
                        </Link>
                        <Link
                            to="/vehicles"
                            className="px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                        >
                            Araçları İncele
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
