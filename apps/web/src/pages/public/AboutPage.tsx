import { Link } from 'react-router-dom';
import {
    Shield,
    Heart,
    Zap,
    Target,
    CheckCircle,
    Car,
    ArrowRight,
} from 'lucide-react';

const values = [
    {
        icon: Shield,
        title: 'Güvenilirlik',
        description: 'Tüm araçlarımız kapsamlı sigorta ile korunur. Güvenliğiniz bizim önceliğimizdir.',
    },
    {
        icon: Heart,
        title: 'Müşteri Odaklılık',
        description: 'Müşteri memnuniyeti en büyük değerimizdir. 7/24 destek hizmetimizle yanınızdayız.',
    },
    {
        icon: Zap,
        title: 'Hız ve Kolaylık',
        description: 'Dakikalar içinde araç kiralayın. Basit ve hızlı süreçlerimizle zaman kazanın.',
    },
    {
        icon: Target,
        title: 'Şeffaflık',
        description: 'Gizli ücret yok. Ne görüyorsanız onu ödersiniz. Tam şeffaf fiyatlandırma.',
    },
];

const team = [
    { name: 'Ahmet Yılmaz', role: 'Kurucu & CEO', avatar: 'AY' },
    { name: 'Elif Kaya', role: 'Operasyon Direktörü', avatar: 'EK' },
    { name: 'Mehmet Demir', role: 'Teknoloji Direktörü', avatar: 'MD' },
    { name: 'Zeynep Arslan', role: 'Müşteri İlişkileri', avatar: 'ZA' },
];

export default function AboutPage() {
    return (
        <div>
            {/* Hero */}
            <section className="relative py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="badge badge-primary bg-white/10 text-white/80 mb-4">Hakkımızda</span>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                        Türkiye'nin Güvenilir<br />
                        <span className="text-primary">Araç Kiralama Platformu</span>
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        2024 yılında kurulan RentaCar, araç sahipleri ile kiracıları güvenli bir şekilde
                        buluşturan, yenilikçi bir P2P araç kiralama platformudur.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="badge badge-primary mb-4">Misyonumuz</span>
                            <h2 className="text-3xl font-bold mb-6">
                                Herkese Uygun Fiyatlı, Güvenilir Araç Kiralama
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Amacımız, araç kiralama sürecini herkes için kolay, güvenli ve
                                uygun fiyatlı hale getirmektir. Geleneksel araç kiralama
                                şirketlerinin yüksek fiyatlarına son veriyoruz.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Doğrudan araç sahiplerinden kiralama',
                                    'Rekabetçi ve şeffaf fiyatlar',
                                    'Kapsamlı sigorta güvencesi',
                                    '7/24 müşteri desteği',
                                    'Kolay ve hızlı süreçler',
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"
                                    alt="Misyonumuz"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-primary">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '500+', label: 'Kayıtlı Araç' },
                            { value: '50.000+', label: 'Mutlu Müşteri' },
                            { value: '81', label: 'Şehirde Hizmet' },
                            { value: '4.9/5', label: 'Müşteri Puanı' },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-white/70 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="badge badge-primary mb-3">Değerlerimiz</span>
                        <h2 className="text-3xl font-bold mb-3">Bizi Biz Yapan Değerler</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value) => (
                            <div key={value.title} className="card p-6 text-center">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <value.icon className="h-7 w-7 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                                <p className="text-sm text-muted-foreground">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="badge badge-primary mb-3">Ekibimiz</span>
                        <h2 className="text-3xl font-bold mb-3">Deneyimli Kadromuz</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        {team.map((member) => (
                            <div key={member.name} className="card p-6 text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{member.avatar}</span>
                                </div>
                                <h3 className="font-semibold mb-1">{member.name}</h3>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-r from-primary to-secondary">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        Hemen Başlayın
                    </h2>
                    <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                        Binlerce araç arasından size en uygun olanı bulun veya aracınızı kiraya vererek kazanç elde edin.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/vehicles"
                            className="px-6 py-3 bg-white text-primary font-medium rounded-lg hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <Car className="h-4 w-4" />
                            Araçları İncele
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            Ücretsiz Üye Ol
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

