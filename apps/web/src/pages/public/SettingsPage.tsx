import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    MapPin,
    Shield,
    Bell,
    FileText,
    Settings,
    Loader2,
    CheckCircle,
    AlertCircle,
    Camera,
    Trash2,
    Plus,
    Eye,
    EyeOff,
    ChevronRight,
    Save,
    X,
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

// ==========================================
// TYPES
// ==========================================

interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    birthDate: string | null;
    tcNumber: string | null;
    gender: string | null;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    role: { name: string };
    addresses: Address[];
    driverLicense: DriverLicense | null;
    notificationPreference: NotificationPref | null;
}

interface Address {
    id: string;
    title: string;
    city: string;
    district: string;
    neighborhood: string | null;
    street: string | null;
    buildingNo: string | null;
    apartmentNo: string | null;
    postalCode: string | null;
    isDefault: boolean;
    type: 'BILLING' | 'DELIVERY';
}

interface DriverLicense {
    id: string;
    licenseNumber: string | null;
    licenseClass: string | null;
    issueDate: string | null;
    expiryDate: string | null;
    frontImage: string | null;
    backImage: string | null;
    verificationStatus: 'NOT_UPLOADED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
}

interface NotificationPref {
    emailRentalUpdates: boolean;
    emailPriceChanges: boolean;
    emailPromotions: boolean;
    emailNewsletter: boolean;
    smsRentalReminders: boolean;
    smsSecurityAlerts: boolean;
}

interface VerificationStatus {
    level: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    licenseStatus: string;
    licenseVerified: boolean;
}

// ==========================================
// TABS
// ==========================================

const tabs = [
    { id: 'personal', label: 'Kişisel Bilgiler', icon: User },
    { id: 'addresses', label: 'Adres Bilgileri', icon: MapPin },
    { id: 'license', label: 'Ehliyet Bilgileri', icon: FileText },
    { id: 'security', label: 'Güvenlik', icon: Shield },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'account', label: 'Hesap', icon: Settings },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function SettingsPage() {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState('personal');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [verification, setVerification] = useState<VerificationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadProfile();
        loadVerification();
    }, [isAuthenticated]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users/profile');
            setProfile(res.data);
        } catch {
            showToast('error', 'Profil bilgileri yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const loadVerification = async () => {
        try {
            const res = await api.get('/users/verification-status');
            setVerification(res.data);
        } catch {
            // ignore
        }
    };

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-muted-foreground">Profil bilgileri yüklenemedi</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right",
                    toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                )}>
                    {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2"><X className="h-4 w-4" /></button>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1">Ayarlar</h1>
                    <p className="text-muted-foreground">Hesap ayarlarınızı ve tercihlerinizi yönetin</p>
                </div>

                {/* Verification Level Banner */}
                {verification && (
                    <VerificationBanner verification={verification} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1">
                        <div className="card p-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                                            activeTab === tab.id
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="lg:col-span-3">
                        {activeTab === 'personal' && (
                            <PersonalInfoTab
                                profile={profile}
                                onSave={loadProfile}
                                showToast={showToast}
                            />
                        )}
                        {activeTab === 'addresses' && (
                            <AddressesTab
                                addresses={profile.addresses}
                                onSave={loadProfile}
                                showToast={showToast}
                            />
                        )}
                        {activeTab === 'license' && (
                            <DriverLicenseTab
                                license={profile.driverLicense}
                                onSave={loadProfile}
                                showToast={showToast}
                            />
                        )}
                        {activeTab === 'security' && (
                            <SecurityTab showToast={showToast} />
                        )}
                        {activeTab === 'notifications' && (
                            <NotificationsTab
                                prefs={profile.notificationPreference}
                                onSave={loadProfile}
                                showToast={showToast}
                            />
                        )}
                        {activeTab === 'account' && (
                            <AccountTab
                                profile={profile}
                                verification={verification}
                                showToast={showToast}
                                onLogout={() => {
                                    logout();
                                    navigate('/login');
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// VERIFICATION BANNER
// ==========================================

function VerificationBanner({ verification }: { verification: VerificationStatus }) {
    const levels = [
        { label: 'E-posta', done: verification.emailVerified },
        { label: 'Telefon', done: verification.phoneVerified },
        { label: 'Kimlik', done: verification.licenseVerified },
    ];

    return (
        <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-sm">Doğrulama Seviyesi</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Seviye {verification.level}/3 — {verification.level === 3 ? 'Tam doğrulanmış' : 'Eksik doğrulamalar var'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {levels.map((level, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                level.done
                                    ? "bg-green-100 text-green-700"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {level.done ? '✓' : i + 1}
                            </div>
                            <span className={cn(
                                "text-xs font-medium",
                                level.done ? "text-green-700" : "text-muted-foreground"
                            )}>
                                {level.label}
                            </span>
                            {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </div>
                    ))}
                </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(verification.level / 3) * 100}%` }}
                />
            </div>
        </div>
    );
}

// ==========================================
// PERSONAL INFO TAB
// ==========================================

function PersonalInfoTab({ profile, onSave, showToast }: {
    profile: UserProfile;
    onSave: () => void;
    showToast: (type: 'success' | 'error', message: string) => void;
}) {
    const [form, setForm] = useState({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
        tcNumber: profile.tcNumber || '',
        gender: profile.gender || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/users/profile', form);
            showToast('success', 'Profil bilgileri güncellendi');
            onSave();
        } catch {
            showToast('error', 'Profil güncellenirken hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = JSON.stringify(form) !== JSON.stringify({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
        tcNumber: profile.tcNumber || '',
        gender: profile.gender || '',
    });

    return (
        <div className="space-y-6">
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-1">Kişisel Bilgiler</h2>
                <p className="text-sm text-muted-foreground mb-6">Profil bilgilerinizi güncelleyin</p>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`
                            )}
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:opacity-90">
                            <Camera className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div>
                        <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                            {profile.isVerified ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> E-posta Doğrulanmış
                                </span>
                            ) : (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> E-posta Doğrulanmamış
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Ad</label>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            className="input"
                            placeholder="Adınız"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Soyad</label>
                        <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            className="input"
                            placeholder="Soyadınız"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Telefon</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="input"
                            placeholder="0(5XX) XXX XX XX"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Doğum Tarihi</label>
                        <input
                            type="date"
                            value={form.birthDate}
                            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">TC Kimlik No</label>
                        <input
                            type="text"
                            value={form.tcNumber}
                            onChange={(e) => setForm({ ...form, tcNumber: e.target.value })}
                            className="input"
                            placeholder="•••••••••••"
                            maxLength={11}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Kimlik doğrulama için gereklidir</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Cinsiyet</label>
                        <select
                            value={form.gender}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}
                            className="input"
                        >
                            <option value="">Seçiniz</option>
                            <option value="Erkek">Erkek</option>
                            <option value="Kadın">Kadın</option>
                            <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
                        </select>
                    </div>
                </div>

                {/* E-posta (readonly) */}
                <div className="mt-5">
                    <label className="block text-sm font-medium mb-1.5">E-posta Adresi</label>
                    <div className="input bg-muted/50 cursor-not-allowed flex items-center justify-between">
                        <span className="text-muted-foreground">{profile.email}</span>
                        <span className="text-xs text-muted-foreground">Değiştirilemiyor</span>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-6 pt-4 border-t border-border">
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={cn(
                            "btn-primary px-6 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2",
                            (!hasChanges || saving) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// ADDRESSES TAB
// ==========================================

function AddressesTab({ addresses, onSave, showToast }: {
    addresses: Address[];
    onSave: () => void;
    showToast: (type: 'success' | 'error', message: string) => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: '',
        city: '',
        district: '',
        neighborhood: '',
        street: '',
        buildingNo: '',
        apartmentNo: '',
        postalCode: '',
        isDefault: false,
        type: 'BILLING' as 'BILLING' | 'DELIVERY',
    });

    const resetForm = () => {
        setForm({
            title: '', city: '', district: '', neighborhood: '',
            street: '', buildingNo: '', apartmentNo: '', postalCode: '',
            isDefault: false, type: 'BILLING',
        });
        setEditId(null);
        setShowForm(false);
    };

    const handleEdit = (addr: Address) => {
        setForm({
            title: addr.title,
            city: addr.city,
            district: addr.district,
            neighborhood: addr.neighborhood || '',
            street: addr.street || '',
            buildingNo: addr.buildingNo || '',
            apartmentNo: addr.apartmentNo || '',
            postalCode: addr.postalCode || '',
            isDefault: addr.isDefault,
            type: addr.type,
        });
        setEditId(addr.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.city || !form.district) {
            showToast('error', 'İl ve ilçe zorunludur');
            return;
        }

        try {
            if (editId) {
                await api.put(`/users/addresses/${editId}`, form);
                showToast('success', 'Adres güncellendi');
            } else {
                await api.post('/users/addresses', form);
                showToast('success', 'Adres eklendi');
            }
            resetForm();
            onSave();
        } catch {
            showToast('error', 'Adres kaydedilemedi');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/users/addresses/${id}`);
            showToast('success', 'Adres silindi');
            onSave();
        } catch {
            showToast('error', 'Adres silinemedi');
        }
    };

    return (
        <div className="space-y-6">
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Adres Bilgileri</h2>
                        <p className="text-sm text-muted-foreground">Fatura ve teslimat adreslerinizi yönetin</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="btn-primary px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Adres Ekle
                    </button>
                </div>

                {/* Address List */}
                {addresses.length === 0 && !showForm ? (
                    <div className="text-center py-12">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Henüz adres eklenmemiş</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="text-primary font-medium hover:underline"
                        >
                            İlk adresinizi ekleyin
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.map((addr) => (
                            <div key={addr.id} className="border border-border rounded-lg p-4 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{addr.title}</span>
                                        {addr.isDefault && (
                                            <span className="badge badge-primary text-xs">Varsayılan</span>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            ({addr.type === 'BILLING' ? 'Fatura' : 'Teslimat'})
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {[addr.neighborhood, addr.street, addr.buildingNo && `No: ${addr.buildingNo}`, addr.apartmentNo && `D: ${addr.apartmentNo}`].filter(Boolean).join(', ')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{addr.district} / {addr.city}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(addr)} className="text-xs text-primary hover:underline">Düzenle</button>
                                    <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 hover:underline">Sil</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Address Form */}
                {showForm && (
                    <div className="mt-6 border-t border-border pt-6">
                        <h3 className="font-medium mb-4">{editId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Adres Başlığı</label>
                                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Ev, İş, vb." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Adres Tipi</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'BILLING' | 'DELIVERY' })} className="input">
                                    <option value="BILLING">Fatura Adresi</option>
                                    <option value="DELIVERY">Teslimat Adresi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">İl *</label>
                                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="İstanbul" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">İlçe *</label>
                                <input type="text" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="input" placeholder="Kadıköy" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Mahalle</label>
                                <input type="text" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="input" placeholder="Caferağa Mah." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Cadde / Sokak</label>
                                <input type="text" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="input" placeholder="Moda Cad." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Bina No</label>
                                <input type="text" value={form.buildingNo} onChange={(e) => setForm({ ...form, buildingNo: e.target.value })} className="input" placeholder="12" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Daire No</label>
                                <input type="text" value={form.apartmentNo} onChange={(e) => setForm({ ...form, apartmentNo: e.target.value })} className="input" placeholder="5" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Posta Kodu</label>
                                <input type="text" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="input" placeholder="34710" />
                            </div>
                            <div className="flex items-center gap-2 pt-7">
                                <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-border" />
                                <label htmlFor="isDefault" className="text-sm">Varsayılan adres olarak ayarla</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                                İptal
                            </button>
                            <button onClick={handleSave} className="btn-primary px-6 py-2 rounded-lg text-white text-sm font-medium">
                                {editId ? 'Güncelle' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// DRIVER LICENSE TAB
// ==========================================

function DriverLicenseTab({ license, onSave, showToast }: {
    license: DriverLicense | null;
    onSave: () => void;
    showToast: (type: 'success' | 'error', message: string) => void;
}) {
    const [form, setForm] = useState({
        licenseNumber: license?.licenseNumber || '',
        licenseClass: license?.licenseClass || 'B',
        issueDate: license?.issueDate ? license.issueDate.split('T')[0] : '',
        expiryDate: license?.expiryDate ? license.expiryDate.split('T')[0] : '',
    });
    const [saving, setSaving] = useState(false);

    const statusConfig = {
        NOT_UPLOADED: { label: 'Yüklenmedi', color: 'text-muted-foreground bg-muted' },
        PENDING: { label: 'İnceleniyor', color: 'text-amber-700 bg-amber-100' },
        APPROVED: { label: 'Doğrulandı', color: 'text-green-700 bg-green-100' },
        REJECTED: { label: 'Reddedildi', color: 'text-red-700 bg-red-100' },
    };

    const status = license?.verificationStatus || 'NOT_UPLOADED';
    const statusInfo = statusConfig[status];

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/users/driver-license', form);
            showToast('success', 'Ehliyet bilgileri güncellendi');
            onSave();
        } catch {
            showToast('error', 'Ehliyet bilgileri güncellenemedi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold">Ehliyet Bilgileri</h2>
                    <p className="text-sm text-muted-foreground">Araç kiralama için ehliyet bilgilerinizi girin</p>
                </div>
                <span className={cn("badge text-xs px-3 py-1", statusInfo.color)}>
                    {statusInfo.label}
                </span>
            </div>

            {license?.verificationStatus === 'REJECTED' && license.rejectionReason && (
                <div className="alert alert-error mb-6 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-sm">Ehliyet doğrulamanız reddedildi</p>
                        <p className="text-sm mt-1">Sebep: {license.rejectionReason}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Ehliyet Numarası</label>
                    <input
                        type="text"
                        value={form.licenseNumber}
                        onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                        className="input"
                        placeholder="Ehliyet numaranız"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Ehliyet Sınıfı</label>
                    <select
                        value={form.licenseClass}
                        onChange={(e) => setForm({ ...form, licenseClass: e.target.value })}
                        className="input"
                    >
                        <option value="B">B</option>
                        <option value="BE">BE</option>
                        <option value="C">C</option>
                        <option value="CE">CE</option>
                        <option value="D">D</option>
                        <option value="DE">DE</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Veriliş Tarihi</label>
                    <input
                        type="date"
                        value={form.issueDate}
                        onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                        className="input"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Son Kullanma Tarihi</label>
                    <input
                        type="date"
                        value={form.expiryDate}
                        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                        className="input"
                    />
                </div>
            </div>

            {/* Photo upload placeholder */}
            <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Ehliyet Fotoğrafları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Ön Yüz</p>
                        <p className="text-xs text-muted-foreground">Ehliyetinizin ön yüz fotoğrafını yükleyin</p>
                        {license?.frontImage && (
                            <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Yüklendi
                            </p>
                        )}
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Arka Yüz</p>
                        <p className="text-xs text-muted-foreground">Ehliyetinizin arka yüz fotoğrafını yükleyin</p>
                        {license?.backImage && (
                            <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Yüklendi
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-border">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-6 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Kaydet
                </button>
            </div>
        </div>
    );
}

// ==========================================
// SECURITY TAB
// ==========================================

function SecurityTab({ showToast }: {
    showToast: (type: 'success' | 'error', message: string) => void;
}) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    // Password strength
    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = getPasswordStrength(newPassword);
    const strengthLabels = ['', 'Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];
    const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            showToast('error', 'Şifreler eşleşmiyor');
            return;
        }
        if (strength < 3) {
            showToast('error', 'Daha güçlü bir şifre belirleyin');
            return;
        }

        setSaving(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            showToast('success', 'Şifreniz başarıyla değiştirildi');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            const msg = err?.response?.data?.error?.message || 'Şifre değiştirilemedi';
            showToast('error', msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-1">Şifre Değiştir</h2>
                <p className="text-sm text-muted-foreground mb-6">Hesabınızın güvenliği için şifrenizi düzenli olarak değiştirin</p>

                <div className="space-y-5 max-w-md">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Mevcut Şifre</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Yeni Şifre</label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {newPassword && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1.5 flex-1 rounded-full transition-colors",
                                                i <= strength ? strengthColors[strength] : "bg-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">{strengthLabels[strength]}</p>
                            </div>
                        )}
                        <ul className="mt-2 space-y-1">
                            {[
                                { test: newPassword.length >= 8, label: 'En az 8 karakter' },
                                { test: /[A-Z]/.test(newPassword), label: 'En az 1 büyük harf' },
                                { test: /[a-z]/.test(newPassword), label: 'En az 1 küçük harf' },
                                { test: /[0-9]/.test(newPassword), label: 'En az 1 rakam' },
                                { test: /[^A-Za-z0-9]/.test(newPassword), label: 'En az 1 özel karakter' },
                            ].map((rule) => (
                                <li key={rule.label} className={cn(
                                    "text-xs flex items-center gap-1.5",
                                    rule.test ? "text-green-600" : "text-muted-foreground"
                                )}>
                                    {rule.test ? <CheckCircle className="h-3 w-3" /> : <div className="w-3 h-3 rounded-full border border-border" />}
                                    {rule.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Yeni Şifre (Tekrar)</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-xs text-red-500 mt-1">Şifreler eşleşmiyor</p>
                        )}
                    </div>

                    <button
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                        className={cn(
                            "btn-primary px-6 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2",
                            (!currentPassword || !newPassword || !confirmPassword || saving) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                        Şifreyi Değiştir
                    </button>
                </div>
            </div>

            {/* 2FA Section */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-1">İki Faktörlü Doğrulama (2FA)</h2>
                <p className="text-sm text-muted-foreground mb-4">Hesabınıza ekstra güvenlik katmanı ekleyin</p>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                        <p className="font-medium text-sm">2FA Durumu</p>
                        <p className="text-xs text-muted-foreground">Yakında aktif edilecek</p>
                    </div>
                    <span className="badge bg-muted text-muted-foreground text-xs">Yakında</span>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// NOTIFICATIONS TAB
// ==========================================

function NotificationsTab({ prefs, onSave, showToast }: {
    prefs: NotificationPref | null;
    onSave: () => void;
    showToast: (type: 'success' | 'error', message: string) => void;
}) {
    const [form, setForm] = useState<NotificationPref>({
        emailRentalUpdates: prefs?.emailRentalUpdates ?? true,
        emailPriceChanges: prefs?.emailPriceChanges ?? true,
        emailPromotions: prefs?.emailPromotions ?? true,
        emailNewsletter: prefs?.emailNewsletter ?? false,
        smsRentalReminders: prefs?.smsRentalReminders ?? true,
        smsSecurityAlerts: prefs?.smsSecurityAlerts ?? true,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/users/notifications/preferences', form);
            showToast('success', 'Bildirim tercihleri güncellendi');
            onSave();
        } catch {
            showToast('error', 'Bildirim tercihleri güncellenemedi');
        } finally {
            setSaving(false);
        }
    };

    const Toggle = ({ checked, onChange, label, description }: {
        checked: boolean;
        onChange: (val: boolean) => void;
        label: string;
        description: string;
    }) => (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    checked ? "bg-primary" : "bg-muted-foreground/30"
                )}
            >
                <div className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    checked && "translate-x-5"
                )} />
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-1">E-posta Bildirimleri</h2>
                <p className="text-sm text-muted-foreground mb-4">Hangi e-posta bildirimlerini almak istediğinizi seçin</p>

                <div className="divide-y divide-border">
                    <Toggle
                        checked={form.emailRentalUpdates}
                        onChange={(val) => setForm({ ...form, emailRentalUpdates: val })}
                        label="Kiralama Güncellemeleri"
                        description="Kiralama onayı, iptali ve durum değişiklikleri"
                    />
                    <Toggle
                        checked={form.emailPriceChanges}
                        onChange={(val) => setForm({ ...form, emailPriceChanges: val })}
                        label="Fiyat Değişiklikleri"
                        description="Favori araçlarınızda fiyat düşüşleri"
                    />
                    <Toggle
                        checked={form.emailPromotions}
                        onChange={(val) => setForm({ ...form, emailPromotions: val })}
                        label="Kampanyalar ve İndirimler"
                        description="Özel kampanya ve indirim fırsatları"
                    />
                    <Toggle
                        checked={form.emailNewsletter}
                        onChange={(val) => setForm({ ...form, emailNewsletter: val })}
                        label="Haftalık Bülten"
                        description="Haftalık araç önerileri ve haberler"
                    />
                </div>
            </div>

            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-1">SMS Bildirimleri</h2>
                <p className="text-sm text-muted-foreground mb-4">SMS bildirim tercihlerinizi yönetin</p>

                <div className="divide-y divide-border">
                    <Toggle
                        checked={form.smsRentalReminders}
                        onChange={(val) => setForm({ ...form, smsRentalReminders: val })}
                        label="Kiralama Hatırlatmaları"
                        description="Kiralama başlangıç ve bitiş hatırlatmaları"
                    />
                    <Toggle
                        checked={form.smsSecurityAlerts}
                        onChange={(val) => setForm({ ...form, smsSecurityAlerts: val })}
                        label="Güvenlik Uyarıları"
                        description="Şüpheli giriş ve güvenlik bildirimleri"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-6 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Tercihleri Kaydet
                </button>
            </div>
        </div>
    );
}

// ==========================================
// ACCOUNT TAB
// ==========================================

function AccountTab({ profile, verification, showToast, onLogout }: {
    profile: UserProfile;
    verification: VerificationStatus | null;
    showToast: (type: 'success' | 'error', message: string) => void;
    onLogout: () => void;
}) {
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDeactivate = async () => {
        if (!confirm('Hesabınızı devre dışı bırakmak istediğinize emin misiniz? Tekrar giriş yaparak aktifleştirebilirsiniz.')) return;
        try {
            await api.post('/users/deactivate');
            showToast('success', 'Hesabınız devre dışı bırakıldı');
            onLogout();
        } catch {
            showToast('error', 'Hesap devre dışı bırakılamadı');
        }
    };

    const handleDelete = async () => {
        if (!deletePassword) {
            showToast('error', 'Şifrenizi girin');
            return;
        }
        setDeleting(true);
        try {
            await api.delete('/users/account', { data: { password: deletePassword } });
            showToast('success', 'Hesabınız silindi');
            onLogout();
        } catch (err: any) {
            const msg = err?.response?.data?.error?.message || 'Hesap silinemedi';
            showToast('error', msg);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Account Info */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Hesap Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Hesap Türü</p>
                        <p className="font-medium text-sm">
                            {profile.role.name === 'VEHICLE_OWNER' ? 'Araç Sahibi' :
                             profile.role.name === 'SUPER_ADMIN' ? 'Yönetici' : 'Müşteri'}
                        </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Hesap Oluşturma</p>
                        <p className="font-medium text-sm">
                            {new Date(profile.createdAt).toLocaleDateString('tr-TR', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">E-posta Doğrulama</p>
                        <p className={cn("font-medium text-sm", profile.isVerified ? "text-green-600" : "text-amber-600")}>
                            {profile.isVerified ? 'Doğrulanmış ✓' : 'Doğrulanmamış'}
                        </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Doğrulama Seviyesi</p>
                        <p className="font-medium text-sm">
                            Seviye {verification?.level || 0}/3
                        </p>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card p-6 border-red-200 dark:border-red-800/50">
                <h2 className="text-lg font-semibold text-red-600 mb-1">Tehlikeli Bölge</h2>
                <p className="text-sm text-muted-foreground mb-6">Bu işlemler geri alınamayabilir</p>

                <div className="space-y-4">
                    {/* Deactivate */}
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                            <p className="font-medium text-sm">Hesabı Devre Dışı Bırak</p>
                            <p className="text-xs text-muted-foreground">Hesabınız geçici olarak devre dışı kalır</p>
                        </div>
                        <button
                            onClick={handleDeactivate}
                            className="px-4 py-2 rounded-lg border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors"
                        >
                            Devre Dışı Bırak
                        </button>
                    </div>

                    {/* Delete */}
                    <div className="p-4 border border-red-200 dark:border-red-800/50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm text-red-600">Hesabı Kalıcı Olarak Sil</p>
                                <p className="text-xs text-muted-foreground">30 gün içinde geri alabilirsiniz</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Hesabı Sil
                            </button>
                        </div>

                        {showDeleteConfirm && (
                            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800/50">
                                <p className="text-sm text-red-600 mb-3">
                                    Bu işlem geri alınamaz. Onaylamak için şifrenizi girin:
                                </p>
                                <div className="flex gap-3">
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="input flex-1"
                                        placeholder="Şifreniz"
                                    />
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting || !deletePassword}
                                        className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        Onayla
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

