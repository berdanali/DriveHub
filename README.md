# 🚗 Araç Kiralama Platformu

Türkiye'nin profesyonel araç kiralama platformu. Premium araçlar, güvenli kiralama ve 7/24 destek.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

## 📋 Özellikler

### Müşteri Özellikleri
- ✅ Araç arama ve filtreleme
- ✅ Online rezervasyon
- ✅ Kiralama geçmişi
- ✅ Güvenli ödeme

### Araç Sahibi Özellikleri
- ✅ Araç listesi yönetimi
- ✅ Kiralama takibi
- ✅ Gelir raporları
- ✅ GPS ile araç takibi

### Admin Özellikleri
- ✅ Kullanıcı yönetimi
- ✅ Araç onaylama sistemi
- ✅ Filo takibi
- ✅ Finansal raporlar

### Güvenlik
- ✅ JWT tabanlı kimlik doğrulama
- ✅ Argon2id şifre hashleme (bcrypt'ten daha güvenli)
- ✅ Rate limiting (Redis tabanlı)
- ✅ Helmet güvenlik başlıkları
- ✅ CORS koruması
- ✅ Input validasyonu (Zod + class-validator)

## 🛠️ Teknoloji Stack

### Backend
- **Framework:** NestJS 10
- **Dil:** TypeScript 5
- **ORM:** Prisma
- **Veritabanı:** PostgreSQL 15
- **Cache:** Redis 7
- **Auth:** JWT + Passport
- **Şifreleme:** Argon2id
- **API Docs:** Swagger

### Frontend
- **Framework:** React 18
- **Dil:** TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios + TanStack Query

### DevOps
- **Container:** Docker & Docker Compose
- **CI/CD:** GitHub Actions
- **Test:** Jest + Supertest

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/your-username/car-rental.git
cd car-rental
```

### 2. Docker Servislerini Başlatın
```bash
docker-compose up -d
```

### 3. Backend Kurulumu
```bash
cd apps/api
npm install
cp .env.example .env  # Environment değişkenlerini düzenleyin
npx prisma generate
npx prisma migrate dev
npm run prisma:seed  # Test verileri yükle
npm run start:dev
```

### 4. Frontend Kurulumu
```bash
cd apps/web
npm install
npm run dev
```

### 5. Uygulamaya Erişim
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs

## 📚 API Dokümantasyonu

API dokümantasyonu Swagger UI üzerinden erişilebilir:
```
http://localhost:3000/api/docs
```

### Ana Endpointler

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | Kullanıcı girişi |
| POST | `/api/auth/refresh` | Token yenileme |
| GET | `/api/vehicles/search` | Araç arama (Public) |
| POST | `/api/vehicles` | Yeni araç ekle (Owner) |
| POST | `/api/rentals` | Kiralama oluştur |
| GET | `/api/rentals/my` | Kiralamalarım |

## 🧪 Test

### Unit Testler
```bash
cd apps/api
npm run test
```

### E2E Testler
```bash
cd apps/api
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 🔧 Environment Değişkenleri

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/car_rental?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT (Production'da güçlü secretlar kullanın!)
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Commission
COMMISSION_RATE=0.15
```

## 📦 Proje Yapısı

```
car-project/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/         # Guards, Filters, Interceptors
│   │   │   ├── config/         # Configuration
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── users/      # User management
│   │   │   │   ├── vehicles/   # Vehicle management
│   │   │   │   ├── rentals/    # Rental operations
│   │   │   │   └── gps/        # GPS tracking
│   │   │   ├── prisma/         # Prisma service
│   │   │   └── redis/          # Redis service
│   │   ├── prisma/             # Prisma schema & migrations
│   │   └── test/               # E2E tests
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── layouts/        # Layout components
│       │   ├── pages/          # Page components
│       │   ├── services/       # API services
│       │   └── store/          # Zustand stores
│       └── ...
│
├── docker-compose.yml          # Development
├── docker-compose.prod.yml     # Production
└── README.md
```

## 🔐 Güvenlik Notları

1. **Şifre Hashleme:** Argon2id kullanılıyor (bcrypt'ten daha güvenli)
2. **Token Saklama:** Access token memory'de, refresh token httpOnly cookie'de
3. **Rate Limiting:** Login için 5 deneme/15dk, Register için 3 deneme/dk
4. **Input Validasyonu:** Tüm inputlar class-validator ile doğrulanıyor
5. **SQL Injection:** Prisma parameterized query kullanıyor
6. **XSS:** React otomatik escape yapıyor + Helmet headers

## 👥 Test Hesapları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | admin@carrental.com | Admin123! |
| Owner | owner@carrental.com | Owner123! |

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

- **Website:** https://arackiralama.com
- **E-posta:** info@arackiralama.com
- **Telefon:** 0850 123 45 67
