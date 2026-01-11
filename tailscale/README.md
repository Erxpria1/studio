# Tailscale Integration for MathCyber

Bu dizin, MathCyber uygulamasının Tailscale ile entegrasyonu için gerekli dosyaları içerir.

## Hızlı Başlangıç

```bash
# Otomatik kurulum
./tailscale/setup.sh
```

## Manuel Kurulum

```bash
# 1. Environment variables'ı ayarla
cp .env.example .env
# .env dosyasında TAILSCALE_AUTH_KEY'i düzenle

# 2. Docker container'ları başlat
docker-compose up -d --build

# 3. Durumu kontrol et
docker-compose logs -f
```

## Dosyalar

- `setup.sh` - Otomatik kurulum scripti
- `../docs/TAILSCALE.md` - Detaylı dokümantasyon
- `../docker-compose.yml` - Docker Compose yapılandırması
- `../Dockerfile` - Next.js application Dockerfile
- `../.env.example` - Environment variables template

## Daha Fazla Bilgi

Detaylı dokümantasyon için `docs/TAILSCALE.md` dosyasına bakın.
