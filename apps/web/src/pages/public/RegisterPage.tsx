import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    Phone,
    Loader2,
    AlertCircle,
    Check,
    Car,
    Users,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';

const registerSchema = z
    .object({
        firstName: z
            .string()
            .min(2, 'Ad en az 2 karakter olmalı')
            .max(50, 'Ad en fazla 50 karakter olabilir'),
        lastName: z
            .string()
            .min(2, 'Soyad en az 2 karakter olmalı')
            .max(50, 'Soyad en fazla 50 karakter olabilir'),
        email: z.string().email('Geçerli bir e-posta adresi girin'),
        phone: z
            .string()
            .regex(/^\+?[0-9]{10,15}$/, 'Geçerli bir telefon numarası girin')
            .optional()
            .or(z.literal('')),
        password: z
            .string()
            .min(8, 'Şifre en az 8 karakter olmalı')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/,
                'Şifre gereksinimleri karşılanmıyor'
            ),
        confirmPassword: z.string(),
        roleType: z.enum(['CUSTOMER', 'VEHICLE_OWNER']),
        terms: z.literal(true, {
            errorMap: () => ({ message: 'Kullanım koşullarını kabul etmelisiniz' }),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Şifreler eşleşmiyor',
        path: ['confirmPassword'],
    });

type RegisterForm = z.infer<typeof registerSchema>;

const passwordRequirements = [
    { regex: /.{8,}/, text: 'En az 8 karakter' },
    { regex: /[A-Z]/, text: 'Bir büyük harf' },
    { regex: /[a-z]/, text: 'Bir küçük harf' },
    { regex: /[0-9]/, text: 'Bir rakam' },
    { regex: /[^a-zA-Z\d\s]/, text: 'Bir özel karakter (!@#$...)' },
];

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        trigger,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            roleType: 'CUSTOMER',
        },
        mode: 'onChange',
    });

    const password = watch('password', '');
    const roleType = watch('roleType');

    const onSubmit = async (data: RegisterForm) => {
        try {
            setError('');
            await authService.register({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                phone: data.phone || undefined,
                roleType: data.roleType,
            });
            // Kayıt sonrası login sayfasına yönlendir - mail doğrulama gerekli mesajıyla
            navigate('/login', { 
                state: { 
                    message: 'Hesabınız başarıyla oluşturuldu! E-posta adresinize doğrulama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin ve hesabınızı doğruladıktan sonra giriş yapın.' 
                } 
            });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(
                error.response?.data?.error?.message ||
                'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.'
            );
        }
    };

    const handleNextStep = async () => {
        const isValid = await trigger(['firstName', 'lastName', 'email', 'phone']);
        if (isValid) {
            setStep(2);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-8">
            <div className="w-full max-w-[480px]">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Hesap oluşturun
                    </h1>
                    <p className="text-muted-foreground">
                        Hemen ücretsiz kayıt olun ve araç kiralama deneyimine başlayın
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        step >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                        1
                    </div>
                    <div className={cn(
                        "w-12 h-1 rounded-full transition-colors",
                        step >= 2 ? "bg-primary" : "bg-muted"
                    )} />
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        step >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                        2
                    </div>
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
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Step 1: Personal Info */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* First Name */}
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                                            Ad
                                        </label>
                                        <div className="relative">
                                            <User className="input-icon" />
                                            <input
                                                {...register('firstName')}
                                                id="firstName"
                                                type="text"
                                                placeholder="Ahmet"
                                                className="input pl-11"
                                            />
                                        </div>
                                        {errors.firstName && (
                                            <p className="mt-1.5 text-sm text-red-500">
                                                {errors.firstName.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                                            Soyad
                                        </label>
                                        <input
                                            {...register('lastName')}
                                            id="lastName"
                                            type="text"
                                            placeholder="Yılmaz"
                                            className="input"
                                        />
                                        {errors.lastName && (
                                            <p className="mt-1.5 text-sm text-red-500">
                                                {errors.lastName.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

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
                                            className="input pl-11"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1.5 text-sm text-red-500">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                        Telefon <span className="text-muted-foreground font-normal">(Opsiyonel)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="input-icon" />
                                        <input
                                            {...register('phone')}
                                            id="phone"
                                            type="tel"
                                            placeholder="+90 555 123 4567"
                                            className="input pl-11"
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="mt-1.5 text-sm text-red-500">
                                            {errors.phone.message}
                                        </p>
                                    )}
                                </div>

                                {/* Account Type */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">
                                        Hesap Türü
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="cursor-pointer">
                                            <input
                                                {...register('roleType')}
                                                type="radio"
                                                value="CUSTOMER"
                                                className="peer sr-only"
                                            />
                                            <div className={cn(
                                                "p-4 rounded-lg border-2 transition-all",
                                                roleType === 'CUSTOMER'
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-muted-foreground/30"
                                            )}>
                                                <Users className="h-5 w-5 text-primary mb-2" />
                                                <div className="font-medium text-sm">Müşteri</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Araç kiralamak istiyorum
                                                </div>
                                            </div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input
                                                {...register('roleType')}
                                                type="radio"
                                                value="VEHICLE_OWNER"
                                                className="peer sr-only"
                                            />
                                            <div className={cn(
                                                "p-4 rounded-lg border-2 transition-all",
                                                roleType === 'VEHICLE_OWNER'
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-muted-foreground/30"
                                            )}>
                                                <Car className="h-5 w-5 text-primary mb-2" />
                                                <div className="font-medium text-sm">Araç Sahibi</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Aracımı kiraya vermek istiyorum
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="w-full btn-primary py-3 rounded-lg text-white font-medium"
                                >
                                    Devam Et
                                </button>
                            </div>
                        )}

                        {/* Step 2: Password & Confirm */}
                        {step === 2 && (
                            <div className="space-y-5">
                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                                        Şifre
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

                                {/* Terms */}
                                <div className="flex items-start gap-3">
                                    <input
                                        {...register('terms')}
                                        type="checkbox"
                                        id="terms"
                                        className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                                    />
                                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                                        <Link to="/terms" className="text-primary hover:underline">Kullanım Koşulları</Link>'nı
                                        ve <Link to="/privacy" className="text-primary hover:underline">Gizlilik Politikası</Link>'nı
                                        okudum ve kabul ediyorum.
                                    </label>
                                </div>
                                {errors.terms && (
                                    <p className="text-sm text-red-500">{errors.terms.message}</p>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
                                    >
                                        Geri
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 btn-primary py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Kayıt yapılıyor...
                                            </>
                                        ) : (
                                            'Kayıt Ol'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Sign In Link */}
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Zaten hesabınız var mı?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Giriş yapın
                    </Link>
                </p>
            </div>
        </div>
    );
}
