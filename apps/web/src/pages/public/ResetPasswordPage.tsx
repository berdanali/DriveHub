import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Loader2, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Şifre en az 8 karakter olmalı')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/,
                'Şifre gereksinimleri karşılanmıyor'
            ),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Şifreler eşleşmiyor',
        path: ['confirmPassword'],
    });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const passwordRequirements = [
    { regex: /.{8,}/, text: 'En az 8 karakter' },
    { regex: /[A-Z]/, text: 'Bir büyük harf' },
    { regex: /[a-z]/, text: 'Bir küçük harf' },
    { regex: /[0-9]/, text: 'Bir rakam' },
    { regex: /[^a-zA-Z\d\s]/, text: 'Bir özel karakter' },
];

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const password = watch('password', '');

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            setError('Geçersiz veya eksik sıfırlama bağlantısı.');
            return;
        }

        try {
            setError('');
            await api.post('/auth/reset-password', {
                token,
                password: data.password,
            });
            setSuccess(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(
                error.response?.data?.error?.message ||
                'Şifre sıfırlanırken bir hata oluştu. Bağlantınızın süresi dolmuş olabilir.'
            );
        }
    };

    // Invalid token state
    if (!token) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Geçersiz Bağlantı
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
                        Lütfen yeni bir sıfırlama bağlantısı isteyin.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="block w-full btn-primary py-3 rounded-lg text-white font-medium text-center"
                    >
                        Yeni Bağlantı İste
                    </Link>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Şifre Değiştirildi
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Şifreniz başarıyla değiştirildi. Şimdi yeni şifrenizle giriş yapabilirsiniz.
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

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="w-full max-w-[420px]">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Yeni Şifre Oluşturun
                    </h1>
                    <p className="text-muted-foreground">
                        Güvenli bir şifre belirleyin. Şifreniz en az 8 karakter olmalı
                        ve güçlü olmalıdır.
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
                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Yeni Şifre
                            </label>
                            <div className="relative">
                                <Lock className="input-icon" />
                                <input
                                    {...register('password')}
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input pl-11 pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {/* Password Strength Indicator */}
                            <div className="mt-3 space-y-2">
                                <div className="grid grid-cols-5 gap-1">
                                    {passwordRequirements.map((req, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1 rounded-full transition-colors",
                                                req.regex.test(password) ? "bg-green-500" : "bg-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {passwordRequirements.map((req, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex items-center gap-1.5 text-xs transition-colors",
                                                req.regex.test(password)
                                                    ? "text-green-600 dark:text-green-500"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            <Check className={cn(
                                                "h-3 w-3",
                                                req.regex.test(password) ? "opacity-100" : "opacity-30"
                                            )} />
                                            {req.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Şifre Tekrar
                            </label>
                            <div className="relative">
                                <Lock className="input-icon" />
                                <input
                                    {...register('confirmPassword')}
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input pl-11 pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1.5 text-sm text-red-500">
                                    {errors.confirmPassword.message}
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
                                    Şifre değiştiriliyor...
                                </>
                            ) : (
                                'Şifreyi Değiştir'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

