# 🚗 Profesyonel Araç Kiralama Platformu - Full Production-Ready Prompt

## 🎯 VİZYON
Europcar, Enterprise, Sixt gibi dünya çapındaki araç kiralama devleriyle birebir rekabet edebilecek, Türkiye pazarına özel, tamamen production-ready bir araç kiralama platformu geliştiriyoruz. Bu platform amatör bir proje DEĞİL, gerçek kullanıcıların para ödeyeceği, güvenlerini emanet edeceği bir e-ticaret platformudur.

**Referans Siteler (Bu sitelerin UX kalitesini yakala veya geç):**
- https://www.europcar.com.tr
- https://www.sixt.com.tr
- https://www.enterprise.com.tr
- https://www.budget.com.tr
- https://getaround.com (P2P model)
- https://turo.com (P2P model)

---

## 📐 MİMARİ GENEL BAKIŞ

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Zustand + React Query + React Hook Form + Zod
- **Backend:** NestJS + TypeScript + Prisma ORM + PostgreSQL + Redis + JWT + Passport + Nodemailer
- **Deployment:** Production-ready Docker Compose

### Portlar
- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- PostgreSQL: `5432` (local)
- Redis: `6379` (opsiyonel, yoksa in-memory fallback)

---

## 👤 KULLANICI ROLLERİ VE AKIŞLARI

### 1. Ziyaretçi (Giriş yapmamış)
- Anasayfayı görüntüleme
- Araç arama ve filtreleme
- Araç detay sayfası görüntüleme (fiyat, özellikler, fotoğraflar, yorumlar)
- Kayıt olma / Giriş yapma
- Şifremi unuttum
- İletişim formu
- SSS (Sıkça Sorulan Sorular) sayfası
- Hakkımızda sayfası

### 2. Müşteri (CUSTOMER rolü)
Ziyaretçi özelliklerine ek olarak:
- **Araç Kiralama Flow'u:**
  - Tarih ve konum seçimi
  - Araç listesini filtreleme (marka, model, yıl, vites, yakıt, fiyat aralığı, koltuk sayısı)
  - Araç detayından "Kirala" butonu
  - Kiralama özeti (tarihler, fiyat dökümü, sigorta seçenekleri)
  - Ödeme sayfası (kredi kartı formu - demo modda simülasyon)
  - Kiralama onay sayfası (referans numarası, detaylar)
- **Kiralamalarım Paneli:**
  - Aktif kiralamalar
  - Geçmiş kiralamalar
  - Bekleyen onaylar
  - Kiralama detayı (durum takibi, iletişim bilgileri)
  - Kiralama iptali
- **Favorilerim:**
  - Favori araçlar listesi
  - Favorilere ekleme/çıkarma (kalp ikonu)
- **Profil & Ayarlar (ÇOK DETAYLI):**
  - Kişisel bilgiler (ad, soyad, telefon, doğum tarihi, TC kimlik no)
  - E-posta değiştirme (yeni e-posta doğrulama gerekli)
  - Şifre değiştirme (mevcut şifre + yeni şifre)
  - Profil fotoğrafı yükleme/değiştirme
  - Adres bilgileri (fatura adresi, teslimat adresi)
  - Ehliyet bilgileri (ehliyet no, sınıf, veriliş tarihi, son kullanma tarihi)
  - Ehliyet fotoğrafı yükleme (ön/arka)
  - Kimlik doğrulama durumu (badge: Doğrulanmış / Doğrulanmamış)
  - Bildirim tercihleri (e-posta bildirimleri, SMS bildirimleri, push bildirimleri)
  - Dil tercihi
  - Hesap silme (soft delete, onay modalı)
- **Değerlendirme sistemi:**
  - Kiralama tamamlandıktan sonra araç ve sahip değerlendirmesi (1-5 yıldız + yorum)

### 3. Araç Sahibi (OWNER rolü)
Müşteri özelliklerine ek olarak:
- **Owner Dashboard:**
  - Toplam araç sayısı, aktif kiralama, bekleyen talep, aylık kazanç kartları
  - Son 7 gün / 30 gün / 12 ay kazanç grafiği (chart)
  - Son kiralama talepleri listesi
  - Araç doluluk oranı
- **Araçlarım:**
  - Araç listesi (kart görünümü: fotoğraf, marka/model, durum badge, fiyat)
  - Araç durumu: Aktif / Pasif / Bakımda / Onay Bekliyor
  - Araç ekleme formu (ÇOK DETAYLI):
    - Marka (dropdown - Türkiye'deki popüler markalar)
    - Model (marka seçimine göre dinamik dropdown)
    - Yıl
    - Plaka
    - Renk
    - Vites tipi (Otomatik / Manuel)
    - Yakıt tipi (Benzin / Dizel / Hibrit / Elektrik / LPG)
    - Motor hacmi
    - Koltuk sayısı
    - Bagaj kapasitesi
    - Kilometre
    - Günlük kiralama fiyatı (₺)
    - Haftalık indirim yüzdesi
    - Aylık indirim yüzdesi
    - Minimum kiralama süresi (gün)
    - Maksimum kiralama süresi (gün)
    - Araç konumu (il/ilçe)
    - Teslimat seçenekleri (Ofisten teslim / Adrese teslim / Her ikisi)
    - Özellikler (checkbox): Klima, Navigasyon, Bluetooth, Geri Görüş Kamerası, Park Sensörü, Cruise Control, Deri Koltuk, Sunroof, Bebek Koltuğu, Kış Lastiği, Zincir, Yangın Söndürücü, İlk Yardım Çantası
    - Fotoğraf yükleme (çoklu, drag & drop, sıralama, ana fotoğraf seçimi - min 3, max 15)
    - Açıklama (zengin metin)
    - Sigorta bilgileri
    - Araç ruhsat fotoğrafı
  - Araç düzenleme (aynı form, mevcut verilerle dolu)
  - Araç silme (soft delete, onay modalı)
  - Araç durumunu değiştirme (aktif/pasif/bakımda)
- **Kiralama Talepleri:**
  - Gelen talepler listesi (tarih, müşteri bilgileri, araç, süre, toplam tutar)
  - Talep detayı
  - Onayla / Reddet butonları
  - Red sebebi yazma
  - Kiralama başlat / tamamla / iptal et
- **Kazançlarım:**
  - Toplam kazanç
  - Komisyon kesintisi detayı (%15 platform komisyonu)
  - Net kazanç
  - Aylık kazanç tablosu
  - Ödeme geçmişi
  - Banka bilgileri (IBAN) girişi

### 4. Admin (ADMIN rolü)
- Admin paneli (ayrı layout, sidebar navigasyon)
- Dashboard (toplam kullanıcı, araç, kiralama, gelir istatistikleri)
- Kullanıcı yönetimi (listeleme, detay, rol değiştirme, ban/unban)
- Araç yönetimi (onaylama, reddetme, silme)
- Kiralama yönetimi
- İletişim mesajları yönetimi
- Sistem ayarları (komisyon oranı, minimum fiyat, vs.)

---

## 🔐 KİMLİK DOĞRULAMA VE GÜVENLİK (EKSİKSİZ)

### Kayıt Akışı
1. Kullanıcı kayıt formunu doldurur (ad, soyad, e-posta, şifre, rol seçimi)
2. Şifre kuralları: min 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter
3. Şifre gücü göstergesi (progress bar: Zayıf/Orta/Güçlü/Çok Güçlü)
4. Kullanım koşulları ve KVKK onayı (checkbox, zorunlu)
5. Kayıt → E-posta doğrulama linki gönderilir
6. Kullanıcı e-postadaki linke tıklar → Hesap doğrulanır
7. Doğrulama olmadan giriş yapılamaz (net hata mesajı + "Tekrar gönder" butonu)
8. Doğrulama linkinin süresi: 24 saat (süre dolunca tekrar gönderebilir)

### Giriş Akışı
1. E-posta + şifre girişi
2. "Beni Hatırla" checkbox (refresh token süresini uzatır)
3. Başarılı giriş → rol bazlı yönlendirme:
   - CUSTOMER → `/` (anasayfa)
   - OWNER → `/owner/dashboard`
   - ADMIN → `/admin/dashboard`
4. Başarısız giriş → net Türkçe hata mesajı
5. 5 başarısız deneme → 15 dakika hesap kilitleme + uyarı e-postası
6. Rate limiting: 5 deneme / 15 dakika

### Şifre Sıfırlama Akışı
1. "Şifremi Unuttum" → E-posta gir
2. E-posta geçerliyse → sıfırlama linki gönderilir (her durumda aynı mesaj gösterilir - güvenlik)
3. Link tıklanır → Yeni şifre belirleme sayfası
4. Yeni şifre + şifre tekrar → Şifre güncellenir
5. Başarılı → Login sayfasına yönlendir, başarı mesajı göster
6. Link süresi: 1 saat

### Token Yönetimi
- Access Token: 15 dakika ömür, memory'de saklanır
- Refresh Token: 7 gün ömür, httpOnly secure cookie'de
- Token yenilenirken eski refresh token invalidate edilir (rotation)
- Logout → tüm tokenlar invalidate edilir

### Profil Doğrulama Seviyeleri
1. **Seviye 1 - E-posta Doğrulanmış:** Temel işlemler
2. **Seviye 2 - Telefon Doğrulanmış:** Kiralama yapabilir
3. **Seviye 3 - Kimlik Doğrulanmış:** Tam erişim (ehliyet + kimlik yüklendi ve admin onayladı)

Her seviyede kullanıcıya badge gösterilir ve eksik adımlar için uyarı/yönlendirme yapılır.

---

## 🎨 FRONTEND TASARIM PRENSİPLERİ

### Genel Tasarım Dili
- **Modern, minimalist, profesyonel** (Europcar referans)
- **Renk Paleti:**
  - Primary: `#0F766E` (Teal/Koyu Yeşil - güven, profesyonellik)
  - Secondary: `#F59E0B` (Amber - dikkat çekici CTA'lar)
  - Background: `#F8FAFC` (Açık gri)
  - Surface: `#FFFFFF` (Beyaz kartlar)
  - Text Primary: `#1E293B` (Koyu lacivert)
  - Text Secondary: `#64748B` (Gri)
  - Success: `#10B981`
  - Error: `#EF4444`
  - Warning: `#F59E0B`
  - Info: `#3B82F6`
- **Font:** Inter (Google Fonts) - temiz, okunabilir
- **Border Radius:** 8px-12px (yumuşak köşeler)
- **Gölgeler:** Subtle shadow-sm, shadow-md (flat design değil, hafif derinlik)
- **Spacing:** Tutarlı 4px grid sistemi

### Header (Sabit, Her Sayfada)
- **Sol:** Logo + site adı
- **Orta:** Ana navigasyon:
  - Araç Kirala (dropdown: Tüm Araçlar, Ekonomik, SUV, Lüks, Elektrikli)
  - Nasıl Çalışır?
  - Fiyatlar
  - İletişim
- **Sağ (Ziyaretçi):** "Giriş Yap" + "Kayıt Ol" (primary buton)
- **Sağ (Giriş yapmış):**
  - Bildirim ikonu (badge ile sayı)
  - Profil dropdown:
    - Kullanıcı adı + e-posta + avatar
    - Doğrulama durumu badge
    - Separator
    - Panelim (role göre)
    - Kiralamalarım
    - Favorilerim
    - Ayarlar
    - Separator
    - Çıkış Yap
  - Owner ise ek: "+ Araç Ekle" butonu (header'da belirgin)
- **Mobil:** Hamburger menü, slide-in drawer

### Footer
- 4 sütunlu layout:
  - **Şirket:** Hakkımızda, Kariyer, Blog, Basın
  - **Destek:** Yardım Merkezi, SSS, İletişim, Şikayet
  - **Yasal:** Kullanım Koşulları, Gizlilik Politikası, KVKK, Çerez Politikası
  - **İletişim:** Adres, Telefon, E-posta, Sosyal medya ikonları
- Alt kısım: Copyright + ödeme yöntemleri ikonları

### Anasayfa (EUROPCAR KALİTESİNDE)
1. **Hero Section:**
   - Büyük, çekici araba görseli (gradient overlay)
   - Başlık: "Hayalinizdeki Aracı Kiralayın"
   - Alt başlık: "Türkiye'nin en güvenilir araç kiralama platformu"
   - **Arama Kutusu (HERO'NUN İÇİNDE):**
     - Alış lokasyonu (il/ilçe autocomplete)
     - Alış tarihi + saati
     - İade tarihi + saati
     - "Araç Ara" butonu (büyük, belirgin)
   - Arka planda subtle animasyon veya parallax efekt

2. **Popüler Araçlar Bölümü:**
   - Horizontal scroll veya grid (4'lü)
   - Her kart: Fotoğraf, marka/model, yıl, vites, yakıt, koltuk, fiyat/gün, yıldız puanı
   - "Tümünü Gör" linki

3. **Nasıl Çalışır? Bölümü:**
   - 3 adım: Ara → Kirala → Kullan
   - İkon + başlık + açıklama
   - Animasyonlu (scroll'da görünür)

4. **Neden Biz? Bölümü:**
   - Güvenli Ödeme, 7/24 Destek, Sigorta Dahil, Hızlı Teslimat
   - Sayaçlar: 10.000+ Araç, 50.000+ Müşteri, 100+ Şehir, 4.8 Puan

5. **Araç Sahipleri İçin Bölümü:**
   - "Aracınızı Kiraya Verin, Kazanç Elde Edin"
   - Avantajlar listesi
   - "Araç Sahibi Ol" CTA butonu

6. **Müşteri Yorumları:**
   - Carousel/slider
   - Avatar, isim, yıldız, yorum

7. **SSS (Kısa versiyon):**
   - Accordion (5-6 soru)
   - "Tüm Sorular" linki

### Araç Arama/Listeleme Sayfası
- **Sol sidebar:** Filtreler
  - Fiyat aralığı (range slider)
  - Marka (checkbox listesi, arama)
  - Model (marka seçimine göre)
  - Yıl aralığı
  - Vites tipi
  - Yakıt tipi
  - Koltuk sayısı
  - Araç tipi (Ekonomik, Sedan, SUV, Lüks, Van, Ticari)
  - Özellikler (checkbox)
  - "Filtreleri Temizle" butonu
- **Sağ:** Araç grid/liste görünümü
  - Sıralama: Fiyat (artan/azalan), Puan, Yeni eklenen
  - Sayfalama (infinite scroll veya pagination)
  - Her kart: Ana fotoğraf, marka/model/yıl, konum, özellik ikonları (vites, yakıt, koltuk, bagaj), fiyat/gün, yıldız puanı, favori kalp ikonu
- **Mobil:** Filtreler modal/drawer'da

### Araç Detay Sayfası
- Fotoğraf galerisi (büyük ana fotoğraf + thumbnail'lar, lightbox, zoom)
- Araç bilgileri (marka, model, yıl, plaka maskelenmiş, renk, km)
- Özellikler tablosu (ikon + metin grid)
- Fiyatlandırma kartı (sağ sidebar, sticky):
  - Günlük fiyat
  - Tarih seçici (alış-iade)
  - Toplam gün
  - Ara toplam
  - İndirim (varsa)
  - Hizmet bedeli
  - **Toplam fiyat**
  - "Şimdi Kirala" butonu
- Araç sahibi bilgileri (avatar, isim, üye tarihi, puan, yanıt süresi)
- Değerlendirmeler ve yorumlar (yıldız dağılımı + yorum listesi)
- Kiralama koşulları (yaş sınırı, ehliyet, depozito, km limiti, vs.)
- Benzer araçlar önerisi (altta)

### Profil & Ayarlar Sayfası (ÇOK DETAYLI)

**Tab/Sidebar navigasyon ile bölümler:**

#### 1. Kişisel Bilgiler
- Avatar (yükleme, kırpma, önizleme)
- Ad Soyad
- E-posta (değiştirince doğrulama gerekir)
- Telefon (değiştirince SMS doğrulama - ileride)
- Doğum Tarihi
- TC Kimlik No (maskelenmiş gösterim: ***-***-1234)
- Cinsiyet
- "Kaydet" butonu (değişiklik varsa aktif)
- Her alanın yanında düzenleme ikonu, tıklayınca editable olur

#### 2. Adres Bilgileri
- Fatura adresi (il, ilçe, mahalle, cadde/sokak, bina no, daire no, posta kodu)
- Teslimat adresi (farklıysa)
- Birden fazla adres ekleme imkanı
- Varsayılan adres seçimi

#### 3. Ehliyet Bilgileri
- Ehliyet numarası
- Ehliyet sınıfı (B, BE, C, vs.)
- Veriliş tarihi
- Son kullanma tarihi
- Ehliyet fotoğrafı ön yüz (yükleme + önizleme)
- Ehliyet fotoğrafı arka yüz (yükleme + önizleme)
- Doğrulama durumu: Yüklenmedi / İnceleniyor / Doğrulandı / Reddedildi (sebep)

#### 4. Güvenlik
- Şifre değiştirme:
  - Mevcut şifre
  - Yeni şifre (güç göstergesi)
  - Yeni şifre tekrar
- İki faktörlü doğrulama (2FA) açma/kapama (ileride)
- Aktif oturumlar listesi (cihaz, IP, son aktivite, "Sonlandır" butonu)
- Giriş geçmişi (son 10 giriş: tarih, IP, cihaz, konum)

#### 5. Bildirim Tercihleri
- E-posta bildirimleri:
  - Kiralama onayları ✓
  - Fiyat değişiklikleri ✓
  - Kampanyalar ve indirimler ✓
  - Haftalık bülten ○
- SMS bildirimleri:
  - Kiralama hatırlatmaları ✓
  - Güvenlik uyarıları ✓
- Push bildirimleri (ileride)
- Her biri toggle switch

#### 6. Ödeme Yöntemleri
- Kayıtlı kartlar listesi (maskelenmiş: **** **** **** 1234)
- Yeni kart ekleme
- Varsayılan kart seçimi
- Kart silme

#### 7. Hesap
- Hesap türü (Müşteri / Araç Sahibi)
- Hesap oluşturma tarihi
- Doğrulama seviyesi (progress bar: Seviye 1/2/3)
- Hesabı devre dışı bırak (geçici)
- Hesabı sil (kalıcı, 30 gün geri alma süresi, onay modalı + şifre doğrulama)
- Verilerimi indir (KVKK uyumu)

---

## 🔧 BACKEND API ENDPOİNTLERİ (EKSİKSİZ)

### Auth Modülü
```
POST   /api/auth/register          - Kayıt
POST   /api/auth/login             - Giriş
POST   /api/auth/logout            - Çıkış
POST   /api/auth/refresh           - Token yenile
GET    /api/auth/me                - Mevcut kullanıcı bilgisi
POST   /api/auth/forgot-password   - Şifre sıfırlama talebi
POST   /api/auth/reset-password    - Yeni şifre belirle
POST   /api/auth/verify-email      - E-posta doğrula
POST   /api/auth/resend-verification - Doğrulama e-postası tekrar gönder
POST   /api/auth/change-password   - Şifre değiştir (giriş yapmışken)
```

### Users Modülü
```
GET    /api/users/profile          - Profil bilgileri
PUT    /api/users/profile          - Profil güncelle
PUT    /api/users/avatar           - Avatar yükle/değiştir
PUT    /api/users/email            - E-posta değiştir (doğrulama tetikler)
PUT    /api/users/phone            - Telefon değiştir
GET    /api/users/verification-status - Doğrulama durumu
POST   /api/users/upload-license   - Ehliyet fotoğrafı yükle
GET    /api/users/addresses        - Adres listesi
POST   /api/users/addresses        - Adres ekle
PUT    /api/users/addresses/:id    - Adres güncelle
DELETE /api/users/addresses/:id    - Adres sil
GET    /api/users/notifications/preferences - Bildirim tercihleri
PUT    /api/users/notifications/preferences - Bildirim tercihleri güncelle
GET    /api/users/sessions         - Aktif oturumlar
DELETE /api/users/sessions/:id     - Oturumu sonlandır
GET    /api/users/login-history    - Giriş geçmişi
POST   /api/users/deactivate       - Hesabı devre dışı bırak
DELETE /api/users/account          - Hesabı sil (soft delete)
```

### Vehicles Modülü
```
GET    /api/vehicles/search        - Araç arama (public, filtreler)
GET    /api/vehicles/:id           - Araç detay (public)
GET    /api/vehicles/brands        - Marka listesi
GET    /api/vehicles/models/:brandId - Model listesi
POST   /api/vehicles               - Araç ekle (owner)
PUT    /api/vehicles/:id           - Araç düzenle (owner)
DELETE /api/vehicles/:id           - Araç sil (owner, soft delete)
PATCH  /api/vehicles/:id/status    - Araç durumu değiştir (owner)
GET    /api/vehicles/my            - Benim araçlarım (owner)
POST   /api/vehicles/:id/images    - Araç fotoğrafı yükle
DELETE /api/vehicles/:id/images/:imageId - Fotoğraf sil
PATCH  /api/vehicles/:id/images/reorder - Fotoğraf sıralaması
```

### Rentals Modülü
```
POST   /api/rentals                - Kiralama oluştur (customer)
GET    /api/rentals/my             - Kiralamalarım (customer)
GET    /api/rentals/:id            - Kiralama detayı
PATCH  /api/rentals/:id/cancel     - Kiralama iptal (customer)
GET    /api/rentals/requests       - Gelen talepler (owner)
PATCH  /api/rentals/:id/approve    - Talebi onayla (owner)
PATCH  /api/rentals/:id/reject     - Talebi reddet (owner)
PATCH  /api/rentals/:id/start      - Kiralama başlat (owner)
PATCH  /api/rentals/:id/complete   - Kiralama tamamla (owner)
GET    /api/rentals/statistics     - İstatistikler (owner)
```

### Favorites Modülü
```
GET    /api/favorites              - Favorilerim
POST   /api/favorites/:vehicleId   - Favorilere ekle
DELETE /api/favorites/:vehicleId   - Favorilerden çıkar
```

### Reviews Modülü
```
POST   /api/reviews                - Değerlendirme yap
GET    /api/reviews/vehicle/:id    - Araç değerlendirmeleri
GET    /api/reviews/my             - Benim değerlendirmelerim
```

### Payments Modülü
```
POST   /api/payments/calculate     - Fiyat hesapla
POST   /api/payments/process       - Ödeme işle (demo simülasyon)
GET    /api/payments/my            - Ödeme geçmişim
GET    /api/payments/earnings      - Kazançlarım (owner)
```

### Contact Modülü
```
POST   /api/contact                - İletişim formu gönder
GET    /api/contact/messages       - Mesajlar (admin)
```

### Admin Modülü
```
GET    /api/admin/dashboard        - Dashboard istatistikleri
GET    /api/admin/users            - Kullanıcı listesi
GET    /api/admin/users/:id        - Kullanıcı detayı
PATCH  /api/admin/users/:id/role   - Rol değiştir
PATCH  /api/admin/users/:id/ban    - Kullanıcı banla
GET    /api/admin/vehicles         - Araç listesi
PATCH  /api/admin/vehicles/:id/approve - Araç onayla
PATCH  /api/admin/vehicles/:id/reject  - Araç reddet
GET    /api/admin/rentals          - Tüm kiralamalar
GET    /api/admin/settings         - Sistem ayarları
PUT    /api/admin/settings         - Ayarları güncelle
```

---

## 📊 VERİTABANI ŞEMASI (PRİSMA)

### Modeller
- **User:** id, email, password, firstName, lastName, phone, birthDate, tcNumber, gender, avatar, role (CUSTOMER/OWNER/ADMIN), isVerified, isActive, verificationLevel (1/2/3), createdAt, updatedAt, deletedAt
- **Address:** id, userId, title, city, district, neighborhood, street, buildingNo, apartmentNo, postalCode, isDefault, type (BILLING/DELIVERY)
- **DriverLicense:** id, userId, licenseNumber, licenseClass, issueDate, expiryDate, frontImage, backImage, verificationStatus (PENDING/APPROVED/REJECTED), rejectionReason
- **Vehicle:** id, ownerId, brandId, modelId, year, plateNumber, color, transmissionType, fuelType, engineSize, seats, trunkCapacity, mileage, dailyPrice, weeklyDiscount, monthlyDiscount, minRentalDays, maxRentalDays, city, district, deliveryType, features (JSON), description, status (ACTIVE/INACTIVE/MAINTENANCE/PENDING_APPROVAL), isApproved, createdAt, updatedAt, deletedAt
- **VehicleImage:** id, vehicleId, url, order, isMain
- **VehicleBrand:** id, name, logo
- **VehicleModel:** id, brandId, name
- **Rental:** id, vehicleId, customerId, startDate, endDate, totalDays, dailyPrice, subtotal, discount, serviceFee, totalPrice, status (PENDING/APPROVED/REJECTED/ACTIVE/COMPLETED/CANCELLED), rejectionReason, cancellationReason, paymentId, createdAt, updatedAt
- **Payment:** id, rentalId, amount, method, status (PENDING/COMPLETED/REFUNDED/FAILED), transactionId, createdAt
- **Review:** id, rentalId, reviewerId, vehicleId, rating (1-5), comment, createdAt
- **Favorite:** id, userId, vehicleId, createdAt
- **Notification:** id, userId, type, title, message, isRead, data (JSON), createdAt
- **NotificationPreference:** id, userId, emailRentalUpdates, emailPriceChanges, emailPromotions, emailNewsletter, smsRentalReminders, smsSecurityAlerts
- **Session:** id, userId, token, device, ip, userAgent, lastActivity, createdAt
- **LoginHistory:** id, userId, ip, device, userAgent, location, success, createdAt
- **ContactMessage:** id, name, email, phone, subject, message, isRead, createdAt
- **SystemSetting:** id, key, value, description

---

## ⚡ PERFORMANS & UX DETAYLARI

### Loading States
- Skeleton loader (iskelet yükleme) her sayfa ve bileşen için
- Button loading spinner (tıklanınca disabled + spinner)
- Form submit sırasında tüm inputlar disabled
- Optimistic updates (favori ekleme anında UI güncellemesi)

### Error Handling (Frontend)
- Toast bildirimleri (sağ üst köşe, otomatik kapanma)
- Form validation hataları (input altında kırmızı metin)
- 404 sayfası (özel tasarım, anasayfaya dönüş)
- 500 sayfası (özel tasarım, tekrar dene butonu)
- Offline durumu algılama ve uyarı

### Responsive Design
- Mobile-first yaklaşım
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Hamburger menü (mobil)
- Filtreler drawer'da (mobil)
- Touch-friendly (minimum 44px dokunma alanı)

### Animasyonlar
- Sayfa geçişleri (fade-in)
- Hover efektleri (kartlar, butonlar)
- Scroll animasyonları (IntersectionObserver)
- Modal açılış/kapanış
- Dropdown açılış/kapanış
- Toast slide-in

### SEO & Erişilebilirlik
- Semantic HTML (header, main, nav, section, article, footer)
- Meta taglar (title, description)
- Alt text tüm görsellerde
- ARIA labels
- Keyboard navigasyon desteği
- Focus visible stiller

---

## 🇹🇷 TÜRKÇE DİL KURALLARI

- Tüm UI metinleri, hata mesajları, bildirimler, placeholder'lar, buton yazıları Türkçe
- Tarih formatı: DD.MM.YYYY
- Para formatı: 1.500,00 ₺
- Telefon formatı: 0(5XX) XXX XX XX
- Saat formatı: 24 saat (14:30)
- Türkçe karakter desteği (ğ, ü, ş, ı, ö, ç, Ğ, Ü, Ş, İ, Ö, Ç)

---

## 🚫 YAPILMAMASI GEREKENLER

- localStorage'da token saklama
- bcrypt kullanma (Argon2id kullan)
- İngilizce hata mesajı gösterme
- Console.log'ları production'da bırakma
- Any type kullanma (TypeScript strict mode)
- Sayfalanmamış liste endpoint'i
- N+1 query problemi
- Stack trace'i kullanıcıya gösterme
- Hardcoded secret/password
- SQL injection'a açık query
- XSS'e açık input rendering

---

## ✅ ÖNCELİK SIRASI (IMPLEMENTATION ORDER)

### Faz 1 - Temel (MVP) ✅
1. Auth (kayıt, giriş, çıkış, e-posta doğrulama, şifre sıfırlama)
2. Araç CRUD (ekleme, listeleme, detay, düzenleme, silme)
3. Araç arama ve filtreleme
4. Temel kiralama flow'u
5. Owner dashboard
6. Responsive tasarım

### Faz 2 - Genişletme (ŞİMDİ BURADAYIZ)
7. **Müşteri paneli (Kiralamalarım, Favoriler, Profil)**
8. **Tam profil & ayarlar sayfası (tüm bölümler)**
9. **Araç kiralama flow'u (tarih seçimi, fiyat hesaplama, ödeme simülasyonu)**
10. Değerlendirme sistemi
11. Bildirim sistemi
12. Admin paneli temeli

### Faz 3 - Profesyonel
13. İleri düzey arama (harita görünümü, yakınımdaki araçlar)
14. Mesajlaşma sistemi (kiracı-sahip)
15. 2FA (iki faktörlü doğrulama)
16. Gelişmiş admin paneli
17. Raporlama ve analitik
18. Çoklu dil desteği

---

## 📌 KRİTİK NOT

Bu prompt'u uygularken:
1. Her modülü **controller → service → repository** katmanlı yapıda oluştur
2. Her endpoint için **input validasyonu** (Zod/class-validator) yap
3. Her kullanıcıya dönük mesaj **Türkçe** olsun
4. Her liste endpoint'inde **sayfalama** olsun
5. Her form'da **loading state**, **error state**, **success state** olsun
6. Her sayfa **responsive** olsun (mobile-first)
7. **Skeleton loader** kullan (veri yüklenirken)
8. Tüm **edge case**'leri düşün (boş liste, yetkisiz erişim, süre dolmuş token, vs.)
9. **TypeScript strict mode** - any kullanma
10. Her değişiklikten sonra **test yaz ve çalıştır**

