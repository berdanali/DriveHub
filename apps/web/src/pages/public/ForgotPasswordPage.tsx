import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

const forgotPasswordSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi girin'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        try {
            setError('');
            await api.post('/auth/forgot-password', { email: data.email });
            setSubmittedEmail(data.email);
            setSuccess(true);
        } catch (err: unknown) {
            // Always show success message for security (don't reveal if email exists)
            setSubmittedEmail(data.email);
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        E-posta Gönderildi
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        <strong>{submittedEmail}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                        Lütfen gelen kutunuzu kontrol edin.
                    </p>
                    <div className="card p-4 text-left mb-6">
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Not:</strong> E-posta birkaç dakika içinde gelmezse:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                            <li>Spam/gereksiz posta klasörünüzü kontrol edin</li>
                            <li>E-posta adresinin doğru yazıldığından emin olun</li>
                            <li>Tekrar deneyin</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => setSuccess(false)}
                            className="w-full py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
                        >
                            Tekrar Dene
                        </button>
                        <Link
                            to="/login"
                            className="block w-full btn-primary py-3 rounded-lg text-white font-medium text-center"
                        >
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="w-full max-w-[420px]">
                {/* Back Link */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Giriş sayfasına dön
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Şifrenizi mi unuttunuz?
                    </h1>
                    <p className="text-muted-foreground">
                        Endişelenmeyin! E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error mb-6 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <div className="card p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                E-posta Adresi
                            </label>
                            <div className="relative">
                                <Mail className="input-icon" />
                                <input
                                    {...register('email')}
                                    id="email"
                                    type="email"
                                    placeholder="ornek@email.com"
                                    autoComplete="email"
                                    className="input pl-11"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                'Sıfırlama Bağlantısı Gönder'
                            )}
                        </button>
                    </form>
                </div>

                {/* Help Text */}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Şifrenizi hatırladınız mı?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Giriş yapın
                    </Link>
                </p>
            </div>
        </div>
    );
}

