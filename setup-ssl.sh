#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SSL Setup Script for turnipass.com & www.turnipass.com
# Run this on your AWS Lightsail server to enable free Let's Encrypt SSL/TLS.
#
# Usage: sudo bash setup-ssl.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

DOMAIN="turnipass.com"
WWW_DOMAIN="www.turnipass.com"
EMAIL="admin@turnipass.com"
PROJECT_DIR="/var/www/simply"

echo "============================================"
echo "  🔒 SSL Setup for $DOMAIN & $WWW_DOMAIN"
echo "============================================"

# Step 1: Ensure we are in the project directory
cd "$PROJECT_DIR"

# Step 2: Ensure Docker compose stack is running HTTP for ACME challenge
echo ""
echo "🚀 Step 1: Ensuring web server is active on HTTP..."
docker compose up -d nginx

# Step 3: Request Let's Encrypt certificate via webroot mode
echo ""
echo "🔒 Step 2: Requesting Let's Encrypt SSL certificate..."
docker run --rm \
  -v simply_certbot_etc:/etc/letsencrypt \
  -v simply_certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" -d "$WWW_DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive

echo ""
echo "   ✅ SSL certificate obtained successfully!"

# Step 4: Update nginx.conf with HTTPS and 301 Redirects
echo ""
echo "📝 Step 3: Updating Nginx configuration for HTTPS & Redirects..."
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

    # ─── HTTP: Redirect all traffic to HTTPS ──────────────────────────────────
    server {
        listen 80;
        server_name turnipass.com www.turnipass.com _;

        # ACME challenge path for Certbot domain validation
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://turnipass.com$request_uri;
        }
    }

    # ─── HTTPS: Redirect WWW to Non-WWW ───────────────────────────────────────
    server {
        listen 443 ssl;
        server_name www.turnipass.com;

        ssl_certificate     /etc/letsencrypt/live/turnipass.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/turnipass.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        return 301 https://turnipass.com$request_uri;
    }

    # ─── HTTPS: Main Primary Server (turnipass.com) ───────────────────────────
    server {
        listen 443 ssl;
        server_name turnipass.com;

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
echo "   ✅ Nginx configuration updated."

# Step 5: Reload Nginx with SSL
echo ""
echo "🚀 Step 4: Reloading Nginx with SSL..."
docker compose exec nginx nginx -s reload || docker compose restart nginx
echo "   ✅ Nginx reloaded successfully!"

# Step 6: Set up zero-downtime auto-renewal cron job
echo ""
echo "🔄 Step 5: Setting up zero-downtime SSL auto-renewal cron job..."
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * cd $PROJECT_DIR && docker run --rm -v simply_certbot_etc:/etc/letsencrypt -v simply_certbot_www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec nginx nginx -s reload") | crontab -
echo "   ✅ Auto-renewal cron job configured (runs daily at 3 AM)"

echo ""
echo "============================================"
echo "  🎉 SSL SETUP COMPLETE!"
echo "  Primary Domain: https://turnipass.com"
echo "  WWW Redirect:   https://www.turnipass.com -> https://turnipass.com"
echo "============================================"
