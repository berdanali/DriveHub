import { Link } from 'react-router-dom';
import {
    Search,
    CalendarCheck,
    Key,
    Star,
    Shield,
    Headphones,
    ArrowRight,
    Car,
    CheckCircle,
    Users,
    CreditCard,
} from 'lucide-react';

const steps = [
    {
        step: 1,
        icon: Search,
        title: 'Araç Arayın',
        description: 'Konumunuzu, tarihlerinizi ve tercihlerinizi girerek size uygun araçları filtreleyin. Yüzlerce araç arasından en uygununu seçin.',
        color: 'bg-blue-500',
    },
    {
        step: 2,
        icon: CalendarCheck,
        title: 'Rezervasyon Yapın',
        description: 'Beğendiğiniz aracı seçin, kiralama detaylarını girin ve talebinizi oluşturun. Araç sahibi talebinizi hızlıca onaylayacaktır.',
        color: 'bg-purple-500',
    },
    {
        step: 3,
        icon: Key,
        title: 'Aracı Teslim Alın',
        description: 'Belirlenen noktada araç sahibi ile buluşun. Aracın durumunu birlikte kontrol edin ve anahtarları teslim alın.',
        color: 'bg-green-500',
    },
    {
        step: 4,
        icon: Star,
        title: 'Keyfinize Bakın',
        description: 'Aracı kullanın, keyfini çıkarın. Kiralama bitiminde aracı iade edin ve deneyiminizi değerlendirin.',
        color: 'bg-amber-500',
    },
];

const ownerSteps = [
    {
        step: 1,
        icon: Car,
        title: 'Aracınızı Ekleyin',
        description: 'Aracınızın fotoğraflarını, özelliklerini ve fiyatını belirleyerek ilan oluşturun.',
    },
    {
        step: 2,
        icon: Users,
        title: 'Talepleri Yönetin',
        description: 'Gelen kiralama taleplerini inceleyin, onaylayın veya reddedin.',
    },
    {
        step: 3,
        icon: Key,
        title: 'Aracı Teslim Edin',
        description: 'Kiracı ile buluşun, aracı teslim edin ve kiralama sürecini takip edin.',
    },
    {
        step: 4,
        icon: CreditCard,
        title: 'Kazancınızı Alın',
        description: 'Kiralama tamamlandığında kazancınız güvenli bir şekilde hesabınıza aktarılır.',
    },
];

const benefits = [
    {
        icon: Shield,
        title: 'Kapsamlı Sigorta',
        description: 'Tüm kiralamalar sigorta kapsamındadır. Olası hasarlara karşı hem araç sahibi hem de kiracı korunur.',
    },
    {
        icon: Headphones,
        title: '7/24 Destek',
        description: 'Yolda kaldığınızda, sorun yaşadığınızda veya herhangi bir konuda destek ekibimize her an ulaşabilirsiniz.',
    },
    {
        icon: CheckCircle,
        title: 'Doğrulanmış Profiller',
        description: 'Tüm kullanıcılar kimlik doğrulamasından geçer. Güvenilir kişilerle etkileşim kurarsınız.',
    },
    {
        icon: CreditCard,
        title: 'Güvenli Ödeme',
        description: 'Tüm ödemeler güvenli ödeme altyapımız üzerinden işlenir. Kredi kartı bilgileriniz şifrelenir.',
    },
];

export default function HowItWorksPage() {
    return (
        <div>
            {/* Hero */}
            <section className="py-16 bg-gradient-to-b from-muted/50 to-background">
                <div className="container mx-auto px-4 text-center">
                    <span className="badge badge-primary mb-4">Nasıl Çalışır?</span>
                    <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                        Araç Kiralamak Hiç Bu Kadar <span className="text-primary">Kolay</span> Olmamıştı
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        4 basit adımda aracınızı kiralayın veya aracınızı kiraya vererek gelir elde edin.
                    </p>
                </div>
            </section>

            {/* Renter Steps */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl font-bold mb-2">Kiracılar İçin</h2>
                        <p className="text-muted-foreground">Araç kiralamak için 4 basit adım</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={step.step} className="flex gap-6 mb-12 last:mb-0">
                                {/* Timeline */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                                        {step.step}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-border mt-3" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="card p-6 flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-lg ${step.color}/10 flex items-center justify-center`}>
                                            <step.icon className={`h-5 w-5`} style={{ color: step.color.replace('bg-', '') }} />
                                        </div>
                                        <h3 className="text-lg font-semibold">{step.title}</h3>
                                    </div>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to="/vehicles"
                            className="btn-primary px-8 py-3 rounded-lg text-white font-medium inline-flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            Araçları İncele
                        </Link>
                    </div>
                </div>
            </section>

            {/* Owner Steps */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl font-bold mb-2">Araç Sahipleri İçin</h2>
                        <p className="text-muted-foreground">Aracınızı kiraya verin, pasif gelir elde edin</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {ownerSteps.map((step) => (
                            <div key={step.step} className="card p-6 text-center relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                    {step.step}
                                </div>
                                <div className="w-14 h-14 mx-auto mb-4 mt-2 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <step.icon className="h-7 w-7 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to="/register"
                            className="btn-primary px-8 py-3 rounded-lg text-white font-medium inline-flex items-center gap-2"
                        >
                            Araç Sahibi Olarak Kaydol
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="badge badge-primary mb-3">Güvencelerimiz</span>
                        <h2 className="text-2xl font-bold mb-2">Neden RentaCar?</h2>
                        <p className="text-muted-foreground">Güvenli ve sorunsuz bir deneyim için</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {benefits.map((benefit) => (
                            <div key={benefit.title} className="card p-6 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <benefit.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gradient-to-r from-primary to-secondary">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Hazır mısınız?
                    </h2>
                    <p className="text-white/80 mb-8 max-w-md mx-auto">
                        Hemen üye olun ve araç kiralama deneyiminizi başlatın.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/vehicles"
                            className="px-6 py-3 bg-white text-primary font-medium rounded-lg hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            Araçları İncele
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            Üye Ol
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

