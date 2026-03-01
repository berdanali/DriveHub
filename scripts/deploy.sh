#!/bin/bash
# ============================================
# DEPLOYMENT SCRIPT - Car Rental Project
# ============================================
# Kullanım: bash scripts/deploy.sh
# İlk kurulum: bash scripts/deploy.sh --init

set -e

echo "🚗 Car Rental - Production Deployment"
echo "======================================"

# .env kontrolü
if [ ! -f .env ]; then
    echo "❌ .env dosyası bulunamadı!"
    echo "   Önce: cp env.production.example .env"
    echo "   Sonra .env içindeki değerleri gerçek değerlerle değiştirin."
    exit 1
fi

# Domain'i .env'den oku
source .env
if [ -z "$DOMAIN" ]; then
    echo "❌ .env içinde DOMAIN tanımlı değil!"
    exit 1
fi

echo "🌐 Domain: $DOMAIN"

# İlk kurulum mu?
if [ "$1" == "--init" ]; then
    echo ""
    echo "📦 İlk kurulum başlatılıyor..."
    echo ""

    # 1) SSL sertifikası
    if [ ! -d "certbot/conf/live/$DOMAIN" ]; then
        echo "🔐 SSL sertifikası alınıyor..."
        bash scripts/init-ssl.sh "$DOMAIN" "${MAIL_USER}"
    else
        echo "✅ SSL sertifikası zaten mevcut."
    fi

    # 2) Nginx config domain değiştir
    echo "📝 Nginx config güncelleniyor..."
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.prod.conf

    # 3) Build & Start
    echo "🏗️  Build ediliyor..."
    docker compose -f docker-compose.prod.yml build

    echo "🚀 Başlatılıyor..."
    docker compose -f docker-compose.prod.yml up -d

    # 4) Prisma migration
    echo "📊 Veritabanı migration çalıştırılıyor..."
    sleep 10  # DB'nin hazır olmasını bekle
    docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

    # 5) Seed data (opsiyonel)
    echo "🌱 Seed data yükleniyor..."
    docker compose -f docker-compose.prod.yml exec api npx prisma db seed || true

    echo ""
    echo "✅ =============================="
    echo "✅ Deployment tamamlandı!"
    echo "✅ =============================="
    echo ""
    echo "🌐 Site: https://$DOMAIN"
    echo "🔌 API:  https://$DOMAIN/api"
    echo ""
    echo "📋 Logları görmek için:"
    echo "   docker compose -f docker-compose.prod.yml logs -f"
    echo ""

else
    # Normal güncelleme
    echo ""
    echo "🔄 Güncelleme başlatılıyor..."
    echo ""

    # Pull latest (git kullanıyorsan)
    # git pull origin main

    # Rebuild & restart
    echo "🏗️  Rebuild ediliyor..."
    docker compose -f docker-compose.prod.yml build

    echo "🚀 Yeniden başlatılıyor..."
    docker compose -f docker-compose.prod.yml up -d

    # Migration
    echo "📊 Migration kontrol ediliyor..."
    sleep 5
    docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

    echo ""
    echo "✅ Güncelleme tamamlandı!"
    echo "🌐 Site: https://$DOMAIN"
    echo ""
fi

