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

# Step 2: Stop Nginx temporarily so port 80 is free for Certbot standalone mode
echo ""
echo "🛑 Step 1: Stopping Nginx temporarily..."
docker compose stop nginx 2>/dev/null || true

# Step 3: Clean up any old/dummy cert files inside the certbot_etc volume
echo ""
echo "🧹 Step 2: Cleaning old certificate data..."
docker run --rm -v simply_certbot_etc:/etc/letsencrypt alpine sh -c "rm -rf /etc/letsencrypt/live/* /etc/letsencrypt/archive/* /etc/letsencrypt/renewal/*"

# Step 4: Request official Let's Encrypt SSL certificate via Standalone mode
echo ""
echo "🔒 Step 3: Requesting official Let's Encrypt SSL certificate..."
docker run --rm \
  -p 80:80 \
  -v simply_certbot_etc:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d "$DOMAIN" -d "$WWW_DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive

echo ""
echo "   ✅ Official Let's Encrypt SSL certificate obtained successfully!"

# Step 5: Start Nginx with official SSL certificate
echo ""
echo "🚀 Step 4: Starting Nginx with HTTPS..."
docker compose up -d nginx
echo "   ✅ Nginx started successfully with HTTPS!"

# Step 6: Set up auto-renewal cron job
echo ""
echo "🔄 Step 5: Setting up SSL auto-renewal cron job..."
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * cd $PROJECT_DIR && docker compose stop nginx && docker run --rm -p 80:80 -v simply_certbot_etc:/etc/letsencrypt certbot/certbot renew --standalone --quiet && docker compose start nginx") | crontab -
echo "   ✅ Auto-renewal cron job configured (runs daily at 3 AM)"

echo ""
echo "============================================"
echo "  🎉 SSL SETUP COMPLETE!"
echo "  Primary Domain: https://turnipass.com"
echo "  WWW Redirect:   https://www.turnipass.com -> https://turnipass.com"
echo "============================================"
