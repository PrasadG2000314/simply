#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SSL Setup Script for turnipass.com
# Run this ONCE on your AWS Lightsail server after the site is working on HTTP.
#
# Usage: sudo bash setup-ssl.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

DOMAIN="turnipass.com"
WWW_DOMAIN="www.turnipass.com"
EMAIL="admin@turnipass.com"
PROJECT_DIR="/var/www/simply"

echo "============================================"
echo "  SSL Setup for $DOMAIN"
echo "============================================"

# Step 1: Ensure we're in the project directory
cd "$PROJECT_DIR"

# Step 2: Clean up any old/broken certbot data
echo ""
echo "🧹 Step 1: Cleaning old certificate data..."
docker volume create simply_certbot_etc 2>/dev/null || true
docker volume create simply_certbot_www 2>/dev/null || true
sudo rm -rf /var/lib/docker/volumes/simply_certbot_etc/_data/live/$DOMAIN
sudo rm -rf /var/lib/docker/volumes/simply_certbot_etc/_data/archive/$DOMAIN
sudo rm -rf /var/lib/docker/volumes/simply_certbot_etc/_data/renewal/$DOMAIN.conf
echo "   ✅ Cleaned old certificate data"

# Step 3: Stop nginx to free port 80
echo ""
echo "🛑 Step 2: Stopping Nginx temporarily..."
docker compose stop nginx
echo "   ✅ Nginx stopped"

# Step 4: Request Let's Encrypt certificate via standalone mode
echo ""
echo "🔒 Step 3: Requesting Let's Encrypt SSL certificate..."
echo "   (This contacts Let's Encrypt servers to verify domain ownership)"
echo ""
docker run --rm \
  -p 80:80 \
  -v simply_certbot_etc:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d "$DOMAIN" -d "$WWW_DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive

echo ""
echo "   ✅ SSL certificate obtained successfully!"

# Step 5: Update nginx.conf to enable HTTPS
echo ""
echo "📝 Step 4: Updating Nginx configuration for HTTPS..."
cat > "$PROJECT_DIR/nginx.conf" << 'NGINX_CONF'
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout 65;

    # Allow large body size for document uploads (up to 100MB)
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # ─── HTTP: Redirect to HTTPS ──────────────────────────────────────────────
    server {
        listen 80;
        server_name turnipass.com www.turnipass.com _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ─── HTTPS: Main Server ───────────────────────────────────────────────────
    server {
        listen 443 ssl;
        server_name turnipass.com www.turnipass.com;

        ssl_certificate     /etc/letsencrypt/live/turnipass.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/turnipass.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Backend API proxy
        location /api/ {
            proxy_pass http://api:5000/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # Static Uploaded Files Proxy
        location /uploads/ {
            proxy_pass http://api:5000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Health check for API
        location /health {
            proxy_pass http://api:5000/health;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Frontend Next.js proxy (catch all)
        location / {
            proxy_pass http://web:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }
}
NGINX_CONF
echo "   ✅ Nginx config updated for HTTPS"

# Step 6: Restart nginx with SSL
echo ""
echo "🚀 Step 5: Starting Nginx with SSL..."
docker compose start nginx
echo "   ✅ Nginx started with HTTPS!"

# Step 7: Set up auto-renewal cron job
echo ""
echo "🔄 Step 6: Setting up SSL auto-renewal cron job..."
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * cd $PROJECT_DIR && docker compose stop nginx && docker run --rm -p 80:80 -v simply_certbot_etc:/etc/letsencrypt certbot/certbot renew --standalone --quiet && docker compose start nginx") | crontab -
echo "   ✅ Auto-renewal cron job configured (runs daily at 3 AM)"

echo ""
echo "============================================"
echo "  🎉 SSL SETUP COMPLETE!"
echo "  Visit: https://turnipass.com"
echo "============================================"
