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

# Step 2: Ensure dummy certificates exist if real ones don't exist yet
# (Nginx requires cert files to start up with the HTTPS config in nginx.conf)
echo ""
echo "🔑 Step 1: Checking SSL certificates..."
CERT_PATH="/var/lib/docker/volumes/simply_certbot_etc/_data/live/$DOMAIN"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
  echo "   ⚠️  No existing SSL certificates found. Creating dummy certificate for initial Nginx startup..."
  sudo mkdir -p "$CERT_PATH"
  sudo openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CERT_PATH/privkey.pem" \
    -out "$CERT_PATH/fullchain.pem" \
    -subj "/CN=localhost"
  echo "   ✅ Dummy certificate generated."
fi

# Step 3: Ensure Nginx container is running with nginx.conf
echo ""
echo "🚀 Step 2: Starting Nginx..."
docker compose up -d nginx

# Step 4: Request real Let's Encrypt certificate via webroot mode
echo ""
echo "🔒 Step 3: Requesting Let's Encrypt SSL certificate..."
docker run --rm \
  -v simply_certbot_etc:/etc/letsencrypt \
  -v simply_certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" -d "$WWW_DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive --force-renewal

echo ""
echo "   ✅ SSL certificate obtained successfully!"

# Step 5: Reload Nginx with official SSL certificate
echo ""
echo "🚀 Step 4: Reloading Nginx with official SSL certificate..."
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
