# ============================================
# CAR RENTAL PROJECT - BAŞLATMA SCRIPTİ
# ============================================

Write-Host "🚗 Car Rental Projesi Başlatılıyor..." -ForegroundColor Cyan
Write-Host ""

# 1. Docker Container'ları Başlat
Write-Host "1️⃣ Docker Container'ları başlatılıyor..." -ForegroundColor Yellow
docker compose up -d

Write-Host "   ⏳ Container'ların hazır olması bekleniyor (10 saniye)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 2. Backend Başlat (Yeni Terminal)
Write-Host "`n2️⃣ Backend başlatılıyor..." -ForegroundColor Yellow
Write-Host "   📝 Yeni bir PowerShell terminali açılıyor..." -ForegroundColor Gray

$backendScript = @"
cd C:\Users\Berdan\Desktop\car-project\apps\api
Write-Host '🔧 Backend başlatılıyor...' -ForegroundColor Cyan
npm run start:dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

Write-Host "   ⏳ Backend'in başlaması bekleniyor (15 saniye)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 3. Frontend Başlat (Yeni Terminal)
Write-Host "`n3️⃣ Frontend başlatılıyor..." -ForegroundColor Yellow
Write-Host "   📝 Yeni bir PowerShell terminali açılıyor..." -ForegroundColor Gray

$frontendScript = @"
cd C:\Users\Berdan\Desktop\car-project\apps\web
Write-Host '🎨 Frontend başlatılıyor...' -ForegroundColor Cyan
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# 4. Özet
Write-Host "`n✅ ========================================" -ForegroundColor Green
Write-Host "✅ Proje Başlatıldı!" -ForegroundColor Green
Write-Host "✅ ========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Erişim Adresleri:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173 veya http://localhost:5174" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3000/api" -ForegroundColor White
Write-Host "   Swagger:   http://localhost:3000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "📋 Test Hesapları:" -ForegroundColor Cyan
Write-Host "   Admin:    admin@carrental.com / Admin123!" -ForegroundColor White
Write-Host "   Owner:    owner@carrental.com / Owner123!" -ForegroundColor White
Write-Host "   Customer: customer@carrental.com / Customer123!" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Frontend'in tamamen yüklenmesi için 10-20 saniye bekleyin..." -ForegroundColor Yellow
Write-Host ""

