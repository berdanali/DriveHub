import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Mail,
    Phone,
    MapPin,
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    Clock,
    MessageSquare,
} from 'lucide-react';
import api from '@/services/api';

const contactSchema = z.object({
    name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır').max(100),
    email: z.string().email('Geçerli bir e-posta adresi girin'),
    phone: z.string().optional(),
    subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır').max(200),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır').max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const subjects = [
    'Genel Bilgi',
    'Kiralama Süreci',
    'Fiyat Teklifi',
    'Şikayet',
    'Öneri',
    'Teknik Destek',
    'Diğer',
];

export default function ContactPage() {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactForm>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactForm) => {
        try {
            setError('');
            await api.post('/contact', data);
            setSuccess(true);
            reset();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        Bizimle İletişime Geçin
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Sorularınız, önerileriniz veya şikayetleriniz için bize ulaşın.
                        En kısa sürede size dönüş yapacağız.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        {/* Info Cards */}
                        <div className="card p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Phone className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Telefon</h3>
                                    <p className="text-muted-foreground text-sm mb-2">7/24 Müşteri Hizmetleri</p>
                                    <a href="tel:+908501234567" className="text-primary font-medium hover:underline">
                                        0850 123 45 67
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">E-posta</h3>
                                    <p className="text-muted-foreground text-sm mb-2">Bize e-posta gönderin</p>
                                    <a href="mailto:berdanali002@gmail.com" className="text-primary font-medium hover:underline">
                                        berdanali002@gmail.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Adres</h3>
                                    <p className="text-muted-foreground text-sm mb-2">Merkez Ofis</p>
                                    <p className="text-sm">
                                        Levent Mahallesi, Büyükdere Caddesi<br />
                                        No: 123, Şişli / İstanbul
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Çalışma Saatleri</h3>
                                    <div className="text-sm space-y-1 text-muted-foreground">
                                        <p>Pazartesi - Cuma: 09:00 - 18:00</p>
                                        <p>Cumartesi: 10:00 - 14:00</p>
                                        <p>Pazar: Kapalı</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="card p-6 lg:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Mesaj Gönderin</h2>
                                    <p className="text-sm text-muted-foreground">Formu doldurarak bize ulaşın</p>
                                </div>
                            </div>

                            {success && (
                                <div className="alert alert-success mb-6 flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Mesajınız başarıyla gönderildi!</p>
                                        <p className="text-sm opacity-80">En kısa sürede size dönüş yapacağız.</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-error mb-6 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                                            Ad Soyad <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('name')}
                                            id="name"
                                            type="text"
                                            placeholder="Ahmet Yılmaz"
                                            className="input"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                                            E-posta <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('email')}
                                            id="email"
                                            type="email"
                                            placeholder="ornek@email.com"
                                            className="input"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Phone */}
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                            Telefon <span className="text-muted-foreground text-xs">(Opsiyonel)</span>
                                        </label>
                                        <input
                                            {...register('phone')}
                                            id="phone"
                                            type="tel"
                                            placeholder="+90 555 123 4567"
                                            className="input"
                                        />
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium mb-2">
                                            Konu <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('subject')}
                                            id="subject"
                                            className="input"
                                        >
                                            <option value="">Konu seçin</option>
                                            {subjects.map((subject) => (
                                                <option key={subject} value={subject}>
                                                    {subject}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.subject && (
                                            <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                                        Mesajınız <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('message')}
                                        id="message"
                                        rows={5}
                                        placeholder="Mesajınızı buraya yazın..."
                                        className="input resize-none"
                                    />
                                    {errors.message && (
                                        <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full md:w-auto btn-primary px-8 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Mesaj Gönder
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="mt-12">
                    <div className="card overflow-hidden">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.2523733!2d29.0173!3d41.0773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDA0JzM4LjMiTiAyOcKwMDEnMDIuMyJF!5e0!3m2!1str!2str!4v1234567890"
                            width="100%"
                            height="400"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="RentaCar Konum"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

