import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, Car, Shield, CreditCard, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
    question: string;
    answer: string;
}

const categories = [
    { id: 'general', label: 'Genel', icon: HelpCircle },
    { id: 'rental', label: 'Kiralama', icon: Car },
    { id: 'payment', label: 'Ödeme', icon: CreditCard },
    { id: 'safety', label: 'Güvenlik', icon: Shield },
    { id: 'process', label: 'Süreçler', icon: Clock },
];

const faqData: Record<string, FAQItem[]> = {
    general: [
        {
            question: 'RentaCar nedir?',
            answer: 'RentaCar, araç sahipleri ile araç kiralamak isteyenleri güvenli bir şekilde buluşturan Türkiye\'nin önde gelen P2P (peer-to-peer) araç kiralama platformudur. Geleneksel filo kiralama şirketlerinden farklı olarak, bireysel araç sahiplerinden doğrudan kiralama yapabilirsiniz.',
        },
        {
            question: 'Nasıl üye olurum?',
            answer: 'Ana sayfadaki "Üye Ol" butonuna tıklayarak veya /register sayfasını ziyaret ederek hızlıca üye olabilirsiniz. E-posta, ad-soyad ve şifre bilgilerinizi girdikten sonra e-posta doğrulaması yaparak hesabınızı aktifleştirebilirsiniz.',
        },
        {
            question: 'Araç sahibi olmak için ne yapmam gerekiyor?',
            answer: 'Kayıt olurken "Araç Sahibi" seçeneğini işaretlemeniz yeterlidir. Kayıt olduktan sonra araçlarınızı ekleyebilir, fiyat belirleyebilir ve kiralama taleplerini yönetebilirsiniz.',
        },
        {
            question: 'RentaCar hangi şehirlerde hizmet veriyor?',
            answer: 'Şu anda Türkiye\'nin 81 ilinde hizmet vermekteyiz. En çok araç bulunan şehirlerimiz İstanbul, Ankara, İzmir, Antalya ve Bursa\'dır.',
        },
    ],
    rental: [
        {
            question: 'Araç kiralamak için hangi belgeler gerekli?',
            answer: 'Araç kiralamak için geçerli bir ehliyet (en az 1 yıllık) ve kimlik belgeniz gerekmektedir. Platformumuz üzerinden ehliyet bilgilerinizi yükleyerek doğrulama sürecini tamamlamanız gerekmektedir.',
        },
        {
            question: 'Minimum kiralama süresi nedir?',
            answer: 'Minimum kiralama süresi 1 gündür (24 saat). Araç sahipleri kendi minimum süre limitlerini belirleyebilir.',
        },
        {
            question: 'Kiralama talebim ne kadar sürede onaylanır?',
            answer: 'Kiralama talepleriniz araç sahibinin onayına tabidir. Çoğu talep birkaç saat içinde onaylanır. Bazı araç sahipleri anlık onay özelliğini kullanabilir.',
        },
        {
            question: 'Kiralama süresini uzatabilir miyim?',
            answer: 'Evet, kiralama süresini uzatmak istiyorsanız araç sahibi ile iletişime geçebilirsiniz. Uzatma, araç sahibinin onayına ve aracın müsaitlik durumuna bağlıdır.',
        },
        {
            question: 'Aracı teslim noktasından farklı bir yere bırakabilir miyim?',
            answer: 'Araç teslim ve iade noktaları kiralama oluşturulurken belirlenir. Farklı bir yere bırakma konusunda araç sahibi ile önceden anlaşmanız gerekmektedir.',
        },
    ],
    payment: [
        {
            question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
            answer: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Tüm ödemeler güvenli altyapımız üzerinden işlenmektedir.',
        },
        {
            question: 'Depozito almıyor musunuz?',
            answer: 'Araç sahipleri depozito talep edebilir. Depozito miktarı araç sahibi tarafından belirlenir ve kiralama bitiminde iade edilir. Depozito politikası araç ilanında belirtilir.',
        },
        {
            question: 'İptal durumunda ücret iadesi nasıl olur?',
            answer: 'Kiralama başlangıcından 48 saat öncesine kadar yapılan iptallerde tam iade yapılır. 24-48 saat arası iptallerde %50 iade, 24 saatten az kala iptallerde iade yapılmaz.',
        },
        {
            question: 'Hizmet bedeli nedir?',
            answer: 'Platform hizmet bedeli kiralama tutarının %15\'idir. Bu ücret, platform güvenliği, müşteri desteği ve sigorta güvencesi hizmetlerini kapsar.',
        },
    ],
    safety: [
        {
            question: 'Araçlar sigortalı mı?',
            answer: 'Evet, platformumuz üzerinden yapılan tüm kiralamalarda kapsamlı kasko ve trafik sigortası bulunmaktadır. Kiralama süresince oluşabilecek hasarlar sigorta kapsamında değerlendirilir.',
        },
        {
            question: 'Araç arıza yaparsa ne yapmalıyım?',
            answer: '7/24 müşteri destek hattımızı arayarak yardım alabilirsiniz. Yol yardımı hizmetimiz kiralama süresince aktiftir. Acil durumlarda 0850 XXX XX XX numarasını arayabilirsiniz.',
        },
        {
            question: 'Kişisel bilgilerim güvende mi?',
            answer: 'Tüm kişisel bilgileriniz 256-bit SSL şifreleme ile korunmaktadır. KVKK (Kişisel Verilerin Korunması Kanunu) uyumlu veri politikamız gereğince bilgileriniz güvendedir.',
        },
        {
            question: 'Araç sahibi güvenilir mi nasıl anlayabilirim?',
            answer: 'Her araç sahibinin profil doğrulama seviyesi görünür. Kimlik doğrulaması yapılmış, önceki kiralama yorumlarına sahip araç sahiplerini tercih edebilirsiniz.',
        },
    ],
    process: [
        {
            question: 'Araç kiralama süreci nasıl işler?',
            answer: '1) Araç arayın ve uygun olanı seçin. 2) Tarih ve konum bilgilerini girin. 3) Kiralama talebinizi oluşturun. 4) Araç sahibi talebi onaylasın. 5) Belirlenen noktada aracı teslim alın. 6) Kiralama bitiminde aracı iade edin.',
        },
        {
            question: 'Aracımı nasıl kiraya verebilirim?',
            answer: '1) Araç sahibi olarak kaydolun. 2) Araç bilgilerini ve fotoğraflarını ekleyin. 3) Günlük fiyat belirleyin. 4) Kiralama taleplerini bekleyin ve onaylayın. 5) Aracı teslim edin ve kiralama bitiminde geri alın.',
        },
        {
            question: 'Araç tesliminde nelere dikkat etmeliyim?',
            answer: 'Aracı teslim alırken mevcut hasarları not edin ve fotoğraflayın. Yakıt seviyesini, kilometre sayacını kontrol edin. Platform üzerinden teslim onayı yapmayı unutmayın.',
        },
        {
            question: 'Kiralama sonrası değerlendirme yapabilir miyim?',
            answer: 'Evet, kiralama tamamlandıktan sonra hem araç sahibi hem de kiracı karşılıklı olarak değerlendirme yapabilir. Değerlendirmeler 1-5 yıldız ve yorum olarak bırakılabilir.',
        },
    ],
};

function FAQAccordion({ item }: { item: FAQItem }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
            >
                <span className="font-medium text-sm pr-4">{item.question}</span>
                <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                    open && "rotate-180"
                )} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300",
                open ? "max-h-96" : "max-h-0"
            )}>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                </div>
            </div>
        </div>
    );
}

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFAQs = searchQuery.trim()
        ? Object.values(faqData).flat().filter(
              (faq) =>
                  faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : faqData[activeCategory] || [];

    return (
        <div>
            {/* Hero */}
            <section className="py-16 bg-gradient-to-b from-muted/50 to-background">
                <div className="container mx-auto px-4 text-center">
                    <span className="badge badge-primary mb-4">Yardım Merkezi</span>
                    <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                        Sıkça Sorulan Sorular
                    </h1>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Aradığınız cevabı bulamadıysanız bize ulaşmaktan çekinmeyin.
                    </p>

                    {/* Search */}
                    <div className="max-w-md mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Soru ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12 py-3"
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Content */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        {/* Categories */}
                        {!searchQuery && (
                            <div className="lg:col-span-1">
                                <div className="card p-2 sticky top-24">
                                    {categories.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => setActiveCategory(cat.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                                                    activeCategory === cat.id
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Questions */}
                        <div className={searchQuery ? 'lg:col-span-4' : 'lg:col-span-3'}>
                            {searchQuery && (
                                <p className="text-sm text-muted-foreground mb-4">
                                    "{searchQuery}" için {filteredFAQs.length} sonuç bulundu
                                </p>
                            )}
                            <div className="space-y-3">
                                {filteredFAQs.length > 0 ? (
                                    filteredFAQs.map((faq, i) => (
                                        <FAQAccordion key={i} item={faq} />
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">Aradığınız soruyu bulamadık</p>
                                        <Link to="/contact" className="text-primary font-medium hover:underline mt-2 inline-block">
                                            Bize ulaşın
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-3">Hâlâ sorunuz mu var?</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Cevabınızı bulamadıysanız destek ekibimiz size yardımcı olmaktan mutluluk duyar.
                    </p>
                    <Link
                        to="/contact"
                        className="btn-primary px-6 py-3 rounded-lg text-white font-medium inline-flex items-center gap-2"
                    >
                        Bize Ulaşın
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
}

