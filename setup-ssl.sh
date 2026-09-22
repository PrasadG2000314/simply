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

# Step 2: Clean up any old duplicate certificate lineages (e.g. turnipass.com-0001)
echo ""
echo "🧹 Step 1: Cleaning duplicate cert directories..."
sudo rm -rf /var/lib/docker/volumes/simply_certbot_etc/_data/live/$DOMAIN-000*
sudo rm -rf /var/lib/docker/volumes/simply_certbot_etc/_data/archive/$DOMAIN-000*
sudo rm -rf /var/lib/docker/volumes/simply_certbot_etc/_data/renewal/$DOMAIN-000*.conf

# Step 3: Ensure dummy certificates exist if real ones don't exist yet
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

# Step 4: Ensure Nginx container is running with nginx.conf
echo ""
echo "🚀 Step 2: Starting Nginx..."
docker compose up -d nginx

# Step 5: Request real Let's Encrypt certificate via webroot mode (forcing exact cert name)
echo ""
echo "🔒 Step 3: Requesting Let's Encrypt SSL certificate for $DOMAIN..."
docker run --rm \
  -v simply_certbot_etc:/etc/letsencrypt \
  -v simply_certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  --cert-name "$DOMAIN" \
  -d "$DOMAIN" -d "$WWW_DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive --force-renewal

echo ""
echo "   ✅ SSL certificate obtained successfully!"

# Step 6: Restart Nginx to pick up the new certificate files
echo ""
echo "🚀 Step 4: Restarting Nginx with official SSL certificate..."
docker compose restart nginx
echo "   ✅ Nginx restarted successfully!"

# Step 7: Set up zero-downtime auto-renewal cron job
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
