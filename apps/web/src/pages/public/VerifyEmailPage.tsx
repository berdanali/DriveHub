import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import api from '@/services/api';

type VerificationState = 'loading' | 'success' | 'error' | 'expired';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [state, setState] = useState<VerificationState>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setState('error');
                setError('Doğrulama bağlantısı geçersiz.');
                return;
            }

            try {
                await api.post('/auth/verify-email', { token });
                setState('success');
            } catch (err: unknown) {
                const error = err as { response?: { data?: { error?: { code?: string; message?: string } } } };
                if (error.response?.data?.error?.code === 'TOKEN_EXPIRED') {
                    setState('expired');
                } else {
                    setState('error');
                    setError(
                        error.response?.data?.error?.message ||
                        'E-posta doğrulaması başarısız oldu.'
                    );
                }
            }
        };

        verifyEmail();
    }, [token]);

    const handleResendEmail = async () => {
        // This would typically require the user's email
        // For now, redirect to login where they can request a new verification
    };

    // Loading state
    if (state === 'loading') {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        E-posta Doğrulanıyor
                    </h1>
                    <p className="text-muted-foreground">
                        Lütfen bekleyin, e-posta adresinizi doğruluyoruz...
                    </p>
                </div>
            </div>
        );
    }

    // Success state
    if (state === 'success') {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        E-posta Doğrulandı!
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        E-posta adresiniz başarıyla doğrulandı. Artık tüm özelliklere
                        erişebilirsiniz.
                    </p>
                    <Link
                        to="/login"
                        className="block w-full btn-primary py-3 rounded-lg text-white font-medium text-center"
                    >
                        Giriş Yap
                    </Link>
                </div>
            </div>
        );
    }

    // Expired state
    if (state === 'expired') {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
                        <Mail className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Bağlantı Süresi Doldu
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Bu doğrulama bağlantısının süresi dolmuş. Yeni bir doğrulama
                        e-postası almak için giriş yapın.
                    </p>
                    <div className="space-y-3">
                        <Link
                            to="/login"
                            className="block w-full btn-primary py-3 rounded-lg text-white font-medium text-center"
                        >
                            Giriş Yap
                        </Link>
                        <Link
                            to="/register"
                            className="block w-full py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors text-center"
                        >
                            Yeni Hesap Oluştur
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="w-full max-w-[420px] text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Doğrulama Başarısız
                </h1>
                <p className="text-muted-foreground mb-6">
                    {error || 'E-posta doğrulaması yapılamadı. Lütfen tekrar deneyin.'}
                </p>
                <div className="space-y-3">
                    <Link
                        to="/login"
                        className="block w-full btn-primary py-3 rounded-lg text-white font-medium text-center"
                    >
                        Giriş Yap
                    </Link>
                    <Link
                        to="/"
                        className="block w-full py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors text-center"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    );
}

