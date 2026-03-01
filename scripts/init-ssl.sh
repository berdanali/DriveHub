#!/bin/bash
# ============================================
# SSL Sertifikası Kurulumu (Let's Encrypt)
# ============================================
# Kullanım: bash scripts/init-ssl.sh senindomain.com senin@email.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Kullanım: bash scripts/init-ssl.sh <domain> <email>"
    echo "   Örnek: bash scripts/init-ssl.sh arackirala.com admin@arackirala.com"
    exit 1
fi

echo "🔐 SSL sertifikası alınıyor: $DOMAIN"
echo "📧 E-posta: $EMAIL"

# 1) Nginx config'deki DOMAIN_PLACEHOLDER'ı değiştir
echo "📝 Nginx config güncelleniyor..."
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.prod.conf

# 2) Geçici nginx config (sadece HTTP, SSL challenge için)
echo "📝 Geçici HTTP-only nginx oluşturuluyor..."
cat > nginx/nginx.temp.conf << 'TEMPEOF'
worker_processes auto;
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name DOMAIN_HERE;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'SSL kurulumu devam ediyor...';
            add_header Content-Type text/plain;
        }
    }
}
TEMPEOF

sed -i "s/DOMAIN_HERE/$DOMAIN/g" nginx/nginx.temp.conf

# 3) Certbot dizinlerini oluştur
mkdir -p certbot/conf certbot/www

# 4) Geçici nginx'i başlat (sadece 80 portu)
echo "🚀 Geçici nginx başlatılıyor..."
docker run -d --name temp-nginx \
    -p 80:80 \
    -v "$(pwd)/nginx/nginx.temp.conf:/etc/nginx/nginx.conf:ro" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    nginx:alpine

# 5) Certbot ile sertifika al
echo "🔐 Sertifika alınıyor..."
docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# 6) Geçici nginx'i durdur ve sil
echo "🧹 Geçici nginx temizleniyor..."
docker stop temp-nginx && docker rm temp-nginx
rm nginx/nginx.temp.conf

echo ""
echo "✅ SSL sertifikası başarıyla alındı!"
echo ""
echo "Şimdi projeyi başlatın:"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo ""

