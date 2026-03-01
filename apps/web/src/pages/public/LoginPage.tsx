import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';

const loginSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi girin'),
    password: z.string().min(1, 'Şifre zorunludur'),
    rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check for success message from password reset or email verification
    const successMessage = location.state?.message;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            rememberMe: false,
        },
    });

    const emailValue = watch('email');

    const onSubmit = async (data: LoginForm) => {
        try {
            setError('');
            setNeedsVerification(false);
            setResendSuccess(false);
            
            await authService.login({ email: data.email, password: data.password });
            
            // Get user role and redirect accordingly
            const user = useAuthStore.getState().user;
            const role = user?.role;
            
            // Rol bazlı yönlendirme
            if (role === 'SUPER_ADMIN') {
                navigate('/admin', { replace: true });
            } else if (role === 'VEHICLE_OWNER') {
                navigate('/owner', { replace: true });
            } else {
                // CUSTOMER veya diğerleri
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
            const errorMessage = error.response?.data?.error?.message || 
                error.response?.data?.message || 
                'E-posta veya şifre hatalı. Lütfen tekrar deneyin.';
            
            // E-posta doğrulama gerekiyor mu kontrol et
            if (errorMessage.includes('E-posta adresinizi doğrulamanız') || 
                errorMessage.includes('doğrulama')) {
                setNeedsVerification(true);
                setVerificationEmail(emailValue);
            }
            
            setError(errorMessage);
        }
    };

    const handleResendVerification = async () => {
        try {
            setResendLoading(true);
            setResendSuccess(false);
            await api.post('/auth/resend-verification', { email: verificationEmail });
            setResendSuccess(true);
        } catch {
            // Hata olsa bile sessizce devam et (güvenlik için)
            setResendSuccess(true);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="w-full max-w-[420px]">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Hesabınıza giriş yapın
                    </h1>
                    <p className="text-muted-foreground">
                        Araç kiralama deneyiminize devam edin
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="alert alert-success mb-6 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{successMessage}</p>
                    </div>
                )}

                {/* Resend Success */}
                {resendSuccess && (
                    <div className="alert alert-success mb-6 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm">{error}</p>
                                
                                {/* Doğrulama maili tekrar gönder butonu */}
                                {needsVerification && !resendSuccess && (
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={resendLoading}
                                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline disabled:opacity-50"
                                    >
                                        {resendLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Gönderiliyor...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4" />
                                                Doğrulama e-postasını tekrar gönder
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="card p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                E-posta
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

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium">
                                    Şifre
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Şifremi unuttum
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="input-icon" />
                                <input
                                    {...register('password')}
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="input pl-11 pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                {...register('rememberMe')}
                                type="checkbox"
                                id="rememberMe"
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                                Beni hatırla
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                'Giriş Yap'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="divider my-6">
                        <span className="text-sm text-muted-foreground">veya</span>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="text-sm font-medium">Google ile devam et</span>
                        </button>
                    </div>
                </div>

                {/* Sign Up Link */}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Hesabınız yok mu?{' '}
                    <Link to="/register" className="text-primary font-medium hover:underline">
                        Ücretsiz kayıt olun
                    </Link>
                </p>
            </div>
        </div>
    );
}
